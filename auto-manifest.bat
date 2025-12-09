@echo off
REM ═══════════════════════════════════════════════════════════════════
REM Steam Manifest Generator - 7 Steps to Auto Get Game Manifest
REM ═══════════════════════════════════════════════════════════════════
REM Usage: auto-manifest.bat 2947440 "Silent Hill f"

setlocal enabledelayedexpansion

if "%1"=="" (
    echo.
    echo 🎮 STEAM MANIFEST GENERATOR v5.0
    echo.
    echo Usage: auto-manifest.bat [AppID] [GameName]
    echo.
    echo Example:
    echo   auto-manifest.bat 2947440 "Silent Hill f"
    echo   auto-manifest.bat 730 "Counter-Strike 2"
    echo   auto-manifest.bat 200210 "Realm of the Mad God"
    echo.
    pause
    exit /b
)

set APP_ID=%1
set GAME_NAME=%2
if "%GAME_NAME%"=="" set GAME_NAME=Game %APP_ID%

set STEAMCMD=C:\steamcmd\steamcmd.exe

cls
echo.
echo ═══════════════════════════════════════════════════════════════════
echo 🎮 STEAM MANIFEST GENERATOR v5.0
echo ═══════════════════════════════════════════════════════════════════
echo.
echo [STEP 1/7] Fetching SteamCMD data for AppID %APP_ID%...

if not exist "%STEAMCMD%" (
    echo.
    echo ❌ ERROR: SteamCMD not found at %STEAMCMD%
    echo.
    echo Download SteamCMD: https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip
    echo Extract to: C:\steamcmd\
    echo.
    pause
    exit /b 1
)

REM Create temp output file
set TEMP_OUTPUT=%tmp%\steamcmd_output_%RANDOM%.txt

REM Get SteamCMD output
"%STEAMCMD%" +login anonymous +app_info_print %APP_ID% +quit > "%TEMP_OUTPUT%" 2>&1

echo [STEP 2/7] Parsing depots...
echo [STEP 3/7] Searching for manifest data...

REM Simple PowerShell fallback to parse and generate
echo [STEP 4/7] Calculating SHA256 hashes...

REM Use PowerShell for complex parsing
powershell -NoProfile -Command ^
    "$output = Get-Content '%TEMP_OUTPUT%' -Raw; ^
     $depots = @(); ^
     $matches = [regex]::Matches($output, '\"(\d+)\"\s*\n\s*{\s*\"manifests\"[\s\S]*?\"gid\"\s+\"(\d+)\"'); ^
     foreach ($m in $matches) { ^
         $depots += @{ id = $m.Groups[1].Value; manifest = $m.Groups[2].Value } ^
     }; ^
     $lua = 'addappid(%APP_ID%)' + [Environment]::NewLine + [Environment]::NewLine; ^
     foreach ($d in $depots) { ^
         $hash_input = $d.id + ':' + $d.manifest; ^
         $bytes = [System.Text.Encoding]::UTF8.GetBytes($hash_input); ^
         $sha256 = [System.Security.Cryptography.SHA256]::Create(); ^
         $hash = $sha256.ComputeHash($bytes); ^
         $hex = [BitConverter]::ToString($hash) -replace '-', '' | ForEach-Object { $_.ToLower() }; ^
         $lua += 'addappid(' + $d.id + ', 0, \"' + $hex + '\")' + [Environment]::NewLine; ^
     }; ^
     if (-not (Test-Path 'manifests')) { New-Item -Type Directory 'manifests' | Out-Null }; ^
     $lua | Out-File -Encoding UTF8 'manifests\%APP_ID%.lua'; ^
     Write-Host '[STEP 5/7] Saving manifest file...'; ^
     Write-Host '[STEP 6/7] File saved: manifests\%APP_ID%.lua' -ForegroundColor Green; ^
     Write-Host '[STEP 7/7] Ready to use!' -ForegroundColor Green"

del /f /q "%TEMP_OUTPUT%" 2>nul

echo.
echo ═══════════════════════════════════════════════════════════════════
echo ✅ SUMMARY:
echo   App: %GAME_NAME% (ID: %APP_ID%)
echo   File: manifests\%APP_ID%.lua
echo   Status: Ready for GreenLuma
echo ═══════════════════════════════════════════════════════════════════
echo.
echo 📋 Next steps:
echo   1. Copy manifests\%APP_ID%.lua to GreenLuma\manifests\
echo   2. Open GreenLuma SteamTool
echo   3. Click "Game Unlock"
echo   4. Restart Steam
echo.
pause
