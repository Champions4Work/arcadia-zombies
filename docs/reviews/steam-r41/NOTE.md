# steam-r41 — readable phone hero steam

Closed **#116 (r40 steam)** failed because the review trio matched main: perimeter `paintVentSteam` stayed tiny (soft-light @ 0.24) and hero-band sites sat off the tank read, so no brass valve wheel or white plume showed in the 390×844 mid-frame.

This pass:

- **`PHONE_HERO_STEAM`** at world **396 / 564 × 288** — inside the phone camera beside **`PHONE_HERO_BLITS`** tanks (**378 / 582 × 300**).
- **`paintPhoneHeroSteam`**: full-alpha **`valve_steam`** handwheel (**0.84** scale) plus layered **`steam_1`–`steam_4`** puffs (**source-over** + capped **soft-light**, **no `lighter` fog wall**).
- Phone path paints hero steam from **`paintPhoneHeroBlits`** only; vent loop skips duplicate hero-band sites when **`viewW < 420`**.

Mid-band gate unchanged: **`cyan=0`**, **`blue >= 200`** on **`midband_crop.png`**.
