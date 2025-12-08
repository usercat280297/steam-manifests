# Auto Manifest Generator - Quick Start

## The Sushi House (AppID 3687470)

**Download Link:**
- https://steamcontent.com/depot/3687471/manifest/4962893632385854811/

**Game Info:**
- AppID: 3687470
- DepotID: 3687471
- ManifestID: 4962893632385854811
- Hash: dc1007b267c56ffe70687e6cc540f2efa091e2ba1b615eb735b80583106c793d

## For Any Future Game - Use SteamCMD

\\\powershell
# Method 1 - Simple command
steamcmd +login anonymous +app_info_print <APP_ID> +quit

# Method 2 - Get DepotID and ManifestID
# Look for "depots" section and find "gid" value
\\\

## AutoGenerate Manifest Script

Create file: **quick-manifest.ps1**

\\\powershell
param([int]\3687470, [string]\ = "Steam App \3687470")

# Run SteamCMD to get depot info
\ = & "C:\steamcmd\steamcmd.exe" "+login" "anonymous" "+app_info_print" \3687470 "+quit" 2>&1

# Parse depot and manifest IDs
\ = [regex]::Matches(\, '"(\d+)"|"gid"\s+"(\d+)"') | % { \.Groups[1].Value, \.Groups[2].Value } | ? { \ }

Write-Host "AppID: \3687470 - Game: \"
Write-Host "Found depots: \"
\\\

## One-Liner to Get Manifest for Any Game

\\\powershell
steamcmd +login anonymous +app_info_print 3687470 +quit 2>&1 | Select-String '"gid"|"(\d+)"' | Select-Object -First 1
\\\

