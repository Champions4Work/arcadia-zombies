import {
  KIND_LOADOUT, KIND_YARD, ledgerAction, ledgerLines, type Ledger,
} from "../meta/ledger";
import {
  META_BLURB, META_MAX, META_N, META_NAMES, nextCost, type Workshop,
} from "../meta/workshop";

export function renderBench(root: HTMLElement, shop: Workshop, onBuy: (id: number) => void): void {
  root.replaceChildren();
  for (let i = 0; i < META_N; i++) {
    const row = document.createElement("div");
    row.className = "fit";
    const label = document.createElement("span");
    const name = document.createElement("b");
    const rank = shop.ranks[i] ?? 0;
    const max = META_MAX[i] ?? 0;
    name.textContent = `${META_NAMES[i] ?? ""} ${rank}/${max}`;
    label.append(name, document.createTextNode(`  ${META_BLURB[i] ?? ""}`));
    const btn = document.createElement("button");
    btn.type = "button";
    const cost = nextCost(shop, i);
    if (cost < 0) {
      btn.textContent = "MAXED";
      btn.disabled = true;
    } else {
      btn.textContent = `${cost} SCRAP`;
      btn.disabled = shop.scrap < cost;
    }
    btn.addEventListener("click", () => onBuy(i));
    row.append(label, btn);
    root.append(row);
  }
}

const HEADS = ["LOADOUT", "YARD", "MARK"];

export function renderLedger(
  root: HTMLElement,
  ledger: Ledger,
  onLoadout: (index: number) => void,
  onYard: (index: number) => void,
): void {
  const stale = root.querySelectorAll("[data-ledger]");
  for (let i = 0; i < stale.length; i++) stale[i]?.remove();
  const lines = ledgerLines(ledger);
  let last = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (line.kind !== last) {
      last = line.kind;
      const head = document.createElement("div");
      head.className = "fit";
      head.dataset.ledger = "1";
      const title = document.createElement("b");
      title.textContent = HEADS[line.kind] ?? "";
      head.append(title);
      root.append(head);
    }
    const row = document.createElement("div");
    row.className = "fit";
    row.dataset.ledger = "1";
    const label = document.createElement("span");
    const name = document.createElement("b");
    name.textContent = line.name;
    label.append(name, document.createTextNode(`  ${line.detail}`));
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = ledgerAction(line);
    const pick = line.kind === KIND_LOADOUT ? onLoadout : line.kind === KIND_YARD ? onYard : null;
    if (!pick || !line.owned || line.on) btn.disabled = true;
    else btn.addEventListener("click", () => pick(line.index));
    row.append(label, btn);
    root.append(row);
  }
}
