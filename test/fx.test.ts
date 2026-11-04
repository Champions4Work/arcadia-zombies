import {
  markCrowdFx, paintAura, paintBoom, paintFlash, paintLevelBurst, paintPuff, paintSpark, paintWeaponShot,
  puffDrawsCorpse,
} from "../src/render/cast-fx";
import { SHAMBLER } from "../src/render/cast";
import { Z_GAS } from "../src/sim/foes";
import { paintHealVial } from "../src/render/cast";
import { buildSprites, bulletSprite, zombieSprite } from "../src/render/horde-sprites";
import { hurtZombie } from "../src/sim/combat.hot";
import { tickProjectiles } from "../src/sim/weapons.hot";
import {
  EV_LEVEL, FX_BOOM, FX_PUFF, FX_SPARK, FX_XP, MAX_FX, WPN_FLAME, WPN_HARP, WPN_MORT, WPN_SHOT, type World,
} from "../src/sim/types";
import { createWorld } from "../src/sim/world";

function paperWorld(seed: number): World {
  const w = createWorld(seed);
  w.toSpawn = 0;
  w.spawnCd = 99999;
  w.fireCd = 99999;
  return w;
}

function firstFx(w: World, kind: number): number {
  for (let i = 0; i < w.fxKind.length; i++) if ((w.fxKind[i] ?? 0) === kind) return 1;
  return 0;
}

function paper(): CanvasRenderingContext2D & { grads: number; arcs: number } {
  let grads = 0;
  let arcs = 0;
  const grad = { addColorStop() {} };
  const ctx = {
    get grads() { return grads; },
    get arcs() { return arcs; },
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    fill() {},
    stroke() {},
    fillRect() {},
    strokeRect() {},
    fillText() {},
    strokeText() {},
    arc() { arcs++; },
    ellipse() { arcs++; },
    arcTo() {},
    createRadialGradient() { grads++; return grad; },
    createLinearGradient() { grads++; return grad; },
    fillStyle: "",
    strokeStyle: "",
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    lineWidth: 1,
    font: "",
    textAlign: "left",
    textBaseline: "middle",
    lineJoin: "round",
    lineCap: "round",
  };
  return ctx as unknown as CanvasRenderingContext2D & { grads: number; arcs: number };
}

describe("combat fx ring", () => {
  it("keeps enough slots that a horde burst still shows sparks and deaths", () => {
    expect(MAX_FX).toBeGreaterThanOrEqual(32);
  });

  it("a hit writes a spark and a kill writes a puff plus xp", () => {
    const w = paperWorld(4);
    w.zombies.alive[0] = 1;
    w.zombies.x[0] = w.px + 20;
    w.zombies.y[0] = w.py;
    w.zombies.hp[0] = 2;
    w.zombies.kind[0] = 0;
    hurtZombie(w, 0, 1);
    expect(firstFx(w, FX_SPARK)).toBe(1);
    expect(w.zombies.alive[0]).toBe(1);
    hurtZombie(w, 0, 4);
    expect(w.zombies.alive[0]).toBe(0);
    expect(firstFx(w, FX_PUFF)).toBe(1);
    expect(firstFx(w, FX_XP)).toBe(1);
  });

  it("a mortar blast writes a boom at the fuse point", () => {
    const w = paperWorld(5);
    w.bullets.alive[0] = 1;
    w.bullets.x[0] = 120;
    w.bullets.y[0] = 140;
    w.bullets.vx[0] = 0;
    w.bullets.vy[0] = 0;
    w.bullets.hp[0] = 3;
    w.bGun[0] = WPN_MORT;
    w.bLife[0] = 1;
    w.bRad[0] = 36;
    tickProjectiles(w);
    expect(firstFx(w, FX_BOOM)).toBe(1);
    expect(w.bullets.alive[0]).toBe(0);
  });
});

describe("weapon and pickup paints", () => {
  it("each special gun paints its own tracer", () => {
    const ctx = paper();
    expect(paintWeaponShot(ctx, WPN_SHOT, 0, 0, 1, 0, 8, 3, 0)).toBe(1);
    expect(paintWeaponShot(ctx, WPN_FLAME, 0, 0, 1, 0, 8, 3, 0)).toBe(1);
    expect(paintWeaponShot(ctx, WPN_HARP, 0, 0, 1, 0, 8, 3, 0)).toBe(1);
    expect(paintWeaponShot(ctx, WPN_MORT, 0, 0, 1, 0, 8, 3, 0)).toBe(1);
    expect(paintWeaponShot(ctx, 0, 0, 0, 1, 0, 8, 3, 0)).toBe(0);
    expect(paintWeaponShot(ctx, WPN_SHOT, 0, 0, 1, 0, 8, 3, 0) + paintWeaponShot(ctx, WPN_FLAME, 0, 0, 1, 0, 8, 3, 0)).toBeGreaterThan(1);
  });

  it("horde stamps keep a distinct sprite per gun", () => {
    buildSprites();
    const rivet = bulletSprite(4, 0, 0);
    const flame = bulletSprite(4, 0, WPN_FLAME);
    const harp = bulletSprite(4, 0, WPN_HARP);
    expect(flame).not.toBe(rivet);
    expect(harp).not.toBe(rivet);
    expect(flame.w).not.toBe(harp.w);
  });

  it("heal vials and auras paint a pulsing glow", () => {
    const ctx = paper();
    paintAura(ctx, 10, 10, 16, 8, "rgba(180,255,190,0.7)", "rgba(80,220,120,0.2)");
    paintHealVial(ctx, 20, 20, 12, 0);
    expect(ctx.grads).toBeGreaterThanOrEqual(2);
    expect(ctx.arcs).toBeGreaterThan(2);
  });

  it("flash spark puff boom and level burst all draw", () => {
    const ctx = paper();
    paintFlash(ctx, 8, 8, 2, 0.4, 1);
    paintSpark(ctx, 8, 8, 2, 0.2, 1);
    paintPuff(ctx, 8, 8, 3, 0, 1);
    paintBoom(ctx, 8, 8, 2, 24, 1);
    const w = paperWorld(6);
    w.events[EV_LEVEL] = 1;
    w.tick = 10;
    paintLevelBurst(ctx, w);
    expect(ctx.grads).toBeGreaterThan(4);
    expect(ctx.arcs).toBeGreaterThan(4);
  });

  it("keeps a canvas corpse off the horde blit", () => {
    buildSprites();
    markCrowdFx(false);
    expect(puffDrawsCorpse(3, 0)).toBe(true);
    expect(puffDrawsCorpse(3, Z_GAS)).toBe(false);
    expect(puffDrawsCorpse(14, 0)).toBe(false);
    markCrowdFx(true);
    expect(puffDrawsCorpse(3, 0)).toBe(false);
    expect(SHAMBLER.h).toBeGreaterThan(zombieSprite(0, 0).h * 2);
    markCrowdFx(false);
  });
});
