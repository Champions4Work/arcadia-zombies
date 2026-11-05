# Visual review artifacts

Every pull request that changes how the game looks must land compare shots here (or link them from the PR body). Rules live in `docs/STYLE.md` and `docs/DESIGN.md`.

## Required captures

- Review size is **390×844 CSS pixels** (phone).
- **`phone_390_play.png`** (or `phone_390_feel.png` for combat juice) — live capture at that size.
- Side-by-side compares against **both** art-bible frames:
  - **`docs/target_look.jpg`** — image 1: phone HUD and layout bible.
  - **`docs/target_look2.png`** — image 2: world density and atmosphere bible.
- Name files like existing rounds: `compare_390_ref1.png`, `compare_390_ref2.png`, or one **`trio_ref1_play_ref2.png`** sheet with ref1, play, and ref2.

A PR with only one reference compare does **not** pass the gate.

## Merge gate

Do **not** merge look-changing work until the coordinator **Read** review approves the compare shots. Copy-only or sim-only PRs do not owe this folder.

## Naming

Use a folder per PR or review round (`r27/`, `pr50/`, `hud-polish/`, `zones/`, etc.). Keep filenames stable so `scripts/compare-shots.mjs` and reviewers can diff history.

## Mid-band pixel gate (r38+)

Yard FX that targets the **phone hero mid-band** must pass **pixel counts**, not only `yard-fx.ts` string tests. Premise and camera math: **`docs/STYLE.md`** (*Phone mid-band (failed premise r34–r37)*).

1. Capture **`phone_390_play.png`** at **`?shot=1`** (390×844).
2. Save a **`midband_crop.png`** — the hero-band yard slice coordinators use for r37+ (same vertical band as the hunter lane; full width of the play capture is fine when it matches review crops).
3. Run:

```bash
node scripts/midband_pixel_gate.mjs docs/reviews/<round>/midband_crop.png
```

Exit **0** only when **`cyan=0`** and **`blue>=200`** (counts printed to stdout). **`yellow`** is reported for chevron read but is not part of the pass line today.

Fixture checks live in **`test/midband-pixel-gate.test.ts`**. **`npm run ci`** includes them.
