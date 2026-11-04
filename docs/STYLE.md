# Art bible

`docs/DESIGN.md` owns HUD slots, systems order, and the product lock. This file owns the look, the palette, and the `az_art_v2` blit list. If the two files disagree on slots or resources, `docs/DESIGN.md` wins.

## Look

Painted, lit steampunk at dusk. Dark stone and iron. Amber lamps. Cyan tanks. One goggled brass hunter in an open center. A dense, readable horde.

Do not ship a flat grey yard, a pixel-plate HUD, a cream joystick, or a second live resource bar.

## References

Review size is 390x844 CSS pixels.

- `docs/target_look.jpg` is image 1. Phone composition. Wide amber rank bar. Heart, five power slots, ultimate, and XP.
- `docs/target_look2.png` is image 2. World density and brass chrome. Yellow conveyor chevrons. Blue pipes. Lit buildings.

Those two files land with [pull request 46](https://github.com/Champions4Work/arcadia-zombies/pull/46) until they are on `main`. Capture against the same frames on that pull request until then.

Image 2 paints a hero portrait with HP and energy bars. That second bar is paint. Do not add an energy pool.

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
| Objectives, top-right | `objectives_panel` |

Optional brass frames: `panel_frame_glow`, `panel_frame_gears`, `panel_frame_pipes`, `panel_frame_small`, `ring_frame_a`, `ring_frame_b`.

The wide amber rank bar on image 1 has no pack frame yet. Draw that bar to match image 1. Do not replace it with a slim pill.

Do not blit a second resource bar.

## World sprites

| Need | Sprites |
| --- | --- |
| Steam valves and blue liquid | `valve_steam`, `pipes_blue_tank`, `steam_1` through `steam_4`, `blue_glow`, `blue_puddle` |
| Belts and conveyors | `conveyor` with yellow chevrons. Belts drop upgrade crates. |
| Lit spawn buildings | `building_wall_door`, `window_lit`, `lamp` |
| Crates and breakables | `crate`, `crate_stack`, `barrel`, `breakable_boiler`, `breakable_gear_pylon` |
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
4. Crates and breakable props. Blit `crate`, `crate_stack`, `barrel`, `breakable_boiler`, and `breakable_gear_pylon`.
5. Vents with slowdown. Blit `decal_vent`, `decal_grate`, and `decal_hazard`. Keep the vent slowdown.
6. Objectives top-right with wave and kills. Blit `objectives_panel`. Wave and kill counts stay in the top strip.
7. Minimap top-left. Blit `minimap_frame` in the top-left safe corner.
8. Health with a power-ups tray. Blit `heart_ring` and five `power_slot` frames. No energy bar.
9. XP bar full-width at the bottom. Blit `xp_bar_frame`. The LV label sits on the right.
10. Dense hordes with blood, casings, and muzzle flash. Blit the actor sheet. Keep the hunter readable.

## Review gate

Every pull request that changes how the game looks must ship a 390x844 phone screenshot beside both reference frames.

- Review size is 390x844 CSS pixels.
- Show the live capture next to `docs/target_look.jpg` and `docs/target_look2.png`.
- Ship one sheet with both refs, or two linked pairs a reviewer can open without a local build.
- A pair with only one reference does not pass.
- Copy-only or sim-only work does not owe this gate.

Do not merge a look-changing pull request until Sasta reads the compare shots.

Until the reference frames land on `main`, capture against the same two files on pull request 46.
