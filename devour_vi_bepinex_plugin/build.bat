@echo off
REM Quick compile script for DevourVietnamesePatch

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo DevourVietnamesePatch Compiler
echo ============================================================
echo.

set SCRIPT_DIR=%~dp0
set GAME_PATH=D:\SteamLibrary\steamapps\common\Devour
set BEPINEX_PATH=%GAME_PATH%\BepInEx

echo Checking paths...
if not exist "%BEPINEX_PATH%" (
  echo ERROR: BepInEx not found at %BEPINEX_PATH%
  pause
  exit /b 1
)
echo OK: BepInEx found

echo.
echo Downloading BepInEx reference DLLs...
cd /d "%SCRIPT_DIR%"

REM Create lib folder
if not exist "lib" mkdir lib

REM Copy DLLs from game's BepInEx folder
echo Copying from: %BEPINEX_PATH%\core
xcopy "%BEPINEX_PATH%\core\*.dll" "lib\" /Y /I > nul

echo.
echo Building...
dotnet build -c Release --no-restore 2>&1

if errorlevel 1 (
  echo.
  echo ERROR: Build failed!
  pause
  exit /b 1
)

echo.
echo ============================================================
echo SUCCESS! DLL compiled:
echo %SCRIPT_DIR%bin\Release\net472\DevourVietnamesePatch.dll
echo ============================================================
echo.
echo Next: Copy to BepInEx plugins folder
echo xcopy "bin\Release\net472\DevourVietnamesePatch.dll" "%GAME_PATH%\BepInEx\plugins\" /Y
echo.
pause
