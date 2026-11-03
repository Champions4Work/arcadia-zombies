import type { BoardView } from "./leaderboard";
import { PHASE_OVER, PHASE_TITLE, type Phase } from "./session";

export interface LeaderChrome {
  phase: Phase;
  line: string;
  share: string | null;
}

export interface LeaderUi {
  sync(chrome: LeaderChrome): void;
  close(): void;
  isOpen(): boolean;
  toast(messages: readonly string[]): void;
}

export function mountLeaderboard(panel: HTMLElement, present: () => BoardView): LeaderUi {
  const line = el("p", "lb-line");
  line.hidden = true;
  const actions = el("div", "lb-actions");
  const openBtn = button("lb-open", "Leaderboard");
  openBtn.setAttribute("aria-expanded", "false");
  openBtn.setAttribute("aria-controls", "lb-board");
  const shareBtn = button("lb-share", "Share");
  shareBtn.hidden = true;
  const status = el("p", "lb-status");
  status.hidden = true;
  actions.append(openBtn, shareBtn);
  const board = el("div", "lb-board");
  board.hidden = true;
  board.setAttribute("role", "region");
  board.setAttribute("aria-label", "Leaderboard");
  const life = el("p", "lb-life");
  const cols = el("p", "lb-cols");
  cols.textContent = "Score · Time · Tier · Kills · Build · Survivor";
  const ranks = el("ol", "lb-ranks");
  const achHead = el("h2", "");
  achHead.textContent = "Achievements";
  const achs = el("ul", "lb-achs");
  const boardActions = el("div", "lb-board-actions");
  const back = button("lb-back", "Back");
  const shareTop = button("lb-share-top", "Share");
  shareTop.hidden = true;
  const boardStatus = el("p", "lb-board-status");
  boardStatus.hidden = true;
  boardActions.append(back, shareTop);
  const title = el("h2", "");
  title.textContent = "Leaderboard";
  board.append(title, boardActions, boardStatus, life, cols, ranks, achHead, achs);
  const go = document.getElementById("go");
  if (go && go.parentElement === panel) panel.insertBefore(line, go);
  else panel.append(line);
  panel.append(actions, status, board);
  const toasts = el("div", "lb-toasts");
  toasts.setAttribute("aria-live", "polite");
  document.body.append(toasts);
  let openFlag = false;
  let chrome: LeaderChrome = { phase: PHASE_TITLE, line: "", share: null };
  let topShare: string | null = null;
  const render = (view: BoardView): void => {
    life.textContent = view.life;
    ranks.replaceChildren();
    if (view.empty) {
      const item = document.createElement("li");
      item.className = "empty";
      item.textContent = "No runs yet";
      ranks.append(item);
    } else {
      for (const row of view.rows) {
        const item = document.createElement("li");
        const head = document.createElement("div");
        head.textContent = row.title;
        const detail = document.createElement("div");
        detail.textContent = row.detail;
        item.append(head, detail);
        ranks.append(item);
      }
    }
    achs.replaceChildren();
    for (const a of view.achievements) {
      const item = document.createElement("li");
      item.textContent = a.line;
      if (a.on) item.className = "on";
      achs.append(item);
    }
    topShare = view.empty ? null : view.rows[0]?.share ?? null;
    shareTop.hidden = !topShare;
  };
  const apply = (): void => {
    const menu = !openFlag && (chrome.phase === PHASE_TITLE || chrome.phase === PHASE_OVER);
    openBtn.hidden = !menu;
    shareBtn.hidden = openFlag || chrome.phase !== PHASE_OVER || !chrome.share;
    actions.hidden = openBtn.hidden && shareBtn.hidden;
    line.hidden = openFlag || chrome.phase !== PHASE_OVER || !chrome.line;
    line.textContent = chrome.line;
    openBtn.setAttribute("aria-expanded", openFlag ? "true" : "false");
  };
  const shut = (focus: boolean): void => {
    const was = openFlag;
    openFlag = false;
    board.hidden = true;
    panel.classList.remove("lb-open");
    status.textContent = "";
    boardStatus.textContent = "";
    status.hidden = true;
    boardStatus.hidden = true;
    apply();
    if (focus && was) openBtn.focus();
  };
  openBtn.addEventListener("click", () => {
    render(present());
    openFlag = true;
    board.hidden = false;
    panel.classList.add("lb-open");
    apply();
    back.focus();
  });
  const showStatus = (message: string): void => {
    status.textContent = message;
    boardStatus.textContent = message;
    status.hidden = !message || openFlag;
    boardStatus.hidden = !message || !openFlag;
  };
  back.addEventListener("click", () => shut(true));
  shareBtn.addEventListener("click", () => flashShare(shareBtn, chrome.share, showStatus));
  shareTop.addEventListener("click", () => flashShare(shareTop, topShare, showStatus));
  const veil = document.getElementById("veil");
  veil?.addEventListener("pointerdown", (e) => {
    if (!openFlag || e.target !== veil) return;
    shut(true);
  });
  return {
    sync(next) {
      chrome = next;
      if (openFlag && next.phase !== PHASE_TITLE && next.phase !== PHASE_OVER) shut(false);
      else apply();
    },
    close() { shut(false); },
    isOpen: () => openFlag,
    toast(messages) { pushToasts(toasts, messages); },
  };
}

function pushToasts(host: HTMLElement, messages: readonly string[]): void {
  for (const text of messages) {
    if (!text) continue;
    const node = document.createElement("div");
    node.className = "lb-toast";
    node.textContent = text;
    host.append(node);
    window.setTimeout(() => node.remove(), 6500);
  }
}

function flashShare(btn: HTMLButtonElement, text: string | null, showStatus: (message: string) => void): void {
  if (!text) return;
  let settled = false;
  const finish = (ok: boolean): void => {
    if (settled) return;
    settled = true;
    btn.textContent = ok ? "Copied" : "Failed";
    showStatus(ok ? text : "Copy failed");
    window.setTimeout(() => {
      if (btn.textContent === "Copied" || btn.textContent === "Failed") btn.textContent = "Share";
    }, 4000);
  };
  if (fallbackCopy(text)) {
    finish(true);
    return;
  }
  const clip = typeof navigator === "undefined" ? undefined : navigator.clipboard;
  if (!clip || typeof clip.writeText !== "function") {
    finish(false);
    return;
  }
  void clip.writeText(text).then(() => finish(true), () => finish(false));
  window.setTimeout(() => finish(false), 800);
}

function fallbackCopy(text: string): boolean {
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, area.value.length);
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, id: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (id) node.id = id;
  return node;
}

function button(id: string, label: string): HTMLButtonElement {
  const node = el("button", id);
  node.type = "button";
  node.textContent = label;
  return node;
}
