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
        const r = indexedDB.open("chuanda-walk-in-closet", 3);
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

  // 服务端代理健康检查（本地静态服务无 functions，返回失败属正常，但页面不应崩溃）
  await page.waitForTimeout(800);
  const hasProviderRadio = await page.getByRole("radio", { name: /阿里云百炼/ }).count();
  check("alibaba provider listed", hasProviderRadio === 1);

  // 输入：sample 人物 + 演示上衣
  await page.getByRole("button", { name: "sample 1" }).click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "纯白短袖" }).click();
  await page.waitForTimeout(600);
  check("inputs ready", true);

  // 本地图层方案（单次运行）
  await page.getByRole("radio", { name: /本地图层拼接/ }).check();
  await page.getByRole("button", { name: "运行当前 Provider", exact: true }).click();
  await page.waitForFunction(
    () => {
      const text = document.body.innerText;
      return text.includes("local-layer") && /latency \d+ms/.test(text) && text.includes("ok");
    },
    undefined,
    { timeout: 120000 },
  );
  check("local-layer provider success", true);

  // 人像分割方案（单次运行）
  await page.getByRole("radio", { name: /人像分割蒙版合成/ }).check();
  await page.getByRole("button", { name: "运行当前 Provider", exact: true }).click();
  await page.waitForFunction(
    () => {
      const text = document.body.innerText;
      return text.includes("hybrid-mask") && /latency \d+ms/.test(text) && text.includes("ok");
    },
    undefined,
    { timeout: 180000 },
  );
  check("hybrid-mask provider success", true);

  // 全部 Benchmark：20 组 × 2 个本地可用 Provider = 40 条
  await page.getByRole("button", { name: /运行全部 Benchmark/ }).click();
  await page.waitForFunction(
    () => document.body.innerText.includes("完成 ") && document.body.innerText.includes("组"),
    undefined,
    { timeout: 600000 },
  );
  const count = await dbCount("vtonTests");
  check("benchmark saved >= 40 tests", count >= 40, `count=${count}`);

  // 汇总表包含 P50/P95 与两个本地 Provider
  const tableText = await page.locator("table").innerText();
  check("summary table has local-layer", tableText.includes("local-layer"));
  check("summary table has hybrid-mask", tableText.includes("hybrid-mask"));
  check("summary table has P50", tableText.includes("P50"));
  check("summary table has P95", tableText.includes("P95"));

  // 导出 JSON
  const jsonPromise = page.waitForEvent("download", { timeout: 10000 });
  await page.getByRole("button", { name: "导出 VTON_BENCHMARK JSON" }).click();
  const jsonDl = await jsonPromise;
  check("export json downloads", /^VTON_BENCHMARK_\d{8}\.json$/.test(jsonDl.suggestedFilename()), jsonDl.suggestedFilename());

  // 导出 MD
  const mdPromise = page.waitForEvent("download", { timeout: 10000 });
  await page.getByRole("button", { name: "导出 VTON_BENCHMARK MD" }).click();
  const mdDl = await mdPromise;
  check("export md downloads", /^VTON_BENCHMARK_\d{8}\.md$/.test(mdDl.suggestedFilename()), mdDl.suggestedFilename());

  // 刷新后历史仍在
  await page.reload({ waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("text=测试记录", { timeout: 20000 });
  check("history persists after reload", (await dbCount("vtonTests")) >= 40);

  await page.screenshot({ path: "scripts/shots/lab-vton-6b.png" });
} catch (e) {
  check("flow completed", false, e.message.slice(0, 240));
}

console.log(results.join("\n"));
console.log("---CONSOLE ERRORS---");
console.log(errors.length ? errors.slice(0, 8).join("\n") : "(none)");
await browser.close();
