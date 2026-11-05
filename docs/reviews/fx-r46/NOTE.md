# fx-r46 — phone combat juice

FX-only pass on **fx-r35 / steam-r44** baseline. No yard prop, belt, tank, HUD, or `PHONE_HERO_VALVE_BLITS` moves.

## Changes

- **Muzzle:** layered amber bloom, 36px tracer with warm under-glow and short flash spikes (`paintSignatureHero`).
- **Brass:** three ejected particles per shot; larger flying rects in `drawJuice`.
- **Blood:** denser `paintBlood` pools and heavier `stampBlood`; review horde ring stains stay outside `HERO_R`.

## Proof

| Artifact | Role |
| --- | --- |
| `phone_390_play.png` | 390×844 `?shot=1` mid-combat |
| `muzzle_crop.png` / `blood_crop.png` | Crops vs ref2 rows in `vs_baseline.png` |
| `midband_gate.txt` | `cyan=0`, `blue≥200` |
| `vs_baseline.png` | Muzzle/blood vs `docs/reviews/fx-r35/phone_390_play.png` |

Coordinator **Read-compare** before merge. **No auto-merge.**
