import { mountBriefing } from "../src/shell/briefing";
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
    expect(body).toContain("forge a union");
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

describe("daily blurb", () => {
  it("mounts the challenge line after quests and hides it when asked", () => {
    const ids = new Map<string, FakeNode>();
    const panel = new FakeNode("div", ids);
    const sub = new FakeNode("p", ids);
    sub.id = "sub";
    panel.append(sub);
    const body = new FakeNode("body", ids);
    const previous = globalThis.document;
    globalThis.document = {
      createElement: (tag: string) => new FakeNode(tag, ids),
      createTextNode: (text: string) => new FakeNode("#text", ids, text),
      body,
      getElementById: (id: string) => ids.get(id) ?? null,
    } as unknown as Document;
    try {
      const ui = mountBriefing(() => undefined);
      expect(panel.children.map((node) => node.id)).toEqual(["sub", "quests", "challenge"]);
      const challenge = ids.get("challenge");
      expect(challenge?.hidden).toBe(true);
      ui.setChallenge("Daily Challenge\n2026-11-04 · SEED ABCD1234", true);
      expect(challenge?.hidden).toBe(false);
      expect(challenge?.textContent).toContain("SEED ABCD1234");
      ui.setChallenge("gone", false);
      expect(challenge?.hidden).toBe(true);
      expect(challenge?.textContent).toBe("");
    } finally {
      globalThis.document = previous;
    }
  });
});

class FakeNode {
  hidden = false;
  textContent: string;
  parentElement: FakeNode | null = null;
  children: FakeNode[] = [];
  type = "";
  private name = "";

  constructor(readonly tag: string, private ids: Map<string, FakeNode>, text = "") {
    this.textContent = text;
  }

  get id(): string {
    return this.name;
  }

  set id(value: string) {
    if (this.name) this.ids.delete(this.name);
    this.name = value;
    if (value) this.ids.set(value, this);
  }

  setAttribute(): void {}

  addEventListener(): void {}

  focus(): void {}

  append(...nodes: FakeNode[]): void {
    for (const node of nodes) this.insertBefore(node, null);
  }

  insertBefore(node: FakeNode, ref: FakeNode | null): void {
    if (node.parentElement) {
      const kids = node.parentElement.children;
      const at = kids.indexOf(node);
      if (at >= 0) kids.splice(at, 1);
    }
    node.parentElement = this;
    if (!ref) {
      this.children.push(node);
      return;
    }
    const at = this.children.indexOf(ref);
    if (at < 0) this.children.push(node);
    else this.children.splice(at, 0, node);
  }

  get nextSibling(): FakeNode | null {
    const kids = this.parentElement?.children;
    if (!kids) return null;
    const at = kids.indexOf(this);
    return kids[at + 1] ?? null;
  }
}
