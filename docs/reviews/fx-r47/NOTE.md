# fx-r47 — combat juice vs #131 fail

Closed **#131** shipped fx-r46 play crops nearly identical to fx-r35: amber muzzle/tracer were present but **flying brass casings did not read** in `muzzle_crop` (particles looked like orange dots, not oblong shells), and floor **blood pooled into heavy ellipses** instead of the fine splatter in `docs/target_look2.png`.

## Fix (FX-only)

| Area | Change |
| --- | --- |
| Brass | **Four** ejected particles per shot; oblong **14×5** brass shells with rotation/spin (no amber halo disc hiding the shell). |
| Blood | `paintBlood` uses **1–2 px droplet rects** with smaller span; more stamps per hit, tighter scatter — less total red fill. |
| Muzzle | Kept amber bloom; tracer extended slightly (**34** px along aim). |

No yard props, HUD, `PHONE_HERO_VALVE_BLITS`, or midband gate changes.

## Proof

- `phone_390_play.png` — 390×844 `?shot=1`
- `muzzle_crop.png` — brass in flight + amber flash
- `blood_crop.png` — splatter droplets, not blob pools
- `midband_gate.txt` — pad cyan `== 0`, blue ≥ 200
- `vs_baseline.png` — vs `docs/reviews/fx-r35/phone_390_play.png`

**No auto-merge.** Coordinator Read-compare before merge.
