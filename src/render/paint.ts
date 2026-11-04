import { FONT_BODY, FONT_DISPLAY } from "../shell/theme";

export const OUTLINE = "#1c120c";
export const FONT = FONT_DISPLAY;
export const COPY_FONT = FONT_BODY;
export const SCALE = 3;

export interface Metal {
  hi: string;
  mid: string;
  lo: string;
  edge: string;
}

export const BRASS: Metal = { hi: "#fff1c2", mid: "#f0b03a", lo: "#a86a14", edge: "#4a2c08" };
export const COPPER: Metal = { hi: "#ffd0b4", mid: "#e07040", lo: "#8a3418", edge: "#3e160c" };
export const STEEL: Metal = { hi: "#f2f7fb", mid: "#8ea4b6", lo: "#4d6272", edge: "#243038" };
export const GREEN: Metal = { hi: "#eaffb0", mid: "#8ed43a", lo: "#3e8618", edge: "#143808" };
export const GREEN_BOOT: Metal = { hi: "#c6e878", mid: "#4f8e20", lo: "#27520e", edge: "#0e2406" };
export const BLUE: Metal = { hi: "#d8fbff", mid: "#3ec4e4", lo: "#1478a4", edge: "#083048" };
export const PURPLE: Metal = { hi: "#f6d8ff", mid: "#c45aee", lo: "#7428a8", edge: "#2c0848" };
export const SKIN: Metal = { hi: "#ffe0c4", mid: "#f0b088", lo: "#c07858", edge: "#6a3828" };

export function font(px: number, weight = 700): string {
  return `${weight} ${px}px ${FONT}`;
}

export function copyFont(px: number, weight = 600): string {
  return `${weight} ${px}px ${COPY_FONT}`;
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function lit(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, m: Metal): CanvasGradient {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, m.hi);
  g.addColorStop(0.38, m.mid);
  g.addColorStop(0.78, m.lo);
  g.addColorStop(1, m.edge);
  return g;
}

export function blob(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, m: Metal, stroke = 2.3): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = lit(ctx, x - rx, y - ry, rx * 2, ry * 2, m);
  ctx.fill();
  ctx.lineWidth = stroke;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x - rx * 0.32, y - ry * 0.36, Math.max(0.8, rx * 0.26), Math.max(0.6, ry * 0.14), -0.6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,248,230,0.72)";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + rx * 0.42, y + ry * 0.08, Math.max(0.6, rx * 0.16), Math.max(0.8, ry * 0.36), 0.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,140,50,0.28)";
  ctx.fill();
}

export function pill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rot: number, m: Metal, stroke = 2.1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  roundRect(ctx, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.46);
  ctx.fillStyle = lit(ctx, -w / 2, -h / 2, w, h, m);
  ctx.fill();
  ctx.lineWidth = stroke;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-w * 0.16, -h * 0.22, Math.max(0.6, w * 0.16), Math.max(0.4, h * 0.1), -0.4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,248,230,0.5)";
  ctx.fill();
  ctx.restore();
}

export function cog(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number, m: Metal, teeth = 8, glow = false): void {
  const outer = r;
  const inner = r * 0.74;
  const step = (Math.PI * 2) / teeth;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2;
    const p = (k: number, rad: number): [number, number] => [Math.cos(a + step * k) * rad, Math.sin(a + step * k) * rad];
    const a0 = p(0.02, inner);
    const a1 = p(0.2, outer);
    const a2 = p(0.48, outer);
    const a3 = p(0.66, inner);
    if (i === 0) ctx.moveTo(a0[0], a0[1]);
    else ctx.lineTo(a0[0], a0[1]);
    ctx.lineTo(a1[0], a1[1]);
    ctx.lineTo(a2[0], a2[1]);
    ctx.lineTo(a3[0], a3[1]);
  }
  ctx.closePath();
  ctx.fillStyle = lit(ctx, -r, -r, r * 2, r * 2, m);
  ctx.fill();
  ctx.lineWidth = Math.max(1.2, r * 0.16);
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  if (glow) {
    const g = ctx.createRadialGradient(0, 0, r * 0.05, 0, 0, r * 0.55);
    g.addColorStop(0, "#fff6d0");
    g.addColorStop(0.45, "#ffb030");
    g.addColorStop(1, "rgba(255,120,20,0.15)");
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.48, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = OUTLINE;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = m.hi;
    ctx.fill();
  }
  ctx.restore();
}

export function rivet(ctx: CanvasRenderingContext2D, x: number, y: number, r = 1.6): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#6a4010";
  ctx.fill();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y - r * 0.28, r * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = "#fff1c2";
  ctx.fill();
}

export function eye(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, pupil = 0.42): void {
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 1.08, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#f7f4e6";
  ctx.fill();
  ctx.lineWidth = Math.max(0.7, r * 0.22);
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + r * 0.12, y + r * 0.12, Math.max(0.6, r * pupil), 0, Math.PI * 2);
  ctx.fillStyle = "#1a120c";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - r * 0.28, y - r * 0.32, Math.max(0.4, r * 0.26), 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fill();
}

export function grin(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  ctx.beginPath();
  ctx.ellipse(x, y, w, w * 0.62, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.fillStyle = "#2a140e";
  ctx.fill();
  ctx.fillStyle = "#fff8ea";
  const tw = w * 0.32;
  roundRect(ctx, x - tw - 0.5, y + 0.2, tw, w * 0.38, 0.6);
  ctx.fill();
  roundRect(ctx, x + 0.5, y + 0.2, tw, w * 0.38, 0.6);
  ctx.fill();
}

export function heart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s * 1.05, y - s * 0.35, x - s * 0.45, y - s * 1.05, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 0.45, y - s * 1.05, x + s * 1.05, y - s * 0.35, x, y + s * 0.35);
  ctx.closePath();
}

export function flame(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y + s);
  ctx.bezierCurveTo(x - s * 0.85, y + s * 0.15, x - s * 0.15, y - s * 0.85, x, y - s * 1.15);
  ctx.bezierCurveTo(x + s * 0.35, y - s * 0.15, x + s * 0.95, y + s * 0.35, x, y + s);
  ctx.closePath();
}

export function dome(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r + 2.4, 0, Math.PI * 2);
  ctx.fillStyle = lit(ctx, x - r, y - r, r * 2.4, r * 2.4, BRASS);
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, "rgba(230,255,255,0.95)");
  g.addColorStop(0.35, "rgba(120,220,245,0.78)");
  g.addColorStop(1, "rgba(20,90,140,0.55)");
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  blob(ctx, x, y + r * 0.12, r * 0.52, r * 0.48, SKIN, 1.2);
  eye(ctx, x - r * 0.22, y + r * 0.02, r * 0.16, 0.4);
  eye(ctx, x + r * 0.22, y + r * 0.02, r * 0.16, 0.4);
  ctx.beginPath();
  ctx.arc(x, y + r * 0.22, r * 0.16, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.strokeStyle = "#6a3828";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x - r * 0.38, y - r * 0.42, r * 0.28, r * 0.14, -0.8, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

export function plate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rot: number, m: Metal, stroke = 2): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  roundRect(ctx, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.18);
  ctx.fillStyle = lit(ctx, -w / 2, -h / 2, w, h, m);
  ctx.fill();
  ctx.lineWidth = stroke;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-w * 0.18, -h * 0.28, Math.max(0.6, w * 0.22), Math.max(0.4, h * 0.08), -0.3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,248,230,0.42)";
  ctx.fill();
  ctx.restore();
}

export function goggles(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, tint = "rgba(120,220,245,0.82)"): void {
  plate(ctx, x, y, s * 2.6, s * 0.95, 0, BRASS, 1.3);
  ctx.beginPath();
  ctx.arc(x - s * 0.7, y, s * 0.55, 0, Math.PI * 2);
  ctx.arc(x + s * 0.7, y, s * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = tint;
  ctx.fill();
  ctx.lineWidth = 1.1;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x - s * 0.88, y - s * 0.18, s * 0.18, s * 0.1, -0.6, 0, Math.PI * 2);
  ctx.ellipse(x + s * 0.52, y - s * 0.18, s * 0.18, s * 0.1, -0.6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fill();
}

export function boiler(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, pulse: number): void {
  blob(ctx, x, y, rx, ry, { hi: "#4a3230", mid: "#2a1a16", lo: "#140c0a", edge: "#080404" }, 2);
  const g = ctx.createRadialGradient(x - rx * 0.15, y - ry * 0.1, 0.4, x, y, rx);
  g.addColorStop(0, pulse > 0.5 ? "#fff6d2" : "#ffe08a");
  g.addColorStop(0.45, pulse > 0.5 ? "#ff9a24" : "#ff6a12");
  g.addColorStop(1, "rgba(255,60,8,0.12)");
  ctx.beginPath();
  ctx.ellipse(x, y, rx * 0.62, ry * 0.58, 0, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

export function stack(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, puff: number): void {
  plate(ctx, x, y, 4.4, h, 0, COPPER, 1.3);
  plate(ctx, x, y - h * 0.46, 6.4, 2.4, 0, BRASS, 1.1);
  if (puff > 0) {
    ctx.globalAlpha = 0.45 * puff;
    blob(ctx, x + 1, y - h * 0.7 - puff * 3, 2.4 + puff, 1.8 + puff * 0.6, { hi: "#f6f2ea", mid: "#d5e4ea", lo: "#8aa0aa", edge: "#3a4448" }, 0.6);
    ctx.globalAlpha = 1;
  }
}

export function bakeRaw(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w * SCALE));
  c.height = Math.max(1, Math.ceil(h * SCALE));
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  ctx.scale(SCALE, SCALE);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  draw(ctx);
  return c;
}

export function bakeActor(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  return bakeRaw(w, h, (ctx) => {
    ctx.save();
    ctx.translate(w / 2, h - 4);
    draw(ctx);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    const g = ctx.createLinearGradient(w * 0.45, 0, w, h * 0.7);
    g.addColorStop(0, "rgba(255,170,70,0)");
    g.addColorStop(1, "rgba(255,120,30,0.4)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  });
}

export function blit(ctx: CanvasRenderingContext2D, frames: HTMLCanvasElement[], w: number, h: number, frame: number, x: number, y: number, flip: number): void {
  const n = frames.length;
  if (!n) return;
  const fr = frames[((frame % n) + n) % n];
  if (!fr) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip < 0 ? -1 : 1, 1);
  ctx.drawImage(fr, -w / 2, -h + 6, w, h);
  ctx.restore();
}
