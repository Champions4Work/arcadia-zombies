# Agent rules (pstack process)

1. Proceed, then present. Never ask "should I do X?" for reversible work. Do it, then explain what and why in the PR body.
2. One owner per PR. The agent that opens a PR carries it to merge: fix CI, address the checker, rebase. No handoffs.
3. Done means: `npm run ci` passes (lint, typecheck, test, build, size) and an independent checker on a different model ran the change and said PASS. Then auto-merge lands it.
4. Encode lessons as lint rules or tests, never as prose. If a bug happens twice, add a rule in `eslint.config.js` or a test in `test/`.
5. No comments in code (enforced by `local/no-comments`). Names and tests carry intent.
6. `*.hot.ts` files run every tick: no allocation (enforced by `local/no-hot-alloc`). Use preallocated typed arrays.
7. The sim is deterministic: all randomness goes through `src/sim/rng.ts`. Never use `Math.random` or wall-clock time inside `src/sim`.
8. Keep the gzip bundle under the budget in `scripts/size.mjs`. Art and sound are drawn in code.
9. Only irreversible actions need a human: deleting live data, force-pushing main, sending outside messages.
