const STEP_MS = 1000 / 60;

let fromX = 0;
let fromY = 0;
let toX = 0;
let toY = 0;
let seenTick = -1;

export function resetSmooth(): void {
  seenTick = -1;
}

export function noteSimPose(x: number, y: number, tick: number): void {
  if (tick === seenTick) return;
  fromX = toX;
  fromY = toY;
  toX = x;
  toY = y;
  if (seenTick < 0) {
    fromX = x;
    fromY = y;
  }
  seenTick = tick;
}

export function drawPose(x: number, y: number, tick: number, blendMs: number): { x: number; y: number } {
  noteSimPose(x, y, tick);
  const t = blendMs > 0 ? Math.min(1, blendMs / STEP_MS) : 1;
  return { x: fromX + (toX - fromX) * t, y: fromY + (toY - fromY) * t };
}
