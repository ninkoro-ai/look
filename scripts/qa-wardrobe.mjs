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
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e}`));

const results = [];
const check = (name, ok, detail = "") =>
  results.push(`${ok ? "PASS" : "FAIL"} | ${name}${detail ? ` | ${detail}` : ""}`);

const dbEval = (store) =>
  page.evaluate(async (store) => {
    const open = () =>
      new Promise((resolve, reject) => {
        const r = indexedDB.open("chuanda-walk-in-closet", 3);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
    const db = await open();
    const t = db.transaction(store).objectStore(store).getAll();
    const data = await new Promise((resolve, reject) => {
      t.onsuccess = () => resolve(t.result);
      t.onerror = () => reject(t.error);
    });
    db.close();
    return data;
  }, store);

try {
  await page.goto(`${BASE}/lab/wardrobe`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("text=LAB / WARDROBE", { timeout: 20000 });
  check("wardrobe lab visible", true);

  // ---- 穿搭照片拆解流程（outfit）----
  await page.locator('select').first().selectOption("w01");
  await page.getByRole("button", { name: "加载该样例" }).click();
  await page.waitForFunction(
    () => document.body.innerText.includes("识别结果（发现 5 件单品）"),
    undefined,
    { timeout: 60000 },
  );
  check("outfit detect: 5 items", true);

  // 修改名称 + 删除一件
  const nameInputs = page.locator('input[value="牛仔外套"]');
  await nameInputs.first().fill("蓝色牛仔外套");
  const rows = page.locator("section", { hasText: "识别结果" });
  await rows.getByRole("button", { name: "删除" }).nth(1).click();

  const before = (await dbEval("wardrobe")).length;
  await page.getByRole("button", { name: /全部加入衣橱/ }).click();
  await page.waitForFunction(
    () => document.body.innerText.includes("✓ 已加入衣橱"),
    undefined,
    { timeout: 120000 },
  );
  const after = (await dbEval("wardrobe")).length;
  check("outfit import: wardrobe grew by 4", after === before + 4, `before=${before} after=${after}`);

  // ---- 单品照片上传流程（single）----
  await page.getByRole("button", { name: "继续添加" }).click();
  await page.getByRole("radio", { name: /单品照片/ }).check();
  await page.locator('select').first().selectOption("w11");
  await page.getByRole("button", { name: "加载该样例" }).click();
  await page.waitForFunction(
    () => document.body.innerText.includes("识别结果（发现 5 件单品）"),
    undefined,
    { timeout: 60000 },
  );
  const singleBefore = (await dbEval("wardrobe")).length;
  await page.getByRole("button", { name: "加入衣橱", exact: true }).click();
  await page.waitForFunction(
    () => document.body.innerText.includes("✓ 已加入衣橱"),
    undefined,
    { timeout: 120000 },
  );
  const singleAfter = (await dbEval("wardrobe")).length;
  check("single import: wardrobe grew by 1", singleAfter === singleBefore + 1, `before=${singleBefore} after=${singleAfter}`);

  // ---- 运行全部 20 组（仅识别）----
  await page.getByRole("button", { name: "继续添加" }).click();
  await page.getByRole("button", { name: /运行全部 20 组/ }).click();
  await page.waitForFunction(
    () => document.body.innerText.includes("完成 20 组识别"),
    undefined,
    { timeout: 300000 },
  );
  check("run-all 20 samples completed", true);

  // ---- 统计面板 ----
  const bodyText = await page.evaluate(() => document.body.innerText);
  check("stats: category accuracy 100%", /类别准确率（样例比对）\s*100%/.test(bodyText), "mock demo dataset");
  check("stats: color accuracy 100%", /颜色准确率（样例比对）\s*100%/.test(bodyText));
  check("stats: avg detect ms shown", /平均识别耗时\s*\d+ms/.test(bodyText));

  // ---- 隐私审计：事件中不得含图片数据/长字符串 ----
  const events = await dbEval("onboardingEvents");
  const leak = events.find((e) => JSON.stringify(e).includes("data:image") || JSON.stringify(e).length > 1200);
  check("events: no privacy/photo data", !leak, `events=${events.length}`);

  // ---- 导出 JSON ----
  const dlPromise = page.waitForEvent("download", { timeout: 15000 });
  await page.getByRole("button", { name: "导出事件 JSON" }).click();
  const dl = await dlPromise;
  const dlPath = await dl.path();
  const raw = JSON.parse(fs.readFileSync(dlPath, "utf8"));
  check("export json valid", Array.isArray(raw.events) && raw.events.length >= 25, `events=${raw.events.length}`);

  // ---- 刷新持久化 ----
  await page.reload({ waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("text=事件记录", { timeout: 20000 });
  const afterReload = await dbEval("onboardingEvents");
  check("events persist after reload", afterReload.length >= 25, `count=${afterReload.length}`);

  await page.screenshot({ path: "scripts/shots/lab-wardrobe-6c.png" });
} catch (e) {
  check("flow completed", false, e.message.slice(0, 240));
}

console.log(results.join("\n"));
console.log("---CONSOLE ERRORS---");
console.log(errors.length ? errors.slice(0, 8).join("\n") : "(none)");
await browser.close();
