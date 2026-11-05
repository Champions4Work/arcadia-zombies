# minimap-r45 vs closed #126 (minimap-r44) vs main

## What broke in #126 / minimap-r44

Phone minimap kept the packed **`minimap_frame`** gold gear rim and added an amber **`miniAim`** wedge plus red horde dots, but the phone branch **stopped calling `paintMiniRooms`** and instead filled the clip with **`INK` / `#12100e`**, leaving a flat dark disc with only obstacle blips and the aim triangle. Room blocks, gold wall strokes, and cyan corridor lines from main were wiped — net loss vs main even though the rim read improved.

## r45 fix (HUD-only)

| Piece | #126 fail | r45 |
| --- | --- | --- |
| Rim | `minimap_frame` blit | Same — inset clip, no duplicate brass ring on phone |
| Interior | Empty dark disc | **`paintMiniRooms` on phone and desktop** (gold rooms + cyan corridors) |
| Props | Grey blips only | **`paintMiniObstacles`** layered on phone |
| Horde | Red dots (when visible) | Red circular dots (`?shot=1` review horde) |
| Player | Amber aim triangle | Same **`miniAim`** on phone |
| Anti-regression | — | Removed phone **`INK` / `#12100e`** full-disc wipe; **`minimap-pixel-gate.py`** on `minimap_crop.png` |

Bottom heart / XP / ult, yard FX, steam, belts, tanks, and mid-band props are untouched.

## Proof

- `phone_390_play.png` — 390×844 `?shot=1`
- `minimap_crop.png` — top-left tight crop; gate **`minimap_gate.txt`** must PASS
- `compare_390_ref1.png`, `compare_390_ref2.png`, `trio_ref1_play_ref2.png` vs **`docs/target_look.jpg`** / **`docs/target_look2.png`**

Coordinator **Read-compare** before merge. **NO AUTO-MERGE.**
