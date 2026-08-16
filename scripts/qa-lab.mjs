import { chromium } from "playwright-core";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = process.env.QA_BASE || "http://localhost:4173";

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e}`));

const results = [];
const check = (name, ok, detail = "") =>
  results.push(`${ok ? "PASS" : "FAIL"} | ${name}${detail ? ` | ${detail}` : ""}`);

const dbCount = (store) =>
  page.evaluate(async (store) => {
    const open = () =>
      new Promise((resolve, reject) => {
        const r = indexedDB.open("chuanda-walk-in-closet", 2);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
    const db = await open();
    const t = db.transaction(store).objectStore(store).count();
    const n = await new Promise((resolve, reject) => {
      t.onsuccess = () => resolve(t.result);
      t.onerror = () => reject(t.error);
    });
    db.close();
    return n;
  }, store);

try {
  await page.goto(`${BASE}/lab/vton`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("text=LAB / VTON", { timeout: 20000 });
  check("lab page visible", true);

  // 输入：sample 人物 + 演示上衣
  await page.getByRole("button", { name: "sample 1" }).click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "纯白短袖" }).click();
  await page.waitForTimeout(600);
  check("inputs ready", true);

  // 本地图层方案
  await page.getByRole("button", { name: "本地图层拼接（姿势锚点）" }).click();
  await page.waitForFunction(
    () => {
      const text = document.body.innerText;
      return text.includes("local-layer") && /latency \d+ms/.test(text) && text.includes("ok");
    },
    { timeout: 120000 },
  );
  check("local-layer provider success", true);

  // 人像分割方案
  await page.getByRole("button", { name: "人像分割蒙版合成（MediaPipe）" }).click();
  await page.waitForFunction(
    () => {
      const text = document.body.innerText;
      return text.includes("hybrid-mask") && /latency \d+ms/.test(text) && text.includes("ok");
    },
    { timeout: 180000 },
  );
  check("hybrid-mask provider success", true);

  // Benchmark 10 组 × 2 本地 Provider
  await page.getByRole("button", { name: "运行 Benchmark" }).click();
  await page.waitForFunction(
    () => document.body.innerText.includes("完成 ") && document.body.innerText.includes("组"),
    { timeout: 420000 },
  );
  const count = await dbCount("vtonTests");
  check("benchmark saved >= 20 tests", count >= 20, `count=${count}`);

  // 汇总表
  const tableText = await page.locator("table").innerText();
  check("summary table has local-layer", tableText.includes("local-layer"));
  check("summary table has hybrid-mask", tableText.includes("hybrid-mask"));

  // 导出 JSON
  const downloadPromise = page.waitForEvent("download", { timeout: 10000 });
  await page.getByRole("button", { name: "导出报告 JSON" }).click();
  const download = await downloadPromise;
  check("export json downloads", download.suggestedFilename().endsWith(".json"), download.suggestedFilename());

  // 刷新后历史仍在
  await page.reload({ waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("text=测试记录", { timeout: 20000 });
  check("history persists after reload", (await dbCount("vtonTests")) >= 20);

  await page.screenshot({ path: "scripts/shots/lab-vton.png" });
} catch (e) {
  check("flow completed", false, e.message.slice(0, 240));
}

console.log(results.join("\n"));
console.log("---CONSOLE ERRORS---");
console.log(errors.length ? errors.slice(0, 8).join("\n") : "(none)");
await browser.close();
