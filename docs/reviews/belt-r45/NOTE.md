# belt-r45 review

## vs #120 (belt-r42 / small cubes)

- Same `reviewDepth` cargo on `PHONE_HERO_BLITS` chevrons; no brown fight-floor crates.
- `BELT_CUBE_S` 6.5 → 9.75 (~1.5× linear) with stronger amber radial halo and trail.
- `belt_cargo_crop.png` should read obvious gold pickup on yellow chevrons like `docs/target_look2.png`.

## vs #123 fail (cardboard crates)

- No `crate` / `crate_stack` blits on belts; `belt_cargo_gate.txt` keeps cardboard low.

## Proof

- Phone: `?shot=1`, 390×844 → `phone_390_play.png`, crops, `midband_gate.txt`, `belt_cargo_gate.txt`.
- Compare: `compare/` trio and ref2 side-by-side vs `docs/target_look*`.

**NO AUTO-MERGE** — coordinator Read-compare before merge.
