export const SOOT = "#100c08";
export const IRON = "#1a120c";
export const PANEL = "#24180e";
export const BRASS = "#d4a04a";
export const BRASS_HI = "#f3d58a";
export const BRASS_LO = "#8a5a18";
export const COPPER = "#c46a32";
export const BRONZE = "#7a4a1c";
export const STEAM = "#f6eee2";
export const STEAM_DIM = "#d8c8a8";
export const INK = "#120c08";
export const DANGER = "#e24a32";
export const XP = "#f0b43a";
export const HEALTH = "#3ec86e";
export const VEIL = "#080604cc";

export const THEME = {
  soot: SOOT,
  iron: IRON,
  panel: PANEL,
  brass: BRASS,
  brassHi: BRASS_HI,
  brassLo: BRASS_LO,
  copper: COPPER,
  bronze: BRONZE,
  steam: STEAM,
  steamDim: STEAM_DIM,
  ink: INK,
  danger: DANGER,
  xp: XP,
  health: HEALTH,
  veil: VEIL,
} as const;

export const FONT_DISPLAY = '"Iowan Old Style", Palatino, "Palatino Linotype", "Book Antiqua", Georgia, "Times New Roman", serif';
export const FONT_BODY = 'ui-sans-serif, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const TYPE_MIN = {
  display: 22,
  body: 15,
  label: 12,
  canvasLabel: 11,
  canvasBody: 12,
  canvasNum: 16,
} as const;

export const THEME_VARS: Readonly<Record<string, string>> = {
  soot: SOOT,
  iron: IRON,
  panel: PANEL,
  brass: BRASS,
  "brass-hi": BRASS_HI,
  "brass-lo": BRASS_LO,
  copper: COPPER,
  bronze: BRONZE,
  steam: STEAM,
  "steam-dim": STEAM_DIM,
  ink: INK,
  danger: DANGER,
  xp: XP,
  health: HEALTH,
  veil: VEIL,
  "font-display": FONT_DISPLAY,
  "font-body": FONT_BODY,
};

const FORBIDDEN = [
  /\bInter\b/,
  /\bCantarell\b/,
  /#160e24/i,
  /#241838/i,
  /#10182c/i,
  /#2c5284/i,
  /#c45ad4/i,
  /#6e2484/i,
  /#7ad0ff/i,
];

export function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = h.length === 3
    ? [h[0]! + h[0]!, h[1]! + h[1]!, h[2]! + h[2]!].join("")
    : h.slice(0, 6);
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}

function channel(c: number): number {
  const t = c / 255;
  return t <= 0.03928 ? t / 12.92 : ((t + 0.055) / 1.055) ** 2.4;
}

export function relLum(hex: string): number {
  const [r, g, b] = hexRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(fg: string, bg: string): number {
  const a = relLum(fg);
  const b = relLum(bg);
  const hi = a > b ? a : b;
  const lo = a > b ? b : a;
  return (hi + 0.05) / (lo + 0.05);
}

export function parseRootVars(css: string): Record<string, string> {
  const block = css.match(/html\{([^}]*)\}/);
  const out: Record<string, string> = {};
  if (!block) return out;
  const re = /--([a-z-]+):([^;}]+)/g;
  let m = re.exec(block[1] ?? "");
  while (m) {
    const key = m[1] ?? "";
    if (key in THEME_VARS) out[key] = (m[2] ?? "").trim();
    m = re.exec(block[1] ?? "");
  }
  return out;
}

export function forbiddenUiHits(source: string): string[] {
  const hits: string[] = [];
  for (const rule of FORBIDDEN) {
    if (rule.test(source)) hits.push(String(rule));
  }
  return hits;
}
