import { chromium } from "playwright-core";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = process.env.QA_BASE || "http://localhost:4173";

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 900, height: 1300 } });
await page.addInitScript(() => {
  localStorage.setItem("chuanda-beta-active", "1");
  localStorage.setItem("chuanda-beta-user", "beta-qa-tryon");
});
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e}`));

const results = [];
const check = (name, ok, detail = "") =>
  results.push(`${ok ? "PASS" : "FAIL"} | ${name}${detail ? ` | ${detail}` : ""}`);

try {
  // 建立衣橱（Beta 独立库，5 件）
  await page.goto(`${BASE}/import`, { waitUntil: "networkidle", timeout: 60000 });
  await page.locator('input[type="file"]').setInputFiles("public/lab-samples/wardrobe/w01.png");
  await page.waitForFunction(() => document.body.innerText.includes("发现 5 件单品"), undefined, { timeout: 60000 });
  await page.getByRole("button", { name: /全部加入衣橱/ }).click();
  await page.waitForFunction(() => document.body.innerText.includes("已加入"), undefined, { timeout: 120000 });
  check("beta wardrobe built (5 items)", true);

  // 入口门禁：静态预览无服务端配置 → 换装间不显示按钮
  await page.goto(`${BASE}/dress`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("text=我的换装间", { timeout: 20000 });
  const entryCount = await page.getByRole("link", { name: /AI 真实试穿/ }).count();
  check("dress entry hidden without server config", entryCount === 0, `count=${entryCount}`);

  // /tryon 页面
  await page.goto(`${BASE}/tryon`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("text=AI 真实试穿", { timeout: 20000 });
  check("tryon page visible (beta)", true);
  const garmentBtns = page.locator("section", { hasText: "选择要试穿的衣物" }).locator("button");
  check("tryon garment list non-empty", (await garmentBtns.count()) >= 2, `count=${await garmentBtns.count()}`);
  await garmentBtns.first().click();

  // 生成（无 Key → 优雅失败，不崩溃）
  await page.getByRole("button", { name: /✨ AI 真实试穿/ }).click();
  await page.waitForFunction(
    () => {
      const t = document.body.innerText;
      return t.includes("生成失败") || t.includes("再试一次");
    },
    undefined,
    { timeout: 60000 },
  );
  const errText = await page.evaluate(() => document.body.innerText);
  check("generate fails gracefully", errText.includes("生成失败") || errText.includes("建议上传"), true);

  // 看板指标
  await page.goto(`${BASE}/lab/vton/beta`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("text=LAB / VTON / BETA", { timeout: 20000 });
  const dash = await page.evaluate(() => document.body.innerText);
  check("dashboard: started count 1", /生成次数 \/ 用户数\s*1\s*\/\s*1/.test(dash), true);
  check("dashboard: success rate 0%", /成功率\s*0%/.test(dash), true);

  // 导出成本报告
  const dlPromise = page.waitForEvent("download", { timeout: 10000 });
  await page.getByRole("button", { name: "导出 vton-cost-report.json" }).click();
  const dl = await dlPromise;
  check("cost report downloads", dl.suggestedFilename() === "vton-cost-report.json", dl.suggestedFilename());

  // 安全：无 Key 泄漏
  const leak = /sk-[a-z0-9]{16,}/i.test(dash);
  check("no api key in dashboard", !leak);

  await page.screenshot({ path: "scripts/shots/lab-vton-beta-6e.png" });
} catch (e) {
  check("flow completed", false, e.message.slice(0, 240));
}

console.log(results.join("\n"));
console.log("---CONSOLE ERRORS---");
console.log(errors.length ? errors.slice(0, 8).join("\n") : "(none)");
await browser.close();
