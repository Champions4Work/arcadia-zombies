# Arcadia look

Locked to `docs/target_look.jpg`, `docs/target_look2.png`, and the approved `art/az_art_v2` pack. Those frames and sprites are the art bible. New colors, scales, or HUD geometry do not land unless this file changes in the same change.

## References

**Image 1** is the phone composition: dusk stone yard, warm amber lamps, one goggled hunter in the open center, slim top wave pill, heart ring bottom-left, five power slots, round ultimate bottom-right, thin XP bar, empty center.

**Image 2** is the polish and world density: framed brass panels, hero portrait with HP and energy bars, chapter title, wave and kill counts, circular minimap, objectives, dense zombie hordes, blood decals, glowing pickups, shell casings, muzzle flash, blue energy tanks, conveyor arrows.

Phone HUD keeps image 1 geometry. Desktop and chrome borrow image 2 frames, icons with counts, glow, and depth.

## Palette

Sampled from both frames. Night stone, iron, leather, and amber carry the yard. Health is cyan. Energy tanks are the same cyan. One danger red. XP is lamp amber.

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

Sprite sources and theme tokens use only these hexes. `test/palette.test.ts` fails on any other catalog key.

## Light

Key light from above. Upper faces catch amber. Soft elliptical contact shadows. Lamps throw amber discs. Energy tanks throw cyan discs. A radial vignette holds the corners. Blood sits as dark rust stains, never a cartoon spray.

## Actors

- One signature hero: goggled helm, leather coat, brass rifle, amber muzzle flash, a cyan foot ring when moving.
- Kits recolor leather and metal. They keep the same silhouette.
- Common foes are hunched dark zombies, readable at a glance.
- Elites and the Clockwork Tank read as heavier iron, spikes optional.
- Pickups glow. Spent casings are tiny brass ticks.

## Ground

Dark brick and flagstone. Rails are dull iron with chevron arrows. Crates, gears, pipes, lamp posts, and cyan tanks sit as props. The floor stays darker than the hero.

## HUD

Phone (image 1), with image 2 frames:

- Slim top bar. Brass-framed wave / chapter pill. Clock and kills on the right with icons. Pause at the safe corner.
- Top left: circular minimap with a gold rim. A small portrait and dual bars (HP, energy) sit on that cluster without crossing the center.
- Bottom left: cyan heart ring.
- Bottom center: five round power slots with counts.
- Bottom right: large round ultimate.
- Thin full-width XP bar on the bottom safe edge, LV on the right.
- Empty center playfield. No resting joystick.
- Objectives stay off the phone center; they may dock under the top-right cluster on a wide view.
- Movement is drag-anywhere. A stick appears only while a finger is down, above the XP bar.

## Type and chrome

Clean system sans. Thin, tracked, uppercase. Glass discs and brass-framed pills. Soft amber or cyan glow. No square pixel plates. No giant cream joystick.

## Art pack

Gameplay sprites come from `art/az_art_v2` (the approved 44-PNG pack, hero = 128px). `scripts/pack-art.py` converts them to webp atlases in `src/art/packed`. Code adds walk bob, lean, left-flip, amber floor tint, additive lamp pools, steam frame cycling, a dark vignette, and a warm multiply grade. Do not replace a packed sprite with a code-drawn stand-in.

## Scale and budget

The gzip checker in `scripts/size.mjs` is 220 KB. The old 124 KB cap was for code-drawn pixels. The packed webp atlases are already compressed, so they add nearly their raw size, about 61 KB, on top of the sim and shell. That is why the budget moved. Re-run the packer before changing the number.

## Acceptance

Each item must be visible in the 390×844 and 1280×800 screenshots shipped with the change. Scope order if the gzip budget is tight: world props and lighting, then HUD, then effects. Later PRs may add density; they still show the same side-by-side with the reference frames.

1. Pipes with glowing blue liquid tanks, valves venting animated steam puffs.
2. Conveyor belts with moving arrows that deliver power-up crates and upgrades.
3. Lit buildings with warm windows, banners, and lamps casting light pools. Zombies read as leaving building doorways.
4. Crates, barrels, and props around the yard. Odd brass structures are marked as future breakables.
5. Floor vents keep the vent slowdown mechanic. Grates carry hazard stripes.
6. Objectives panel top-right (ACTIVATE THE STEAM GATE, HOLD THE AREA timer, Survive all waves) plus a wave counter and kill count.
7. Minimap top-left, next to the hero portrait.
8. Health keeps our heart-ring design. The old energy bar is the power-up / ultimate ring.
9. XP bar full width at the bottom with an LV label.
10. Dense readable zombie hordes, blood decals, shell casings, muzzle flash, and a hero clearly shooting a signature gun.

