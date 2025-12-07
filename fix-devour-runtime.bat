@echo off
REM DEVOUR Runtime Fix - Simple Batch Script
REM Cài đặt Visual C++ Redistributable

setlocal enabledelayedexpansion

cls
echo.
echo ============================================
echo DEVOUR Runtime Fix Tool
echo ============================================
echo.

REM Check admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script requires Administrator privileges!
    echo.
    echo Please right-click this file and select "Run as Administrator"
    pause
    exit /b 1
)

echo [OK] Running as Administrator
echo.

REM Download and install VC++ Redistributable
echo Downloading Visual C++ 2022 Redistributable...
echo.

REM Visual C++ 2022 x64
echo Installing Visual C++ 2022 (x64)...
powershell -Command "Invoke-WebRequest -Uri 'https://aka.ms/vs/17/release/vc_redist.x64.exe' -OutFile '%TEMP%\vc_redist.x64.exe'" >nul 2>&1
if exist "%TEMP%\vc_redist.x64.exe" (
    "%TEMP%\vc_redist.x64.exe" /quiet /norestart
    echo [OK] Installed Visual C++ 2022 (x64)
    del "%TEMP%\vc_redist.x64.exe"
) else (
    echo [ERROR] Failed to download VC++ 2022 x64
)

echo.

REM Visual C++ 2022 x86
echo Installing Visual C++ 2022 (x86)...
powershell -Command "Invoke-WebRequest -Uri 'https://aka.ms/vs/17/release/vc_redist.x86.exe' -OutFile '%TEMP%\vc_redist.x86.exe'" >nul 2>&1
if exist "%TEMP%\vc_redist.x86.exe" (
    "%TEMP%\vc_redist.x86.exe" /quiet /norestart
    echo [OK] Installed Visual C++ 2022 (x86)
    del "%TEMP%\vc_redist.x86.exe"
) else (
    echo [ERROR] Failed to download VC++ 2022 x86
)

echo.
echo ============================================
echo Installation complete!
echo ============================================
echo.
echo Next steps:
echo 1. Restart your computer
echo 2. Open Steam
echo 3. Right-click DEVOUR ^> Properties
echo 4. Local Files ^> Verify integrity of game files
echo 5. Try launching game again
echo.
pause
