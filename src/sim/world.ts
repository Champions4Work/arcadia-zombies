import { resetJuice } from "../render/juice";
import { CHAR_TINKER, CHARACTERS, characterAt } from "./characters";
import { attachFinale } from "./finale";
import { attachMapEvents } from "./map-events";
import { applyUpgrade } from "./progress";
import { createRng } from "./rng";
import {
  EV_N, H, MAX_BULLETS, MAX_FX, MAX_ZOMBIES, OFFER_N, UPG_COUNT, UPG_WPN_RIVET, W, WPN_COUNT,
  type Pool, type World,
} from "./types";
const pool = (n: number): Pool => ({
  x: new Float32Array(n), y: new Float32Array(n), vx: new Float32Array(n), vy: new Float32Array(n),
  hp: new Int16Array(n), alive: new Uint8Array(n), kind: new Uint8Array(n),
});
export function applyCharacter(w: World, index: number, start?: number): void {
  const slot = index >= 0 && index < CHARACTERS.length ? index : CHAR_TINKER;
  const row = characterAt(slot);
  w.charId = slot;
  w.maxHp = 5 + row.hp;
  w.hp = w.maxHp;
  const upg = start === undefined ? row.startUpg : start;
  if (upg >= 0) applyUpgrade(w, upg);
}
export const createWorld = (seed: number, charId = CHAR_TINKER): World => {
  resetJuice();
  const offers = new Int8Array(OFFER_N);
  offers.fill(-1);
  const teslaHit = new Int16Array(8);
  teslaHit.fill(-1);
  const bHit = new Int16Array(MAX_BULLETS);
  bHit.fill(-1);
  const upgrades = new Uint8Array(UPG_COUNT);
  upgrades[UPG_WPN_RIVET] = 1;
  const world: World = {
    rng: createRng(seed), tick: 0, px: W / 2, py: H / 2, hp: 5, maxHp: 5,
    score: 0, wave: 0, toSpawn: 0, spawnCd: 0, fireCd: 0, hurtCd: 0, over: false,
    xp: 0, level: 0, choosing: 0, teslaCd: 0, teslaN: 0, teslaFlash: 0, shield: 0, shieldCd: 0,
    aimX: 1, aimY: 0,
    rank: 0, rankFlash: 0, banner: 0, ventCd: 0, healCd: 0, mortarCd: 0,
    charId: CHAR_TINKER, offerExtra: -1,
    zombies: pool(MAX_ZOMBIES), bullets: pool(MAX_BULLETS),
    events: new Uint8Array(EV_N), upgrades, offers,
    scratch: new Uint8Array(UPG_COUNT), bHit, bPierce: new Uint8Array(MAX_BULLETS),
    bLife: new Uint8Array(MAX_BULLETS), bGun: new Uint8Array(MAX_BULLETS),
    bRad: new Uint8Array(MAX_BULLETS),
    wpnCd: new Int16Array(WPN_COUNT), gun: 0,
    zMark: new Uint8Array(MAX_ZOMBIES), teslaHit,
    fxKind: new Uint8Array(MAX_FX), fxX: new Float32Array(MAX_FX), fxY: new Float32Array(MAX_FX),
    fxA: new Float32Array(MAX_FX), fxTick: new Int32Array(MAX_FX), fxHead: 0,
  };
  attachFinale(world);
  attachMapEvents(world);
  applyCharacter(world, charId);
  return world;
};
