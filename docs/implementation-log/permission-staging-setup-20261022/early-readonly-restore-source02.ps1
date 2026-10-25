param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[0-9a-f]{64}$')]
    [string]$ExpectedSourceSha256
)
$ErrorActionPreference = 'Stop'
$base = 'D:\Workspace\pos-cafe-docs\docs\implementation-log\permission-staging-setup-20261022'
$ownSource = Join-Path $base 'early-readonly-restore-source02.ps1'
$previousReceipt = Join-Path $base 'early-readonly-restore01.json'
$receipt = Join-Path $base 'early-readonly-restore02.json'
$guardSource = Join-Path $base 'deadline-readonly-guard-source01.ps1'
$guardSourceHash = '9c3aaff3f3e979c6b45387dee2dbfceb6190106b34ac69f344876568d1673061'
$live = 'D:\Workspace\pos-cafe\.codex\config.toml'
$snapshot = Join-Path $base 'current-readonly-config.toml'
$temp = 'D:\Workspace\pos-cafe\.codex\config.early-readonly-85a6cd99b8144ae08d59fa0b982b9427.tmp'
$expectedWrite = 'b666027bc770a46c70149b83b8a704bdfff1343dae5e6447a1ae543681b9547c'
$expectedReadonly = '0afb3ee78fa7f75786bb2d7345d51a2ef64afe26c7a0be032c8a1e726156a8a9'
$started = [DateTimeOffset]::UtcNow.ToString('o')
$evidencePaths = @('D:\Workspace', 'D:\Workspace\pos-cafe-docs', 'D:\Workspace\pos-cafe-docs\docs', 'D:\Workspace\pos-cafe-docs\docs\implementation-log', $base)
$paths = @('D:\Workspace', 'D:\Workspace\pos-cafe', 'D:\Workspace\pos-cafe\.codex', $live, $temp) + $evidencePaths + @($snapshot, $guardSource, $ownSource, $previousReceipt)
function Hash-File([string]$path) { return (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() }
function Assert-Paths {
    foreach ($path in $paths) {
        $item = Get-Item -LiteralPath $path -Force
        if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw ('Unexpected reparse path: ' + $path) }
    }
    foreach ($path in @($live, $temp, $snapshot, $guardSource, $ownSource, $previousReceipt)) {
        if ((Get-Item -LiteralPath $path -Force).PSIsContainer) { throw ('Expected regular file: ' + $path) }
    }
    if (-not [string]::Equals($PSCommandPath, $ownSource, [StringComparison]::OrdinalIgnoreCase)) { throw 'Corrective source path mismatch' }
    if ((Hash-File $ownSource) -ne $ExpectedSourceSha256 -or (Hash-File $guardSource) -ne $guardSourceHash) { throw 'Corrective/guard source pin mismatch' }
    if (Test-Path -LiteralPath $receipt) { throw 'Corrective receipt already exists' }
}
function Assert-NoWatchers {
    $duplicates = @(Get-CimInstance Win32_Process -Filter "Name='pwsh.exe' OR Name='powershell.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($guardSource) })
    if ($duplicates.Count -ne 0) { throw 'Deadline watcher still active' }
    if ($null -ne (Get-CimInstance Win32_Process -Filter 'ProcessId=10588 OR ProcessId=34152 OR ProcessId=31232')) { throw 'Old watcher PID present; identity ambiguity' }
}
Assert-Paths
Assert-NoWatchers
$previous = Get-Content -LiteralPath $previousReceipt -Raw | ConvertFrom-Json
if ($previous.status -ne 'early_restore_failed_no_further_action' -or $previous.stoppedWatcherPid -ne 10588 -or $previous.mutationPerformed -ne $false -or $previous.temporaryPathIfCreated -cne $temp -or -not $previous.guardStoppedAtUtc) { throw 'Prior failure/temp ownership identity mismatch' }
$before = Hash-File $live
if ($before -ne $expectedWrite -or (Hash-File $snapshot) -ne $expectedReadonly -or (Hash-File $temp) -ne $expectedReadonly) { throw 'Pinned live/snapshot/prepared-temp bytes mismatch' }
$originalAcl = Get-Acl -LiteralPath $live
$beforeSddl = $originalAcl.Sddl
if ((Get-Acl -LiteralPath $temp).Sddl -ne $beforeSddl) { throw 'Prepared temp ACL does not match original live ACL' }
Assert-Paths
Assert-NoWatchers
if ((Hash-File $live) -ne $expectedWrite -or (Get-Acl -LiteralPath $live).Sddl -ne $beforeSddl) { throw 'Live config changed immediately before atomic replacement' }
[IO.File]::Replace($temp, $live, [System.Management.Automation.Language.NullString]::Value, $false)
$after = Hash-File $live
$aclPreserved = ((Get-Acl -LiteralPath $live).Sddl -eq $beforeSddl)
if ($after -ne $expectedReadonly -or -not $aclPreserved) { throw 'Post-restore hash/ACL verification failed' }
Assert-NoWatchers
foreach ($path in $evidencePaths) {
    $item = Get-Item -LiteralPath $path -Force
    if (-not $item.PSIsContainer -or (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0)) { throw 'Unsafe receipt ancestor' }
}
$record = [ordered]@{
    status = 'early_restore_after_bootstrap_not_deadline'
    startedAtUtc = $started
    guardStoppedAtUtc = ([DateTimeOffset]$previous.guardStoppedAtUtc).ToUniversalTime().ToString('o')
    restoredVerifiedAtUtc = [DateTimeOffset]::UtcNow.ToString('o')
    targetPath = $live
    snapshotPath = $snapshot
    ownSourcePath = $ownSource
    ownSourceSha256 = $ExpectedSourceSha256
    watcherSourcePath = $guardSource
    watcherSourceSha256 = $guardSourceHash
    stoppedWatcherPid = 10588
    stopIdentityEvidencePath = $previousReceipt
    priorFailurePreserved = $true
    correctiveChange = 'Pass explicit PowerShell NullString.Value for .NET null backup path; reuse exact prior-owned prepared readonly temporary file'
    preparedTemporaryPathConsumedByAtomicReplacement = $temp
    beforeSha256 = $before
    afterSha256 = $after
    originalAclPreserved = $aclPreserved
    atomicReplacement = $true
    compareAndSwapGuarantee = $false
    coordination = 'Operational SINGLEWRITER; watcher stopped and exit confirmed before early restore. External uncoordinated writers remain a race.'
    activeDeadlineWatchersAfterRestore = 0
    mutationPerformed = $true
    reason = 'Owner-authorized return to stored readonly after successful bootstrap and matching-marker reconciliation, as reported by root'
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
$data = (New-Object Text.UTF8Encoding($false)).GetBytes(($record | ConvertTo-Json -Depth 6) + [Environment]::NewLine)
$stream = [IO.File]::Open($receipt, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::Read)
try { $stream.Write($data, 0, $data.Length); $stream.Flush($true) } finally { $stream.Dispose() }
$record | ConvertTo-Json -Depth 6 -Compress