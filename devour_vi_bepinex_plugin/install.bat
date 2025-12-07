@echo off
REM BepInEx + Plugin Auto Setup for DEVOUR
REM Vietnamese Patch Installer

setlocal enabledelayedexpansion

cls
echo.
echo ============================================================
echo DEVOUR Vietnamese BepInEx Plugin Auto Installer
echo ============================================================
echo.

set GAME_PATH=D:\SteamLibrary\steamapps\common\Devour
set BEPINEX_URL=https://github.com/BepInEx/BepInEx/releases/download/v5.4.21/BepInEx_x64_5.4.21.0.zip
set TEMP_ZIP=%TEMP%\BepInEx_5.4.21.0.zip

echo [Step 1] Checking game folder...
if exist "%GAME_PATH%" (
    echo [OK] Game folder found: %GAME_PATH%
) else (
    echo [ERROR] Game not found at: %GAME_PATH%
    echo Please modify GAME_PATH in this script
    pause
    exit /b 1
)
echo.

echo [Step 2] Checking for BepInEx...
if exist "%GAME_PATH%\BepInEx" (
    echo [OK] BepInEx already installed
) else (
    echo [DOWNLOAD] Downloading BepInEx 5.4.21...
    powershell -Command "Invoke-WebRequest -Uri '%BEPINEX_URL%' -OutFile '%TEMP_ZIP%'" >nul 2>&1
    
    if exist "%TEMP_ZIP%" (
        echo [EXTRACT] Extracting to game folder...
        powershell -Command "Expand-Archive -Path '%TEMP_ZIP%' -DestinationPath '%GAME_PATH%' -Force" >nul 2>&1
        echo [OK] BepInEx installed
        del "%TEMP_ZIP%"
    ) else (
        echo [ERROR] Failed to download BepInEx
        echo Please download manually from: %BEPINEX_URL%
        pause
        exit /b 1
    )
)
echo.

echo [Step 3] Checking for plugin DLL...
set PLUGIN_DLL=e:\Đức Hải\steam-manifest-bot\devour_vi_bepinex_plugin\bin\Release\net472\DevourVietnamesePatch.dll

if exist "%PLUGIN_DLL%" (
    echo [OK] Plugin found: %PLUGIN_DLL%
) else (
    echo [BUILD] Need to compile plugin first...
    cd /d "e:\Đức Hải\steam-manifest-bot\devour_vi_bepinex_plugin"
    
    echo [CHECK] Checking for dotnet...
    where dotnet >nul 2>&1
    if %errorLevel% neq 0 (
        echo [ERROR] .NET SDK not found
        echo Please install: https://dotnet.microsoft.com/en-us/download
        pause
        exit /b 1
    )
    
    echo [COMPILE] Building plugin...
    dotnet build -c Release >nul 2>&1
    
    if not exist "!PLUGIN_DLL!" (
        echo [ERROR] Compilation failed
        echo Try: cd e:\Đức Hải\steam-manifest-bot\devour_vi_bepinex_plugin
        echo Then: dotnet build -c Release
        pause
        exit /b 1
    )
    echo [OK] Plugin compiled
)
echo.

echo [Step 4] Copying plugin to BepInEx...
set PLUGINS_DIR=%GAME_PATH%\BepInEx\plugins
if not exist "!PLUGINS_DIR!" mkdir "!PLUGINS_DIR!"

copy /y "%PLUGIN_DLL%" "!PLUGINS_DIR!" >nul 2>&1
echo [OK] Plugin copied to: !PLUGINS_DIR!
echo.

echo ============================================================
echo [SUCCESS] Setup Complete!
echo ============================================================
echo.
echo Next steps:
echo 1. Launch DEVOUR game
echo 2. Check menu for Vietnamese text
echo 3. If you see Vietnamese = Plugin works!
echo.
echo Log file: %GAME_PATH%\BepInEx\LogOutput.log
echo Plugin DLL: !PLUGINS_DIR!\DevourVietnamesePatch.dll
echo.
pause
