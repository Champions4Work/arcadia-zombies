import { isUnion } from "../sim/evolve";
import { rarityName, UPG_RARITY, upgName } from "../sim/progress";
import { UPG_MAX, type World } from "../sim/types";
import { blurbFor, drawIcon, rarityTint } from "./icons";
import { hudInk, pixelBox } from "../art/chrome";
import { measurePx, wrapPx } from "../art/font";
import { BRASS_HI, INK, IRON, SOOT, STEAM, STEAM_DIM, XP } from "../shell/theme";

function ink(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = "center",
): void {
  hudInk(ctx, text, x, y, color, size >= 14 ? 2 : 1, align);
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
  pixelBox(ctx, x, y, w, h, IRON);
  pixelBox(ctx, x + 4, y + 4, w - 8, h - 8, SOOT);
  if (index >= 0) {
    pixelBox(ctx, x + 8, y + 8, 16, 16, BRASS_HI);
    ink(ctx, String(index + 1), x + 16, y + 11, 11, INK, "center");
  }
  if (id < 0) {
    ink(ctx, "-", x + w / 2, y + h / 2, 16, STEAM_DIM, "center");
    return;
  }
  const union = isUnion(id);
  const rarity = UPG_RARITY[id] ?? 0;
  const tag = union ? "EVOLVE" : rarityName(rarity);
  const tagColor = rarityTint(id);
  if (union) {
    ctx.strokeStyle = XP;
    ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
  }
  ink(ctx, tag, x + w / 2, y + 22, 11, tagColor, "center");
  drawIcon(ctx, id, x + w / 2, y + 50, Math.min(14, w * 0.12));
  const name = upgName(id) || "GEAR";
  ink(ctx, name, x + w / 2, y + 68, measurePx(name, 1) > w - 18 ? 11 : 13, BRASS_HI, "center");
  const blurb = blurbFor(id);
  const lines = wrapPx(blurb, w - 22, 1);
  const maxLines = h < 150 ? 2 : 3;
  for (let i = 0; i < lines.length && i < maxLines; i++) {
    ink(ctx, lines[i] ?? "", x + w / 2, y + 88 + i * 13, 12, STEAM, "center");
  }
  if (union) {
    ink(ctx, "ONE UNION", x + w / 2, y + h - 22, 11, XP, "center");
    return;
  }
  const lv = world.upgrades[id] ?? 0;
  const pipGap = w < 110 ? 8 : 12;
  for (let p = 0; p < UPG_MAX; p++) {
    ctx.fillStyle = p < lv ? XP : p === lv ? STEAM : SOOT;
    ctx.fillRect(x + w / 2 - (UPG_MAX - 1) * (pipGap / 2) + p * pipGap - 2, y + h - 18, 4, 4);
  }
}
