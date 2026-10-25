$ErrorActionPreference = 'Stop'
$fixtureRoot = 'D:\Workspace\pos-cafe-permission-timeonly-20261022\temp\night-node01'
$allowedParent = 'D:\Workspace\pos-cafe-permission-timeonly-20261022\temp'
$resolvedFixture = [IO.Path]::GetFullPath($fixtureRoot)
if ($resolvedFixture -ne $fixtureRoot -or -not $resolvedFixture.StartsWith($allowedParent + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'OUTSIDE_APPROVED_PATH' }
$rootIdentity = Get-Item -LiteralPath $fixtureRoot -Force
if (-not $rootIdentity.PSIsContainer -or ($rootIdentity.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'ROOT_IDENTITY' }
$items = @(Get-ChildItem -LiteralPath $fixtureRoot -Force -Recurse)
$links = @($items | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint })
$expectedLinks = @(
  $fixtureRoot + '\permission-staging-ci-portability-20261022-PAK0aB\dangling-docs\docs-link'
  $fixtureRoot + '\permission-staging-ci-portability-20261022-PAK0aB\present-docs\docs-alias'
)
if ($links.Count -ne 2 -or @($links | Where-Object { $_.FullName -notin $expectedLinks }).Count -ne 0) { throw 'LINK_IDENTITY' }
$files = @($items | Where-Object { -not $_.PSIsContainer -and -not ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) })
$logicalBytes = ($files | Measure-Object -Property Length -Sum).Sum
if ($files.Count -ne 45 -or $logicalBytes -ne 40919) { throw 'FIXTURE_CHANGED' }
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
  authorizationReference = 'request_user_input_async call_074a110f1f0348a7af8702cbc1f45643 item0'
  answer = 'Xóa riêng fixture đã dùng xong'
  approvedAbsolutePath = $fixtureRoot
  files = $files.Count
  logicalBytes = $logicalBytes
  linksRemovedWithoutRecursion = $links.Count
  fixtureRemoved = $true
  freeBytesBefore = $freeBefore
  freeBytesAfter = $freeAfter
  observedHostFreeDeltaBytes = $freeAfter - $freeBefore
  measurementLimit = 'Logical fixture bytes are distinct from measured host free-space change; other processes may affect host delta.'
  reportsPreserved = @('night-node01.tap','night-node01-stderr.log','night-node01.json')
}
$receipt | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath 'D:\Workspace\pos-cafe-docs\docs\implementation-log\permission-main-staging-night-20261022\cleanup-node-fixture01.json' -Encoding utf8NoBOM
$receipt | ConvertTo-Json -Depth 5
