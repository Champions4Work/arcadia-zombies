export interface Rng { state: number }
export const createRng = (seed: number): Rng => ({ state: seed >>> 0 || 1 });
export function nextFloat(r: Rng): number {
  let x = r.state;
  x ^= x << 13; x >>>= 0;
  x ^= x >>> 17;
  x ^= x << 5; x >>>= 0;
  r.state = x;
  return x / 4294967296;
}
