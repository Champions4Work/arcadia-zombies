import { continueRect } from "../render/chestFx";
import { type Fit } from "./fit";
import { currentHud, mapGameBox, offerCards, type Box } from "./hud-layout";

export const FOCUS_CHEST = "chest";
export const FOCUS_OFFER = "offer";
export const FOCUS_OVER = "over";
export const FOCUS_NONE = "none";

export type FocusKind = typeof FOCUS_CHEST | typeof FOCUS_OFFER | typeof FOCUS_OVER | typeof FOCUS_NONE;

export interface FocusView {
  kind: FocusKind;
  offers: number;
  fit: Fit;
  go: HTMLButtonElement | null;
}

export interface PlayFocus {
  root: HTMLElement;
  sync(next: FocusView): void;
  kind(): FocusKind;
}

export function placeBox(el: HTMLElement, box: Box): void {
  el.setAttribute("style", `left:${box.x}px;top:${box.y}px;width:${box.w}px;height:${box.h}px`);
}

function makeBtn(id: string, label: string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.id = id;
  btn.type = "button";
  btn.textContent = label;
  btn.setAttribute("aria-label", label);
  btn.setAttribute("tabindex", "0");
  return btn;
}

function show(el: HTMLElement, on: boolean): void {
  if (on) el.removeAttribute("hidden");
  else el.setAttribute("hidden", "");
}

function grab(el: HTMLElement): void {
  el["focus"]();
}

export function mountPlayFocus(
  host: HTMLElement,
  onPick: (slot: number) => void,
  onContinue: () => void,
): PlayFocus {
  const root = document.createElement("div");
  root.id = "play-focus";
  show(root, false);
  const cont = makeBtn("continue", "CONTINUE");
  cont.addEventListener("click", onContinue);
  const cards: HTMLButtonElement[] = [];
  for (let i = 1; i <= 3; i++) {
    const btn = makeBtn(`offer-${i}`, `Card ${i}`);
    const slot = i;
    btn.addEventListener("click", () => onPick(slot));
    cards.push(btn);
    root.append(btn);
  }
  root.append(cont);
  host.append(root);
  let mode: FocusKind = FOCUS_NONE;
  let armed = "";
  const hideAll = (): void => {
    show(cont, false);
    for (let i = 0; i < cards.length; i++) {
      const btn = cards[i];
      if (btn) show(btn, false);
    }
  };
  return {
    root,
    kind: () => mode,
    sync(next) {
      const prev = mode;
      mode = next.kind;
      if (mode === FOCUS_NONE) {
        show(root, false);
        hideAll();
        armed = "";
        return;
      }
      show(root, true);
      if (prev !== mode) hideAll();
      if (mode === FOCUS_CHEST) {
        const box = mapGameBox(next.fit, continueRect());
        show(cont, true);
        placeBox(cont, box);
        if (armed !== FOCUS_CHEST) {
          armed = FOCUS_CHEST;
          grab(cont);
        }
        return;
      }
      if (mode === FOCUS_OFFER) {
        const hud = currentHud();
        const boxes = hud ? offerCards(hud.view, next.offers) : [];
        const token = `${FOCUS_OFFER}:${next.offers}`;
        for (let i = 0; i < next.offers && i < cards.length; i++) {
          const btn = cards[i];
          const box = boxes[i];
          if (!btn || !box) continue;
          show(btn, true);
          placeBox(btn, box);
        }
        const first = cards[0];
        if (first && armed !== token) {
          armed = token;
          grab(first);
        }
        return;
      }
      if (mode === FOCUS_OVER && next.go && armed !== FOCUS_OVER) {
        armed = FOCUS_OVER;
        grab(next.go);
      }
    },
  };
}

export function playKeyPick(key: string, offers: number): number {
  if (key < "1" || key > "3") return 0;
  const n = key.charCodeAt(0) - 48;
  return n >= 1 && n <= offers ? n : 0;
}
