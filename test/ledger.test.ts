import {
  applyLedger,
  chooseLoadout,
  chooseYard,
  COAT_SCORE,
  emptyFacts,
  emptyLedger,
  GOGGLES_RUNS,
  grantLedger,
  JET_WAVE,
  KIND_LOADOUT,
  KIND_MARK,
  KIND_YARD,
  LAMP_TICKS,
  ledgerAction,
  ledgerLines,
  LEDGER_KEY,
  LEDGER_VERSION,
  LINE_TICKS,
  loadLedger,
  LOADOUT_JET,
  LOADOUT_LINE,
  LOADOUT_RIVET,
  LOADOUT_SCATTER,
  LOADOUT_SHELL,
  MARK_GOGGLES,
  MARK_MASK,
  saveLedger,
  SCATTER_WAVE,
  serializeLedger,
  SHELL_KILLS,
  YARD_BOILER,
  YARD_BRASS,
  YARD_FOUNDRY,
  YARD_LAMP,
  type Ledger,
  type LedgerFacts,
} from "../src/meta/ledger";
import { applyWorkshop, BONUS_DMG, BONUS_GUN, BONUS_HP, emptyWorkshop, META_DMG, META_GUN, META_HP, META_MAX } from "../src/meta/workshop";
import { CHAR_BRUTE } from "../src/sim/characters";
import { MOD_GLASS } from "../src/sim/modifiers";
import {
  UPG_WPN_FLAME, UPG_WPN_HARP, UPG_WPN_MORT, UPG_WPN_RIVET, UPG_WPN_SHOT,
} from "../src/sim/types";
import { createWorld } from "../src/sim/world";

const mem = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k) ?? null : null),
    setItem: (k: string, v: string) => { m.set(k, v); },
  };
};

function facts(patch: Partial<LedgerFacts> = {}): LedgerFacts {
  return { ...emptyFacts(), ...patch };
}

function guns(w: ReturnType<typeof createWorld>): number[] {
  return [
    w.upgrades[UPG_WPN_RIVET] ?? 0,
    w.upgrades[UPG_WPN_SHOT] ?? 0,
    w.upgrades[UPG_WPN_FLAME] ?? 0,
    w.upgrades[UPG_WPN_HARP] ?? 0,
    w.upgrades[UPG_WPN_MORT] ?? 0,
  ];
}

function line(ledger: Ledger, kind: number, index: number) {
  const hit = ledgerLines(ledger).find((row) => row.kind === kind && row.index === index);
  if (!hit) throw new Error("missing line");
  return hit;
}

describe("hunter ledger", () => {
  it("starts on the rivet rifle in the foundry and keeps a quiet yard", () => {
    const ledger = emptyLedger();
    const w = createWorld(3);
    const props = w.arena.obsN;
    const prop0 = w.arena.obsX[0];
    applyLedger(w, ledger);
    expect(guns(w)).toEqual([1, 0, 0, 0, 0]);
    expect(w.meta.hp).toBe(0);
    expect(w.meta.dmg).toBe(0);
    expect(w.meta.gun).toBe(0);
    expect(w.meta.spd).toBe(0);
    expect(w.maxHp).toBe(5);
    expect(w.arena.obsN).toBe(props);
    expect(w.arena.obsX[0]).toBe(prop0);
    expect(ledgerAction(line(ledger, KIND_LOADOUT, LOADOUT_RIVET))).toBe("USING");
    expect(ledgerAction(line(ledger, KIND_YARD, YARD_FOUNDRY))).toBe("USING");
    expect(ledgerAction(line(ledger, KIND_LOADOUT, LOADOUT_SCATTER))).toBe("WAVE 4");
    expect(ledgerAction(line(ledger, KIND_MARK, MARK_GOGGLES))).toBe("LOCKED");
  });

  it("grants each unlock once and refuses a pick the hunter has not earned", () => {
    const ledger = emptyLedger();
    expect(grantLedger(ledger, facts({ bestWave: SCATTER_WAVE - 1 }))).toEqual([]);
    expect(chooseLoadout(ledger, LOADOUT_SCATTER)).toBe(false);
    expect(ledger.loadout).toBe(LOADOUT_RIVET);
    expect(grantLedger(ledger, facts({ bestWave: SCATTER_WAVE }))).toEqual(["SCATTER RIG"]);
    expect(grantLedger(ledger, facts({ bestWave: JET_WAVE }))).toEqual(["BOILER JET", "BRASS DISTRICT"]);
    expect(grantLedger(ledger, facts({ bestWave: JET_WAVE }))).toEqual([]);
    expect(chooseLoadout(ledger, LOADOUT_SCATTER)).toBe(true);
    expect(chooseLoadout(ledger, LOADOUT_SCATTER)).toBe(true);
    expect(ledger.loadout).toBe(LOADOUT_SCATTER);
    const w = createWorld(1);
    applyLedger(w, ledger);
    expect(guns(w)).toEqual([1, 1, 0, 0, 0]);
    applyLedger(w, ledger);
    expect(w.upgrades[UPG_WPN_SHOT]).toBe(1);
  });

  it("opens the other starters from time and lifetime kills", () => {
    const ledger = emptyLedger();
    expect(grantLedger(ledger, facts({ bestTicks: LINE_TICKS - 1, lifeKills: SHELL_KILLS - 1 }))).toEqual(["BOILER ROW"]);
    const fresh = grantLedger(ledger, facts({ bestTicks: LINE_TICKS, lifeKills: SHELL_KILLS }));
    expect(fresh).toEqual(["HARPOON LINE", "MORTAR CROWN"]);
    expect(chooseLoadout(ledger, LOADOUT_LINE)).toBe(true);
    const lineRun = createWorld(2);
    applyLedger(lineRun, ledger);
    expect(lineRun.upgrades[UPG_WPN_HARP]).toBe(1);
    expect(lineRun.upgrades[UPG_WPN_MORT]).toBe(0);
    expect(chooseLoadout(ledger, LOADOUT_SHELL)).toBe(true);
    const shell = createWorld(2);
    applyLedger(shell, ledger);
    expect(shell.upgrades[UPG_WPN_MORT]).toBe(1);
    expect(shell.upgrades[UPG_WPN_HARP]).toBe(0);
  });

  it("opens the brass district from wave 6 or from the steam gate", () => {
    const byWave = emptyLedger();
    expect(grantLedger(byWave, facts({ bestWave: 5, gate: false }))).toEqual(["SCATTER RIG"]);
    expect(grantLedger(byWave, facts({ bestWave: 6 }))).toEqual(["BRASS DISTRICT"]);
    const byGate = emptyLedger();
    expect(grantLedger(byGate, facts({ gate: true }))).toContain("BRASS DISTRICT");
    expect(chooseYard(byGate, YARD_BRASS)).toBe(true);
    const w = createWorld(4);
    applyLedger(w, byGate);
    expect(w.meta.hp).toBe(1);
    expect(w.maxHp).toBe(6);
    expect(w.hp).toBe(6);
  });

  it("keeps yard bonuses inside the workshop caps", () => {
    const ledger = emptyLedger();
    grantLedger(ledger, facts({
      bestWave: JET_WAVE,
      bestTicks: LAMP_TICKS,
      lifeKills: 250,
    }));
    expect(chooseYard(ledger, YARD_LAMP)).toBe(true);
    const shop = emptyWorkshop();
    shop.ranks[META_HP] = META_MAX[META_HP] ?? 0;
    shop.ranks[META_DMG] = META_MAX[META_DMG] ?? 0;
    shop.ranks[META_GUN] = META_MAX[META_GUN] ?? 0;
    const full = createWorld(5);
    applyWorkshop(full, shop);
    applyLedger(full, ledger);
    expect(full.meta.hp).toBe((META_MAX[META_HP] ?? 0) * BONUS_HP);
    expect(full.meta.dmg).toBe((META_MAX[META_DMG] ?? 0) * BONUS_DMG);
    expect(full.meta.gun).toBe((META_MAX[META_GUN] ?? 0) * BONUS_GUN);
    expect(full.meta.spd).toBe(0);
    expect(chooseYard(ledger, YARD_BOILER)).toBe(true);
    const bare = createWorld(5);
    bare.meta.spd = 0.125;
    applyLedger(bare, ledger);
    expect(bare.meta.dmg).toBe(1);
    expect(bare.meta.hp).toBe(0);
    expect(bare.meta.gun).toBe(0);
    expect(bare.meta.spd).toBe(0.125);
    expect(chooseYard(ledger, YARD_FOUNDRY)).toBe(true);
    const home = createWorld(5);
    applyLedger(home, ledger);
    expect(home.meta.hp).toBe(0);
    expect(home.meta.dmg).toBe(0);
    expect(home.meta.gun).toBe(0);
  });

  it("adds plate on a glass cannon and on the brute without touching props", () => {
    const ledger = emptyLedger();
    grantLedger(ledger, facts({ bestWave: 6 }));
    chooseYard(ledger, YARD_BRASS);
    const glass = createWorld(8, 0, MOD_GLASS);
    const props = glass.arena.obsN;
    applyLedger(glass, ledger);
    expect(glass.maxHp).toBe(2);
    expect(glass.arena.obsN).toBe(props);
    const brute = createWorld(8, CHAR_BRUTE);
    applyLedger(brute, ledger);
    expect(brute.maxHp).toBe(9);
  });

  it("keeps cosmetic marks off the sim", () => {
    const ledger = emptyLedger();
    expect(grantLedger(ledger, facts({ runs: GOGGLES_RUNS - 1, score: COAT_SCORE - 1 }))).toEqual([]);
    const fresh = grantLedger(ledger, facts({ runs: GOGGLES_RUNS, score: COAT_SCORE, forged: true }));
    expect(fresh).toEqual(["AMBER GOGGLES", "SOOT COAT", "BRASS MASK"]);
    expect(ledgerAction(line(ledger, KIND_MARK, MARK_MASK))).toBe("KEPT");
    const marked = createWorld(9);
    const plain = createWorld(9);
    applyLedger(marked, ledger);
    applyLedger(plain, emptyLedger());
    expect(guns(marked)).toEqual(guns(plain));
    expect(marked.meta).toEqual(plain.meta);
    expect(marked.maxHp).toBe(plain.maxHp);
    expect(marked.arena.obsN).toBe(plain.arena.obsN);
  });

  it("round-trips the save and leaves a newer schema alone", () => {
    const store = mem();
    const ledger = emptyLedger();
    grantLedger(ledger, facts({ bestWave: JET_WAVE, bestTicks: LAMP_TICKS }));
    chooseLoadout(ledger, LOADOUT_JET);
    chooseYard(ledger, YARD_LAMP);
    saveLedger(store, ledger, true);
    const loaded = loadLedger(store);
    expect(loaded.writable).toBe(true);
    expect(loaded.ledger).toEqual(ledger);
    expect(store.getItem(LEDGER_KEY)).toBe(serializeLedger(ledger));
    const raw = JSON.stringify({ v: LEDGER_VERSION + 1, owned: 999, loadout: 4, yard: 3 });
    store.setItem(LEDGER_KEY, raw);
    const newer = loadLedger(store);
    expect(newer.writable).toBe(false);
    expect(newer.ledger.loadout).toBe(LOADOUT_RIVET);
    saveLedger(store, newer.ledger, newer.writable);
    expect(store.getItem(LEDGER_KEY)).toBe(raw);
  });

  it("drops a pick the save does not own and survives a bad store", () => {
    const store = mem();
    store.setItem(LEDGER_KEY, JSON.stringify({ v: LEDGER_VERSION, owned: 1, loadout: LOADOUT_SHELL, yard: YARD_BOILER }));
    const loaded = loadLedger(store);
    expect(loaded.ledger.loadout).toBe(LOADOUT_RIVET);
    expect(loaded.ledger.yard).toBe(YARD_FOUNDRY);
    expect(chooseLoadout(loaded.ledger, 9)).toBe(false);
    expect(chooseYard(loaded.ledger, -1)).toBe(false);
    store.setItem(LEDGER_KEY, "{");
    expect(loadLedger(store).writable).toBe(true);
    expect(loadLedger(store).ledger).toEqual(emptyLedger());
    const thrown = loadLedger({
      getItem: () => { throw new Error("quota"); },
      setItem: () => { throw new Error("quota"); },
    });
    expect(thrown.writable).toBe(false);
    expect(() => saveLedger({
      getItem: () => store.getItem(LEDGER_KEY),
      setItem: () => { throw new Error("quota"); },
    }, emptyLedger(), true)).not.toThrow();
    expect(store.getItem(LEDGER_KEY)).toBe("{");
    saveLedger({
      getItem: () => { throw new Error("quota"); },
      setItem: () => { store.setItem(LEDGER_KEY, "wiped"); },
    }, emptyLedger(), thrown.writable);
    expect(store.getItem(LEDGER_KEY)).toBe("{");
  });
});
