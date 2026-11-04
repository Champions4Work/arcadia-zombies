let reduced = false;

export const FLASH_SOFT = 0.28;
export const HURT_SOFT = 0.35;

export function setReduceMotion(on: boolean): void {
  reduced = on;
}

export function reduceMotionOn(): boolean {
  return reduced;
}

export function prefersReduceMotion(query?: { matches: boolean } | null): boolean {
  if (query) return query.matches;
  try {
    return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}
