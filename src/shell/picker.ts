import { CHARACTERS, characterAt, isUnlocked } from "../sim/characters";

const INK = "#120c08";
const BRASS = "#c8963e";
const HI = "#e8c878";
const COPPER = "#b5562f";
const SKIN = "#e6c2a0";
const GOGG = "#7ad0ff";
const CLOTH = "#3a2416";
const GREEN = "#3d5a22";
const MINT = "#9dcea0";
const RUST = "#6a2e18";

function pix(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}

function paintTinker(c: CanvasRenderingContext2D): void {
  pix(c, 4, 3, 8, 7, BRASS);
  pix(c, 5, 4, 6, 5, SKIN);
  pix(c, 4, 5, 8, 2, BRASS);
  pix(c, 5, 5, 2, 2, GOGG);
  pix(c, 9, 5, 2, 2, GOGG);
  pix(c, 6, 10, 4, 4, CLOTH);
  pix(c, 11, 1, 4, 4, HI);
  pix(c, 12, 0, 2, 6, BRASS);
  pix(c, 10, 2, 6, 2, BRASS);
  pix(c, 12, 2, 2, 2, INK);
}

function paintGunslinger(c: CanvasRenderingContext2D): void {
  pix(c, 3, 1, 10, 2, CLOTH);
  pix(c, 2, 3, 12, 1, INK);
  pix(c, 5, 4, 6, 5, SKIN);
  pix(c, 6, 6, 1, 1, INK);
  pix(c, 9, 6, 1, 1, INK);
  pix(c, 4, 9, 7, 6, COPPER);
  pix(c, 5, 10, 5, 4, "#8a3e22");
  pix(c, 11, 8, 4, 2, BRASS);
  pix(c, 14, 7, 1, 1, HI);
}

function paintAlchemist(c: CanvasRenderingContext2D): void {
  pix(c, 4, 2, 8, 5, GREEN);
  pix(c, 5, 5, 6, 4, SKIN);
  pix(c, 6, 6, 1, 1, INK);
  pix(c, 9, 6, 1, 1, INK);
  pix(c, 6, 9, 4, 6, MINT);
  pix(c, 7, 10, 2, 3, HI);
  pix(c, 5, 8, 6, 1, BRASS);
  pix(c, 7, 14, 2, 1, BRASS);
}

function paintBrute(c: CanvasRenderingContext2D): void {
  pix(c, 5, 1, 6, 5, SKIN);
  pix(c, 6, 3, 1, 1, INK);
  pix(c, 9, 3, 1, 1, INK);
  pix(c, 6, 5, 4, 1, RUST);
  pix(c, 1, 7, 14, 8, RUST);
  pix(c, 2, 8, 12, 5, "#4a2014");
  pix(c, 3, 9, 2, 2, BRASS);
  pix(c, 11, 9, 2, 2, BRASS);
  pix(c, 7, 10, 2, 3, CLOTH);
}

function paintSwatch(canvas: HTMLCanvasElement, index: number): void {
  const c = canvas.getContext("2d");
  if (!c) return;
  c.fillStyle = "#3a2818";
  c.fillRect(0, 0, 16, 16);
  if (index === 0) paintTinker(c);
  else if (index === 1) paintGunslinger(c);
  else if (index === 2) paintAlchemist(c);
  else paintBrute(c);
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
    sw.width = 16;
    sw.height = 16;
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
