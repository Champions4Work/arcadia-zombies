# Agent rules (pstack process)

1. Start every build with `/poteto-mode` in autopilot-full, using pstack (github.com/cursor/plugins, `pstack`). Proceed, then present. Never ask "should I do X?" for reversible work.
2. One owner per PR. The builder that opens a PR plays its build, runs `npm run ci` once, and merges its own PR when CI is green. No separate reviewer or checker agent.
3. After a rebase or small fix, run at most one quick check, then merge. Update your branch only when there is a real merge conflict.
4. Every bug Shayan reports becomes a lint rule in `eslint.config.js` or a test in `test/`. Encode lessons in structure, never as prose.
5. `npm test` includes a headless bot playtest (`test/playtest.test.ts`). If a change pushes bot survival or kills out of the target band, retune difficulty, or move the band with a reason in the PR body.
6. No comments in code (enforced by `local/no-comments`). Names and tests carry intent.
7. `*.hot.ts` files run every tick: no allocation (enforced by `local/no-hot-alloc`). Use preallocated typed arrays.
8. The sim is deterministic: all randomness goes through `src/sim/rng.ts`. Never use `Math.random` or wall-clock time inside `src/sim`.
9. Keep the gzip bundle under the budget in `scripts/size.mjs` (220 KB after the az_art_v2 webp pack). World art is packed sprites; code adds motion, tint, light, and grade.
10. Only irreversible actions need a human: deleting live data, force-pushing main, sending outside messages.
11. Before opening a PR, load the matching skill under `.cursor/skills/` and run its checklist. Visuals, juice, shake, HUD, and overlays use `game-feel` and `game-ui-ux`. Difficulty and upgrades use `balance-check` and `roguelike`. Render or sim performance uses `performance-optimization` and `perf-profile`. Sound uses `audio-design`. Broader design or UX passes also load `design-review` or `ux-design`. Skills stay in `.cursor/skills/` and are not shipped in the gzip bundle.
