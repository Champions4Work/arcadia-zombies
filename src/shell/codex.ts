import { LEGACY_UNIONS, PASSIVE_IDS, UNIONS, WEAPON_IDS } from "../sim/evolve";
import { Z_ELITE, Z_KIND } from "../sim/foes";
import { upgName } from "../sim/progress";
import { MAX_ZOMBIES, UPG_COUNT, type World } from "../sim/types";
import type { Store } from "./session";

export const CODEX_KEY = "arcadia.codex";
export const FOE_N = 7;

export const FOE_NAMES: readonly string[] = [
  "SHAMBLER",
  "CLOCKWORK GHOUL",
  "BOILER BRUTE",
  "SPITTER",
  "GAS TANK",
  "KNIGHT",
  "RAT-GEAR",
];

export const FOE_NOTES: readonly string[] = [
  "A rotting walker in the yard.",
  "A fast corpse wound with gears.",
  "A heavy boiler that soaks rivets.",
  "Spits acid from a brass nozzle.",
  "Waddles in, then bursts green.",
  "A shield that turns your rivets.",
  "A skittering pack of clock rats.",
];

export interface Codex {
  ups: Uint8Array;
  foes: Uint8Array;
  elite: number;
}

export interface CodexLine {
  section: string;
  title: string;
  detail: string;
  locked: boolean;
}

export function emptyCodex(): Codex {
  return { ups: new Uint8Array(UPG_COUNT), foes: new Uint8Array(FOE_N), elite: 0 };
}

export function loadCodex(store: Store): Codex {
  const book = emptyCodex();
  const raw = store.getItem(CODEX_KEY);
  if (!raw) return book;
  const parts = raw.split(".");
  const ups = parts[0] ?? "";
  const foes = parts[1] ?? "";
  for (let i = 0; i < book.ups.length && i < ups.length; i++) book.ups[i] = ups.charCodeAt(i) === 49 ? 1 : 0;
  for (let i = 0; i < book.foes.length && i < foes.length; i++) book.foes[i] = foes.charCodeAt(i) === 49 ? 1 : 0;
  book.elite = (parts[2] ?? "") === "1" ? 1 : 0;
  return book;
}

export function codexStamp(book: Codex): string {
  let ups = "";
  for (let i = 0; i < book.ups.length; i++) ups += (book.ups[i] ?? 0) > 0 ? "1" : "0";
  let foes = "";
  for (let i = 0; i < book.foes.length; i++) foes += (book.foes[i] ?? 0) > 0 ? "1" : "0";
  return `${ups}.${foes}.${book.elite > 0 ? "1" : "0"}`;
}

export function saveCodex(store: Store, book: Codex): void {
  store.setItem(CODEX_KEY, codexStamp(book));
}

export function observe(book: Codex, w: World): boolean {
  let changed = false;
  for (let i = 0; i < UPG_COUNT; i++) {
    if ((w.upgrades[i] ?? 0) > 0 && (book.ups[i] ?? 0) === 0) {
      book.ups[i] = 1;
      changed = true;
    }
  }
  const z = w.zombies;
  for (let i = 0; i < MAX_ZOMBIES; i++) {
    if (!z.alive[i]) continue;
    const raw = z.kind[i] ?? 0;
    const kind = raw & Z_KIND;
    if (kind >= 0 && kind < book.foes.length && (book.foes[kind] ?? 0) === 0) {
      book.foes[kind] = 1;
      changed = true;
    }
    if ((raw & Z_ELITE) !== 0 && book.elite === 0) {
      book.elite = 1;
      changed = true;
    }
  }
  return changed;
}

export function codexLines(book: Codex): CodexLine[] {
  const out: CodexLine[] = [];
  for (let i = 0; i < WEAPON_IDS.length; i++) {
    const id = WEAPON_IDS[i] ?? 0;
    const known = (book.ups[id] ?? 0) > 0;
    out.push({
      section: "WEAPONS",
      title: upgName(id),
      detail: known ? "Fitted on a run." : "Not yet fitted.",
      locked: !known,
    });
  }
  for (let i = 0; i < PASSIVE_IDS.length; i++) {
    const id = PASSIVE_IDS[i] ?? 0;
    const known = (book.ups[id] ?? 0) > 0;
    out.push({
      section: "PASSIVES",
      title: upgName(id),
      detail: known ? "Fitted on a run." : "Not yet fitted.",
      locked: !known,
    });
  }
  for (let i = 0; i < UNIONS.length; i++) {
    const spec = UNIONS[i];
    if (!spec) continue;
    const known = (book.ups[spec.id] ?? 0) > 0;
    out.push({
      section: "EVOLUTIONS",
      title: known ? upgName(spec.id) : "UNKNOWN UNION",
      detail: known ? `${spec.recipe}. ${spec.effect}` : spec.recipe,
      locked: !known,
    });
  }
  for (let i = 0; i < LEGACY_UNIONS.length; i++) {
    const spec = LEGACY_UNIONS[i];
    if (!spec) continue;
    const known = (book.ups[spec.id] ?? 0) > 0;
    out.push({
      section: "EVOLUTIONS",
      title: known ? upgName(spec.id) : "UNKNOWN UNION",
      detail: known ? `${spec.recipe}. ${spec.effect}` : spec.recipe,
      locked: !known,
    });
  }
  for (let i = 0; i < FOE_N; i++) {
    const known = (book.foes[i] ?? 0) > 0;
    out.push({
      section: "ENEMIES",
      title: known ? (FOE_NAMES[i] ?? "FOE") : "UNSEEN FOE",
      detail: known ? (FOE_NOTES[i] ?? "") : "Not yet met.",
      locked: !known,
    });
  }
  out.push({
    section: "ENEMIES",
    title: book.elite > 0 ? "ELITE" : "UNSEEN FOE",
    detail: book.elite > 0 ? "A gilded, tougher version of a foe." : "Not yet met.",
    locked: book.elite === 0,
  });
  return out;
}

export function renderBook(el: HTMLElement, book: Codex): void {
  el.replaceChildren();
  const lines = codexLines(book);
  let section = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (line.section !== section) {
      section = line.section;
      const h = document.createElement("h2");
      h.textContent = section;
      el.appendChild(h);
    }
    const p = document.createElement("p");
    p.textContent = `${line.title} — ${line.detail}`;
    if (line.locked) p.className = "lock";
    el.appendChild(p);
  }
}
