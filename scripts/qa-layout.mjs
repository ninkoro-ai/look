import { chromium } from "playwright-core";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = process.env.QA_BASE || "http://localhost:3000";

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(String(e)));

const results = [];
const check = (name, ok, detail = "") =>
  results.push(`${ok ? "PASS" : "FAIL"} | ${name}${detail ? ` | ${detail}` : ""}`);

// 坏图检查：遍历所有页面
async function brokenImages(label) {
  const broken = await page.evaluate(() =>
    Array.from(document.querySelectorAll("img"))
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.alt || img.getAttribute("src")?.slice(0, 60) || "?"),
  );
  check(`${label}: no broken images`, broken.length === 0, broken.join(","));
}

await page.goto(`${BASE}/dress`, { waitUntil: "networkidle" });
await page.waitForSelector("text=我的换装间", { timeout: 20000 });
await page.waitForTimeout(400);

// 先清空初始搭配：清掉已有所有层
const chipCount = await page.locator("button.group").count();
for (let i = 0; i < chipCount; i++) {
  await page.locator("button.group").first().click();
  await page.waitForTimeout(80);
}
check("dress: clear removes all layers", (await page.locator("[data-layer]").count()) === 0);
await brokenImages("dress base");

// 穿上衣
await page.getByRole("button", { name: "上衣" }).first().click();
await page.waitForTimeout(150);
await page.locator('[data-testid="pick-item"]').first().click();
await page.waitForTimeout(250);

// 换下装
await page.getByRole("button", { name: "下装" }).click();
await page.waitForTimeout(150);
await page.locator('[data-testid="pick-item"]').first().click();
await page.waitForTimeout(250);

// 换鞋
await page.getByRole("button", { name: "鞋" }).click();
await page.waitForTimeout(150);
await page.locator('[data-testid="pick-item"]').first().click();
await page.waitForTimeout(250);

// 换包
await page.getByRole("button", { name: "包" }).click();
await page.waitForTimeout(150);
await page.locator('[data-testid="pick-item"]').first().click();
await page.waitForTimeout(250);

// 量测各层位置（相对模特画布）
const boxes = await page.evaluate(() => {
  const canvas = document.querySelector('[data-testid="model-canvas"] [class*="aspect"]');
  if (!canvas) return null;
  const cr = canvas.getBoundingClientRect();
  const out = {};
  document.querySelectorAll("[data-layer]").forEach((el) => {
    const r = el.getBoundingClientRect();
    out[el.getAttribute("data-layer")] = {
      left: (r.left - cr.left) / cr.width,
      top: (r.top - cr.top) / cr.height,
      right: (r.right - cr.left) / cr.width,
      bottom: (r.bottom - cr.top) / cr.height,
    };
  });
  return out;
});

const inBounds = (b) => b && b.left >= -0.02 && b.top >= -0.02 && b.right <= 1.02 && b.bottom <= 1.02;
check("layout: top within canvas", inBounds(boxes.top), JSON.stringify(boxes.top));
check("layout: top vertical band", boxes.top && boxes.top.top > 0.1 && boxes.top.top < 0.35, JSON.stringify(boxes.top));
check("layout: bottom within canvas", inBounds(boxes.bottom), JSON.stringify(boxes.bottom));
check("layout: bottom band", boxes.bottom && boxes.bottom.top > 0.35 && boxes.bottom.bottom > 0.75, JSON.stringify(boxes.bottom));
check("layout: shoes within canvas", inBounds(boxes.shoes), JSON.stringify(boxes.shoes));
check("layout: shoes near feet", boxes.shoes && boxes.shoes.top > 0.78, JSON.stringify(boxes.shoes));
check("layout: bag within canvas", inBounds(boxes.bag), JSON.stringify(boxes.bag));
check("layout: bag right side", boxes.bag && boxes.bag.right > 0.45, JSON.stringify(boxes.bag));

// 裙子独占逻辑：穿裙子后上衣/下装被清空
await page.getByRole("button", { name: "裙子" }).click();
await page.waitForTimeout(150);
await page.locator('[data-testid="pick-item"]').first().click();
await page.waitForTimeout(250);
check(
  "dress logic: dress clears top+bottom",
  (await page.locator('[data-layer="dress"]').count()) === 1 &&
    (await page.locator('[data-layer="top"]').count()) === 0 &&
    (await page.locator('[data-layer="bottom"]').count()) === 0,
);

await page.screenshot({ path: "scripts/shots/dress-outfit.png" });

// 收藏后首页 LOOK 03 应引用收藏（至少还能正常展示）
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForSelector("text=今日 LOOK", { timeout: 20000 });
await brokenImages("home");

// 衣橱与详情页坏图检查
await page.goto(`${BASE}/wardrobe`, { waitUntil: "networkidle" });
await page.waitForSelector("text=衣橱", { timeout: 15000 });
await brokenImages("wardrobe");

console.log(results.join("\n"));
console.log("---CONSOLE ERRORS---");
console.log(errors.length ? errors.join("\n") : "(none)");
await browser.close();
