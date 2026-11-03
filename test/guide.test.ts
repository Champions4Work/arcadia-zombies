import { GUIDE_KEY, GUIDE_LINES, GUIDE_SKIP, GUIDE_TITLE, guideSeen, loadGuideSeen, saveGuideSeen } from "../src/shell/guide";

const mem = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k) ?? null : null),
    setItem: (k: string, v: string) => { m.set(k, v); },
  };
};

describe("how to play", () => {
  it("names move, auto-fire, level-up cards, and gears", () => {
    expect(GUIDE_TITLE).toBe("How to play");
    expect(GUIDE_SKIP).toBe("Skip");
    expect(GUIDE_LINES.map((line) => line.title)).toEqual(["Move", "Auto-fire", "Level-up cards", "Gears"]);
    const body = GUIDE_LINES.map((line) => line.body).join(" ");
    expect(body).toContain("WASD");
    expect(body).toContain("fires on its own");
    expect(body).toContain("two cards");
    expect(body).toContain("forges a union");
  });

  it("treats only the stored flag as seen", () => {
    expect(guideSeen(null)).toBe(false);
    expect(guideSeen("")).toBe(false);
    expect(guideSeen("true")).toBe(false);
    expect(guideSeen(" 1")).toBe(false);
    expect(guideSeen("1")).toBe(true);
  });

  it("persists a skip and ignores a broken store", () => {
    const store = mem();
    expect(loadGuideSeen(store)).toBe(false);
    saveGuideSeen(store);
    expect(store.getItem(GUIDE_KEY)).toBe("1");
    expect(loadGuideSeen(store)).toBe(true);
    const boom = {
      getItem() { throw new Error("blocked"); },
      setItem() { throw new Error("blocked"); },
    };
    expect(loadGuideSeen(boom)).toBe(false);
    expect(() => saveGuideSeen(boom)).not.toThrow();
  });
});
