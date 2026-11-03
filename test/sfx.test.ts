import { applyUpgrade, sawAngle, sawRadius, takeXp, xpNeed } from "../src/sim/progress";
import { step } from "../src/sim/step.hot";
import {
  EV_HURT, EV_KILL, EV_LEVEL, EV_RANK, EV_SAW, EV_SHIELD, EV_SHOT, EV_TESLA, FX_SPARK,
  UPG_PIERCE, UPG_SAWS, UPG_SHIELD, UPG_SHOTGUN, UPG_TESLA, type Input, type World,
} from "../src/sim/types";
import { createWorld } from "../src/sim/world";
import { isMuted, setMuted } from "../src/render/sound";
import {
  bootSfx, playSfxCue, playWorldSfx, readSfxPrefs, resetSfxPlayback, setSfxMuted, setSfxVolume,
  sfxMuted, sfxVolume, type SfxSink,
} from "../src/render/sfx";
import {
  admitCue, clampSfxVolume, CUE_BOSS, CUE_CLICK, CUE_DEATH, CUE_HIT, CUE_HURT, CUE_LEVEL,
  CUE_N, CUE_PICK, CUE_RANK, CUE_RIFLE, CUE_RIVET, CUE_SAW, CUE_SHIELD, CUE_SHOTGUN, CUE_TESLA,
  cueBase, cueDur, cueGap, createSfxGate, isBossWave, loadSfxPrefs, mixGain,
  saveSfxPrefs, SFX_MUTE_KEY, SFX_VOL_DEFAULT, SFX_VOL_KEY, sfxMuteLabel,
  sfxVolumePercent, shotCue, VOICE_CAP, voicesAt,
} from "../src/render/sfx-cues";
import { MUTE_KEY } from "../src/shell/session";

const idle = (pick = 0): Input => ({ dx: 0, dy: 0, pick });

const mem = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k) ?? null : null),
    setItem: (k: string, v: string) => { m.set(k, v); },
  };
};

const quiet = (w: World): void => {
  w.zombies.alive.fill(0);
  w.toSpawn = 0;
  w.spawnCd = 99999;
  w.fireCd = 99999;
  w.hurtCd = 99999;
};

beforeEach(() => {
  resetSfxPlayback();
  setSfxMuted(false);
  setSfxVolume(SFX_VOL_DEFAULT);
  setMuted(false);
});

describe("sfx settings", () => {
  it("clamps volume and labels the menu toggle", () => {
    expect(clampSfxVolume(Number.NaN)).toBe(SFX_VOL_DEFAULT);
    expect(clampSfxVolume(Number.POSITIVE_INFINITY)).toBe(SFX_VOL_DEFAULT);
    expect(clampSfxVolume(-0.2)).toBe(0);
    expect(clampSfxVolume(4)).toBe(1);
    expect(sfxVolumePercent(0.8)).toBe(80);
    expect(sfxVolumePercent(0)).toBe(0);
    expect(sfxVolumePercent(1)).toBe(100);
    expect(sfxMuteLabel(false)).toBe("SFX On");
    expect(sfxMuteLabel(true)).toBe("SFX Off");
  });

  it("saves sfx mute and volume apart from the master mute", () => {
    const store = mem();
    store.setItem(MUTE_KEY, "0");
    saveSfxPrefs(store, { muted: true, volume: 1 / 3 });
    expect(store.getItem(MUTE_KEY)).toBe("0");
    expect(store.getItem(SFX_MUTE_KEY)).toBe("1");
    expect(loadSfxPrefs(store)).toEqual({ muted: true, volume: 0.33 });
    store.setItem(SFX_VOL_KEY, "nope");
    expect(loadSfxPrefs(store).volume).toBe(SFX_VOL_DEFAULT);
    store.setItem(SFX_VOL_KEY, "");
    expect(loadSfxPrefs(store).volume).toBe(SFX_VOL_DEFAULT);
    store.setItem(SFX_VOL_KEY, "2");
    expect(loadSfxPrefs(store).volume).toBe(1);
    store.setItem(SFX_VOL_KEY, "-1");
    expect(loadSfxPrefs(store).volume).toBe(0);
    store.setItem(SFX_MUTE_KEY, "true");
    expect(loadSfxPrefs(store).muted).toBe(false);
    store.setItem(SFX_MUTE_KEY, "1");
    expect(loadSfxPrefs(store).muted).toBe(true);
    expect(SFX_MUTE_KEY).not.toBe(MUTE_KEY);
  });

  it("boots from local storage without touching the master mute", () => {
    const store = mem();
    saveSfxPrefs(store, { muted: true, volume: 0.25 });
    bootSfx(store);
    expect(sfxMuted()).toBe(true);
    expect(sfxVolume()).toBe(0.25);
    expect(isMuted()).toBe(false);
    expect(readSfxPrefs()).toEqual({ muted: true, volume: 0.25 });
  });
});

describe("difficulty voices", () => {
  it("marks every fifth wave a boss", () => {
    expect(isBossWave(0)).toBe(false);
    expect(isBossWave(4)).toBe(false);
    expect(isBossWave(5)).toBe(true);
    expect(isBossWave(10)).toBe(true);
    expect(isBossWave(15)).toBe(true);
    expect(isBossWave(16)).toBe(false);
  });

  it("maps the equipped weapon onto a shot voice", () => {
    const w = createWorld(1);
    expect(shotCue(w)).toBe(CUE_RIFLE);
    w.upgrades[UPG_PIERCE] = 2;
    expect(shotCue(w)).toBe(CUE_RIVET);
    w.upgrades[UPG_SHOTGUN] = 1;
    expect(shotCue(w)).toBe(CUE_SHOTGUN);
  });
});

describe("rate limit", () => {
  it("gives every cue a gap, a duration, and a sub-unity gain", () => {
    let sum = 0;
    for (let id = 0; id < CUE_N; id++) {
      expect(cueGap(id)).toBeGreaterThan(0);
      expect(cueDur(id)).toBeGreaterThan(0);
      expect(cueBase(id)).toBeGreaterThan(0);
      expect(cueBase(id)).toBeLessThanOrEqual(0.08);
      sum += mixGain(cueBase(id), id);
    }
    expect(mixGain(0.08, 0)).toBeLessThanOrEqual(0.08);
    expect(mixGain(0.08, 4)).toBeLessThan(mixGain(0.08, 0));
    expect(sum).toBeLessThan(1);
  });

  it("drops repeats inside the gap and extras past the voice cap", () => {
    const gate = createSfxGate();
    expect(admitCue(gate, CUE_HIT, 0, 0.05)).toBe(true);
    expect(admitCue(gate, CUE_HIT, cueGap(CUE_HIT) * 0.5, 0.05)).toBe(false);
    expect(admitCue(gate, CUE_HIT, cueGap(CUE_HIT), 0.05)).toBe(true);
    const packed = createSfxGate();
    let admitted = 0;
    for (let id = 0; id < VOICE_CAP; id++) if (admitCue(packed, id, 5, 1)) admitted++;
    expect(admitted).toBe(VOICE_CAP);
    expect(voicesAt(packed, 5)).toBe(VOICE_CAP);
    expect(admitCue(packed, CUE_LEVEL, 5, 1)).toBe(false);
    expect(admitCue(packed, CUE_CLICK, 5.05, 0.2)).toBe(false);
    expect(admitCue(packed, CUE_CLICK, 7, 0.2)).toBe(true);
  });

  it("lets the siren, rank horn, and power-up pick preempt a full voice cap", () => {
    const gate = createSfxGate();
    for (let id = 0; id < VOICE_CAP; id++) expect(admitCue(gate, id, 2, 4)).toBe(true);
    expect(admitCue(gate, CUE_HIT, 2, 1)).toBe(false);
    expect(admitCue(gate, CUE_BOSS, 2, 0.72)).toBe(true);
    expect(admitCue(gate, CUE_RANK, 2, 0.42)).toBe(true);
    expect(admitCue(gate, CUE_PICK, 2, 0.16)).toBe(true);
    expect(voicesAt(gate, 2)).toBe(VOICE_CAP);
    expect(Array.from(gate.owner)).toEqual(expect.arrayContaining([CUE_BOSS, CUE_RANK, CUE_PICK]));
    expect(admitCue(gate, CUE_CLICK, 2, 0.03)).toBe(false);
  });

  it("keeps a horde from retriggering hits, deaths, and shots every frame", () => {
    const w = createWorld(4);
    w.wave = 3;
    w.tick = 2;
    w.fxKind[0] = FX_SPARK;
    w.fxTick[0] = w.tick;
    const heard: number[] = [];
    let t = 0;
    const sink: SfxSink = { now: () => t, play: (id) => { heard.push(id); } };
    const frames = 180;
    for (let i = 0; i < frames; i++) {
      t = i / 60;
      w.events.fill(0);
      w.events[EV_SHOT] = 1;
      w.events[EV_KILL] = 1;
      playWorldSfx(w, sink);
    }
    const shots = heard.filter((id) => id === CUE_RIFLE).length;
    const deaths = heard.filter((id) => id === CUE_DEATH).length;
    const hits = heard.filter((id) => id === CUE_HIT).length;
    expect(shots).toBeGreaterThan(40);
    expect(deaths).toBeGreaterThan(15);
    expect(hits).toBeGreaterThan(20);
    expect(shots).toBeLessThan(100);
    expect(deaths).toBeLessThan(40);
    expect(hits).toBeLessThan(60);
    expect(heard.length).toBeLessThan(frames);
  });
});

describe("world cues", () => {
  const heard: number[] = [];
  const vols: number[] = [];
  let t = 0;
  const sink: SfxSink = {
    now: () => t,
    play: (id, _when, vol) => {
      heard.push(id);
      vols.push(vol);
    },
  };

  beforeEach(() => {
    heard.length = 0;
    vols.length = 0;
    t = 0;
  });

  it("horns on a rank change and sirens once on a boss wave", () => {
    const w = createWorld(8);
    w.hp = 9999;
    w.maxHp = 9999;
    for (let i = 0; i < 5; i++) {
      quiet(w);
      step(w, idle());
      t += 3;
      playWorldSfx(w, sink);
    }
    expect(w.wave).toBe(5);
    expect(w.tick).toBe(5);
    expect(heard.filter((id) => id === CUE_RANK)).toHaveLength(0);
    expect(heard.filter((id) => id === CUE_BOSS)).toEqual([CUE_BOSS]);
    t += 3;
    playWorldSfx(w, sink);
    expect(heard.filter((id) => id === CUE_BOSS)).toEqual([CUE_BOSS]);
    while (w.tick < 1799) step(w, idle());
    t += 3;
    playWorldSfx(w, sink);
    expect(w.wave).toBe(5);
    expect(w.rank).toBe(0);
    expect(heard.filter((id) => id === CUE_RANK)).toHaveLength(0);
    step(w, idle());
    expect(w.tick).toBe(1800);
    expect(w.rank).toBe(1);
    expect(w.events[EV_RANK]).toBe(1);
    t += 3;
    playWorldSfx(w, sink);
    expect(heard.filter((id) => id === CUE_RANK)).toEqual([CUE_RANK]);
    step(w, idle());
    t += 3;
    playWorldSfx(w, sink);
    expect(heard.filter((id) => id === CUE_RANK)).toEqual([CUE_RANK]);
    expect(heard.filter((id) => id === CUE_BOSS)).toEqual([CUE_BOSS]);
  });

  it("uses a different shot voice for the rifle, rivet, and shotgun", () => {
    const shoot = (arm: number | null): number[] => {
      resetSfxPlayback();
      heard.length = 0;
      t += 1;
      const w = createWorld(9);
      quiet(w);
      w.fireCd = 0;
      if (arm !== null) applyUpgrade(w, arm);
      w.zombies.alive[0] = 1;
      w.zombies.hp[0] = 1;
      w.zombies.x[0] = w.px + 12;
      w.zombies.y[0] = w.py;
      step(w, idle());
      playWorldSfx(w, sink);
      return heard.filter((id) => id === CUE_RIFLE || id === CUE_RIVET || id === CUE_SHOTGUN);
    };
    expect(shoot(null)).toEqual([CUE_RIFLE]);
    expect(shoot(UPG_PIERCE)).toEqual([CUE_RIVET]);
    expect(shoot(UPG_SHOTGUN)).toEqual([CUE_SHOTGUN]);
  });

  it("speaks tesla cracks, saw bites, hits, and deaths from the sim", () => {
    const zap = createWorld(11);
    quiet(zap);
    applyUpgrade(zap, UPG_TESLA);
    applyUpgrade(zap, UPG_TESLA);
    zap.teslaCd = 1;
    zap.zombies.alive[0] = 1;
    zap.zombies.hp[0] = 6;
    zap.zombies.x[0] = zap.px + 20;
    zap.zombies.y[0] = zap.py;
    step(zap, idle());
    t = 1;
    playWorldSfx(zap, sink);
    expect(zap.events[EV_TESLA]).toBe(1);
    expect(heard).toContain(CUE_TESLA);
    expect(heard).toContain(CUE_HIT);
    expect(heard).not.toContain(CUE_DEATH);

    const saw = createWorld(13);
    quiet(saw);
    applyUpgrade(saw, UPG_SAWS);
    saw.tick = 3;
    const angle = sawAngle(4, 0, 1);
    const radius = sawRadius(saw);
    saw.zombies.alive[0] = 1;
    saw.zombies.hp[0] = 3;
    saw.zombies.x[0] = saw.px + Math.cos(angle) * radius;
    saw.zombies.y[0] = saw.py + Math.sin(angle) * radius;
    step(saw, idle());
    t = 2;
    const before = heard.length;
    playWorldSfx(saw, sink);
    const sawHeard = heard.slice(before);
    expect(saw.events[EV_SAW]).toBe(1);
    expect(sawHeard).toContain(CUE_SAW);
    expect(sawHeard).not.toContain(CUE_HIT);

    const slain = createWorld(15);
    quiet(slain);
    applyUpgrade(slain, UPG_SAWS);
    slain.tick = 3;
    const killAngle = sawAngle(4, 0, 1);
    const killRadius = sawRadius(slain);
    slain.zombies.alive[0] = 1;
    slain.zombies.hp[0] = 1;
    slain.zombies.x[0] = slain.px + Math.cos(killAngle) * killRadius;
    slain.zombies.y[0] = slain.py + Math.sin(killAngle) * killRadius;
    step(slain, idle());
    t = 2.5;
    const slainBefore = heard.length;
    playWorldSfx(slain, sink);
    const slainHeard = heard.slice(slainBefore);
    expect(slain.zombies.alive[0]).toBe(0);
    expect(slain.events[EV_SAW]).toBe(1);
    expect(slain.events[EV_KILL]).toBe(1);
    expect(slainHeard).toContain(CUE_SAW);
    expect(slainHeard).not.toContain(CUE_HIT);

    const kill = createWorld(14);
    quiet(kill);
    kill.fireCd = 0;
    kill.zombies.alive[0] = 1;
    kill.zombies.hp[0] = 1;
    kill.zombies.x[0] = kill.px + 12;
    kill.zombies.y[0] = kill.py;
    step(kill, idle());
    t = 3;
    playWorldSfx(kill, sink);
    expect(kill.events[EV_KILL]).toBe(1);
    expect(heard).toContain(CUE_DEATH);
    expect(heard).toContain(CUE_HIT);
    expect(heard).toContain(CUE_RIFLE);
  });

  it("chimes a level and picks a power-up without firing the rank horn", () => {
    const w = createWorld(3);
    playWorldSfx(w, sink);
    t = 1;
    takeXp(w, xpNeed(0));
    playWorldSfx(w, sink);
    expect(w.choosing).toBe(1);
    expect(w.events[EV_LEVEL]).toBe(1);
    expect(heard).toContain(CUE_LEVEL);
    expect(heard).not.toContain(CUE_PICK);
    t = 2;
    step(w, idle(1));
    playWorldSfx(w, sink);
    expect(w.choosing).toBe(0);
    expect(heard).toContain(CUE_PICK);
    expect(heard).not.toContain(CUE_RANK);
  });

  it("thuds on a hit and pings when the boiler shield catches it", () => {
    const hurt = createWorld(2);
    quiet(hurt);
    hurt.hurtCd = 0;
    hurt.zombies.alive[0] = 1;
    hurt.zombies.x[0] = hurt.px;
    hurt.zombies.y[0] = hurt.py;
    step(hurt, idle());
    t = 1;
    playWorldSfx(hurt, sink);
    expect(hurt.events[EV_HURT]).toBe(1);
    expect(heard).toContain(CUE_HURT);
    expect(heard).not.toContain(CUE_SHIELD);

    const blocked = createWorld(6);
    quiet(blocked);
    applyUpgrade(blocked, UPG_SHIELD);
    blocked.hurtCd = 0;
    blocked.zombies.alive[0] = 1;
    blocked.zombies.x[0] = blocked.px;
    blocked.zombies.y[0] = blocked.py;
    step(blocked, idle());
    t = 2;
    playWorldSfx(blocked, sink);
    expect(blocked.events[EV_SHIELD]).toBe(1);
    expect(heard).toContain(CUE_SHIELD);
    expect(heard.filter((id) => id === CUE_HURT)).toHaveLength(1);
  });

  it("keeps the loudest stack inside the voice cap and under unity gain", () => {
    const w = createWorld(1);
    w.wave = 1;
    w.choosing = 1;
    playWorldSfx(w, sink);
    heard.length = 0;
    vols.length = 0;
    w.wave = 5;
    w.choosing = 0;
    w.events[EV_RANK] = 1;
    w.events[EV_LEVEL] = 1;
    w.events[EV_HURT] = 1;
    w.events[EV_SHOT] = 1;
    w.events[EV_TESLA] = 1;
    w.events[EV_SHIELD] = 1;
    w.events[EV_KILL] = 1;
    w.upgrades[UPG_SHOTGUN] = 1;
    w.events[EV_SAW] = 1;
    w.fxKind[0] = FX_SPARK;
    w.fxTick[0] = w.tick;
    t = 4;
    playWorldSfx(w, sink);
    expect(heard).toEqual([
      CUE_BOSS, CUE_RANK, CUE_PICK, CUE_LEVEL, CUE_HURT, CUE_SHOTGUN, CUE_TESLA, CUE_SHIELD,
    ]);
    expect(heard).toHaveLength(VOICE_CAP);
    expect(vols[vols.length - 1] ?? 1).toBeLessThan(vols[0] ?? 0);
    expect(vols.reduce((sum, vol) => sum + vol, 0)).toBeLessThan(1);
  });

  it("still plays a boss siren, rank horn, and pick when every voice is busy", () => {
    const w = createWorld(1);
    w.wave = 1;
    w.choosing = 1;
    t = 3;
    playWorldSfx(w, sink);
    heard.length = 0;
    for (let id = 0; id < VOICE_CAP; id++) expect(playSfxCue(id, sink)).toBe(true);
    w.wave = 5;
    w.choosing = 0;
    w.events[EV_RANK] = 1;
    playWorldSfx(w, sink);
    expect(heard).toContain(CUE_BOSS);
    expect(heard).toContain(CUE_RANK);
    expect(heard).toContain(CUE_PICK);
    const bosses = heard.filter((id) => id === CUE_BOSS).length;
    playWorldSfx(w, sink);
    expect(heard.filter((id) => id === CUE_BOSS)).toHaveLength(bosses);
  });

  it("drops sound while sfx or master mute is on and does not replay a passed siren", () => {
    const w = createWorld(1);
    w.wave = 4;
    t = 1;
    playWorldSfx(w, sink);
    setSfxMuted(true);
    expect(isMuted()).toBe(false);
    w.wave = 5;
    w.events[EV_HURT] = 1;
    t = 2;
    playWorldSfx(w, sink);
    expect(heard).toEqual([]);
    setSfxMuted(false);
    setSfxVolume(0);
    t = 3;
    playWorldSfx(w, sink);
    expect(heard).toEqual([]);
    setSfxVolume(0.8);
    setMuted(true);
    expect(sfxMuted()).toBe(false);
    t = 4;
    playWorldSfx(w, sink);
    expect(heard).toEqual([]);
    setMuted(false);
    t = 5;
    playWorldSfx(w, sink);
    expect(heard).not.toContain(CUE_BOSS);
    expect(playSfxCue(CUE_CLICK, sink)).toBe(true);
    expect(playSfxCue(CUE_CLICK, sink)).toBe(false);
    t += 1;
    expect(playSfxCue(CUE_CLICK, sink)).toBe(true);
  });

  it("does not throw when the audio device is still locked", () => {
    const w = createWorld(1);
    w.events[EV_SHOT] = 1;
    expect(() => playWorldSfx(w)).not.toThrow();
    expect(playSfxCue(CUE_CLICK)).toBe(false);
  });
});
