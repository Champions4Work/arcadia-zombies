import { GUIDE_LINES, GUIDE_SKIP, GUIDE_TITLE } from "./guide";
import { QUEST_HEADING } from "./quests";

const STYLE = `
#guide{position:fixed;inset:0;z-index:8;display:flex;align-items:center;justify-content:center;background:rgba(8,4,16,.62);padding:16px}
#guide[hidden]{display:none}
#guide-card{display:flex;flex-direction:column;gap:12px;width:min(420px,92vw);padding:22px 22px 18px;background:linear-gradient(#4a3418,#1a120c);border:4px solid #f0b03a;border-radius:22px;box-shadow:0 18px 40px rgba(0,0,0,.45),inset 0 0 0 3px #6a4014}
#guide-title{margin:0;font:800 22px/1.2 Inter,Cantarell,sans-serif;color:#fff1c2;text-align:center;letter-spacing:.04em}
#guide-list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px}
#guide-list li{font:600 14px/1.35 Inter,Cantarell,sans-serif;color:#fff1c2}
#guide-list strong{display:block;color:#f0c86a;letter-spacing:.06em;font-size:12px;text-transform:uppercase}
#guide-skip{align-self:center;font:800 16px Inter,Cantarell,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#1c120c;background:linear-gradient(#fff1c2,#f0b03a);border:3px solid #1c120c;border-radius:14px;padding:10px 28px;cursor:pointer}
#quests{margin:0;max-width:min(360px,86vw);font:700 12px/1.4 Inter,Cantarell,sans-serif;color:#fff1c2;letter-spacing:.04em;text-align:center;white-space:pre-line}
#quests[hidden]{display:none}
`;

export interface BriefingUi {
  showGuide(): void;
  hideGuide(): void;
  guideOpen(): boolean;
  setQuests(text: string, visible: boolean): void;
}

export function mountBriefing(onSkip: () => void): BriefingUi {
  const prior = document.getElementById("briefing-style");
  if (!prior) {
    const style = document.createElement("style");
    style.id = "briefing-style";
    style.textContent = STYLE;
    document.head.append(style);
  }
  const guide = document.createElement("div");
  guide.id = "guide";
  guide.hidden = true;
  guide.setAttribute("role", "dialog");
  guide.setAttribute("aria-modal", "true");
  guide.setAttribute("aria-labelledby", "guide-title");
  const card = document.createElement("div");
  card.id = "guide-card";
  const title = document.createElement("h2");
  title.id = "guide-title";
  title.textContent = GUIDE_TITLE;
  const list = document.createElement("ul");
  list.id = "guide-list";
  for (const line of GUIDE_LINES) {
    const li = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = line.title;
    li.append(strong, document.createTextNode(line.body));
    list.append(li);
  }
  const skip = document.createElement("button");
  skip.id = "guide-skip";
  skip.type = "button";
  skip.textContent = GUIDE_SKIP;
  card.append(title, list, skip);
  guide.append(card);
  card.addEventListener("click", (e) => e.stopPropagation());
  skip.addEventListener("click", () => onSkip());
  guide.addEventListener("click", () => onSkip());
  document.body.append(guide);
  const quests = document.createElement("pre");
  quests.id = "quests";
  quests.hidden = true;
  quests.setAttribute("aria-label", QUEST_HEADING);
  const sub = document.getElementById("sub");
  const parent = sub?.parentElement;
  if (parent) parent.insertBefore(quests, sub.nextSibling);
  else document.body.append(quests);
  return {
    showGuide() {
      guide.hidden = false;
      skip.focus();
    },
    hideGuide() {
      guide.hidden = true;
    },
    guideOpen() {
      return !guide.hidden;
    },
    setQuests(text: string, visible: boolean) {
      quests.hidden = !visible;
      quests.textContent = visible ? text : "";
    },
  };
}
