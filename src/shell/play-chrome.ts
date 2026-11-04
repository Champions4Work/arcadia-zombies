import { PHASE_PLAY, type Phase } from "./session";

export interface PlayChromeHidden {
  mute: boolean;
  sfx: boolean;
}

export function showMenuChrome(phase: Phase): boolean {
  return phase !== PHASE_PLAY;
}

export function playChromeHidden(playing: boolean): PlayChromeHidden {
  return { mute: playing, sfx: playing };
}
