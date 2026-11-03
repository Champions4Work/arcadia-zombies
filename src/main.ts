import { draw } from "./render/draw";
import { blip, unlockAudio } from "./render/sound";
import { cardSlot } from "./sim/progress";
import { step } from "./sim/step.hot";
import { EV_HURT, EV_KILL, EV_LEVEL, EV_SHIELD, EV_SHOT, EV_TESLA, EV_WAVE, H, W, type Input } from "./sim/types";
import { createWorld } from "./sim/world";
const canvas = document.getElementById("game") as HTMLCanvasElement;
const c = canvas.getContext("2d") as CanvasRenderingContext2D;
const fit = () => { const s = Math.max(1, Math.min(innerWidth / W, innerHeight / H)); canvas.style.width = `${W * s}px`; canvas.style.height = `${H * s}px`; };
addEventListener("resize", fit); fit();
let world = createWorld(Date.now() >>> 0);
const keys = new Set<string>();
const input: Input = { dx: 0, dy: 0, pick: 0 };
let touch: { x: number; y: number } | null = null;
let pendingPick = 0;
function canvasPos(e: PointerEvent): { x: number; y: number } {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
}
addEventListener("keydown", (e) => {
  unlockAudio();
  keys.add(e.key.toLowerCase());
  if (world.over && e.key.toLowerCase() === "r") world = createWorld(Date.now() >>> 0);
  if (world.choosing && e.key >= "1" && e.key <= "3") pendingPick = e.key.charCodeAt(0) - 48;
});
addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
canvas.addEventListener("pointerdown", (e) => {
  unlockAudio();
  if (world.over) { world = createWorld(Date.now() >>> 0); return; }
  if (world.choosing) {
    const p = canvasPos(e);
    pendingPick = cardSlot(p.x, p.y);
    return;
  }
  touch = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener("pointermove", (e) => { if (touch) { input.dx = (e.clientX - touch.x) / 20; input.dy = (e.clientY - touch.y) / 20; } });
addEventListener("pointerup", () => { touch = null; input.dx = 0; input.dy = 0; });
const STEP_MS = 1000 / 60;
let acc = 0; let last = performance.now();
function frame(now: number): void {
  acc += Math.min(250, now - last); last = now;
  if (!touch) { input.dx = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0); input.dy = (keys.has("s") || keys.has("arrowdown") ? 1 : 0) - (keys.has("w") || keys.has("arrowup") ? 1 : 0); }
  while (acc >= STEP_MS) {
    input.pick = pendingPick;
    step(world, input);
    pendingPick = 0;
    input.pick = 0;
    if (world.events[EV_SHOT]) blip(660, 0.05, "square");
    if (world.events[EV_KILL]) blip(120, 0.15, "sawtooth");
    if (world.events[EV_HURT]) blip(80, 0.3, "triangle");
    if (world.events[EV_WAVE]) blip(440, 0.4, "sine");
    if (world.events[EV_LEVEL]) blip(880, 0.25, "triangle");
    if (world.events[EV_TESLA]) blip(980, 0.08, "square");
    if (world.events[EV_SHIELD]) blip(300, 0.12, "sine");
    acc -= STEP_MS;
  }
  draw(c, world);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
