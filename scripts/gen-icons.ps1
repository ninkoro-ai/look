Add-Type -AssemblyName System.Drawing

function New-RoundedRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-Icon([int]$size, [string]$outPath) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)

  $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
  $grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.Color]::FromArgb(255, 244, 235, 222),
    [System.Drawing.Color]::FromArgb(255, 185, 106, 75),
    45
  )
  $bgPath = New-RoundedRectPath 0 0 $size $size ($size * 0.22)
  $g.FillPath($grad, $bgPath)

  $s = $size / 512.0
  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 252, 249, 244), ($size * 0.052))
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

  # 挂衣钩圆环
  $g.DrawEllipse($pen, [single]((256 - 26) * $s), [single](92 * $s), [single](52 * $s), [single](52 * $s))
  # 钩子直线
  $g.DrawLine($pen, 256 * $s, 144 * $s, 256 * $s, 226 * $s)
  # 衣架三角形
  $g.DrawLine($pen, 256 * $s, 226 * $s, 148 * $s, 300 * $s)
  $g.DrawLine($pen, 256 * $s, 226 * $s, 364 * $s, 300 * $s)
  $g.DrawLine($pen, 148 * $s, 300 * $s, 364 * $s, 300 * $s)
  # 下横杆
  $g.DrawLine($pen, 172 * $s, 352 * $s, 340 * $s, 352 * $s)

  $pen.Dispose()
  $grad.Dispose()
  $bgPath.Dispose()
  $g.Dispose()
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

New-Item -ItemType Directory -Force -Path "D:\chuandaOS\public\icons" | Out-Null
New-Icon 512 "D:\chuandaOS\public\icons\icon-512.png"
New-Icon 192 "D:\chuandaOS\public\icons\icon-192.png"
Write-Output "icons generated"
