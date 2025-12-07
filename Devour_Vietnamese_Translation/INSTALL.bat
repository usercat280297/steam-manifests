@echo off
chcp 65001 > nul
cls
echo.
echo Looking for Devour game folder...
echo.

setlocal enabledelayedexpansion
set FOUND=0

for %%D in (
  "C:\Program Files (x86)\Steam\steamapps\common\Devour"
  "D:\SteamLibrary\steamapps\common\Devour"
  "E:\SteamLibrary\steamapps\common\Devour"
) do (
  if exist "%%D\inventory.json" (
    set "GAMEPATH=%%D"
    set FOUND=1
    goto :FOUND
  )
)

if %FOUND%==0 (
  echo Game folder not found! Enter path:
  set /p "GAMEPATH=Path: "
)

:FOUND
echo Found: %GAMEPATH%
echo.

if not exist "%GAMEPATH%\inventory.json.backup" (
  copy "%GAMEPATH%\inventory.json" "%GAMEPATH%\inventory.json.backup"
  echo Backup created
)

copy "inventory.json" "%GAMEPATH%\inventory.json" /Y
echo Vietnamese installed!
echo.
echo Done! Launch game now.
pause
