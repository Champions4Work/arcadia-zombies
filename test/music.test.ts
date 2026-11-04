import {
  BED_BOSS, BED_HORDE, BED_MENU, BED_WAVE,
  bootMusic, cueFrom, musicMuted, musicMuteLabel, musicVolume, musicVolumePercent,
  needsHardStart, parseMusicPrefs, persistMusic, setMusicMuted, setMusicVolume, silence,
  tempoOf, timbresOf, TIMBRE_BELL, TIMBRE_BRASS, TIMBRE_GEAR, TIMBRE_ORGAN, TIMBRE_STEAM, TIMBRE_THUMP,
  type MusicSnap,
} from "../src/render/music";
import { PHASE_OVER, PHASE_PAUSE, PHASE_PLAY, PHASE_TITLE, PHASE_WORKSHOP, MUTE_KEY } from "../src/shell/session";

const mem = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k) ?? null : null),
    setItem: (k: string, v: string) => { m.set(k, v); },
  };
};

function play(over: Partial<MusicSnap> = {}): MusicSnap {
  return {
    phase: PHASE_PLAY, wave: 10, rank: 2, toSpawn: 0, alive: 4,
    bossOn: 0, bossPending: 0, lich: false,
    ...over,
  };
}

describe("music beds", () => {
  it("picks menu, wave, horde, and boss from the snapshot", () => {
    const snap: MusicSnap = {
      phase: PHASE_PLAY, wave: 10, rank: 2, toSpawn: 0, alive: 4,
      bossOn: 0, bossPending: 0, lich: false,
    };
    const wave = cueFrom(snap, silence());
    const boss = cueFrom({ ...snap, bossOn: 1, alive: 400 }, wave);
    const menu = cueFrom({ ...snap, phase: PHASE_TITLE, bossOn: 1, alive: 400 }, silence());
    const crowd = { ...snap, alive: 36, toSpawn: 0, bossOn: 0 };
    const horde = cueFrom(crowd, silence());
    const dipped = cueFrom({ ...crowd, alive: 24 }, horde);
    const clear = cueFrom({ ...crowd, alive: 23 }, dipped);
    expect(wave.audible && wave.bed).toBe(BED_WAVE);
    expect(boss.audible && boss.bed).toBe(BED_BOSS);
    expect(menu.audible && menu.bed).toBe(BED_MENU);
    expect(horde.audible && horde.bed).toBe(BED_HORDE);
    expect(dipped.audible && dipped.bed).toBe(BED_HORDE);
    expect(clear.audible && clear.bed).toBe(BED_WAVE);
    const fitting = cueFrom({ ...snap, phase: PHASE_WORKSHOP, bossOn: 1 }, silence());
    expect(fitting.audible && fitting.bed).toBe(BED_MENU);
    expect(timbresOf(BED_MENU)).toContain(TIMBRE_ORGAN);
    expect(timbresOf(BED_MENU)).not.toContain(TIMBRE_BRASS);
    expect(timbresOf(BED_WAVE)).toContain(TIMBRE_BRASS);
    expect(timbresOf(BED_WAVE)).not.toContain(TIMBRE_BELL);
    expect(timbresOf(BED_HORDE)).toContain(TIMBRE_GEAR);
    expect(timbresOf(BED_BOSS)).toContain(TIMBRE_BELL);
    expect(tempoOf(boss)).toBeGreaterThan(tempoOf(menu));
    expect(cueFrom({ ...snap, phase: PHASE_PAUSE, bossOn: 1 }, boss).audible).toBe(false);

    expect(parseMusicPrefs("true", "nope")).toEqual({ muted: false, volume: 0.8 });
    expect(parseMusicPrefs("1", "2").volume).toBe(1);
    setMusicVolume(1 / 3);
    setMusicMuted(true);
    const store = mem();
    store.setItem(MUTE_KEY, "0");
    persistMusic(store);
    expect(store.getItem(MUTE_KEY)).toBe("0");
    bootMusic(store);
    expect(musicMuted()).toBe(true);
    expect(musicVolume()).toBeCloseTo(0.33, 2);
    expect(musicMuteLabel(false)).toBe("Music On");
    expect(musicVolumePercent(musicVolume())).toBe(33);
  });

  it("keeps the boss bed through warning, fight, and lich", () => {
    const warn = cueFrom(play({ bossPending: 1, alive: 400 }), silence());
    const telegraph = cueFrom(play({ bossPending: 2, alive: 0 }), warn);
    const fight = cueFrom(play({ bossOn: 1, bossPending: 0, alive: 400 }), telegraph);
    const lich = cueFrom(play({ lich: true, alive: 400, bossOn: 0, bossPending: 0 }), fight);
    expect(warn.audible && warn.bed).toBe(BED_BOSS);
    expect(telegraph.audible && telegraph.bed).toBe(BED_BOSS);
    expect(fight.audible && fight.bed).toBe(BED_BOSS);
    expect(lich.audible && lich.bed).toBe(BED_BOSS);
    expect(tempoOf(warn)).toBeCloseTo(78.8, 5);
    expect(tempoOf(telegraph)).toBeCloseTo(80.8, 5);
    expect(tempoOf(fight)).toBeCloseTo(82.8, 5);
    expect(tempoOf(lich)).toBe(84);
    expect(tempoOf(cueFrom(play({ phase: PHASE_OVER, bossOn: 1 }), fight))).toBe(0);
  });

  it("holds the horde bed between 36 and 24 and ignores rank", () => {
    const quiet = cueFrom(play({ alive: 35, rank: 8, wave: 1 }), silence());
    expect(quiet.audible && quiet.bed).toBe(BED_WAVE);
    expect(tempoOf(quiet)).toBe(118);
    const entered = cueFrom(play({ alive: 20, toSpawn: 16 }), silence());
    expect(entered.audible && entered.bed).toBe(BED_HORDE);
    expect(tempoOf(entered)).toBeCloseTo(139.2, 5);
    const again = cueFrom(play({ alive: 20, toSpawn: 16 }), entered);
    expect(again).toEqual(entered);
    const held = cueFrom(play({ alive: 24, rank: 8 }), entered);
    const released = cueFrom(play({ alive: 23, rank: 8 }), held);
    expect(held.audible && held.bed).toBe(BED_HORDE);
    expect(released.audible && released.bed).toBe(BED_WAVE);
    const messy = cueFrom({
      phase: PHASE_PLAY, wave: Number.NaN, rank: -4, toSpawn: Number.NaN, alive: -10,
      bossOn: 0, bossPending: 0, lich: false,
    }, silence());
    expect(messy.audible && messy.bed).toBe(BED_WAVE);
    expect(tempoOf(messy)).toBe(96);
    expect(tempoOf(cueFrom(play({ phase: PHASE_TITLE }), silence()))).toBe(68);
  });

  it("names each bed by the first voice of each timbre", () => {
    expect(timbresOf(BED_MENU)).toEqual([TIMBRE_ORGAN, TIMBRE_GEAR, TIMBRE_STEAM]);
    expect(timbresOf(BED_WAVE)).toEqual([TIMBRE_GEAR, TIMBRE_THUMP, TIMBRE_BRASS]);
    expect(timbresOf(BED_HORDE)).toEqual([TIMBRE_GEAR, TIMBRE_THUMP, TIMBRE_BRASS, TIMBRE_ORGAN, TIMBRE_STEAM]);
    expect(timbresOf(BED_BOSS)).toEqual([TIMBRE_GEAR, TIMBRE_THUMP, TIMBRE_ORGAN, TIMBRE_BRASS, TIMBRE_BELL]);
  });

  it("keeps mute and volume 0 from writing the master mute key", () => {
    const store = mem();
    store.setItem(MUTE_KEY, "0");
    setMusicMuted(true);
    setMusicVolume(0);
    persistMusic(store);
    expect(store.getItem(MUTE_KEY)).toBe("0");
    bootMusic(store);
    expect(musicMuted()).toBe(true);
    expect(musicVolume()).toBe(0);
    setMusicMuted(false);
    setMusicVolume(0.4);
    persistMusic(store);
    bootMusic(store);
    expect(musicMuted()).toBe(false);
    expect(musicVolume()).toBe(0.4);
  });

  it("saves music volume without writing the master mute key", () => {
    const fresh = mem();
    setMusicMuted(false);
    setMusicVolume(0.5);
    persistMusic(fresh);
    expect(fresh.getItem(MUTE_KEY)).toBe(null);
    bootMusic(fresh);
    expect(musicMuted()).toBe(false);
    expect(musicVolume()).toBe(0.5);
    expect(musicVolumePercent(musicVolume())).toBe(50);
    setMusicVolume(2);
    expect(musicVolume()).toBe(1);
    setMusicVolume(-1);
    expect(musicVolume()).toBe(0);
    setMusicVolume(Number.NaN);
    expect(musicVolume()).toBe(0.8);
    expect(parseMusicPrefs("0", "").volume).toBe(0.8);
    expect(parseMusicPrefs("1", "0").muted).toBe(true);
    expect(musicMuteLabel(true)).toBe("Music Off");
    bootMusic(null);
    expect(musicMuted()).toBe(false);
    expect(musicVolume()).toBe(0.8);
  });

  it("hard-starts an audible cue when hush left the live bed empty", () => {
    const wave = cueFrom(play(), silence());
    expect(needsHardStart(wave, null)).toBe(true);
    expect(needsHardStart(wave, BED_WAVE)).toBe(false);
    expect(needsHardStart(silence(), null)).toBe(false);
    expect(needsHardStart(wave, BED_HORDE)).toBe(false);
  });
});
