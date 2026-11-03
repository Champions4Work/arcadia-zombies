import { MAX_ZOMBIES, type Input, type World } from "../src/sim/types";

export function aggressive(w: World): Input {
  const z = w.zombies;
  let bx = 0;
  let by = 0;
  let bd = 1e18;
  let found = 0;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (!z.alive[i]) continue;
    const dx = (z.x[i] ?? 0) - w.px;
    const dy = (z.y[i] ?? 0) - w.py;
    const d2 = dx * dx + dy * dy;
    if (d2 < bd) {
      bd = d2;
      bx = dx;
      by = dy;
      found = 1;
    }
  }
  if (w.boss.on) {
    const dx = w.boss.x - w.px;
    const dy = w.boss.y - w.py;
    const d2 = dx * dx + dy * dy;
    if (d2 < bd) {
      bd = d2;
      bx = dx;
      by = dy;
      found = 1;
    }
  }
  const skip = w.chestOpen ? 1 : 0;
  if (!found) return { dx: 0, dy: 0, pick: 1, skip };
  const d = Math.sqrt(bd) || 1;
  return { dx: bx / d, dy: by / d, pick: 1, skip };
}
