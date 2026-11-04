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
