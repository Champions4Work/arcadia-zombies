import { fill, frame, grid, outline, put, type PxFrame } from "../px";

function foe(
  id: string,
  w: number,
  h: number,
  ox: number,
  oy: number,
  bob: number,
  draw: (g: string[][], y: number) => void,
): PxFrame {
  const g = grid(w, h);
  draw(g, bob);
  outline(g);
  return frame(id, ox, oy, g);
}

function shambler(bob: number, elite: boolean): PxFrame {
  return foe(elite ? `shambler-e-${bob}` : `shambler-${bob}`, 16, 20, 8, 19, bob, (g, y) => {
    fill(g, 4, 8 + y, 8, 8, "z");
    fill(g, 5, 9 + y, 6, 3, "g");
    fill(g, 3, 14 + y, 4, 5, "t");
    fill(g, 9, 14 + (y ^ 1), 4, 5, "t");
    fill(g, 5, 3 + y, 6, 6, "g");
    put(g, 6, 5 + y, "R");
    put(g, 9, 5 + y, "k");
    put(g, 7, 7 + y, "t");
    if (elite) fill(g, 5, 2 + y, 6, 2, "b");
  });
}

function ghoul(bob: number, elite: boolean): PxFrame {
  return foe(elite ? `ghoul-e-${bob}` : `ghoul-${bob}`, 16, 20, 8, 19, bob, (g, y) => {
    fill(g, 5, 7 + y, 6, 8, "t");
    fill(g, 6, 8 + y, 4, 3, "g");
    fill(g, 4, 13 + y, 3, 6, "d");
    fill(g, 9, 13 + (y ^ 1), 3, 6, "d");
    fill(g, 5, 2 + y, 6, 6, "z");
    put(g, 6, 4 + y, "B");
    put(g, 9, 4 + y, "R");
    if (elite) fill(g, 5, 1 + y, 6, 2, "B");
  });
}

function brute(bob: number, elite: boolean): PxFrame {
  return foe(elite ? `zbrute-e-${bob}` : `zbrute-${bob}`, 20, 20, 10, 19, bob, (g, y) => {
    fill(g, 3, 7 + y, 14, 9, "r");
    fill(g, 4, 8 + y, 12, 5, "c");
    fill(g, 2, 13 + y, 6, 6, "n");
    fill(g, 12, 13 + (y ^ 1), 6, 6, "n");
    fill(g, 6, 2 + y, 8, 6, "r");
    fill(g, 7, 3 + y, 6, 3, "b");
    put(g, 8, 4 + y, "R");
    put(g, 11, 4 + y, "R");
    if (elite) fill(g, 6, 1 + y, 8, 2, "B");
  });
}

function spitter(bob: number, elite: boolean): PxFrame {
  return foe(elite ? `spitter-e-${bob}` : `spitter-${bob}`, 16, 20, 8, 19, bob, (g, y) => {
    fill(g, 4, 8 + y, 8, 7, "t");
    fill(g, 5, 9 + y, 6, 3, "a");
    fill(g, 4, 14 + y, 3, 5, "z");
    fill(g, 9, 14 + (y ^ 1), 3, 5, "z");
    fill(g, 5, 3 + y, 6, 6, "g");
    put(g, 6, 5 + y, "R");
    fill(g, 10, 7 + y, 4, 3, "a");
    put(g, 13, 8 + y, "G");
    if (elite) fill(g, 5, 2 + y, 6, 2, "b");
  });
}

function gasbag(bob: number, elite: boolean): PxFrame {
  return foe(elite ? `gas-e-${bob}` : `gas-${bob}`, 16, 20, 8, 19, bob, (g, y) => {
    fill(g, 3, 5 + y, 10, 10, "t");
    fill(g, 4, 6 + y, 8, 7, "g");
    fill(g, 6, 8 + y, 4, 4, "a");
    fill(g, 5, 15 + y, 3, 4, "z");
    fill(g, 8, 15 + (y ^ 1), 3, 4, "z");
    put(g, 6, 7 + y, "R");
    put(g, 9, 7 + y, "R");
    if (elite) fill(g, 5, 4 + y, 6, 2, "b");
  });
}

function knight(bob: number, elite: boolean): PxFrame {
  return foe(elite ? `knight-e-${bob}` : `knight-${bob}`, 18, 20, 8, 19, bob, (g, y) => {
    fill(g, 4, 8 + y, 7, 8, "x");
    fill(g, 5, 9 + y, 5, 4, "w");
    fill(g, 3, 14 + y, 4, 5, "n");
    fill(g, 8, 14 + (y ^ 1), 4, 5, "n");
    fill(g, 4, 2 + y, 7, 6, "b");
    fill(g, 5, 3 + y, 5, 3, "d");
    put(g, 6, 4 + y, "R");
    fill(g, 11, 6 + y, 5, 10, "b");
    fill(g, 12, 7 + y, 3, 8, "d");
    put(g, 13, 10 + y, "B");
    if (elite) fill(g, 4, 1 + y, 7, 2, "B");
  });
}

function rat(bob: number, elite: boolean): PxFrame {
  return foe(elite ? `rat-e-${bob}` : `rat-${bob}`, 12, 12, 6, 11, bob, (g, y) => {
    fill(g, 1, 5 + y, 8, 4, "n");
    fill(g, 2, 4 + y, 5, 3, "c");
    fill(g, 7, 3 + y, 3, 3, "r");
    put(g, 8, 4 + y, "R");
    put(g, 10, 5 + y, "n");
    if (elite) put(g, 3, 4 + y, "B");
  });
}

function kindSet(
  name: string,
  make: (bob: number, elite: boolean) => PxFrame,
): PxFrame[] {
  return [
    make(0, false), make(1, false),
    make(0, true), make(1, true),
  ];
}

export const FOE_FRAMES: PxFrame[] = [
  ...kindSet("shambler", shambler),
  ...kindSet("ghoul", ghoul),
  ...kindSet("zbrute", brute),
  ...kindSet("spitter", spitter),
  ...kindSet("gas", gasbag),
  ...kindSet("knight", knight),
  ...kindSet("rat", rat),
];
