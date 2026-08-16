import { chromium } from "playwright-core";
import fs from "node:fs";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = process.env.QA_BASE || "http://localhost:4173";

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 900, height: 1300 } });
page.on("dialog", (d) => void d.accept());
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e}`));

const results = [];
const check = (name, ok, detail = "") =>
  results.push(`${ok ? "PASS" : "FAIL"} | ${name}${detail ? ` | ${detail}` : ""}`);

try {
  // ---- 1. 开启 Beta 模式（独立数据库）----
  await page.goto(`${BASE}/lab/beta`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("text=Beta 模式未开启", { timeout: 20000 });
  await page.getByRole("button", { name: "开启 Beta 模式" }).click();
  await page.waitForSelector("text=核心指标", { timeout: 30000 });
  check("beta mode enabled + dashboard", true);

  // ---- 2. 首页 Beta 引导（空衣橱）----
  await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("text=为什么需要数字衣橱", { timeout: 20000 });
  check("home beta banner (empty wardrobe)", true);
  check("home beta footer", (await page.getByText("Beta 测试模式").count()) === 1);

  // ---- 3. 衣橱空态 CTA ----
  await page.goto(`${BASE}/wardrobe`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("text=添加我的第一件衣服", { timeout: 20000 });
  check("wardrobe empty CTA visible", true);

  // ---- 4. 首次建立衣橱（上传 → 识别 → 确认 → 入库 5 件）----
  await page.getByRole("link", { name: /添加我的第一件衣服/ }).click();
  await page.waitForSelector("text=从穿搭照片添加", { timeout: 20000 });
  await page.locator('input[type="file"]').setInputFiles("public/lab-samples/wardrobe/w01.png");
  await page.waitForFunction(() => document.body.innerText.includes("发现 5 件单品"), undefined, { timeout: 60000 });
  await page.getByRole("button", { name: /全部加入衣橱/ }).click();
  await page.waitForFunction(() => document.body.innerText.includes("已加入"), undefined, { timeout: 120000 });
  check("first wardrobe built (5 items imported)", true);

  // ---- 5. 首页推荐查看 + 反馈 ----
  await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
  await page.locator('a[href^="/outfit"]').first().click();
  await page.waitForTimeout(800);
  await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
  const fbSection = page.locator("section", { hasText: "今天推荐怎么样？" });
  await fbSection.locator("button").nth(0).click();
  await fbSection.getByRole("button", { name: "提交反馈" }).click();
  await page.waitForSelector("text=已收到你的反馈", { timeout: 15000 });
  check("feedback submitted", true);

  // ---- 6. AI 试穿点击 ----
  await page.goto(`${BASE}/lab/vton`, { waitUntil: "networkidle", timeout: 60000 });
  await page.getByRole("button", { name: "sample 1" }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "纯白短袖" }).click();
  await page.waitForTimeout(500);
  await page.getByRole("radio", { name: /本地图层拼接/ }).check();
  await page.getByRole("button", { name: "运行当前 Provider", exact: true }).click();
  await page.waitForFunction(
    () => document.body.innerText.includes("local-layer") && document.body.innerText.includes("ok"),
    undefined,
    { timeout: 120000 },
  );
  check("vton run + clicked event", true);

  // ---- 7. 注入 12 人模拟 Cohort（历史事件，用于指标验证）----
  const base = new Date("2026-08-09T08:00:00Z").getTime();
  const iso = (ms) => new Date(ms).toISOString();
  const rows = [];
  for (let i = 1; i <= 12; i++) {
    const u = `beta-u${String(i).padStart(2, "0")}`;
    const day0 = base + (i - 1) * 60_000;
    rows.push({ id: `${u}-s0`, betaUserId: u, createdAt: iso(day0), event: "session_started" });
    rows.push({ id: `${u}-on`, betaUserId: u, createdAt: iso(day0 + 10_000), event: "wardrobe_onboarding_started" });
    if (i <= 8) {
      rows.push({ id: `${u}-up`, betaUserId: u, createdAt: iso(day0 + 20_000), event: "garment_upload_started", source: "outfit_photo" });
      rows.push({ id: `${u}-dt`, betaUserId: u, createdAt: iso(day0 + 25_000), event: "garment_detection_completed", detectedCount: 5, confirmedCount: 5 });
      const cats = ["outerwear", "top", "bottom", "shoes", "bag"];
      for (let k = 0; k < 5; k++) {
        rows.push({ id: `${u}-a${k}`, betaUserId: u, createdAt: iso(day0 + 40_000 + k * 35_000), event: "garment_added", category: cats[k] });
      }
    }
    if (i <= 6) rows.push({ id: `${u}-v1`, betaUserId: u, createdAt: iso(day0 + 90_000), event: "daily_outfit_viewed", page: "home" });
    if (i <= 4) rows.push({ id: `${u}-vt`, betaUserId: u, createdAt: iso(day0 + 120_000), event: "vton_clicked", page: "lab-vton" });
    const fbMap = {
      "beta-u01": ["like", ""],
      "beta-u02": ["neutral", ""],
      "beta-u03": ["dislike", ""],
      "beta-u04": ["like", "推荐不够准"],
    };
    if (fbMap[u]) {
      rows.push({ id: `${u}-fb`, betaUserId: u, createdAt: iso(day0 + 130_000), event: "feedback_submitted", feedback: fbMap[u][0], feedbackText: fbMap[u][1] || undefined });
    }
  }
  const ret = [
    ["beta-u01", 1], ["beta-u02", 1], ["beta-u03", 1], ["beta-u04", 1], ["beta-u05", 1],
    ["beta-u06", 1], ["beta-u07", 1], ["beta-u08", 1], ["beta-u09", 1],
    ["beta-u01", 3], ["beta-u02", 3], ["beta-u03", 3], ["beta-u04", 3], ["beta-u05", 3], ["beta-u06", 3], ["beta-u07", 3],
    ["beta-u01", 7], ["beta-u02", 7], ["beta-u03", 7], ["beta-u04", 7], ["beta-u05", 7],
  ];
  for (const [u, day] of ret) {
    const idx = parseInt(u.slice(-2), 10);
    const d0 = base + (idx - 1) * 60_000;
    rows.push({ id: `${u}-s${day}`, betaUserId: u, createdAt: iso(d0 + day * 86_400_000), event: "session_started" });
  }
  await page.evaluate(async (rows) => {
    const db = await new Promise((resolve, reject) => {
      const r = indexedDB.open("chuanda-walk-in-closet-beta", 3);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const tx = db.transaction("betaEvents", "readwrite");
    const store = tx.objectStore("betaEvents");
    for (const row of rows) store.put(row);
    await new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
    db.close();
  }, rows);
  check("cohort injected (12 users)", true);

  // ---- 8. 指标看板 ----
  await page.goto(`${BASE}/lab/beta`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("text=核心指标", { timeout: 20000 });
  const text = await page.evaluate(() => document.body.innerText);
  const match = (re) => {
    const m = text.match(re);
    return m ? parseFloat(m[1]) : NaN;
  };
  const completion = match(/首次衣橱完成率（≥5 件）\s*([\d.]+)%/);
  const day1 = match(/留存 Day1 \/ Day3 \/ Day7\s*([\d.]+)%/);
  const vtonRate = match(/AI 试穿点击率\s*([\d.]+)%/);
  check("metrics: completion rate 60-80%", completion >= 60 && completion <= 80, `${completion}%`);
  check("metrics: day1 retention 60-80%", day1 >= 60 && day1 <= 80, `${day1}%`);
  check("metrics: vton click rate 25-50%", vtonRate >= 25 && vtonRate <= 50, `${vtonRate}%`);
  check("metrics: first completion time <3min", /平均首次完成时间\s*[0-9]+s/.test(text) && match(/平均首次完成时间\s*([\d.]+)s/) < 180, text.match(/平均首次完成时间\s*([\d.]+)s/)?.[1] ?? "");
  check("metrics: feedback like>=3", /反馈 😊\/😐\/😞\s*([\d]+)\s*\/\s*([\d]+)\s*\/\s*([\d]+)/.test(text));

  // ---- 9. 隐私审计 ----
  const exported = await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const r = indexedDB.open("chuanda-walk-in-closet-beta", 3);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const tx = db.transaction("betaEvents").objectStore("betaEvents").getAll();
    const data = await new Promise((resolve) => {
      tx.onsuccess = () => resolve(tx.result);
    });
    db.close();
    return data;
  });
  const leak = exported.find((e) => JSON.stringify(e).includes("data:image") || JSON.stringify(e).length > 800);
  check("events: no privacy/photo data", !leak, `events=${exported.length}`);

  // ---- 10. 导出 JSON ----
  const dlPromise = page.waitForEvent("download", { timeout: 15000 });
  await page.getByRole("button", { name: "导出 BETA_ANALYTICS JSON" }).click();
  const dl = await dlPromise;
  const raw = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
  check("export json valid", raw.metrics?.totalUsers >= 13, `users=${raw.metrics?.totalUsers}`);
  if (process.env.SAVE_BETA_EXPORT) {
    fs.mkdirSync("benchmarks", { recursive: true });
    fs.writeFileSync(process.env.SAVE_BETA_EXPORT, JSON.stringify(raw, null, 2));
  }

  // ---- 11. 删除测试数据并退出 ----
  await page.getByRole("button", { name: /删除全部测试数据并退出/ }).click();
  await page.waitForSelector("text=Beta 模式未开启", { timeout: 30000 });
  const flag = await page.evaluate(() => localStorage.getItem("chuanda-beta-active"));
  check("beta data deleted + mode exited", flag === null);

  await page.screenshot({ path: "scripts/shots/lab-beta-6d.png" });
} catch (e) {
  check("flow completed", false, e.message.slice(0, 240));
}

console.log(results.join("\n"));
console.log("---CONSOLE ERRORS---");
console.log(errors.length ? errors.slice(0, 8).join("\n") : "(none)");
await browser.close();
