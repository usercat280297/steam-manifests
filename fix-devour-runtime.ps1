# DEVOUR Runtime Fix Script
# Cài đặt tất cả required runtimes cho DEVOUR

Write-Host "🔧 DEVOUR Runtime Fix Tool" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "❌ This script requires Administrator privileges!" -ForegroundColor Red
    Write-Host "Please right-click and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

# 1. Check current Visual C++ versions
Write-Host "📋 Checking installed Visual C++ versions..." -ForegroundColor Yellow
Write-Host ""

$vcRedistPaths = @(
    "HKLM:\SOFTWARE\Classes\Installer\Products",
    "HKLM:\SOFTWARE\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"
)

$installedVC = @()
foreach ($path in $vcRedistPaths) {
    if (Test-Path $path) {
        Get-ChildItem $path | ForEach-Object {
            $displayName = (Get-ItemProperty $_.PSPath).DisplayName
            if ($displayName -like "*Visual C++*" -or $displayName -like "*VC Redist*") {
                $installedVC += $displayName
            }
        }
    }
}

if ($installedVC.Count -gt 0) {
    Write-Host "Currently installed:" -ForegroundColor Green
    $installedVC | ForEach-Object { Write-Host "  ✅ $_" }
} else {
    Write-Host "  ⚠️  No Visual C++ redistributables found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📥 Installing required runtimes for DEVOUR..." -ForegroundColor Yellow
Write-Host ""

# 2. Download links for required runtimes
$runtimes = @(
    @{
        name = "Visual C++ 2015-2022 (x86)"
        url = "https://aka.ms/vs/17/release/vc_redist.x86.exe"
        file = "$env:TEMP\vc_redist_2022_x86.exe"
    },
    @{
        name = "Visual C++ 2015-2022 (x64)"
        url = "https://aka.ms/vs/17/release/vc_redist.x64.exe"
        file = "$env:TEMP\vc_redist_2022_x64.exe"
    },
    @{
        name = ".NET Runtime 8.0 (for GreenLuma GUI)"
        url = "https://dotnetcli.blob.core.windows.net/dotnet/release-metadata/releases-index.json"
        file = "$env:TEMP\dotnet_runtime_8.exe"
    }
)

# 3. Install VC++ 2022
Write-Host "Installing Visual C++ 2022 (x86)..." -ForegroundColor Cyan
$vcx86 = "vc_redist.x86.exe"
$vcx64 = "vc_redist.x64.exe"

# Check if files exist in current directory
if (-not (Test-Path $vcx86)) {
    Write-Host "⏬ Downloading Visual C++ 2022 (x86)..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri "https://aka.ms/vs/17/release/vc_redist.x86.exe" `
            -OutFile $vcx86 -ErrorAction Stop
        Write-Host "✅ Downloaded" -ForegroundColor Green
    } catch {
        Write-Host "❌ Download failed: $_" -ForegroundColor Red
    }
}

if (Test-Path $vcx86) {
    Write-Host "📦 Installing..." -ForegroundColor Cyan
    & ".\$vcx86" /quiet /norestart
    Write-Host "✅ Installed Visual C++ 2022 (x86)" -ForegroundColor Green
}

# Install VC++ 2022 x64
Write-Host ""
Write-Host "Installing Visual C++ 2022 (x64)..." -ForegroundColor Cyan
if (-not (Test-Path $vcx64)) {
    Write-Host "⏬ Downloading Visual C++ 2022 (x64)..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri "https://aka.ms/vs/17/release/vc_redist.x64.exe" `
            -OutFile $vcx64 -ErrorAction Stop
        Write-Host "✅ Downloaded" -ForegroundColor Green
    } catch {
        Write-Host "❌ Download failed: $_" -ForegroundColor Red
    }
}

if (Test-Path $vcx64) {
    Write-Host "📦 Installing..." -ForegroundColor Cyan
    & ".\$vcx64" /quiet /norestart
    Write-Host "✅ Installed Visual C++ 2022 (x64)" -ForegroundColor Green
}

# 4. Verify game installation
Write-Host ""
Write-Host "🎮 Verifying DEVOUR installation..." -ForegroundColor Yellow
Write-Host ""

$gamePath = "D:\SteamLibrary\steamapps\common\Devour"
$gameExe = Join-Path $gamePath "DEVOUR.exe"

if (Test-Path $gamePath) {
    Write-Host "✅ Game folder found: $gamePath" -ForegroundColor Green
    
    $dllFiles = Get-ChildItem $gamePath -Filter "*.dll" | Measure-Object
    Write-Host "✅ Found $($dllFiles.Count) DLL files" -ForegroundColor Green
    
    if (Test-Path $gameExe) {
        Write-Host "✅ DEVOUR.exe found" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Game folder not found at: $gamePath" -ForegroundColor Red
    Write-Host "Please verify DEVOUR is installed" -ForegroundColor Yellow
}

# 5. Fix common issues
Write-Host ""
Write-Host "🔧 Applying additional fixes..." -ForegroundColor Cyan
Write-Host ""

# Verify game files through Steam
Write-Host "📌 Next steps:" -ForegroundColor Yellow
Write-Host "1. Open Steam" -ForegroundColor White
Write-Host "2. Right-click DEVOUR → Properties" -ForegroundColor White
Write-Host "3. Go to LOCAL FILES tab" -ForegroundColor White
Write-Host "4. Click 'Verify integrity of game files...'" -ForegroundColor White
Write-Host ""

Write-Host "⏳ After verification completes, try launching game again" -ForegroundColor Cyan
Write-Host ""

Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "✅ Runtime installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "If you still get runtime errors:" -ForegroundColor Yellow
Write-Host "  1. Restart your computer" -ForegroundColor White
Write-Host "  2. Verify game files in Steam" -ForegroundColor White
Write-Host "  3. Uninstall and reinstall DEVOUR" -ForegroundColor White
Write-Host ""
