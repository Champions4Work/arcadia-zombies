import { playKeyPick } from "../src/shell/play-focus";

describe("play focus keys", () => {
  it("maps 1 2 3 onto live offer slots and ignores extra digits", () => {
    expect(playKeyPick("1", 2)).toBe(1);
    expect(playKeyPick("2", 2)).toBe(2);
    expect(playKeyPick("3", 2)).toBe(0);
    expect(playKeyPick("3", 3)).toBe(3);
    expect(playKeyPick("Enter", 3)).toBe(0);
    expect(playKeyPick("0", 3)).toBe(0);
  });
});
