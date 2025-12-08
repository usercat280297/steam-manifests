# The Sushi House - Download & Manifest Info

##  Download Link
https://steamcontent.com/depot/3687471/manifest/4962893632385854811/

##  Manifest Details
- **AppID:** 3687470
- **Game Name:** The Sushi House  
- **DepotID:** 3687471
- **ManifestID:** 4962893632385854811
- **Manifest Hash:** dc1007b267c56ffe70687e6cc540f2efa091e2ba1b615eb735b80583106c793d

##  Manifest File
Location: `manifests/3687470.lua`

Use with GreenLuma Reborn by copying to your GreenLuma manifests directory.

##  Auto-Generate for Other Games

### Quick Command (SteamCMD)
```powershell
steamcmd +login anonymous +app_info_print <APP_ID> +quit
```

Replace `<APP_ID>` with the game's Steam App ID.

### Example: Get Manifest for Team Fortress 2 (AppID 440)
```powershell
steamcmd +login anonymous +app_info_print 440 +quit 2>&1 | Select-String '"gid"'
```

This will show the ManifestID under depots section.

##  Steps to Create Manifest for Any Game

1. Get the **AppID** from Steam store URL
2. Run: `steamcmd +login anonymous +app_info_print <APP_ID> +quit`
3. Find the **DepotID** and **ManifestID** under "depots" section
4. Calculate hash: `SHA256("DepotID:ManifestID")`
5. Create `.lua` file:
```lua
addappid(<APP_ID>)
addappid(<DEPOT_ID>, 0, "<HASH>")
```

##  SteamCMD Location
`C:\steamcmd\steamcmd.exe`

If not present, download from: https://steamcmd.net/

---

**Last Updated:** 2025-12-08
