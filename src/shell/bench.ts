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
