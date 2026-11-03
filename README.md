# Arcadia Zombies

A steampunk zombie survival browser game. Move with WASD/arrows or drag on touch; your brass automaton fires on its own. Survive the waves.

Built with Vite, TypeScript and canvas 2D. The simulation is seeded and deterministic, so bots can play it headless (`test/sim.test.ts`).

```
npm install
npm run dev
npm run ci
```

Every merge to `main` deploys via Cloudflare Workers static assets. Process rules for agents: see `AGENTS.md`.
