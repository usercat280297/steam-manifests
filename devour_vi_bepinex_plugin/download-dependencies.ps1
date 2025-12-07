$v = "5.4.21"
$url = "https://github.com/BepInEx/BepInEx/releases/download/v$v/BepInEx_x64_$v.zip"
$dir = Split-Path -Parent $PSCommandPath
$lib = Join-Path $dir "lib"
$zip = Join-Path $lib "BepInEx.zip"

Write-Host "Downloading BepInEx $v..." -ForegroundColor Cyan
if (-not (Test-Path $lib)) { mkdir $lib | Out-Null }
if (-not (Test-Path $zip)) {
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
}
Write-Host "Downloaded" -ForegroundColor Green

Write-Host "Extracting..." -ForegroundColor Cyan
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($zip, $lib, $true)
Write-Host "Done!" -ForegroundColor Green

Write-Host "Copying DLLs..." -ForegroundColor Cyan
$core = Join-Path $lib "BepInEx\core"
if (Test-Path $core) {
    Get-ChildItem $core -Filter "*.dll" | % { Copy-Item $_.FullName $lib -Force }
}
Write-Host "Ready to build!" -ForegroundColor Green
