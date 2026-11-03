import { CODEX_KEY, codexLines, emptyCodex, loadCodex, observe, saveCodex } from "../src/shell/codex";
import {
  begin, closeCodex, createSession, openCodex, PHASE_OVER, PHASE_PLAY, PHASE_TITLE,
} from "../src/shell/session";
import { Z_ELITE } from "../src/sim/foes";
import { upgName } from "../src/sim/progress";
import {
  UNION_CROWN, UPG_DYNAMO, UPG_TESLA, UPG_WPN_FLAME, UPG_WPN_HARP, UPG_WPN_MORT, UPG_WPN_RIVET,
  UPG_WPN_SHOT, Z_GHOUL, Z_SHAMBLER,
} from "../src/sim/types";
import { createWorld } from "../src/sim/world";

const mem = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k) ?? null : null),
    setItem: (k: string, v: string) => { m.set(k, v); },
  };
};

describe("codex", () => {
  it("lists weapons, passives, sealed evolutions with recipes, and unseen foes", () => {
    const lines = codexLines(emptyCodex());
    const sections = new Set(lines.map((line) => line.section));
    expect(sections).toEqual(new Set(["WEAPONS", "PASSIVES", "EVOLUTIONS", "ENEMIES"]));
    expect(lines.some((line) => line.section === "WEAPONS" && line.title === upgName(UPG_TESLA))).toBe(true);
    const guns = [UPG_WPN_RIVET, UPG_WPN_SHOT, UPG_WPN_FLAME, UPG_WPN_HARP, UPG_WPN_MORT];
    for (let i = 0; i < guns.length; i++) {
      const title = upgName(guns[i] ?? 0);
      expect(lines.some((line) => line.section === "WEAPONS" && line.title === title)).toBe(true);
    }
    expect(lines.some((line) => line.section === "PASSIVES" && line.title === upgName(UPG_DYNAMO))).toBe(true);
    const crown = lines.find((line) => line.detail.includes("TESLA COIL max + DYNAMO"));
    expect(crown?.title).toBe("UNKNOWN UNION");
    expect(crown?.locked).toBe(true);
    expect(crown?.detail).not.toContain(upgName(UNION_CROWN));
    expect(crown?.detail).not.toContain("Crown lightning");
    const legacy = lines.find((line) => line.detail.includes("TESLA COIL LV2 + SAW GEARS LV2"));
    expect(legacy?.locked).toBe(true);
    expect(legacy?.title).toBe("UNKNOWN UNION");
    const foes = lines.filter((line) => line.section === "ENEMIES");
    expect(foes.length).toBe(8);
    expect(foes.every((line) => line.locked && line.title === "UNSEEN FOE")).toBe(true);
  });

  it("unlocks a forged union and a met foe, and keeps them in localStorage", () => {
    const store = mem();
    const book = emptyCodex();
    const w = createWorld(3);
    w.upgrades[UPG_TESLA] = 5;
    w.upgrades[UNION_CROWN] = 1;
    w.zombies.alive[0] = 1;
    w.zombies.kind[0] = Z_GHOUL | Z_ELITE;
    expect(observe(book, w)).toBe(true);
    expect(observe(book, w)).toBe(false);
    const lines = codexLines(book);
    const crown = lines.find((line) => line.title === upgName(UNION_CROWN));
    expect(crown?.locked).toBe(false);
    expect(crown?.detail).toContain("TESLA COIL max + DYNAMO");
    expect(crown?.detail).toContain("Crown lightning");
    expect(lines.some((line) => line.title === "CLOCKWORK GHOUL" && !line.locked)).toBe(true);
    expect(lines.some((line) => line.title === "ELITE" && !line.locked)).toBe(true);
    expect(lines.some((line) => line.title === "SHAMBLER")).toBe(false);
    saveCodex(store, book);
    const again = loadCodex(store);
    expect(again.ups[UNION_CROWN]).toBe(1);
    expect(again.ups[UPG_TESLA]).toBe(1);
    expect(again.foes[Z_GHOUL]).toBe(1);
    expect(again.foes[Z_SHAMBLER]).toBe(0);
    expect(again.elite).toBe(1);
    expect(store.getItem(CODEX_KEY)).toContain("1");
  });

  it("does not throw when the store refuses the write", () => {
    const store = {
      getItem: () => null,
      setItem: () => { throw new Error("full"); },
    };
    expect(() => saveCodex(store, emptyCodex())).not.toThrow();
  });

  it("ignores a broken save and still opens", () => {
    const store = mem();
    store.setItem(CODEX_KEY, "nope");
    const book = loadCodex(store);
    expect(book.elite).toBe(0);
    expect(book.ups[UNION_CROWN]).toBe(0);
    expect(codexLines(book).some((line) => line.title === "UNKNOWN UNION")).toBe(true);
  });

  it("opens from the title and the gears-stop screen, and play closes it", () => {
    const title = createSession();
    openCodex(title);
    expect(title.phase).toBe(PHASE_TITLE);
    expect(title.codex).toBe(true);
    expect(begin(title)).toBe(true);
    expect(title.phase).toBe(PHASE_PLAY);
    expect(title.codex).toBe(false);
    openCodex(title);
    expect(title.codex).toBe(false);
    title.phase = PHASE_OVER;
    openCodex(title);
    expect(title.codex).toBe(true);
    closeCodex(title);
    expect(title.codex).toBe(false);
  });
});
