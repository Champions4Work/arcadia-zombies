# belt-r47 — normal-play belt cargo on phone chevrons

## Failed premise (#132)

Closed **#132** drew glowing upgrade cubes only when `location.search` included **`?shot=1`** (review-only paint or sim state). Real wave/run never showed belt cargo. **#128** shipped **`belt_cargo_crop`** with yellow chevrons and **zero** readable gold cube while an amber gate passed.

## New premise (this PR)

| Check | Result |
| --- | --- |
| Sim cargo in normal play | **`parkPhoneHeroBeltCargo`** in **`src/sim/depth.ts`** runs from **`attachDepth`** on every world (including live runs). Two **`CARGO_RIDE`** slots on belts **370 / 590 × ~408/424** (chevron band inside phone X **[332,628]**). |
| Review capture | **`reviewDepth`** calls the same **`parkPhoneHeroBeltCargo`** helper; **`?shot=1`** still frames the yard but does not own cargo state or paint. |
| Paint path | **`paintDepthLive`** → **`paintBeltUpgradeCube`** on **`LAYER_MID`** (`registerLayer(LAYER_MID, paintDepthMid)` in **`src/render/depth.ts`**). **`source-over`** gold iso cube + amber radial halo at **`BELT_CUBE_SCALE` 1.5**. No **`wantsReviewShot`** gate (lint in **`eslint.config.js`**). |
| Pixels | **`belt_cargo_gate.txt`**: **`gold=93`**, **`warm=743`**. **`midband_gate.txt`**: **`cyan=0`**, **`blue=1233`**. |

## Artifacts

- `phone_390_play.png` — 390×844 `?shot=1`
- `belt_cargo_crop.png` — gold cube on yellow chevron (left belt)
- `midband_crop.png` + `midband_gate.txt`
- `belt_cargo_gate.txt`

**No auto-merge.** Coordinator Read-compare vs **`docs/target_look2.png`** and fail crops **`fail132_belt_cargo_crop.png`** / **`fail128_belt_cargo_crop.png`**.
