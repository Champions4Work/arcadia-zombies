# belt-r46 — chevron gold cubes (premise fix vs #128)

## Failed premise (#120 / #123 / #128)

| Round | Mistake | Pixel proof |
| --- | --- | --- |
| #120 / r42 | Weak `paintBeltUpgradeCube` + cargo parked mid-drop (`DROP_ALONG * 0.38`) | `pass_r42_belt_cargo_crop.png`: chevrons read; cube easy to miss |
| #123 / r43 | Fight-floor `OB_BOILER` / tan crate props | `fail_r43_belt_cargo_crop.png`: cardboard on floor, not belt cargo |
| #128 | Stronger paint + reframed crop; **amber gate counted chevrons, not cubes** | `fail128_belt_cargo_crop.png`: chevrons + tank + horde, **no gold cube on belt** |

## New premise (this PR)

1. **`reviewDepth`** parks cargo at **`PHONE_CHEVRON_CARGO_DY`** on **`370/590 × 380`** (inside `[332,628]`). Drops fight-floor review **`OB_BOILER`** spawn.
2. **`paintBeltUpgradeCube`** ( **`src/render/belt-cube.ts`**, **1.65×** ) with **`source-over`** amber halo + isometric gold block on **`LAYER_MID`** after actors. **`?shot=1`** only via `location.search`.
3. **`belt_cargo_crop`** crop unchanged (CSS **y 34–52%**, left **45%**).
4. **`scripts/belt_cargo_pixel_gate.mjs`**: **`chevronCube`** counts cube-body gold in the chevron band (**`b ∈ [85,130]`**, not flat chevron yellow); pass **`chevronCube ≥ 6`** and **`goldHi ≥ 8`**.

## Gates (this folder)

| File | r46 | #120 r42 | #128 fail |
| --- | --- | --- | --- |
| `belt_cargo_gate.txt` | see file | `amber=141 goldHi=9` (chevron-only) | same false pass |
| `midband_gate.txt` | `cyan=0 blue≥200` | unchanged | unchanged |

**NO AUTO-MERGE** — coordinator Read-compare `belt_cargo_crop.png` vs `docs/target_look2.png` before merge.
