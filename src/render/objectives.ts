import { GATE_R, GATE_X, GATE_Y, gateOn } from "../sim/objectives";
import { BRASS, cog } from "./paint";
import { LAYER_MID, registerLayer } from "./plugins";
import type { World } from "../sim/types";

function drawGate(ctx: CanvasRenderingContext2D, w: World): void {
  const on = gateOn(w);
  ctx.save();
  ctx.globalAlpha = on ? 0.32 : 0.78 + 0.18 * Math.sin(w.tick * 0.12);
  cog(ctx, GATE_X, GATE_Y, GATE_R * 0.62, w.tick * 0.02, BRASS, 8, on === 0);
  ctx.beginPath();
  ctx.arc(GATE_X, GATE_Y, GATE_R, 0, Math.PI * 2);
  ctx.strokeStyle = on ? BRASS.lo : BRASS.hi;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

registerLayer(LAYER_MID, drawGate);
