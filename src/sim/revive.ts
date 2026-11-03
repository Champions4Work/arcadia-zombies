import { EV_REVIVE, type World } from "./types";

export function fell(w: World): boolean {
  if (w.hp > 0) return false;
  if (w.meta.revive > 0) {
    w.meta.revive -= 1;
    const half = w.maxHp >> 1;
    w.hp = half > 0 ? half : 1;
    w.hurtCd = 90;
    w.events[EV_REVIVE] = 1;
    return false;
  }
  w.over = true;
  return true;
}
