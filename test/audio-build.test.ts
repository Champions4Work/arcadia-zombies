import {
  BED_WAVE, bootMusic, cueFrom, silence, syncMusic, type MusicSnap,
} from "../src/render/music";
import { bootSfx, playSfxCue, playUiClick } from "../src/render/sfx";
import { CUE_CLICK, CUE_DASH } from "../src/render/sfx-cues";
import { getBus, unlockAudio } from "../src/render/sound";
import { PHASE_PLAY } from "../src/shell/session";

class MockGain {
  value = 1;
  setValueAtTime(v: number): void { this.value = v; }
  exponentialRampToValueAtTime(v: number): void { this.value = v; }
  linearRampToValueAtTime(v: number): void { this.value = v; }
  cancelScheduledValues(): void {}
}

class MockNode {
  gain = new MockGain();
  threshold = new MockGain();
  knee = new MockGain();
  ratio = new MockGain();
  attack = new MockGain();
  release = new MockGain();
  type = "lowpass";
  frequency = new MockGain();
  Q = new MockGain();
  loop = false;
  buffer: AudioBuffer | null = null;
  connect(): this { return this; }
  disconnect(): void {}
  start(): void {}
  stop(): void {}
}

class MockAudioContext {
  currentTime = 0;
  state: AudioContextState = "running";
  destination = new MockNode();
  createGain(): MockNode { return new MockNode(); }
  createOscillator(): MockNode { return new MockNode(); }
  createBufferSource(): MockNode { return new MockNode(); }
  createBiquadFilter(): MockNode { return new MockNode(); }
  createDynamicsCompressor(): MockNode { return new MockNode(); }
  createBuffer(_c: number, len: number, sampleRate: number): AudioBuffer {
    void sampleRate;
    const data = new Float32Array(len);
    return { getChannelData: () => data } as unknown as AudioBuffer;
  }
  resume(): Promise<void> { return Promise.resolve(); }
  suspend(): Promise<void> { return Promise.resolve(); }
}

describe("audio graph build", () => {
  it("wires buses and plays cues without throwing", () => {
    const prev = globalThis.AudioContext;
    globalThis.AudioContext = MockAudioContext as unknown as typeof AudioContext;
    try {
      bootSfx(null);
      bootMusic(null);
      unlockAudio();
      expect(getBus()).not.toBeNull();
      playUiClick();
      playSfxCue(CUE_CLICK);
      playSfxCue(CUE_DASH);
      const snap: MusicSnap = {
        phase: PHASE_PLAY, wave: 2, rank: 0, toSpawn: 0, alive: 6,
        bossOn: 0, bossPending: 0, lich: false,
      };
      syncMusic(snap);
      const cue = cueFrom(snap, silence());
      expect(cue.audible && cue.bed).toBe(BED_WAVE);
    } finally {
      globalThis.AudioContext = prev;
    }
  });
});
