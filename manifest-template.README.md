Purpose
-------

This folder contains a manifest template (`manifest-template.json`) intended for safe local testing of the bot's manifest-processing pipeline.

Important
---------
- This template is NOT an "online fix" and does not, and must not, be used to bypass DRM or anti-tamper systems.
- If you need official access to online functionality or non-DRM test builds, contact the game's publisher or Valve/Steam and request developer/test depots.

Usage
-----
- Copy `manifest-template.json` to `manifests/<appId>.json` and adapt `appId`, `depotId`, and `manifestId` fields for offline testing.
- The bot will treat this file like any other manifest for packaging and uploading, which is useful for validating the UI, GitHub uploads, and Discord embeds.

Alternatives for Online Testing
-------------------------------
- Request a developer or QA depot from the publisher.
- Use official APIs (SteamPipe / Steam depots) according to Steam terms.
- Work with community devs / publishers to obtain test-approved builds.

If you want, I can:
- Add a CLI flag to the bot to treat manifests under a `test/` folder as "test-only" and skip upload/notify steps.
- Wire a toggle in the `/admin` UI to import these templates for local validation.
