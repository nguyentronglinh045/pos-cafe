param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[0-9a-f]{64}$')]
    [string]$ExpectedSourceSha256
)
$ErrorActionPreference = 'Stop'
$base = 'D:\Workspace\pos-cafe-docs\docs\implementation-log\permission-staging-setup-20261022'
$ownSource = Join-Path $base 'early-readonly-restore-source01.ps1'
$receipt = Join-Path $base 'early-readonly-restore01.json'
$guardSource = Join-Path $base 'deadline-readonly-guard-source01.ps1'
$guardSourceHash = '9c3aaff3f3e979c6b45387dee2dbfceb6190106b34ac69f344876568d1673061'
$guardPid = 10588
$guardExecutable = 'C:\Users\nguye\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe'
$expectedGuardCommand = '"' + $guardExecutable + '" -NoProfile -NonInteractive -File ' + $guardSource + ' -ExpectedSourceSha256 ' + $guardSourceHash
$expectedGuardCreationUtc = [DateTimeOffset]::Parse('2026-10-22T09:12:41.860685Z')
$live = 'D:\Workspace\pos-cafe\.codex\config.toml'
$snapshot = Join-Path $base 'current-readonly-config.toml'
$expectedWrite = 'b666027bc770a46c70149b83b8a704bdfff1343dae5e6447a1ae543681b9547c'
$expectedReadonly = '0afb3ee78fa7f75786bb2d7345d51a2ef64afe26c7a0be032c8a1e726156a8a9'
$started = [DateTimeOffset]::UtcNow.ToString('o')
$evidencePaths = @('D:\Workspace', 'D:\Workspace\pos-cafe-docs', 'D:\Workspace\pos-cafe-docs\docs', 'D:\Workspace\pos-cafe-docs\docs\implementation-log', $base)
$paths = @('D:\Workspace', 'D:\Workspace\pos-cafe', 'D:\Workspace\pos-cafe\.codex', $live) + $evidencePaths + @($snapshot, $guardSource, $ownSource)
$temp = $null
$guardStoppedAtUtc = $null
$before = $null
$after = $null
$mutationPerformed = $false
function Hash-File([string]$path) { return (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() }
function Assert-Paths {
    foreach ($path in $paths) {
        $item = Get-Item -LiteralPath $path -Force
        if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw ('Unexpected reparse path: ' + $path) }
    }
    foreach ($path in @($live, $snapshot, $guardSource, $ownSource)) {
        if ((Get-Item -LiteralPath $path -Force).PSIsContainer) { throw ('Expected regular file: ' + $path) }
    }
    if (-not [string]::Equals($PSCommandPath, $ownSource, [StringComparison]::OrdinalIgnoreCase)) { throw 'Early restore source path mismatch' }
    if ((Hash-File $ownSource) -ne $ExpectedSourceSha256) { throw 'Early restore source hash mismatch' }
    if ((Hash-File $guardSource) -ne $guardSourceHash) { throw 'Guard source hash mismatch' }
    if (Test-Path -LiteralPath $receipt) { throw 'Receipt already exists; no overwrite' }
}
function Assert-NoWatchers {
    $duplicates = @(Get-CimInstance Win32_Process -Filter "Name='pwsh.exe' OR Name='powershell.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($guardSource) })
    if ($duplicates.Count -ne 0) { throw 'An exact-source deadline watcher is still active' }
    if ($null -ne (Get-CimInstance Win32_Process -Filter 'ProcessId=10588 OR ProcessId=34152 OR ProcessId=31232')) { throw 'Old watcher PID is present after stop; refuse identity ambiguity' }
}
function Write-Receipt($record) {
    foreach ($path in $evidencePaths) {
        $item = Get-Item -LiteralPath $path -Force
        if (-not $item.PSIsContainer -or (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0)) { throw ('Unsafe receipt ancestor: ' + $path) }
    }
    $data = (New-Object Text.UTF8Encoding($false)).GetBytes(($record | ConvertTo-Json -Depth 6) + [Environment]::NewLine)
    $stream = [IO.File]::Open($receipt, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::Read)
    try { $stream.Write($data, 0, $data.Length); $stream.Flush($true) } finally { $stream.Dispose() }
}
try {
    Assert-Paths
    $before = Hash-File $live
    if ($before -ne $expectedWrite -or (Hash-File $snapshot) -ne $expectedReadonly) { throw 'Live/snapshot hash mismatch before stopping guard' }
    $originalAcl = Get-Acl -LiteralPath $live
    $beforeSddl = $originalAcl.Sddl
    $guard = Get-CimInstance Win32_Process -Filter 'ProcessId=10588'
    if ($null -eq $guard -or $guard.Name -ne 'pwsh.exe') { throw 'Guard process missing or wrong executable name' }
    if (-not [string]::Equals($guard.ExecutablePath, $guardExecutable, [StringComparison]::OrdinalIgnoreCase)) { throw 'Guard executable path mismatch' }
    if ($guard.CommandLine -cne $expectedGuardCommand) { throw 'Guard exact command line mismatch' }
    if ([Math]::Abs((([DateTimeOffset]$guard.CreationDate).ToUniversalTime() - $expectedGuardCreationUtc).TotalMilliseconds) -gt 1) { throw 'Guard process creation time mismatch' }
    $duplicates = @(Get-CimInstance Win32_Process -Filter "Name='pwsh.exe' OR Name='powershell.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($guardSource) })
    if ($duplicates.Count -ne 1 -or $duplicates[0].ProcessId -ne $guardPid) { throw 'Duplicate watcher identity mismatch before stop' }
    $guardObject = Get-Process -Id $guardPid
    Stop-Process -InputObject $guardObject
    if (-not $guardObject.WaitForExit(5000)) { throw 'Guard did not exit within 5 seconds' }
    $guardStoppedAtUtc = [DateTimeOffset]::UtcNow.ToString('o')
    Assert-NoWatchers
    Assert-Paths
    if ((Hash-File $live) -ne $expectedWrite -or (Hash-File $snapshot) -ne $expectedReadonly) { throw 'Live/snapshot changed after guard stopped; not overwritten' }
    if ((Get-Acl -LiteralPath $live).Sddl -ne $beforeSddl) { throw 'Live ACL changed after guard stopped; not overwritten' }
    $snapshotBytes = [IO.File]::ReadAllBytes($snapshot)
    $sha = [Security.Cryptography.SHA256]::Create()
    try { $snapshotHash = ([BitConverter]::ToString($sha.ComputeHash($snapshotBytes))).Replace('-', '').ToLowerInvariant() } finally { $sha.Dispose() }
    if ($snapshotHash -ne $expectedReadonly) { throw 'Snapshot bytes changed; not overwritten' }
    $temp = [IO.Path]::Combine([IO.Path]::GetDirectoryName($live), 'config.early-readonly-' + [Guid]::NewGuid().ToString('N') + '.tmp')
    $stream = [IO.File]::Open($temp, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
    try { $stream.Write($snapshotBytes, 0, $snapshotBytes.Length); $stream.Flush($true) } finally { $stream.Dispose() }
    Set-Acl -LiteralPath $temp -AclObject $originalAcl
    Assert-NoWatchers
    Assert-Paths
    if ((Hash-File $temp) -ne $expectedReadonly) { throw 'Prepared readonly bytes mismatch' }
    if ((Hash-File $live) -ne $expectedWrite -or (Get-Acl -LiteralPath $live).Sddl -ne $beforeSddl) { throw 'Live bytes/ACL changed before atomic replacement; not overwritten' }
    [IO.File]::Replace($temp, $live, $null, $false)
    $temp = $null
    $mutationPerformed = $true
    $after = Hash-File $live
    $aclPreserved = ((Get-Acl -LiteralPath $live).Sddl -eq $beforeSddl)
    if ($after -ne $expectedReadonly -or -not $aclPreserved) { throw 'Post-restore hash/ACL verification failed' }
    Assert-NoWatchers
    $record = [ordered]@{
        status = 'early_restore_after_bootstrap_not_deadline'
        startedAtUtc = $started
        guardStoppedAtUtc = $guardStoppedAtUtc
        restoredVerifiedAtUtc = [DateTimeOffset]::UtcNow.ToString('o')
        targetPath = $live
        snapshotPath = $snapshot
        ownSourcePath = $ownSource
        ownSourceSha256 = $ExpectedSourceSha256
        watcherSourcePath = $guardSource
        watcherSourceSha256 = $guardSourceHash
        stoppedWatcherPid = $guardPid
        stoppedWatcherExecutable = $guardExecutable
        exactStoppedWatcherCommand = $expectedGuardCommand
        beforeSha256 = $before
        afterSha256 = $after
        originalAclPreserved = $aclPreserved
        atomicReplacement = $true
        compareAndSwapGuarantee = $false
        coordination = 'Operational SINGLEWRITER, watcher stopped and exit confirmed before early restore; external uncoordinated writers remain a race'
        activeDeadlineWatchersAfterRestore = 0
        mutationPerformed = $true
        reason = 'Owner-authorized return to stored readonly after successful one-call bootstrap and matching-marker reconciliation, as reported by root'
        rootReportedApplyAtUtc = '2026-10-22T09:26:19Z'
        rootReportedReconcileNonce = 'c439a96e8e0a4088865f74185b9a121d'
        databaseCallsByThisAction = 0
        apiCallsByThisAction = 0
        scope = 'stored_project_config_only'
        liveConnectionReloaded = $false
        oauthRevoked = $false
        globalConfigChanged = $false
        deadlineGuaranteeClaimed = $false
    }
    Write-Receipt $record
    $record | ConvertTo-Json -Depth 6 -Compress
} catch {
    $failure = [ordered]@{
        status = 'early_restore_failed_no_further_action'
        observedAtUtc = [DateTimeOffset]::UtcNow.ToString('o')
        guardStoppedAtUtc = $guardStoppedAtUtc
        stoppedWatcherPid = $guardPid
        ownSourceSha256 = $ExpectedSourceSha256
        beforeSha256 = $before
        afterSha256 = $after
        mutationPerformed = $mutationPerformed
        error = $_.Exception.Message
        temporaryPathIfCreated = $temp
        scope = 'stored_project_config_only'
        databaseCallsByThisAction = 0
        apiCallsByThisAction = 0
        liveConnectionReloaded = $false
        oauthRevoked = $false
    }
    try { Write-Receipt $failure } catch {}
    throw
}