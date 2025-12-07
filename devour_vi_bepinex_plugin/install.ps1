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
$PLUGIN_DLL = "$SCRIPT_DIR\bin\Release\net472\DevourVietnamesePatch.dll"

if (Test-Path $PLUGIN_DLL) {
    Write-Host "[OK] Plugin found: $PLUGIN_DLL" -ForegroundColor Green
} else {
    if ($SkipBuild) {
        Write-Host "[SKIP] Plugin build skipped" -ForegroundColor Yellow
    } else {
        Write-Host "[BUILD] Need to compile plugin first..." -ForegroundColor Yellow
        
        # Check for dotnet
        $dotnetCheck = (Get-Command dotnet -ErrorAction SilentlyContinue)
        if (-not $dotnetCheck) {
            Write-Host "[ERROR] .NET SDK not found" -ForegroundColor Red
            Write-Host "Please install: https://dotnet.microsoft.com/en-us/download" -ForegroundColor Red
            Write-Host "After installing, run this script again" -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host "[COMPILE] Building plugin..." -ForegroundColor Yellow
        Push-Location $SCRIPT_DIR
        try {
            & dotnet build -c Release 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) {
                Write-Host "[ERROR] Compilation failed" -ForegroundColor Red
                Write-Host "Try manually:" -ForegroundColor Yellow
                Write-Host "  cd $SCRIPT_DIR" -ForegroundColor Yellow
                Write-Host "  dotnet build -c Release" -ForegroundColor Yellow
                exit 1
            }
            Write-Host "[OK] Plugin compiled" -ForegroundColor Green
        } finally {
            Pop-Location
        }
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
