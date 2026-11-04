export const POSE_IDLE = 0;
export const POSE_WALK = 1;
export const POSE_ATK = 2;
export const POSE_HIT = 3;
export const POSE_DIE = 4;
export const POSE_N = 5;
export const FRAME_N = 4;
export const SWING = [0.55, 0.12, -0.55, -0.08];

export interface Motion {
  bob: number;
  swing: number;
  lean: number;
  drop: number;
  squash: number;
}

export function heroPose(moving: boolean, firing: boolean, hurt: boolean, dead: boolean): number {
  if (dead) return POSE_DIE;
  if (hurt) return POSE_HIT;
  if (firing) return POSE_ATK;
  if (moving) return POSE_WALK;
  return POSE_IDLE;
}

export function foePose(flash: boolean, striking: boolean, moving: boolean): number {
  if (flash) return POSE_HIT;
  if (striking) return POSE_ATK;
  if (moving) return POSE_WALK;
  return POSE_IDLE;
}

export function poseFrame(tick: number, pose: number, slow = false): number {
  const shift = pose === POSE_HIT || pose === POSE_ATK ? 2 : slow ? 4 : 3;
  return (tick >> shift) & 3;
}

export function motionOf(pose: number, frame: number): Motion {
  const walk = SWING[frame] ?? 0;
  if (pose === POSE_DIE) {
    return { bob: 4 + frame * 2.4, swing: 0.35, lean: 0.55 + frame * 0.18, drop: 6 + frame * 3.2, squash: 0.72 };
  }
  if (pose === POSE_HIT) {
    return { bob: 1.6, swing: -0.42, lean: -0.22, drop: 1.2, squash: 0.9 };
  }
  if (pose === POSE_ATK) {
    return { bob: -2.2, swing: 0.95, lean: 0.18, drop: 0, squash: 1 };
  }
  if (pose === POSE_WALK) {
    return { bob: frame & 1 ? -2 : 0, swing: walk, lean: 0, drop: 0, squash: 1 };
  }
  return { bob: frame & 1 ? -0.7 : 0, swing: walk * 0.18, lean: 0, drop: 0, squash: 1 };
}

export function justFired(fireCd: number, every: number): boolean {
  const span = every > 8 ? 10 : 4;
  return fireCd > every - span;
}

export function foeStriking(kind: number, _vx: number, vy: number, dx: number, dy: number): boolean {
  const d2 = dx * dx + dy * dy;
  if (kind === 3) return vy > 66;
  if (kind === 5) return d2 < 1600;
  return d2 < 1296;
}
