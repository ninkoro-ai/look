import { chromium } from "playwright-core";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = process.env.QA_BASE || "http://localhost:3000";
const SHOTS = fileURLToPath(new URL("./shots/", import.meta.url));
fs.mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("pageerror", (e) => consoleErrors.push(`PAGEERROR: ${e}`));

const shot = (name) => page.screenshot({ path: `${SHOTS}/${name}.png` });

const results = [];
const check = (name, ok, detail = "") => {
  results.push(`${ok ? "PASS" : "FAIL"} | ${name}${detail ? ` | ${detail}` : ""}`);
};

// 1. 首页
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForSelector("text=今日 LOOK", { timeout: 20000 });
const lookCards = await page.locator('a[href^="/outfit?"]').count();
check("home: 3 look cards", lookCards === 3, `count=${lookCards}`);
check("home: weather card", (await page.locator("text=体感").count()) > 0);
check("home: model previews", (await page.locator('[data-testid="model-canvas"]').count()) === 3);
await shot("home");

// 2. IndexedDB 数据
const dbInfo = await page.evaluate(async () => {
  const open = () =>
    new Promise((resolve, reject) => {
      const r = indexedDB.open("chuanda-walk-in-closet", 2);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  const db = await open();
  const count = (s) =>
    new Promise((resolve, reject) => {
      const t = db.transaction(s).objectStore(s).count();
      t.onsuccess = () => resolve(t.result);
      t.onerror = () => reject(t.error);
    });
  const wardrobe = await count("wardrobe");
  const recs = await count("recommendations");
  const outfits = await count("outfits");
  const models = await count("models");
  db.close();
  return { wardrobe, recs, outfits, models };
});
check("db: wardrobe seeded >= 30", dbInfo.wardrobe >= 30, JSON.stringify(dbInfo));
check("db: today recommendations", dbInfo.recs === 3);
check("db: user model", dbInfo.models === 1);

// 3. 衣橱页
await page.goto(`${BASE}/wardrobe`, { waitUntil: "networkidle" });
await page.waitForSelector("text=衣橱", { timeout: 15000 });
const wardrobeCards = await page.locator('button.group').count();
check("wardrobe: all items visible", wardrobeCards === dbInfo.wardrobe, `count=${wardrobeCards}`);
await shot("wardrobe");

// 4. 换装页
await page.goto(`${BASE}/dress`, { waitUntil: "networkidle" });
await page.waitForSelector("text=我的换装间", { timeout: 15000 });
await page.waitForTimeout(400);

const modelCount = await page.locator("[data-model]").count();
check("dress: model shown", modelCount === 1);
const layersBefore = await page.locator("[data-layer]").count();
check("dress: initial outfit rendered", layersBefore >= 1, `layers=${layersBefore}`);

const topItems = page.locator('[data-testid="pick-item"]');
check("dress: top category items", (await topItems.count()) >= 5, `items=${await topItems.count()}`);

const topBefore = (await page.locator('[data-layer="top"]').count())
  ? await page.locator('[data-layer="top"]').first().getAttribute("src")
  : null;
// 点击第一件上衣，验证换装
await topItems.first().click();
await page.waitForTimeout(250);
const topAfter = await page.locator('[data-layer="top"]').first().getAttribute("src");
check("dress: click replaces top layer", Boolean(topAfter) && topAfter !== topBefore, `changed=${Boolean(topAfter && topAfter !== topBefore)}`);

// 点击下装分类，穿一条裤子
await page.getByRole("button", { name: "下装" }).click();
await page.waitForTimeout(200);
const bottomItems = page.locator('[data-testid="pick-item"]');
const bottomBefore = (await page.locator('[data-layer="bottom"]').count())
  ? await page.locator('[data-layer="bottom"]').first().getAttribute("src")
  : null;
await bottomItems.first().click();
await page.waitForTimeout(250);
const bottomAfter = await page.locator('[data-layer="bottom"]').first().getAttribute("src");
check("dress: click replaces bottom layer", Boolean(bottomAfter) && bottomAfter !== bottomBefore, `changed=${Boolean(bottomAfter && bottomAfter !== bottomBefore)}`);

await shot("dress");

// 5. 穿搭详情
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForSelector('a[href^="/outfit?"]', { timeout: 15000 });
await page.locator('a[href^="/outfit?"]').first().click();
await page.waitForSelector("text=穿搭详情", { timeout: 15000 });
await page.waitForSelector("text=搭配清单", { timeout: 15000 });
const listRows = await page.locator("text=搭配清单").locator("xpath=../..").locator("div.flex.items-center").count();
check("outfit: item list rows", listRows >= 2, `rows=${listRows}`);
await shot("outfit");

// 6. PWA 资源
const manifest = await page.request.get(`${BASE}/manifest.webmanifest`);
const sw = await page.request.get(`${BASE}/sw.js`);
check("pwa: manifest 200", manifest.status() === 200);
check("pwa: sw.js 200", sw.status() === 200);

// 7. 收藏闭环：在换装页收藏当前搭配
await page.goto(`${BASE}/dress`, { waitUntil: "networkidle" });
await page.waitForSelector("text=收藏这套", { timeout: 15000 });
await page.getByRole("button", { name: "收藏这套" }).click();
await page.waitForTimeout(400);
const favCount = await page.evaluate(async () => {
  const open = () =>
    new Promise((resolve, reject) => {
      const r = indexedDB.open("chuanda-walk-in-closet", 2);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  const db = await open();
  const t = db.transaction("favorites").objectStore("favorites").count();
  const n = await new Promise((resolve, reject) => {
    t.onsuccess = () => resolve(t.result);
    t.onerror = () => reject(t.error);
  });
  db.close();
  return n;
});
check("dress: favorite saved", favCount >= 1, `favorites=${favCount}`);

console.log(results.join("\n"));
console.log("---CONSOLE ERRORS---");
console.log(consoleErrors.length ? consoleErrors.join("\n") : "(none)");

await browser.close();
