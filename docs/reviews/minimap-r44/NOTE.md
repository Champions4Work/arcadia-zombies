# minimap-r44 vs main after #122 (hud-r42)

#122 / hud-r42 locked the phone bottom heart, XP tube, and ult sun. This pass is **HUD chrome only** for polish item **7** vs **`docs/target_look.jpg`** and **`docs/target_look2.png`**:

| Area | After #122 | r44 change |
| --- | --- | --- |
| Frame | `minimap_frame` with tight clip; extra brass stroke | Packed **`minimap_frame`** only on phone; inset clip so the **gold rim** reads; no duplicate ring stroke |
| Layout | 64×64 square parked on top strip | Diameter **`max(52, rowH)`**, vertically centered in the top strip safe corner |
| Map read | Cyan corridor lines + gold room blocks | Dark **`INK`** disc, grey obstacle blips, subtle arena bounds |
| Player | Cyan center dot | **Amber aim triangle** (image 2) |
| Horde | Red squares | **Red dots** on phone |

Bottom heart / XP / ult, yard tanks, belts, steam, and mid-band props are untouched.
