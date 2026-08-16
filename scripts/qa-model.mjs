import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = process.env.QA_BASE || "http://localhost:4173";
const PHOTO = fileURLToPath(new URL("./test-assets/fullbody-test.jpg", import.meta.url));

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--disable-gpu", "--no-sandbox", "--use-angle=swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e}`));

const results = [];
const check = (name, ok, detail = "") =>
  results.push(`${ok ? "PASS" : "FAIL"} | ${name}${detail ? ` | ${detail}` : ""}`);

const dbRead = (store, key) =>
  page.evaluate(
    async ({ store, key }) => {
      const open = () =>
        new Promise((resolve, reject) => {
          const r = indexedDB.open("chuanda-walk-in-closet", 3);
          r.onsuccess = () => resolve(r.result);
          r.onerror = () => reject(r.error);
        });
      const db = await open();
      const tx = db.transaction(store).objectStore(store);
      const value = await new Promise((resolve, reject) => {
        const req = key ? tx.get(key) : tx.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      db.close();
      return value;
    },
    { store, key },
  );

try {
  await page.goto(`${BASE}/dress`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("text=我的换装间", { timeout: 30000 });
  await page.waitForTimeout(500);

  const modelBefore = await dbRead("models", "user-demo");
  const topBefore = (await dbRead("wardrobe", "top-01")).anchor;

  // 打开模特面板
  await page.getByRole("button", { name: "更换模特" }).click();
  await page.waitForSelector("text=上传一张全身照", { timeout: 15000 });
  check("model sheet opens", true);

  // 上传测试照片并等待识别
  const input = page.locator('input[type="file"]');
  await input.setInputFiles(PHOTO);

  let previewText = null;
  try {
    await page.waitForSelector("text=已按 600×1200", { timeout: 120000 });
    previewText = await page.locator("text=已按 600×1200").innerText();
  } catch {
    const body = await page.locator("body").innerText();
    check("pose detection succeeds", false, body.slice(0, 160).replace(/\n/g, " | "));
    throw new Error("detection timeout");
  }
  check("pose detection succeeds", Boolean(previewText));

  const previewSrc = await page.locator("img.aspect-\\[1\\/2\\]").getAttribute("src");
  check("preview is standardized PNG", Boolean(previewSrc && previewSrc.startsWith("data:image/png")), previewSrc?.slice(0, 24));

  // 确认使用照片
  await page.getByRole("button", { name: "使用这张照片" }).click();
  await page.waitForSelector("text=模特已更新", { timeout: 30000 });
  check("model updated toast", true);

  const modelAfter = await dbRead("models", "user-demo");
  const topAfter = (await dbRead("wardrobe", "top-01")).anchor;

  check("model source = photo", modelAfter.source === "photo");
  check("model body saved", Boolean(modelAfter.body && modelAfter.body.shoulderY > 0));
  check(
    "model image replaced",
    Boolean(modelAfter.modelImage !== modelBefore.modelImage && modelAfter.modelImage.startsWith("data:image/png")),
  );
  check(
    "anchors retuned",
    Boolean(topAfter && JSON.stringify(topAfter) !== JSON.stringify(topBefore)),
    `before=${JSON.stringify(topBefore)} after=${JSON.stringify(topAfter)}`,
  );

  // 回到换装间，模特与衣服层仍正常渲染
  await page.goto(`${BASE}/dress`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("text=我的换装间", { timeout: 30000 });
  await page.waitForTimeout(500);
  check("model renders after change", (await page.locator("[data-model]").count()) === 1);
  check("clothes render after change", (await page.locator("[data-layer]").count()) >= 1);
  await page.screenshot({ path: "scripts/shots/live-model.png" });
} catch (e) {
  check("flow completed", false, e.message.slice(0, 200));
}

console.log(results.join("\n"));
console.log("---CONSOLE ERRORS---");
console.log(errors.length ? errors.slice(0, 8).join("\n") : "(none)");
await browser.close();
