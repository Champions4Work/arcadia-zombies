# art-r47 — az_art_v2 sprite integration

## Landed in phone frame (390×844 `?shot=1`)

| Sprite | Path |
| --- | --- |
| Hunter idle + walk | `hero_idle`, `hero_walk_1`–`4` via `paintSignatureHero` / manifest anchors |
| Horde | `zombie_worker`, `zombie_crawler`, `zombie_tubes`, `zombie_bloater`, `brute` via `paintZombie` |
| Blue tanks + belt chevrons | `#112 PHONE_HERO_BLITS` (`pipes_blue_tank` ×2, `conveyor` ×2) |
| Wing props (scaled) | `decal_vent`, `decal_grate`, `crate`, `crate_stack`, `barrel`, `breakable_gear_pylon` on `PHONE_WING_*` rails |
| Floor / facades | `tile_stone_seamless`, `building_wall_door`, `window_lit`, `lamp` (unchanged pack blits) |

## Skipped (no clean in-frame read)

| Sprite | Reason |
| --- | --- |
| `breakable_boiler` on phone | Left/right entries sit at world **x ≈ 306 / 656**, outside **`camX ≈ 332`** … **`+ viewW`**; gear pylons cover the wing breakable read instead |
| Perimeter-only duplicate tanks | Off-clip **`PROPS`** **`pipes_blue_tank`** at **x ≈ 308 / 654**; phone liquid read comes from **`PHONE_HERO_BLITS`** only |
| HUD / FX sheets | Out of scope (other builders); still packed in **`hud.webp`** / world FX frames |

## Source pack

Unpacked from **`art_v2_slim.tar.gz`**. Hero PNGs and **`manifest.json`** foot anchors updated; repacked with **`scripts/pack-art.py`**.

Mid-band gate: **`docs/reviews/art-r47/midband_gate.txt`** (**pad cyan == 0**, **blue ≥ 200**).
