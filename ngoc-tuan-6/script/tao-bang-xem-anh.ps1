param([string]$EvidenceRoot, [string]$OutputDir)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
[IO.Directory]::CreateDirectory($OutputDir) | Out-Null
$font = New-Object System.Drawing.Font('Arial', 14)
$manifest = @()
foreach ($group in @('n01', 'giao-dien')) {
  $files = @(Get-ChildItem -LiteralPath (Join-Path $EvidenceRoot "$group/anh") -Recurse -File -Filter '*.png' | Sort-Object FullName)
  for ($i = 0; $i -lt $files.Count; $i += 6) {
    $batch = @($files | Select-Object -Skip $i -First 6)
    $canvas = New-Object System.Drawing.Bitmap(1600, (480 * [int][Math]::Ceiling($batch.Count / 2.0)))
    $g = [System.Drawing.Graphics]::FromImage($canvas)
    $g.Clear([System.Drawing.Color]::White)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $sheet = '{0}-{1:D2}.jpg' -f $group, [int](1 + $i / 6)
    for ($j = 0; $j -lt $batch.Count; $j++) {
      $file = $batch[$j]
      $img = [System.Drawing.Image]::FromFile($file.FullName)
      $x = ($j % 2) * 800
      $y = [int][Math]::Floor($j / 2.0) * 480
      $scale = [Math]::Min(800.0 / $img.Width, 450.0 / $img.Height)
      $label = if ($group -eq 'n01') { $file.Directory.Name + '/' + $file.Name } else { $file.Name }
      $g.DrawString($label, $font, [System.Drawing.Brushes]::Black, $x, $y)
      $g.DrawImage($img, $x, ($y + 28), [int]($img.Width * $scale), [int]($img.Height * $scale))
      $manifest += [pscustomobject]@{ group=$group; image=$label; sheet=$sheet; width=$img.Width; height=$img.Height; sha256=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLower() }
      $img.Dispose()
    }
    $canvas.Save((Join-Path $OutputDir $sheet), [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $g.Dispose()
    $canvas.Dispose()
  }
}
$font.Dispose()
$manifest | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $OutputDir 'danh-sach-anh.json')
$manifest | Group-Object group | Select-Object Name,Count
