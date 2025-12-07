# BepInEx + Plugin Auto Setup for DEVOUR - PowerShell Version
# Vietnamese Patch Installer

param(
    [switch]$SkipDownload,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "DEVOUR Vietnamese BepInEx Plugin Auto Installer" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$GAME_PATH = "D:\SteamLibrary\steamapps\common\Devour"
$BEPINEX_URL = "https://github.com/BepInEx/BepInEx/releases/download/v5.4.21/BepInEx_x64_5.4.21.0.zip"
$TEMP_ZIP = "$env:TEMP\BepInEx_5.4.21.0.zip"
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

# ============================================================
# STEP 1: Check game folder
# ============================================================
Write-Host "[Step 1] Checking game folder..." -ForegroundColor Yellow
if (Test-Path $GAME_PATH) {
    Write-Host "[OK] Game folder found: $GAME_PATH" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Game not found at: $GAME_PATH" -ForegroundColor Red
    Write-Host "Please modify GAME_PATH in this script" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ============================================================
# STEP 2: Check for BepInEx
# ============================================================
Write-Host "[Step 2] Checking for BepInEx..." -ForegroundColor Yellow
$BEPINEX_DIR = "$GAME_PATH\BepInEx"

if (Test-Path $BEPINEX_DIR) {
    Write-Host "[OK] BepInEx already installed" -ForegroundColor Green
} else {
    if ($SkipDownload) {
        Write-Host "[SKIP] BepInEx download skipped" -ForegroundColor Yellow
    } else {
        Write-Host "[DOWNLOAD] Downloading BepInEx 5.4.21..." -ForegroundColor Yellow
        try {
            Invoke-WebRequest -Uri $BEPINEX_URL -OutFile $TEMP_ZIP -UseBasicParsing
            Write-Host "[EXTRACT] Extracting to game folder..." -ForegroundColor Yellow
            Expand-Archive -Path $TEMP_ZIP -DestinationPath $GAME_PATH -Force
            Remove-Item $TEMP_ZIP -Force
            Write-Host "[OK] BepInEx installed" -ForegroundColor Green
        } catch {
            Write-Host "[ERROR] Failed to download/extract BepInEx" -ForegroundColor Red
            Write-Host "Please download manually from: $BEPINEX_URL" -ForegroundColor Red
            exit 1
        }
    }
}
Write-Host ""

# ============================================================
# STEP 3: Check for plugin DLL
# ============================================================
Write-Host "[Step 3] Checking for plugin DLL..." -ForegroundColor Yellow
$PLUGIN_DLL = $null

# Check multiple locations
$possiblePaths = @(
    "$SCRIPT_DIR\bin\Release\net472\DevourVietnamesePatch.dll",
    "$SCRIPT_DIR\DevourVietnamesePatch.dll",
    "$SCRIPT_DIR\..\devour_vi_bepinex_plugin\bin\Release\net472\DevourVietnamesePatch.dll"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $PLUGIN_DLL = $path
        Write-Host "[OK] Plugin found: $PLUGIN_DLL" -ForegroundColor Green
        break
    }
}

if (-not $PLUGIN_DLL) {
    Write-Host "[INFO] Plugin DLL not found locally" -ForegroundColor Yellow
    Write-Host "[DOWNLOAD] Attempting to download from GitHub Actions..." -ForegroundColor Yellow
    
    Push-Location $SCRIPT_DIR
    try {
        # Try to download DLL from GitHub Actions artifacts
        & node download-dll.js
        
        # Check again after download
        if (Test-Path "$SCRIPT_DIR\DevourVietnamesePatch.dll") {
            $PLUGIN_DLL = "$SCRIPT_DIR\DevourVietnamesePatch.dll"
            Write-Host "[OK] Downloaded plugin" -ForegroundColor Green
        } else {
            Write-Host "[INFO] Attempting local build instead..." -ForegroundColor Yellow
            
            # Check for dotnet
            $dotnetCheck = (Get-Command dotnet -ErrorAction SilentlyContinue)
            if (-not $dotnetCheck) {
                Write-Host "[ERROR] .NET SDK not found" -ForegroundColor Red
                Write-Host "Please install: https://dotnet.microsoft.com/en-us/download" -ForegroundColor Red
                exit 1
            }
            
            Write-Host "[COMPILE] Building plugin locally..." -ForegroundColor Yellow
            & dotnet build -c Release 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                $PLUGIN_DLL = "$SCRIPT_DIR\bin\Release\net472\DevourVietnamesePatch.dll"
                Write-Host "[OK] Plugin compiled" -ForegroundColor Green
            } else {
                Write-Host "[ERROR] Compilation failed" -ForegroundColor Red
                exit 1
            }
        }
    } catch {
        Write-Host "[ERROR] Cannot find or build plugin" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        exit 1
    } finally {
        Pop-Location
    }
}
Write-Host ""

# ============================================================
# STEP 4: Copy plugin to BepInEx
# ============================================================
Write-Host "[Step 4] Copying plugin to BepInEx..." -ForegroundColor Yellow
$PLUGINS_DIR = "$GAME_PATH\BepInEx\plugins"

if (-not (Test-Path $PLUGINS_DIR)) {
    New-Item -ItemType Directory -Path $PLUGINS_DIR -Force | Out-Null
}

if (Test-Path $PLUGIN_DLL) {
    Copy-Item -Path $PLUGIN_DLL -Destination $PLUGINS_DIR -Force
    Write-Host "[OK] Plugin copied to: $PLUGINS_DIR" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Plugin DLL not found at: $PLUGIN_DLL" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ============================================================
# SUCCESS
# ============================================================
Write-Host "============================================================" -ForegroundColor Green
Write-Host "[SUCCESS] Setup Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Launch DEVOUR game" -ForegroundColor White
Write-Host "2. Check menu for Vietnamese text" -ForegroundColor White
Write-Host "3. If you see Vietnamese = Plugin works!" -ForegroundColor White
Write-Host ""
Write-Host "Log file: $GAME_PATH\BepInEx\LogOutput.log" -ForegroundColor Gray
Write-Host "Plugin DLL: $PLUGINS_DIR\DevourVietnamesePatch.dll" -ForegroundColor Gray
Write-Host ""
