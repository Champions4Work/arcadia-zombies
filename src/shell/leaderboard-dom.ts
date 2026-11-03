import type { BoardView } from "./leaderboard";
import { PHASE_OVER, PHASE_TITLE, type Phase } from "./session";

const STYLE = `
#lb-line,#lb-status,#lb-board-status{margin:0;max-width:min(36rem,100%);font:14px/1.45 monospace;color:#e6c27a;letter-spacing:.04em;text-align:center;overflow-wrap:anywhere}
#lb-status,#lb-board-status{font-size:12px;color:#e8c878}
#lb-actions,#lb-board-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
#lb-open,#lb-share,#lb-back,#lb-share-top{font:700 14px/1 monospace;letter-spacing:.14em;text-transform:uppercase;color:#c8963e;background:rgba(18,12,8,.72);border:2px solid #c8963e;padding:10px 14px;cursor:pointer}
#lb-open:hover,#lb-share:hover,#lb-back:hover,#lb-share-top:hover{background:#c8963e;color:#120c08}
#panel.lb-open{max-height:90vh;overflow:hidden;box-sizing:border-box}
#panel.lb-open>:not(#lb-board){display:none}
#lb-board{width:min(440px,86vw);max-height:calc(90vh - 72px);overflow:auto;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:10px;padding:4px 4px 12px}
#lb-board[hidden]{display:none}
#lb-board h2{margin:0;font:700 22px Palatino,Georgia,serif;color:#c8963e;letter-spacing:.04em;text-align:center}
#lb-life{margin:0;font:13px/1.4 monospace;color:#e6c27a;text-align:center}
#lb-cols{margin:0;font:11px/1.3 monospace;letter-spacing:.08em;text-transform:uppercase;color:#c8963e;text-align:center}
#lb-ranks,#lb-achs{list-style:none;margin:0;padding:0;width:100%}
#lb-ranks li{padding:6px 8px;border:1px solid rgba(200,150,62,.35);background:rgba(200,150,62,.08);font:12px/1.35 monospace;text-align:left;color:#e6c27a}
#lb-ranks li+li{margin-top:4px}
#lb-ranks li.empty{text-align:center}
#lb-ranks li div:first-child{font-weight:700;color:#e8c878}
#lb-ranks li div:last-child{color:#e6c27a}
#lb-achs li{padding:2px 0;font:12px/1.35 monospace;color:#c4a574;text-align:left}
#lb-achs li.on{color:#e8c878}
#lb-toasts{position:fixed;z-index:6;top:max(56px,calc(env(safe-area-inset-top) + 48px));left:50%;transform:translateX(-50%);display:flex;flex-direction:column;gap:8px;width:min(420px,92vw);pointer-events:none}
.lb-toast{font:700 13px/1.35 monospace;text-align:center;color:#120c08;background:#e8c878;border:2px solid #c8963e;padding:8px 12px;animation:lb-in .18s ease-out}
@keyframes lb-in{from{transform:translateY(-6px);opacity:0}to{transform:none;opacity:1}}
`;

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
  ensureStyle();
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
  cols.textContent = "Score · Time · Tier · Kills · Build";
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

function ensureStyle(): void {
  let style = document.getElementById("lb-style");
  if (!style) {
    style = document.createElement("style");
    style.id = "lb-style";
    document.head.append(style);
  }
  style.textContent = STYLE;
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
