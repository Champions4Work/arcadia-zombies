# Design lock

This file is the product lock for look, HUD, polish, and the order of later systems. Palette, sprite sources, and pack rules live in `docs/STYLE.md` once that file is on the branch. If `docs/STYLE.md`, `docs/target_look.jpg`, and `docs/target_look2.png` are missing on `main`, they land with the art pack on [pull request 46](https://github.com/Champions4Work/arcadia-zombies/pull/46). That PR is titled feat(art): blit the az_art_v2 webp pack. Write this file even when those assets are still on the other branch, so the lock is not forgotten. Treat the rules below as true now.

## Target look

The game is a lit, painted steampunk yard at dusk. Stone and iron stay dark. Amber lamps and cyan tanks light the actors. The hunter is one goggled brass figure with a rifle in an open center. Zombies are a dense, readable horde.

The two reference frames are the art bible:

- `docs/target_look.jpg` is reference image 1. Phone composition at 390x844.
- `docs/target_look2.png` is reference image 2. World density and chrome.

Match those frames. Do not invent a flatter pixel look, a cream joystick plate, or a second resource bar that fights them.

## Ten-point polish list

Every item below stays true. A visual change that drops one of them is unfinished.

1. Steam valves and blue liquid pipes. Valves puff steam. Pipes and tanks hold glowing cyan liquid.
2. Belts delivering power-ups. Conveyors carry chevron arrows and drop upgrade crates onto the yard.
3. Lit buildings that zombies spawn from. Warm windows, banners, and lamp pools. Foes leave the doorways.
4. Crates and breakable props. Crates, barrels, and odd brass pylons sit in the yard. Marked structures break.
5. Vents with slowdown. Floor grates keep the vent slowdown. Hazard stripes stay on those tiles.
6. Objectives top-right with wave and kills. A compact card shows the live objective, the wave, and the kill count.
7. Map top-left. A small circular minimap with a gold rim sits in the top-left safe corner.
8. Health with power-ups, not energy. The heart ring is HP. Five power slots sit beside it. The large bottom-right ring is the ultimate. There is no separate energy meter.
9. XP bar at the bottom. A thin full-width bar sits on the bottom safe edge, with an LV label on the right.
10. Dense hordes with blood, casings, and muzzle flash. The yard stays crowded. Hits leave rust blood. Shots throw brass casings and an amber muzzle.

Image 2 draws a hero portrait with HP and energy bars. That second bar is chrome from the painting, not a live resource. Do not add an energy pool to the sim or the HUD.

## Phone HUD geometry

Lock the phone HUD to reference image 1 at 390x844 CSS pixels. `src/shell/hud-layout.ts` already scales portrait chrome from a 390-wide unit. Keep that reference. Inset every must-show control from the safe area.

On 390x844, the playfield stays empty. Chrome hugs the short edges.

**Top strip.** Image 1 uses a wide amber rank bar, not a slim brass pill. A play mark sits on the left of that bar. The rank name sits on the fill, CALM on the reference. A separate capsule holds the clock and the skull kill count. Pause sits in the top-right safe corner.

**Top-left.** A circular minimap with a gold rim sits in the top-left safe corner. Its height matches the top strip. It must not cover the hunter. Image 1 leaves this corner open. The polish list still requires the map here.

**Top-right.** Wave, kills, and pause stay in the top strip. The objectives card docks under that cluster, as in image 2. It stays off the center. It does not become a second health stack.

**Bottom-left.** The cyan heart ring is HP. Low HP pulses. Shields or a revive pip may sit on that ring. There is no second bar.

**Bottom-center.** Five round power slots sit in one row. Icons and counts live here. This row is the loadout, not an energy tank.

**Bottom-right.** A large round ultimate ring fills around the icon. Ready state glows. This ring is the old energy idea, not a new meter.

**Bottom edge.** A thin XP bar spans the safe inset. The LV label sits on the right.

**Center.** The playfield stays empty. Movement is drag-anywhere. A stick appears only while a finger is down, and only above the XP bar. There is no resting joystick.

Image 2 also paints a desktop loadout with keys, ammo trays, and a parked stick. That chrome stays off the phone. Desktop and wide views may borrow image 2 frames, glow, and icon-with-count treatment. They still use heart plus power slots plus ultimate. They still do not grow an energy bar.

## World density and chrome

Lock yard density and metal chrome to reference image 2.

The floor is dark brick and flagstone. Rails and belts cut across it. Blue tanks and pipe runs sit on the edges and throw cyan light. Steam valves puff. Warm lamps throw amber discs. Buildings hold lit windows. Crates, barrels, vents, and gear sit on those rails with a walkable gap between props. Blood stains the stone. Spent casings sit on the floor as small brass ticks. The rifle shows an amber muzzle when it fires. The horde fills the open stone and still leaves a path.

HUD chrome on that frame is glass discs and brass-framed pills with a soft amber or cyan glow. Type is a clean system sans, thin, tracked, uppercase. No square pixel plates.

Image 2 is not a license to fill the phone center or to copy its dual resource bars. Density and chrome come from image 2. Phone slot positions come from image 1.

## PR gate

Every pull request that changes how the game looks must ship a 390x844 phone screenshot next to both reference frames. Both `docs/target_look.jpg` and `docs/target_look2.png` are required. Ship one sheet that shows the live capture beside both frames, or two linked pairs that a reviewer can open without a local build. A pair with only one reference does not pass.

Do not merge look-changing work without those captures. Palette, layout, sprite, lighting, HUD, and prop-density changes all count. Copy-only or sim-only work does not.

Until the art pack lands, capture against the same two files on pull request 46. After it lands, capture against `docs/target_look.jpg` and `docs/target_look2.png` on the branch.

## Systems order after art

Do this work after the art pack is on `main`. Do not start a later row until the row above it has landed.

1. **World and props.** Place pipes, tanks, valves, belts, lamps, buildings, crates, and vents at image 2 density. Keep spawn doorways readable.
2. **HUD match.** Fit the 390x844 layout to image 1. Heart, five power slots, ultimate, XP, map, and objectives. No energy bar.
3. **Effects and feel.** Smooth move, dash, hit flash, trauma shake from `src/render/shake.ts`, and 60 fps on a phone. Feedback in `src/render/juice.ts` stays on the camera and the draw path, not the sim body.
4. **Chip-style music and SFX.** Redo the music bed (`BedId` in `src/render/music.ts`) and the cues as chip and brass. Route them through the existing mixer buses.
5. **Objectives and waves.** Surface the live objective, the wave, and the kill count in the top-right cluster. Wave beats stay the director. The HUD reports them.
6. **Gameplay depth.** Upgrade belt, breakable props, and vent slowdown. New verbs use the props from row 1. They do not add a new resource beside HP.

A later row may ship in its own pull request. Each look-changing row still owes the 390x844 side-by-side from the PR gate.
