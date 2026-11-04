export interface Insets {
  l: number;
  r: number;
  t: number;
  b: number;
}

export interface Viewport {
  cssW: number;
  cssH: number;
  dpr: number;
  safe: Insets;
}

export interface ViewportSource {
  innerWidth?: number;
  innerHeight?: number;
  devicePixelRatio?: number;
  visualViewport?: { width: number; height: number } | null;
}

export const ZERO_INSETS: Insets = { l: 0, r: 0, t: 0, b: 0 };

export function readInsets(style: { getPropertyValue(name: string): string }): Insets {
  return {
    l: cssPx(style, "--safe-l"),
    r: cssPx(style, "--safe-r"),
    t: cssPx(style, "--safe-t"),
    b: cssPx(style, "--safe-b"),
  };
}

export function readViewport(win: ViewportSource = globalThis, safe: Insets = ZERO_INSETS): Viewport {
  const vv = win.visualViewport;
  const cssW = Math.max(1, vv?.width ?? win.innerWidth ?? 1);
  const cssH = Math.max(1, vv?.height ?? win.innerHeight ?? 1);
  return {
    cssW,
    cssH,
    dpr: Math.max(1, win.devicePixelRatio ?? 1),
    safe: {
      l: Math.max(0, safe.l),
      r: Math.max(0, safe.r),
      t: Math.max(0, safe.t),
      b: Math.max(0, safe.b),
    },
  };
}

export function bindViewport(onChange: () => void, win: Window = window): () => void {
  const vv = win.visualViewport;
  win.addEventListener("resize", onChange);
  win.addEventListener("orientationchange", onChange);
  vv?.addEventListener("resize", onChange);
  vv?.addEventListener("scroll", onChange);
  return () => {
    win.removeEventListener("resize", onChange);
    win.removeEventListener("orientationchange", onChange);
    vv?.removeEventListener("resize", onChange);
    vv?.removeEventListener("scroll", onChange);
  };
}

function cssPx(style: { getPropertyValue(name: string): string }, name: string): number {
  const n = Number.parseFloat(style.getPropertyValue(name));
  return Number.isFinite(n) ? n : 0;
}
