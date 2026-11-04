const GLYPH: Record<string, number> = {
  "0": 0b111101101101111,
  "1": 0b010010010010010,
  "2": 0b111001111100111,
  "3": 0b111001111001111,
  "4": 0b101101111001001,
  "5": 0b111100111001111,
  "6": 0b111100111101111,
  "7": 0b111001010010010,
  "8": 0b111101111101111,
  "9": 0b111101111001111,
  F: 0b111100110100100,
  P: 0b110101110100100,
  S: 0b011100010001110,
  A: 0b010101111101101,
  I: 0b111010010010111,
  L: 0b100100100100111,
  E: 0b111100111100111,
  "-": 0b000000111000000,
  " ": 0,
};

let on = false;
let last = 0;
let acc = 0;
let frames = 0;
let shown = -1;
let debugHud = false;
let sendFails = 0;

export function fpsEnabled(): boolean {
  return on;
}

export function fpsReadout(): number {
  return shown;
}

export function resetFps(): void {
  on = false;
  last = 0;
  acc = 0;
  frames = 0;
  shown = -1;
  debugHud = false;
  sendFails = 0;
}

export function toggleFps(): boolean {
  on = !on;
  last = 0;
  acc = 0;
  frames = 0;
  shown = -1;
  return on;
}

export function toggleFromKey(key: string, repeat: boolean): boolean {
  return !repeat && key.toLowerCase() === "f";
}

export function setDebugHud(hud: boolean): void {
  debugHud = hud;
}

export function noteSendFails(n: number): void {
  sendFails = n < 0 ? 0 : n | 0;
}

export function overlayLines(fpsOn: boolean, fps: number, fails: number, hud: boolean): string[] {
  const lines: string[] = [];
  if (fpsOn) lines.push(fps < 0 ? "FPS --" : `FPS ${fps}`);
  if (hud || fails > 0) lines.push(`FAIL ${fails}`);
  return lines;
}

export function noteFrame(now: number): void {
  if (!on) return;
  if (last === 0) {
    last = now;
    return;
  }
  let dt = now - last;
  last = now;
  if (dt < 0) dt = 0;
  else if (dt > 1000) dt = 1000;
  acc += dt;
  frames += 1;
  if (acc >= 250 && frames > 0) {
    shown = Math.round((frames * 1000) / acc);
    acc = 0;
    frames = 0;
  }
}

function glyph(c: CanvasRenderingContext2D, x: number, y: number, ch: string, col: string): void {
  const bits = GLYPH[ch] ?? 0;
  c.fillStyle = col;
  for (let p = 0; p < 15; p++) {
    if (bits & (1 << (14 - p))) c.fillRect(x + (p % 3), y + ((p / 3) | 0), 1, 1);
  }
}

export function paintFps(c: CanvasRenderingContext2D): void {
  if (!debugHud) return;
  const lines = overlayLines(on, shown, sendFails, debugHud);
  if (lines.length === 0) return;
  const x0 = 8;
  const y0 = 58;
  for (let row = 0; row < lines.length; row++) {
    const text = lines[row] ?? "";
    const y = y0 + row * 10;
    c.fillStyle = "#120c08";
    c.fillRect(x0 - 2, y - 2, text.length * 4 + 4, 9);
    for (let i = 0; i < text.length; i++) glyph(c, x0 + i * 4, y, text.charAt(i), "#e8c878");
  }
}
