# hud-r45 vs #122 (hud-r42)

#122 added **`paintPhoneUltSun`** and teal heart polish, but the phone ult still read as the packed **`ultimate_button`** steering wheel with a weapon **`badgeIcon`** crosshair in the center, and a blue **`XP`** arc when ready.

| Item | #122 / main read | r45 change |
| --- | --- | --- |
| Ult frame | **`ultimate_button`** wheel asset | Same **`heart_ring`** brass blit as HP (symmetric with ref 1) |
| Ult center | Weapon badge crosshair | **`paintPhoneUltSun`** filled 12-point star only — no badge |
| Charge arc | Blue **`XP`** when ready | Warm **`BRASS` / `COPPER`** only — no blue ring |
| Heart / XP | Teal heart + **`xp_bar_frame`** tube | Unchanged |

Pixel gate on **`hud_bottom_crop.png`**: **`scripts/hud_ult_pixel_gate.mjs`** (`orange≥420` in ult half).
