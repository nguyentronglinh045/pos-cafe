param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[0-9a-f]{64}$')]
    [string]$ExpectedSourceSha256
)
$ErrorActionPreference = 'Stop'
$live = 'D:\Workspace\pos-cafe\.codex\config.toml'
$snapshot = 'D:\Workspace\pos-cafe-docs\docs\implementation-log\permission-staging-setup-20261022\current-readonly-config.toml'
$sourcePath = 'D:\Workspace\pos-cafe-docs\docs\implementation-log\permission-staging-setup-20261022\deadline-readonly-guard-source01.ps1'
$receipt = 'D:\Workspace\pos-cafe-docs\docs\implementation-log\permission-staging-setup-20261022\deadline-readonly-restore.json'
$expectedWrite = 'b666027bc770a46c70149b83b8a704bdfff1343dae5e6447a1ae543681b9547c'
$expectedReadonly = '0afb3ee78fa7f75786bb2d7345d51a2ef64afe26c7a0be032c8a1e726156a8a9'
$deadline = [DateTimeOffset]::Parse('2026-10-22T10:00:00Z')
$started = [DateTimeOffset]::UtcNow.ToString('o')
$evidencePaths = @('D:\Workspace', 'D:\Workspace\pos-cafe-docs', 'D:\Workspace\pos-cafe-docs\docs', 'D:\Workspace\pos-cafe-docs\docs\implementation-log', 'D:\Workspace\pos-cafe-docs\docs\implementation-log\permission-staging-setup-20261022')
$guardPaths = @('D:\Workspace', 'D:\Workspace\pos-cafe', 'D:\Workspace\pos-cafe\.codex', $live) + $evidencePaths + @($snapshot, $sourcePath)
$temp = $null
$before = $null
$after = $null
function Assert-Paths {
    foreach ($path in $guardPaths) {
        $item = Get-Item -LiteralPath $path -Force
        if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw ('Unexpected reparse path: ' + $path) }
    }
    foreach ($path in @($live, $snapshot, $sourcePath)) {
        if ((Get-Item -LiteralPath $path -Force).PSIsContainer) { throw ('Expected regular file: ' + $path) }
    }
    if (-not [string]::Equals($PSCommandPath, $sourcePath, [StringComparison]::OrdinalIgnoreCase)) { throw 'Executing guard source path mismatch' }
    if ((Hash-File $sourcePath) -ne $ExpectedSourceSha256) { throw 'Pinned guard source hash mismatch' }
    if (Test-Path -LiteralPath $receipt) { throw ('Receipt path already exists; no overwrite: ' + $receipt) }
}
function Hash-File([string]$path) {
    return (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
}
function Write-Receipt($record) {
    foreach ($path in $evidencePaths) {
        $item = Get-Item -LiteralPath $path -Force
        if (-not $item.PSIsContainer -or (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0)) { throw ('Unsafe receipt ancestor path: ' + $path) }
    }
    $json = $record | ConvertTo-Json -Depth 5
    $data = (New-Object Text.UTF8Encoding($false)).GetBytes($json + [Environment]::NewLine)
    $stream = [IO.File]::Open($receipt, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::Read)
    try { $stream.Write($data, 0, $data.Length); $stream.Flush($true) } finally { $stream.Dispose() }
}
function Write-AlreadyReadonly {
    Write-Receipt ([ordered]@{
        status = 'verified_already_readonly'
        observedAtUtc = [DateTimeOffset]::UtcNow.ToString('o')
        guardStartedAtUtc = $started
        deadlineUtc = $deadline.ToString('o')
        guardPid = $PID
        sourceSha256 = $ExpectedSourceSha256
        targetPath = $live
        beforeSha256 = $before
        afterSha256 = $before
        mutationPerformed = $false
        scope = 'stored_project_config_only'
        liveConnectionReloaded = $false
        oauthRevoked = $false
    })
}
try {
    while ($true) {
        Assert-Paths
        $before = Hash-File $live
        $snapshotHash = Hash-File $snapshot
        if ($snapshotHash -ne $expectedReadonly) { throw ('Unexpected snapshot SHA256: ' + $snapshotHash) }
        if ($before -eq $expectedReadonly) { Write-AlreadyReadonly; exit 0 }
        if ($before -ne $expectedWrite) { throw ('Unexpected live config SHA256; not overwritten: ' + $before) }
        if ([DateTimeOffset]::UtcNow -ge $deadline) { break }
        $remainingMs = ($deadline - [DateTimeOffset]::UtcNow).TotalMilliseconds
        Start-Sleep -Milliseconds ([int][Math]::Max(1, [Math]::Min(30000, $remainingMs)))
    }
    Assert-Paths
    $before = Hash-File $live
    if ($before -eq $expectedReadonly) { Write-AlreadyReadonly; exit 0 }
    if ($before -ne $expectedWrite) { throw ('Unexpected live config before restore; not overwritten: ' + $before) }
    $snapshotBytes = [IO.File]::ReadAllBytes($snapshot)
    $sha = [Security.Cryptography.SHA256]::Create()
    try { $snapshotHash = ([BitConverter]::ToString($sha.ComputeHash($snapshotBytes))).Replace('-', '').ToLowerInvariant() } finally { $sha.Dispose() }
    if ($snapshotHash -ne $expectedReadonly) { throw 'Snapshot changed before restore' }
    $originalAcl = Get-Acl -LiteralPath $live
    $beforeSddl = $originalAcl.Sddl
    $temp = [IO.Path]::Combine([IO.Path]::GetDirectoryName($live), 'config.readonly-guard-' + [Guid]::NewGuid().ToString('N') + '.tmp')
    $stream = [IO.File]::Open($temp, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
    try { $stream.Write($snapshotBytes, 0, $snapshotBytes.Length); $stream.Flush($true) } finally { $stream.Dispose() }
    Set-Acl -LiteralPath $temp -AclObject $originalAcl
    Assert-Paths
    if ((Hash-File $temp) -ne $expectedReadonly) { throw 'Temporary restore file hash mismatch' }
    if ((Hash-File $live) -ne $expectedWrite) { throw 'Live config changed immediately before atomic replacement; not overwritten' }
    if ((Get-Acl -LiteralPath $live).Sddl -ne $beforeSddl) { throw 'Live config ACL changed before atomic replacement; not overwritten' }
    [IO.File]::Replace($temp, $live, $null, $false)
    $temp = $null
    $after = Hash-File $live
    $aclPreserved = ((Get-Acl -LiteralPath $live).Sddl -eq $beforeSddl)
    if ($after -ne $expectedReadonly) { throw ('Post-restore hash mismatch: ' + $after) }
    if (-not $aclPreserved) { throw 'Restored bytes but original ACL verification failed' }
    Write-Receipt ([ordered]@{
        status = 'restored_readonly_at_deadline'
        observedAtUtc = [DateTimeOffset]::UtcNow.ToString('o')
        guardStartedAtUtc = $started
        deadlineUtc = $deadline.ToString('o')
        guardPid = $PID
        sourceSha256 = $ExpectedSourceSha256
        targetPath = $live
        snapshotPath = $snapshot
        beforeSha256 = $before
        afterSha256 = $after
        atomicReplacement = $true
        originalAclPreserved = $aclPreserved
        mutationPerformed = $true
        scope = 'stored_project_config_only'
        liveConnectionReloaded = $false
        oauthRevoked = $false
    })
    exit 0
} catch {
    $failure = [ordered]@{
        status = 'blocked_or_failed_no_further_action'
        observedAtUtc = [DateTimeOffset]::UtcNow.ToString('o')
        guardStartedAtUtc = $started
        deadlineUtc = $deadline.ToString('o')
        guardPid = $PID
        sourceSha256 = $ExpectedSourceSha256
        targetPath = $live
        beforeSha256 = $before
        afterSha256 = $after
        error = $_.Exception.Message
        temporaryPathIfCreated = $temp
        scope = 'stored_project_config_only'
        liveConnectionReloaded = $false
        oauthRevoked = $false
    }
    try { Write-Receipt $failure } catch {}
    exit 3
}