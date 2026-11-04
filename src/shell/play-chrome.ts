import { PHASE_PLAY, type Phase } from "./session";

export function showMenuChrome(phase: Phase): boolean {
  return phase !== PHASE_PLAY;
}
