$ErrorActionPreference = 'Stop'
$fixtureRoot = 'D:\Workspace\pos-cafe-permission-timeonly-20261022\temp\night-node05'
if ((Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Workspace\pos-cafe-permission-timeonly-20261022\evidence\night-node05.json').Hash.ToLowerInvariant() -ne '8a2025b8dddace0d053f1efd735cbfcf8567e9948689e79111b59d5751a91ce9') { throw 'RECEIPT_HASH' }
$runReceipt = Get-Content -Raw -LiteralPath 'D:\Workspace\pos-cafe-permission-timeonly-20261022\evidence\night-node05.json' | ConvertFrom-Json
if ($runReceipt.sourceSHA -ne '4f8772667fc0607c77451e5b0c5ddbedfe7b63b5' -or $runReceipt.exitCode -ne 0 -or $runReceipt.tests -ne 938 -or $runReceipt.pass -ne 938 -or $runReceipt.fail -ne 0 -or $runReceipt.skip -ne 0 -or -not $runReceipt.sourceCleanAfter -or -not $runReceipt.noInstall -or -not $runReceipt.noNetwork -or [IO.Path]::GetFullPath($runReceipt.tempRoot) -ne $fixtureRoot) { throw 'REPORT_BINDING' }
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $runReceipt.tap.path).Hash.ToLowerInvariant() -ne $runReceipt.tap.sha256) { throw 'TAP_HASH' }
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $runReceipt.stderr.path).Hash.ToLowerInvariant() -ne $runReceipt.stderr.sha256) { throw 'STDERR_HASH' }
$allowedParent = 'D:\Workspace\pos-cafe-permission-timeonly-20261022\temp'
$resolvedFixture = [IO.Path]::GetFullPath($fixtureRoot)
if ($resolvedFixture -ne $fixtureRoot -or -not $resolvedFixture.StartsWith($allowedParent + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'OUTSIDE_APPROVED_PATH' }
$rootIdentity = Get-Item -LiteralPath $fixtureRoot -Force
if (-not $rootIdentity.PSIsContainer -or ($rootIdentity.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'ROOT_IDENTITY' }
$items = @(Get-ChildItem -LiteralPath $fixtureRoot -Force -Recurse)
$links = @($items | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint })
$expectedLinks = @(
  $fixtureRoot + '\permission-staging-ci-portability-20261022-e8qCdK\dangling-docs\docs-link'
  $fixtureRoot + '\permission-staging-ci-portability-20261022-e8qCdK\present-docs\docs-alias'
)
if ($links.Count -ne 2 -or @($links | Where-Object { $_.FullName -notin $expectedLinks }).Count -ne 0) { throw 'LINK_IDENTITY' }
$files = @($items | Where-Object { -not $_.PSIsContainer -and -not ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) })
$logicalBytes = ($files | Measure-Object -Property Length -Sum).Sum
if ($files.Count -ne 45 -or $logicalBytes -ne 40919) { throw 'FIXTURE_CHANGED' }
if ([DateTime]::UtcNow -ge [DateTime]::Parse('2026-10-22T17:00:00Z').ToUniversalTime()) { throw 'AUTHORIZATION_EXPIRED' }
if (@(Get-CimInstance Win32_Process | Where-Object { $_.Name -in @('node.exe','cmd.exe') -and $_.CommandLine -and $_.CommandLine.Contains($fixtureRoot) }).Count) { throw 'PROCESS_STILL_USES_FIXTURE' }
$freeBefore = (Get-PSDrive -Name D).Free
# Remove each approved link itself without recursion before deleting the owned
# fixture tree, so a junction cannot redirect recursive deletion.
foreach ($link in $links) { Remove-Item -LiteralPath $link.FullName -Force }
if (@(Get-ChildItem -LiteralPath $fixtureRoot -Force -Recurse | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }).Count) { throw 'REMAINING_LINK' }
Remove-Item -LiteralPath $fixtureRoot -Recurse -Force
$freeAfter = (Get-PSDrive -Name D).Free
if (Test-Path -LiteralPath $fixtureRoot) { throw 'ROOT_REMAINS' }
$receipt = [ordered]@{
  schemaVersion = 'permission-node-fixture-cleanup-v1'
  recordedAtUtc = [DateTime]::UtcNow.ToString('o')
  authorizationReference = 'request_user_input_async call_0a899e78075b42f4a7ca84a7d0073d9d item0'
  answer = 'Cho phép dọn nhóm fixture này đến 00:00'
  approvedAbsolutePath = $fixtureRoot
  files = $files.Count
  logicalBytes = $logicalBytes
  linksRemovedWithoutRecursion = $links.Count
  fixtureRemoved = $true
  freeBytesBefore = $freeBefore
  freeBytesAfter = $freeAfter
  observedHostFreeDeltaBytes = $freeAfter - $freeBefore
  measurementLimit = 'Logical fixture bytes are distinct from measured host free-space change; other processes may affect host delta.'
  reportsPreserved = @('night-node05.tap','night-node05-stderr.log','night-node05.json')
}
$receipt | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath 'D:\Workspace\pos-cafe-docs\docs\implementation-log\permission-main-staging-night-20261022\cleanup-node-fixture04.json' -Encoding utf8NoBOM
$receipt | ConvertTo-Json -Depth 5
