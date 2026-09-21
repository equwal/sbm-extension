# Draws the sbm icon (a white ribbon on #005577) as PNG files.
# Usage: powershell -File make-icons.ps1 -Out <dir> -Sizes 16,32,48,128
param([string]$Out, [string]$Sizes)
Add-Type -AssemblyName System.Drawing

foreach ($size in ($Sizes -split "," | ForEach-Object { [int]$_ })) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    # A square with round corners.
    $r = [single]($size * 0.18)
    $d = 2 * $r
    $e = [single]($size - 1)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $d, $d, 180, 90)
    $path.AddArc($e - $d, 0, $d, $d, 270, 90)
    $path.AddArc($e - $d, $e - $d, $d, $d, 0, 90)
    $path.AddArc(0, $e - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    $blue = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 0, 0x55, 0x77))
    $g.FillPath($blue, $path)

    # The ribbon of the Android icon: M40,30 L68,30 L68,80 L54,69 L40,80 Z,
    # centred, 62 percent of the icon high.
    $s = $size * 0.62 / 50
    $c = $size / 2
    $pts = @(@(-14, -25), @(14, -25), @(14, 25), @(0, 14), @(-14, 25)) | ForEach-Object {
        New-Object System.Drawing.PointF ([single]($c + $_[0] * $s)), ([single]($c + $_[1] * $s))
    }
    $g.FillPolygon([System.Drawing.Brushes]::White, [System.Drawing.PointF[]]$pts)

    $bmp.Save((Join-Path $Out "$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}
