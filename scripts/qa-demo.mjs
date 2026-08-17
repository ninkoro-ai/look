import { chromium } from "playwright-core";

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

try {
  await page.goto(`${BASE}/demo/real-tryon`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("text=AI 真实试穿 · Demo", { timeout: 20000 });
  check("demo page visible", true);

  // 素材数量
  const body = await page.evaluate(() => document.body.innerText);
  check(
    "models listed (AI + real)",
    body.includes("AI 模特") && body.includes("真实模特") && body.includes("选择模特"),
  );
  check("10 garments listed", body.includes("10 件透明素材"));
  check("generated gallery listed", body.includes("真实 AI 试穿效果"));

  // 本地回退（静态预览无 /api → 云端检测为本地回退）
  await page.waitForTimeout(1200);
  const status = await page.evaluate(() => document.body.innerText);
  check("fallback status shown", status.includes("本地回退") || status.includes("检测中"));

  // 选择模特 + 衣物 → 生成（Local Segmentation 回退）
  await page.getByRole("button").filter({ hasText: "AI 模特 01" }).first().click();
  await page.getByRole("button", { name: /酒红针织衫/ }).click();
  await page.getByRole("button", { name: /AI 试穿：AI 模特 01/ }).click();
  await page.waitForFunction(
    () => {
      const t = document.body.innerText;
      return t.includes("After · AI 结果") && t.includes("生成耗时");
    },
    undefined,
    { timeout: 180000 },
  );
  const out = await page.evaluate(() => document.body.innerText);
  check("before/after shown", out.includes("Before · 原图") && out.includes("After · AI 结果"));
  check("provider + cost shown", out.includes("Local Segmentation（回退）") && out.includes("成本估算：¥0"));
  check("duration shown", /生成耗时：\d+s/.test(out));

  await page.screenshot({ path: "scripts/shots/demo-real-tryon.png" });
} catch (e) {
  check("flow completed", false, e.message.slice(0, 240));
}

console.log(results.join("\n"));
console.log("---CONSOLE ERRORS---");
console.log(errors.length ? errors.slice(0, 8).join("\n") : "(none)");
await browser.close();
