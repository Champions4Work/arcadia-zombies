import { type ResultBadge, type ResultCard, type ResultStat, type RunResult } from "./results";

export interface ResultsUi {
  show(result: RunResult): void;
  hide(): void;
  visible(): boolean;
  onCopy(fn: () => void): void;
}

export function mountResults(panel: HTMLElement): ResultsUi {
  const root = document.createElement("div");
  root.id = "results";
  root.hidden = true;
  const banner = document.createElement("div");
  banner.className = "result-banner";
  const headline = document.createElement("h2");
  headline.id = "result-head";
  const cause = document.createElement("p");
  cause.id = "result-cause";
  const lived = document.createElement("p");
  lived.id = "result-time";
  banner.append(headline, cause, lived);
  const stats = document.createElement("div");
  stats.id = "result-stats";
  const build = document.createElement("div");
  build.id = "result-build";
  const seals = document.createElement("div");
  seals.id = "result-seals";
  const go = document.getElementById("go");
  const copy = document.createElement("button");
  copy.id = "run-copy";
  copy.type = "button";
  copy.textContent = "Copy run log";
  root.append(banner, stats, build, copy, seals);
  const roster = document.getElementById("roster");
  if (roster && roster.parentElement === panel) panel.insertBefore(root, roster);
  else panel.append(root);
  let open = false;
  const parkGo = (): void => {
    if (!go) return;
    const after = root.nextSibling;
    if (go.parentElement !== panel) panel.insertBefore(go, after);
  };
  return {
    show(result) {
      open = true;
      root.hidden = false;
      root.classList.toggle("win", result.won);
      root.classList.toggle("fall", !result.won);
      headline.textContent = result.headline;
      cause.textContent = result.cause;
      lived.textContent = `Survived ${result.time}`;
      fillStats(stats, result.stats);
      fillCards(build, result.cards);
      fillSeals(seals, result.badges);
      if (go) root.insertBefore(go, build);
    },
    hide() {
      open = false;
      parkGo();
      root.hidden = true;
      headline.textContent = "";
      cause.textContent = "";
      lived.textContent = "";
      stats.replaceChildren();
      build.replaceChildren();
      seals.replaceChildren();
    },
    visible: () => open,
    onCopy(fn) {
      copy.onclick = fn;
    },
  };
}

function fillStats(host: HTMLElement, rows: readonly ResultStat[]): void {
  host.replaceChildren();
  for (const row of rows) {
    const item = document.createElement("div");
    item.className = "result-stat";
    item.style.setProperty("--d", `${row.delay}ms`);
    item.dataset.id = row.id;
    const label = document.createElement("span");
    label.className = "result-stat-label";
    label.textContent = row.label;
    const value = document.createElement("span");
    value.className = "result-stat-value";
    value.textContent = row.value;
    item.append(label, value);
    host.append(item);
  }
}

function fillCards(host: HTMLElement, cards: readonly ResultCard[]): void {
  host.replaceChildren();
  if (cards.length === 0) {
    const empty = document.createElement("p");
    empty.className = "result-empty";
    empty.textContent = "No gears forged";
    host.append(empty);
    return;
  }
  for (const card of cards) {
    const item = document.createElement("div");
    item.className = "result-card";
    item.dataset.id = String(card.id);
    const icon = document.createElement("span");
    icon.className = "result-card-icon";
    icon.textContent = card.name.slice(0, 1);
    const name = document.createElement("span");
    name.className = "result-card-name";
    name.textContent = card.name;
    const lv = document.createElement("span");
    lv.className = "result-card-lv";
    lv.textContent = `LV ${card.level}`;
    item.append(icon, name, lv);
    host.append(item);
  }
}

function fillSeals(host: HTMLElement, badges: readonly ResultBadge[]): void {
  host.replaceChildren();
  for (const badge of badges) {
    const item = document.createElement("div");
    item.className = badge.on ? "result-seal on" : "result-seal";
    item.dataset.id = badge.id;
    const icon = document.createElement("span");
    icon.className = "result-seal-icon";
    icon.textContent = badge.on ? "⚙" : "○";
    const name = document.createElement("span");
    name.className = "result-seal-name";
    name.textContent = badge.name;
    const prog = document.createElement("span");
    prog.className = "result-seal-prog";
    prog.textContent = badge.progress;
    item.append(icon, name, prog);
    host.append(item);
  }
}
