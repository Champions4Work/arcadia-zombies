import { CHARACTERS, characterAt, isUnlocked } from "../sim/characters";
import { bakeRaw } from "../render/paint";
import { drawHeroPortrait, HERO_H, HERO_W } from "../render/heroes";

const portraits = new Map<number, HTMLCanvasElement>();

function portrait(index: number): HTMLCanvasElement {
  let hit = portraits.get(index);
  if (!hit) {
    hit = bakeRaw(HERO_W, HERO_H, (ctx) => drawHeroPortrait(ctx, index));
    portraits.set(index, hit);
  }
  return hit;
}

function paintSwatch(canvas: HTMLCanvasElement, index: number): void {
  const c = canvas.getContext("2d");
  if (!c) return;
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = "high";
  c.fillStyle = "#4a3018";
  c.fillRect(0, 0, canvas.width, canvas.height);
  const g = c.createRadialGradient(canvas.width / 2, canvas.height * 0.7, 4, canvas.width / 2, canvas.height * 0.75, canvas.width * 0.42);
  g.addColorStop(0, "rgba(16,10,8,0.45)");
  g.addColorStop(1, "rgba(16,10,8,0)");
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(canvas.width / 2, canvas.height * 0.82, canvas.width * 0.32, canvas.height * 0.1, 0, 0, Math.PI * 2);
  c.fill();
  c.drawImage(portrait(index), 0, 0, canvas.width, canvas.height);
}

export function mountPicker(root: HTMLElement, onPick: (index: number) => void): void {
  root.replaceChildren();
  for (let i = 0; i < CHARACTERS.length; i++) {
    const row = characterAt(i);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "survivor";
    btn.dataset.id = row.id;
    const sw = document.createElement("canvas");
    sw.width = HERO_W;
    sw.height = HERO_H;
    sw.className = "swatch";
    paintSwatch(sw, i);
    const name = document.createElement("span");
    name.className = "survivor-name";
    name.textContent = row.name;
    const copy = document.createElement("span");
    copy.className = "survivor-copy";
    const line1 = document.createElement("span");
    line1.textContent = row.line1;
    const line2 = document.createElement("span");
    line2.textContent = row.line2;
    copy.append(line1, line2);
    const lock = document.createElement("span");
    lock.className = "survivor-lock";
    btn.append(sw, name, copy, lock);
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      onPick(i);
    });
    root.append(btn);
  }
}

export function paintPicker(root: HTMLElement, index: number, bestWave: number): void {
  const buttons = root.querySelectorAll("button");
  buttons.forEach((btn, i) => {
    const row = characterAt(i);
    const open = isUnlocked(i, bestWave);
    const on = open && i === index;
    btn.disabled = !open;
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    const lock = btn.querySelector(".survivor-lock");
    if (lock) lock.textContent = open ? "" : `Wave ${row.unlockWave}`;
    const blurb = `${row.line1} ${row.line2}`;
    btn.setAttribute("aria-label", open ? `${row.name}. ${blurb}` : `${row.name}. Locked until wave ${row.unlockWave}. ${blurb}`);
  });
}
