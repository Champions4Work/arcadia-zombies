import { WARN_BOSS, warnState } from "../sim/warn";
import { type World } from "../sim/types";

export function drawWarns(c: CanvasRenderingContext2D, w: World): void {
  const a = warnState(w);
  for (let i = 0; i < a.on.length; i++) {
    if (!a.on[i]) continue;
    const x = a.x[i] ?? 0;
    const y = a.y[i] ?? 0;
    const rx = a.rx[i] ?? 12;
    const ry = a.ry[i] ?? 8;
    const ang = a.ang[i] ?? 0;
    const t = a.t[i] ?? 1;
    const boss = (a.kind[i] ?? 0) === WARN_BOSS;
    const pulse = 0.35 + 0.35 * ((t % 8) < 4 ? 1 : 0);
    c.save();
    c.translate(x, y);
    c.rotate(ang);
    c.globalAlpha = pulse;
    c.fillStyle = boss ? "rgba(255,90,26,0.55)" : "rgba(255,210,80,0.5)";
    c.beginPath();
    c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 0.95;
    c.strokeStyle = boss ? "#ff5a1a" : "#ffe14a";
    c.lineWidth = 2.4;
    c.stroke();
    c.restore();
  }
}
