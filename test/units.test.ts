import {
  CHAR_ALCHEMIST, CHAR_BRUTE, CHAR_GUNSLINGER, CHAR_TINKER,
} from "../src/sim/characters";
import { Z_GAS, Z_KNIGHT, Z_RAT, Z_SPITTER } from "../src/sim/foes";
import { HAT_BRIM, HAT_DOME, HAT_HELM, HAT_TALL, HERO_KITS, heroKit } from "../src/render/heroes";
import { buildSprites, zombieSprite } from "../src/render/horde-sprites";
import {
  foePose, foeStriking, heroPose, justFired, POSE_ATK, POSE_DIE, POSE_HIT, POSE_IDLE, POSE_N, POSE_WALK,
} from "../src/render/poses";
import { Z_BRUTE, Z_GHOUL, Z_SHAMBLER } from "../src/sim/types";

describe("hero kits", () => {
  it("gives each survivor a distinct hat and coat", () => {
    expect(HERO_KITS.length).toBe(4);
    expect(heroKit(CHAR_TINKER).hat).toBe(HAT_DOME);
    expect(heroKit(CHAR_GUNSLINGER).hat).toBe(HAT_BRIM);
    expect(heroKit(CHAR_ALCHEMIST).hat).toBe(HAT_TALL);
    expect(heroKit(CHAR_BRUTE).hat).toBe(HAT_HELM);
    const coats = HERO_KITS.map((row) => row.coat.mid);
    expect(new Set(coats).size).toBe(4);
    expect(heroKit(99).id).toBe(CHAR_TINKER);
    expect(heroKit(CHAR_BRUTE).fat).toBeGreaterThan(heroKit(CHAR_GUNSLINGER).fat);
  });
});

describe("pose table", () => {
  it("picks death over hit over attack over walk", () => {
    expect(heroPose(true, true, true, true)).toBe(POSE_DIE);
    expect(heroPose(true, true, true, false)).toBe(POSE_HIT);
    expect(heroPose(true, true, false, false)).toBe(POSE_ATK);
    expect(heroPose(true, false, false, false)).toBe(POSE_WALK);
    expect(heroPose(false, false, false, false)).toBe(POSE_IDLE);
    expect(foePose(true, true, true)).toBe(POSE_HIT);
    expect(foePose(false, true, true)).toBe(POSE_ATK);
    expect(foePose(false, false, true)).toBe(POSE_WALK);
    expect(foePose(false, false, false)).toBe(POSE_IDLE);
    expect(POSE_N).toBe(5);
  });

  it("reads a just-fired rivet and a close strike", () => {
    expect(justFired(20, 24)).toBe(true);
    expect(justFired(2, 24)).toBe(false);
    expect(foeStriking(Z_SPITTER, 0, 70, 80, 80)).toBe(true);
    expect(foeStriking(Z_SPITTER, 0, 10, 80, 80)).toBe(false);
    expect(foeStriking(Z_KNIGHT, 0, 0, 20, 20)).toBe(true);
    expect(foeStriking(Z_SHAMBLER, 1, 0, 10, 10)).toBe(true);
    expect(foeStriking(Z_SHAMBLER, 1, 0, 80, 80)).toBe(false);
  });
});

describe("horde stamps", () => {
  it("keeps a unique ink signature per foe kind", () => {
    buildSprites();
    const kinds = [Z_SHAMBLER, Z_GHOUL, Z_BRUTE, Z_SPITTER, Z_GAS, Z_KNIGHT, Z_RAT];
    const marks = kinds.map((kind) => {
      const spr = zombieSprite(kind, 0);
      const seen = new Set<number>();
      for (let i = 0; i < spr.pix.length; i++) if (spr.pix[i]) seen.add(spr.pix[i] ?? 0);
      expect(spr.w).toBeGreaterThan(7);
      expect(spr.h).toBeGreaterThan(7);
      expect(seen.size).toBeGreaterThan(3);
      return `${spr.w}x${spr.h}:${[...seen].sort((a, b) => a - b).join(",")}`;
    });
    expect(new Set(marks).size).toBe(kinds.length);
  });
});
