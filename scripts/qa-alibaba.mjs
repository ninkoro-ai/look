import { chromium } from "playwright-core";

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
  await page.goto(`${BASE}/lab/vton/alibaba`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("text=LAB / VTON / ALIBABA", { timeout: 20000 });
  check("alibaba lab page visible", true);

  // 配置状态（静态预览无 functions → 未连接）
  await page.waitForTimeout(1000);
  const body = await page.evaluate(() => document.body.innerText);
  check("config status shown", body.includes("配置状态"));

  // Benchmark 资产未就绪提示
  check("benchmark assets pending", /待补充文件 28 个/.test(body), "person-01..08 + garment-01..20");
  check("ready count 0/20", /当前就绪：0\/20/.test(body));

  // 输入 + Generate（无服务端 Key/代理 → 应安全失败并显示错误，不崩溃）
  await page.getByRole("button", { name: "sample 1" }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "纯白短袖" }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /Generate/ }).click();
  await page.waitForFunction(
    () => {
      const t = document.body.innerText;
      return t.includes("失败") || t.includes("耗时");
    },
    undefined,
    { timeout: 60000 },
  );
  const after = await page.evaluate(() => document.body.innerText);
  check("generate fails gracefully without key", after.includes("失败") || after.includes("errorCode"));

  // 导出 JSON（无记录也允许导出空结果）
  const dlPromise = page.waitForEvent("download", { timeout: 10000 });
  await page.getByRole("button", { name: "导出 ALIBABA_BENCHMARK JSON" }).click();
  const dl = await dlPromise;
  check("export json downloads", dl.suggestedFilename().endsWith(".json"), dl.suggestedFilename());

  // 安全：页面不含 Key 特征
  const leak = /sk-[a-z0-9]{16,}|dashscope.*api[_-]?key\s*[:=]\s*['"]/i.test(after);
  check("no api key in page", !leak);

  await page.screenshot({ path: "scripts/shots/lab-vton-alibaba.png" });
} catch (e) {
  check("flow completed", false, e.message.slice(0, 240));
}

console.log(results.join("\n"));
console.log("---CONSOLE ERRORS---");
console.log(errors.length ? errors.slice(0, 8).join("\n") : "(none)");
await browser.close();
