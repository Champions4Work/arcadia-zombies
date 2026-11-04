import { isUnion } from "../sim/evolve";
import { rarityName, UPG_RARITY, upgName } from "../sim/progress";
import { UPG_MAX, type World } from "../sim/types";
import { blurbFor, drawIcon, rarityTint } from "./icons";
import { BRASS_HI, INK, IRON, SOOT, STEAM, STEAM_DIM, XP } from "../shell/theme";
import { BRASS, copyFont, font, lit, OUTLINE, roundRect } from "./paint";

function ink(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = "center",
  weight = 700,
): void {
  ctx.font = font(size, weight);
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, size * 0.16);
  ctx.strokeStyle = OUTLINE;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (let i = 0; i < words.length; i++) {
    const word = words[i] ?? "";
    const next = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(next).width > max && cur) {
      lines.push(cur);
      cur = word;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

export function drawRewardCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  id: number,
  world: World,
  index = -1,
): void {
  roundRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = OUTLINE;
  ctx.fill();
  roundRect(ctx, x + 3, y + 3, w - 6, h - 6, 10);
  ctx.fillStyle = lit(ctx, x, y, w, h, BRASS);
  ctx.fill();
  roundRect(ctx, x + 6, y + 6, w - 12, h - 12, 8);
  const bg = ctx.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, IRON);
  bg.addColorStop(1, SOOT);
  ctx.fillStyle = bg;
  ctx.fill();
  if (index >= 0) {
    ctx.beginPath();
    ctx.arc(x + 16, y + 16, 9, 0, Math.PI * 2);
    ctx.fillStyle = BRASS.mid;
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ink(ctx, String(index + 1), x + 16, y + 10, 11, INK, "center");
  }
  if (id < 0) {
    ink(ctx, "—", x + w / 2, y + h / 2, 16, STEAM_DIM, "center");
    return;
  }
  const union = isUnion(id);
  const rarity = UPG_RARITY[id] ?? 0;
  const tag = union ? "EVOLVE" : rarityName(rarity);
  const tagColor = rarityTint(id);
  if (union) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = XP;
    roundRect(ctx, x + 6, y + 6, w - 12, h - 12, 8);
    ctx.stroke();
  }
  ink(ctx, tag, x + w / 2, y + 22, 11, tagColor, "center");
  drawIcon(ctx, id, x + w / 2, y + 50, Math.min(14, w * 0.12));
  const name = upgName(id) || "GEAR";
  ctx.font = font(13, 800);
  let size = w < 110 ? 12 : 13;
  while (size > 11 && ctx.measureText(name).width > w - 18) {
    size -= 1;
    ctx.font = font(size, 800);
  }
  ink(ctx, name, x + w / 2, y + 68, size, BRASS_HI, "center", 800);
  ctx.font = copyFont(12, 600);
  const blurb = blurbFor(id);
  const lines = wrap(ctx, blurb, w - 22);
  const maxLines = h < 150 ? 2 : 3;
  for (let i = 0; i < lines.length && i < maxLines; i++) {
    ink(ctx, lines[i] ?? "", x + w / 2, y + 88 + i * 13, 12, STEAM, "center", 600);
  }
  if (union) {
    ink(ctx, "ONE UNION", x + w / 2, y + h - 22, 11, XP, "center");
    return;
  }
  const lv = world.upgrades[id] ?? 0;
  const pipR = w < 110 ? 2.4 : 3.3;
  const pipGap = w < 110 ? 8 : 12;
  for (let p = 0; p < UPG_MAX; p++) {
    ctx.beginPath();
    ctx.arc(x + w / 2 - (UPG_MAX - 1) * (pipGap / 2) + p * pipGap, y + h - 16, pipR, 0, Math.PI * 2);
    ctx.fillStyle = p < lv ? XP : p === lv ? STEAM : SOOT;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }
}
