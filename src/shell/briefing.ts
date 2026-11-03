import { GUIDE_LINES, GUIDE_SKIP, GUIDE_TITLE } from "./guide";
import { QUEST_HEADING } from "./quests";

export interface BriefingUi {
  showGuide(): void;
  hideGuide(): void;
  guideOpen(): boolean;
  setQuests(text: string, visible: boolean): void;
}

export function mountBriefing(onSkip: () => void): BriefingUi {
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
