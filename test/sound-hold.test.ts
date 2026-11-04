import { audioHeld, holdAudio } from "../src/render/sound";

describe("page audio hold", () => {
  it("tracks held and live without requiring an audio context", () => {
    holdAudio(true);
    expect(audioHeld()).toBe(true);
    holdAudio(false);
    expect(audioHeld()).toBe(false);
  });
});
