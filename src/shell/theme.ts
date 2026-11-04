import {
  BRASS as PAL_BRASS,
  BRASS_HI as PAL_BRASS_HI,
  BRASS_LO as PAL_BRASS_LO,
  BRONZE as PAL_BRONZE,
  COPPER as PAL_COPPER,
  DANGER as PAL_DANGER,
  HEALTH as PAL_HEALTH,
  INK as PAL_INK,
  IRON as PAL_IRON,
  PANEL as PAL_PANEL,
  SOOT as PAL_SOOT,
  STEAM as PAL_STEAM,
  STEAM_DIM as PAL_STEAM_DIM,
  VEIL as PAL_VEIL,
  XP as PAL_XP,
  CYAN as PAL_CYAN,
  GLASS as PAL_GLASS,
  hexRgb as palHexRgb,
} from "../art/palette";

export const SOOT = PAL_SOOT;
export const IRON = PAL_IRON;
export const PANEL = PAL_PANEL;
export const BRASS = PAL_BRASS;
export const BRASS_HI = PAL_BRASS_HI;
export const BRASS_LO = PAL_BRASS_LO;
export const COPPER = PAL_COPPER;
export const BRONZE = PAL_BRONZE;
export const STEAM = PAL_STEAM;
export const STEAM_DIM = PAL_STEAM_DIM;
export const INK = PAL_INK;
export const DANGER = PAL_DANGER;
export const XP = PAL_XP;
export const HEALTH = PAL_HEALTH;
export const VEIL = PAL_VEIL;
export const CYAN = PAL_CYAN;
export const GLASS = PAL_GLASS;

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
  cyan: CYAN,
  glass: GLASS,
} as const;

export const FONT_DISPLAY = 'system-ui, "Segoe UI", "Helvetica Neue", sans-serif';
export const FONT_BODY = FONT_DISPLAY;

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
  cyan: CYAN,
  glass: GLASS,
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
  /Iowan Old Style/,
  /Palatino/,
];

export function hexRgb(hex: string): [number, number, number] {
  const [r, g, b] = palHexRgb(hex);
  return [r, g, b];
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
