@echo off
REM Download BepInEx 5.4.21 from GitHub releases
REM This script fetches the required DLLs instead of using NuGet

setlocal enabledelayedexpansion

set "BEPINEX_VERSION=5.4.21"
set "DOWNLOAD_URL=https://github.com/BepInEx/BepInEx/releases/download/v%BEPINEX_VERSION%/BepInEx_x64_%BEPINEX_VERSION%.zip"
set "DOWNLOAD_DIR=%~dp0lib"
set "ZIP_FILE=%DOWNLOAD_DIR%\BepInEx.zip"

echo.
echo ============================================
echo BepInEx Dependency Downloader
echo ============================================
echo.
echo Version: %BEPINEX_VERSION%
echo Target: %DOWNLOAD_DIR%
echo.

if not exist "%DOWNLOAD_DIR%" (
  echo Creating lib directory...
  mkdir "%DOWNLOAD_DIR%"
)

if exist "%ZIP_FILE%" (
  echo ✓ BepInEx already downloaded
  goto :extract
)

echo Downloading BepInEx from GitHub...
powershell -NoProfile -Command "^
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityPointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12; ^
  Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%ZIP_FILE%' -UseBasicParsing"

if errorlevel 1 (
  echo ✗ Download failed!
  pause
  exit /b 1
)
echo ✓ Downloaded

:extract
echo Extracting BepInEx...
powershell -NoProfile -Command "^
  Add-Type -AssemblyName System.IO.Compression.FileSystem; ^
  [System.IO.Compression.ZipFile]::ExtractToDirectory('%ZIP_FILE%', '%DOWNLOAD_DIR%')"

if errorlevel 1 (
  echo ✗ Extraction failed!
  pause
  exit /b 1
)

echo ✓ Extracted

REM Copy DLLs to lib folder
echo Organizing DLLs...
if exist "%DOWNLOAD_DIR%\BepInEx\core" (
  for %%f in ("%DOWNLOAD_DIR%\BepInEx\core\*.dll") do (
    copy "%%f" "%DOWNLOAD_DIR%\" > nul 2>&1
  )
)

echo ✓ Setup complete!
echo.
echo You can now build the project:
echo   dotnet build -c Release
echo.
pause
