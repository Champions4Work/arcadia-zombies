import { expect, test, type Page } from "@playwright/test";

const AUDIO_NOISE = /AudioContext|autoplay|NotAllowedError|user gesture|not allowed to start|play\(\) request|no supported source/i;

function collectPageFaults(page: Page): string[] {
  const faults: string[] = [];
  page.on("pageerror", (err) => {
    const text = err.message;
    if (!AUDIO_NOISE.test(text)) faults.push(text);
  });
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (!AUDIO_NOISE.test(text)) faults.push(text);
  });
  return faults;
}

async function knobTravel(page: Page): Promise<number> {
  return page.locator("#knob").evaluate((el) => {
    const node = el as HTMLElement;
    const joy = node.parentElement;
    if (!joy || joy.hasAttribute("hidden")) return 0;
    const nums = node.style.transform.match(/-?\d+(?:\.\d+)?/g);
    const x = Number(nums?.[0] ?? "0");
    const y = Number(nums?.[1] ?? "0");
    return Math.hypot(x, y);
  });
}

async function dragStick(page: Page, x: number, y: number): Promise<number> {
  let travel = 0;
  for (let attempt = 0; attempt < 4; attempt++) {
    await page.keyboard.press("1");
    await page.waitForTimeout(80);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 90, y, { steps: 8 });
    await page.waitForTimeout(100);
    travel = await knobTravel(page);
    if (travel > 8) return travel;
    await page.mouse.up();
  }
  return travel;
}

test("loads the game and plays a few seconds without page errors", async ({ page }) => {
  const faults = collectPageFaults(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const skip = page.locator("#guide-skip");
  if (await skip.isVisible()) await skip.click();
  await page.locator("#go").click();
  await page.waitForTimeout(3000);
  await expect(page.locator("#game")).toBeVisible();
  await expect(page.locator("#veil")).not.toHaveClass(/\bon\b/);
  await expect(page.locator("#sfx")).toBeHidden();
  await expect(page.locator("#opts")).toBeHidden();
  await expect(page.locator("#sfx-vol")).toBeHidden();
  const box = await page.locator("#game").boundingBox();
  if (!box) throw new Error("game has no box");
  const x = box.x + Math.min(110, box.width * 0.22);
  const y = box.y + box.height - Math.min(150, box.height * 0.18);
  const travel = await dragStick(page, x, y);
  expect(travel).toBeGreaterThan(8);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.mouse.up();
  expect(faults).toEqual([]);
});

test("preview run API stores a POST with Airship and Whip samples", async ({ request }) => {
  const log = {
    v: 1,
    samples: [{
      t: 20,
      level: 3,
      hp: 12,
      maxHp: 14,
      hurt: 1,
      dps: 4,
      kills: 7,
      alive: 2,
      elites: 0,
      weapons: [{ name: "Airship", lv: 1 }],
      upgrades: [{ name: "Whip", lv: 1 }],
      character: "tinker",
      modifier: "none",
      death: "",
      viewW: 390,
      viewH: 844,
      fps: [60],
    }],
  };
  const post = await request.post("/api/runs", { data: log });
  expect(post.status()).toBe(201);
  const listed = await request.get("/api/runs");
  expect(listed.ok()).toBeTruthy();
  const body = await listed.json() as { runs: { log: { samples: { weapons: { name: string }[]; upgrades: { name: string }[] }[] } }[] };
  expect(body.runs[0]?.log.samples.length).toBeGreaterThan(0);
  expect(body.runs[0]?.log.samples[0]?.weapons[0]?.name).toBe("Airship");
  expect(body.runs[0]?.log.samples[0]?.upgrades[0]?.name).toBe("Whip");
});

test("the page fetch path stores Airship and Whip samples", async ({ page }) => {
  await page.goto("/");
  const skip = page.locator("#guide-skip");
  if (await skip.isVisible()) await skip.click();
  const result = await page.evaluate(async () => {
    const log = {
      v: 1,
      samples: [{
        t: 20,
        level: 3,
        hp: 12,
        maxHp: 14,
        hurt: 1,
        dps: 4,
        kills: 7,
        alive: 2,
        elites: 0,
        weapons: [{ name: "Airship", lv: 1 }],
        upgrades: [{ name: "Whip", lv: 1 }],
        character: "tinker",
        modifier: "none",
        death: "overrun:CALM",
        viewW: 390,
        viewH: 844,
        fps: [60],
      }],
    };
    const post = await fetch("/api/runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(log),
    });
    const listed = await fetch("/api/runs");
    return { status: post.status, listed: await listed.json() as { runs: { log: { samples: { weapons: { name: string }[]; upgrades: { name: string }[] }[] } }[] } };
  });
  expect(result.status).toBe(201);
  expect(result.listed.runs[0]?.log.samples.length).toBeGreaterThan(0);
  expect(result.listed.runs[0]?.log.samples[0]?.weapons[0]?.name).toBe("Airship");
  expect(result.listed.runs[0]?.log.samples[0]?.upgrades[0]?.name).toBe("Whip");
});
