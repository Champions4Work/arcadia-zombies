# Art bible

`docs/DESIGN.md` owns HUD slots, systems order, and the product lock. This file owns the look, the palette, and the `az_art_v2` blit list. If the two files disagree on slots or resources, `docs/DESIGN.md` wins.

## Look

Painted, lit steampunk at dusk. Dark stone and iron. Amber lamps. Cyan tanks. One goggled brass hunter in an open center. A dense, readable horde.

Do not ship a flat grey yard, a pixel-plate HUD, a cream joystick, or a second live resource bar.

## Hard lesson: darken and declutter

Adding props does not move the yard toward the refs. Failed attempts proved it:

- **Densify PRs [#78](https://github.com/Champions4Work/arcadia-zombies/pull/78) and [#83](https://github.com/Champions4Work/arcadia-zombies/pull/83)** — more crates, barrels, and yard clutter made the middle **busier**, not closer to image 2.
- **Round 28 / [#82](https://github.com/Champions4Work/arcadia-zombies/pull/82)** — grade and fill pushed **too bright and too busy**.

The correct direction is **darken + declutter** the center yard while keeping a **few readable silhouettes**: belt chevrons, blue tanks and pipe runs, steam valves, lit building windows. Props belong on walls and rails; the hunter’s lane stays open. Horde density comes from **actors and stains**, not from stacking breakables in `YARD_CLEAR`.

## Failed premise: tint and grade without floor art

Closed **[#87](https://github.com/Champions4Work/arcadia-zombies/pull/87)** proved that **`paintBrassGrade`**, multiply veils, and darker `fillRect` washes **do not** turn a bright procedural yard into the painted stone read in image 2. The live 390×844 frame stayed cyan/brass with center clutter.

**Required fix:** blit **`tile_stone_seamless`** (packed from `art/az_art_v2/tile_stone_seamless.png`) across the yard in `paintGround`, and use **`tile_metal_seamless`** only for rail/grate cells—not a horizontal brass pad or code-drawn cobble fill. Brass district disables `brassPad` metal cells; metal tiles stay on tracks. Do not ship fill-only floor plates as the primary yard read.

## Round 31 — open fight band, dense perimeter

Review **`docs/reviews/r31/`** against r30. The brass yard keeps **`tile_stone_seamless`** (#90) but moves the **power-up belt to `y: 658`** (bottom edge) so **`CARGO_*` crates ride and land outside `YARD_CLEAR`**, not through the hunter lane. **`reviewDepth`** parks a glowing **`crate_stack` on that perimeter belt**, not on blue pads in the center. Perimeter **`PROPS`** densify with **`window_lit`**, side **`conveyor`**, **`blue_puddle`**, duplicate **`pipes_blue_tank` / `valve_steam` / `decal_grate` / `decal_vent`** runs on both rails—no **`crate` / `barrel` / `crate_stack`** inside the vertical fight band. Coordinator **Read** must compare r31 play vs r30 before merge.

## Effects (phone read, r32)

FX-only tuning on current main (#90 stone, #92 HUD, #93 perimeter). Do **not** repeat closed #91: no double **`lighter`** steam blits at high alpha, no fight-floor cyan pads, no yard prop moves.

| Effect | Rule |
| --- | --- |
| Steam valves | **`paintVentSteam`**: scaled **`steam_1`–`steam_4`** at **`STEAM_VENT_SCALE`**, warm gray under-puffs, **`soft-light`** compositing, alpha ≤ **`STEAM_VENT_ALPHA`**. |
| Blue liquid | Subtle **`bluePool`** on **`TANKS`** and **`pipes_blue_tank`** only; **`blue_puddle`** blit on puddle props. No glow on breakables. |
| Combat | Amber muzzle/tracer, flying brass particles, floor casings, horde blood denser than calm main but **outside `HERO_R`**. |

Review **`docs/reviews/fx-r32/`** (`phone_390_play.png` 390×844, `?shot=1`) vs **`docs/target_look.jpg`** and **`docs/target_look2.png`**. Coordinator **Read-compare** before merge; **no auto-merge**.

## Effects (phone read, r35)

FX-only pass on r32 baseline. Steam must puff from **hero-band valve sites** that stay inside the **390×844 `?shot=1` camera** (not only off-screen perimeter rails). **`HERO_BAND_STEAM`** plus **`reviewDepth`** lane vents call exported **`paintVentSteam`** with a small **`valve_steam`** cap; packed **`steam_1`–`steam_4`** stay **small/dark** (soft-light, no #91 fog wall). Combat keeps **amber muzzle bloom + tracer**, **flying brass** particles, and floor casings readable at the rifle. Floor **blood stains** shrink slightly (lower **`paintBlood`** span/alpha) so stone vents stay legible in the phone crop.

Review **`docs/reviews/fx-r35/`** with **`vs_baseline.png`** (before/after crops of steam + muzzle vs **`docs/reviews/fx-r32/phone_390_play.png`**). Coordinator **Read-compare**; **no auto-merge**.

## References (art bible)

Review size is 390×844 CSS pixels. These two files are the art bible. Every visual PR compares against both.

| File | Role |
| --- | --- |
| `docs/target_look.jpg` | **Image 1** — phone HUD and layout bible. Wide amber rank bar. Heart, five power slots, ultimate, XP, minimap slot, top strip. |
| `docs/target_look2.png` | **Image 2** — world and atmosphere bible. Dark yard, belts, blue tanks and pipes, steam, lit windows, dense horde chrome. |

Ship a 390×844 phone shot plus side-by-side compares to both refs (`docs/reviews/README.md`). Do not merge look-changing work without coordinator **Read** review on those compares.

Image 2 paints a hero portrait with HP and energy bars. That second bar is paint. Do not add an energy pool or copy image 2’s desktop HUD (portrait strip, energy/ammo trays, parked stick) onto phone.

## Palette

Sampled from both frames. Night stone stays darker than the hero. Health is cyan. Lamps and XP are amber. Danger is one red.

| Role | Hex | Key |
| --- | --- | --- |
| Transparent | `#00000000` | `.` |
| Ink | `#0c0a08` | `k` |
| Soot | `#100c0a` | `s` |
| Iron | `#1a1612` | `i` |
| Panel | `#241e18` | `p` |
| Stone | `#2c2620` | `x` |
| Amber | `#e0a040` | `b` |
| Amber hi | `#f0c878` | `B` |
| Amber lo | `#8a5a20` | `d` |
| Copper | `#b86a38` | `c` |
| Leather | `#3a2a1c` | `n` |
| Steam | `#f4ead8` | `m` |
| Steam dim | `#c8b8a0` | `M` |
| Danger | `#e24a32` | `R` |
| XP | `#f0b44a` | `y` |
| Health | `#3ec8c0` | `h` |
| Mine | `#2a2824` | `g` |
| Mine hi | `#6a6860` | `G` |
| Mine lo | `#141210` | `t` |
| Spike | `#0a0908` | `z` |
| Steel | `#8a8478` | `w` |
| Steel hi | `#d0c8b8` | `W` |
| Fire | `#e86a20` | `f` |
| Fire hi | `#f0d080` | `F` |
| Rust | `#6a3018` | `r` |
| Ember | `#e8a030` | `e` |
| White | `#f4f0e8` | `u` |
| Black | `#080604` | `o` |
| Cyan | `#7ae0d4` | `a` |

Sprite sources use only these hexes.

## Pack paths

Source PNGs live in `art/az_art_v2/`. The manifest is `art/az_art_v2/manifest.json`. Hero height in the source pack is 128 px.

Pull request 46 packs those PNGs to these files:

- `src/art/packed/actors.webp`
- `src/art/packed/world.webp`
- `src/art/packed/hud.webp`
- `src/art/packed/tile_stone_seamless.webp`
- `src/art/packed/tile_metal_seamless.webp`
- `src/art/packed/pack.ts`

The packer on that branch is `scripts/pack-art.py`. Blit the packed frame. Do not redraw a packed sprite in code.

## HUD sprites

Phone slots live in `docs/DESIGN.md`. Blit these frames into those slots.

| Slot | Sprite |
| --- | --- |
| HP heart ring | `heart_ring` |
| Power-up tray, five discs | `power_slot` |
| Ultimate ring | `ultimate_button` |
| Full-width XP bar | `xp_bar_frame` |
| Minimap, top-left | `minimap_frame` |
| Objectives, top-right | `objectives_panel` + `panel_frame_gears`, gold header, green checks |

Optional brass frames: `panel_frame_glow`, `panel_frame_gears`, `panel_frame_pipes`, `panel_frame_small`, `ring_frame_a`, `ring_frame_b`.

The wide amber rank bar on image 1 has no pack frame yet. Draw that bar to match image 1. Do not replace it with a slim pill.

**HUD [#84](https://github.com/Champions4Work/arcadia-zombies/pull/84)** landed image 1 phone chrome. Keep that layout. Do not swap in image 2 desktop HUD chrome on phone.

**HUD r31** tightens phone chrome against `docs/target_look.jpg`: brass `panel_frame_small` timer strip with clock glyph, skull, and live kills; `objectives_panel` under gear frame; larger blits for `minimap_frame`, `heart_ring`, `power_slot`, and `ultimate_button`; brass pause ring on phone.

**HUD obj-r35** stacks the phone timer strip and `objectives_panel` in one right-aligned column (shared width, 2 px gap), drops the gear overlay on phone objectives so the brass panel reads cleanly, and tightens minimap inset so the gold rim stays visible without covering the hunter lane.

Do not blit a second resource bar.

## World sprites

| Need | Sprites |
| --- | --- |
| Steam valves and blue liquid | `valve_steam`, `pipes_blue_tank`, `steam_1` through `steam_4`, `blue_glow`, `blue_puddle` |
| Belts and conveyors | `conveyor` with yellow chevrons. Belts drop upgrade crates. |
| Lit spawn buildings | `building_wall_door`, `window_lit`, `lamp` |
| Crates and breakables (sparse) | `crate`, `crate_stack`, `barrel`, `breakable_boiler`, `breakable_gear_pylon` — edge rails only, not a filled center |
| Vents with slowdown | `decal_vent`, `decal_grate`, `decal_hazard` |
| Floor | `tile_stone_seamless`, `tile_metal_seamless` |

## Actor sprites

| Need | Sprites |
| --- | --- |
| Hunter | `hero_idle`, `hero_walk_1` through `hero_walk_4` |
| Horde | `zombie_worker`, `zombie_crawler`, `zombie_tubes`, `zombie_bloater`, `brute` |

Hits leave rust blood. Shots throw brass casings and an amber muzzle.

## Ten-point check

A look-changing shot is unfinished if any row is missing.

1. Steam valves and blue liquid pipes. Blit `valve_steam` and `pipes_blue_tank`. Cycle the steam frames.
2. Belts and conveyors deliver power-ups. Blit `conveyor` with yellow chevrons. Drop crates onto the yard.
3. Lit buildings that zombies spawn from. Blit `building_wall_door`, `window_lit`, and `lamp`. Foes leave the door.
4. Crates and breakable props, **sparse**. Blit `crate`, `crate_stack`, `barrel`, `breakable_boiler`, and `breakable_gear_pylon` on walls and belts. Do not carpet the open yard.
5. Vents with slowdown. Blit `decal_vent`, `decal_grate`, and `decal_hazard`. Keep the vent slowdown.
6. Objectives top-right with a gold header and green checks. Chapter banner and Wave n/8 plus kills stay in the top strip.
7. Minimap top-left. Blit `minimap_frame` in the top-left safe corner.
8. Health with a power-ups tray. Blit `heart_ring` and five `power_slot` frames. No energy bar.
9. XP bar full-width at the bottom. Blit `xp_bar_frame`. The LV label sits on the right.
10. Dense hordes with blood, casings, and muzzle flash. Blit the actor sheet. Keep the hunter readable.

## Bundle budget

The gzip budget in `scripts/size.mjs` is 220 KB. That is the raised cap after the `az_art_v2` webp pack landed. The old 124 KB cap covered code-drawn art. Packed world, HUD, and actor sheets need the extra room. A look PR that adds packed art must raise `scripts/size.mjs` and this paragraph together.

## Sound palette

All audio is procedural Web Audio. Nothing ships as sampled assets. Route everything through the master bus in `src/render/sound.ts`, with separate music and SFX gains that respect the menu sliders and the global mute flag.

**Music beds** (`src/render/music.ts`) use chip timbres: gear ticks, brass stabs, organ pads, steam hiss, thump bass, and bell accents. Beds crossfade by play state: menu (`BED_MENU`), combat wave (`BED_WAVE`), horde pressure (`BED_HORDE`), and boss (`BED_BOSS`). Tempos ramp with `drive` so the yard feels darker and slower at rest and tighter under pressure. A light compressor on the music bus keeps phone speakers out of clip.

**SFX cues** (`src/render/sfx-cues.ts`, `src/render/sfx.ts`) map sim events to short square, triangle, and band-pass noise bursts: rifle and shotgun muzzles, rivet and tesla weapons, hit spark, kill thud, hurt thud, dash vent, level and pick chimes, rank horn, boss siren, wave whistle, UI click, shield ping, and ult boom. Voice pooling and per-cue gaps keep hordes from stacking into distortion.

Tonal color follows the art palette: amber brass for rewards and muzzles, cyan-leaning picks, rust-low kills, and iron-grey thumps. Keep perceived peaks under phone comfort; mix on buses, not per-oscillator sliders.

## Review gate

Every pull request that changes how the game looks must ship a 390x844 phone screenshot beside both reference frames.

- Review size is 390x844 CSS pixels.
- Show the live capture next to `docs/target_look.jpg` and `docs/target_look2.png`.
- Ship one sheet with both refs, or two linked pairs a reviewer can open without a local build.
- A pair with only one reference does not pass.
- Copy-only or sim-only work does not owe this gate.

Do not merge a look-changing pull request until coordinator **Read** review approves the compare shots.

Artifact layout and filenames: `docs/reviews/README.md`.
