export const BOSS_TANK = 3;
export const TANK_NAME = "CLOCKWORK TANK";
export const TANK_PATTERNS = 3;
export const TANK_HP = 108;
export const TANK_HURT_R2 = 960;
export const TANK_BODY_R2 = 784;
export const SHOT_SHELL = 2;

export const PHASE_SCAR = 0;
export const PHASE_CANNON = 1;
export const PHASE_RAM = 2;

export const SCAR_BACK = 20;
export const SCAR_SIDE = 14;
export const SCAR_LIFE = 120;
export const TELL_CANNON = 96;
export const TELL_RAM = 40;

export function scarAnchorX(x: number, ax: number, ay: number, side: number): number {
  return x - ax * SCAR_BACK + (-ay) * SCAR_SIDE * side;
}
export function scarAnchorY(y: number, ax: number, ay: number, side: number): number {
  return y - ay * SCAR_BACK + ax * SCAR_SIDE * side;
}
export function shellsFor(tier: number): number {
  if (tier >= 20) return 3;
  if (tier >= 8) return 2;
  return 1;
}
export function shellSpeed(tier: number): number {
  const s = 2.35 + (tier > 0 ? tier * 0.05 : 0);
  return s > 3.4 ? 3.4 : s;
}
export function ramSpeed(tier: number): number {
  const s = 1.85 + (tier > 0 ? tier * 0.03 : 0);
  return s > 2.6 ? 2.6 : s;
}
export function scarRadius(tier: number): number {
  const r = 18 + (tier > 0 ? tier >> 1 : 0);
  return r > 34 ? 34 : r;
}
