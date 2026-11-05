# steam-r44 vs closed #124

#124 kept **`paintVentSteam`** on hero-band sites with **`soft-light`** **`steam_1`–`steam_4`** wisps, a tiny **`valve_steam`** cap (scale ~0.58), and **`STEAM_VENT_ALPHA` ~0.24**. On the phone mid-band beside **`#112 PHONE_HERO_BLITS`** tanks, that washed out: **`fail_r43_steam_crop.png`** showed **`whiteish=132`** with no readable red wheel or plume.

This pass abandons soft-light for phone tank valves. **`PHONE_HERO_VALVE_BLITS`** blit the packed **`valve_steam`** asset with **`source-over`** at scale **1.24**, seated on the tank rim at in-frame world **X** beside the hero blits. **`paintPhoneHeroValveSteam`** runs on **`LAYER_MID`** so the baked white plume draws above tanks and nearby horde. Perimeter **`STEAM_VENTS`** still use the r32 soft-light wisps only.

Proof: **`steam_gate.txt`** (**`whiteish=844`**, **`valveRed=1050`**) and **`midband_gate.txt`** (**`cyan=0`**, **`blue=1233`**).

**No auto-merge.** Coordinator Read-compare **`steam_crop.png`** and trio vs **`docs/target_look.jpg`** / **`docs/target_look2.png`** before merge.
