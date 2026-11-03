import { H, MAX_BULLETS, MAX_ZOMBIES, W, type World } from "../sim/types";
const BRASS = "#c8963e";
const COPPER = "#b5562f";
function gear(c: CanvasRenderingContext2D, x: number, y: number, r: number, a: number): void {
  c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = "#3a2a1a";
  for (let k = 0; k < 8; k++) { c.rotate(Math.PI / 4); c.fillRect(-r * 0.15, -r * 1.15, r * 0.3, r * 0.4); }
  c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#1a120b"; c.beginPath(); c.arc(0, 0, r * 0.35, 0, Math.PI * 2); c.fill(); c.restore();
}
export function draw(c: CanvasRenderingContext2D, w: World): void {
  c.fillStyle = "#24180e"; c.fillRect(0, 0, W, H);
  gear(c, 60, 60, 40, w.tick * 0.01); gear(c, 420, 260, 55, -w.tick * 0.008); gear(c, 400, 50, 25, w.tick * 0.02);
  const z = w.zombies;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (!z.alive[i]) continue;
    const x = z.x[i] ?? 0; const y = z.y[i] ?? 0;
    c.fillStyle = "#5d7a3a"; c.fillRect(x - 5, y - 7, 10, 14);
    c.fillStyle = "#8fb35a"; c.fillRect(x - 4, y - 11, 8, 6);
    c.fillStyle = COPPER; c.fillRect(x - 3, y - 9, 2, 2);
  }
  const b = w.bullets; c.fillStyle = "#ffd27a";
  for (let j = 0; j < MAX_BULLETS; j++) if (b.alive[j]) c.fillRect((b.x[j] ?? 0) - 2, (b.y[j] ?? 0) - 2, 4, 4);
  if (w.hurtCd % 6 < 3) {
    c.fillStyle = BRASS; c.fillRect(w.px - 6, w.py - 6, 12, 12);
    c.fillStyle = "#2b1d12"; c.fillRect(w.px - 7, w.py - 12, 14, 3); c.fillRect(w.px - 4, w.py - 16, 8, 5);
    c.fillStyle = "#7ad0ff"; c.fillRect(w.px - 4, w.py - 4, 3, 3); c.fillRect(w.px + 1, w.py - 4, 3, 3);
  }
  c.fillStyle = BRASS; c.font = "bold 14px monospace";
  c.fillText(`HP ${"♥".repeat(Math.max(0, w.hp))}  SCORE ${w.score}  WAVE ${w.wave}`, 8, 18);
  if (w.over) {
    c.fillStyle = "rgba(0,0,0,0.6)"; c.fillRect(0, 0, W, H);
    c.fillStyle = BRASS; c.font = "bold 28px monospace"; c.textAlign = "center";
    c.fillText("THE GEARS STOP", W / 2, H / 2 - 10);
    c.font = "14px monospace"; c.fillText(`Score ${w.score} - tap or press R`, W / 2, H / 2 + 18); c.textAlign = "left";
  }
}
