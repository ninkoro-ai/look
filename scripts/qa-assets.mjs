import { chromium } from "playwright-core";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = process.env.QA_BASE || "http://localhost:3000";

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page.goto(`${BASE}/wardrobe`, { waitUntil: "networkidle" });
await page.waitForSelector("button.group img", { timeout: 20000 });

const results = await page.evaluate(async () => {
  const imgs = Array.from(document.querySelectorAll("button.group img"));
  const out = [];
  for (const img of imgs) {
    const src = img.getAttribute("src");
    if (!src) continue;
    try {
      const loaded = new Image();
      loaded.src = src;
      await loaded.decode();
      const c = document.createElement("canvas");
      c.width = loaded.naturalWidth;
      c.height = loaded.naturalHeight;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(loaded, 0, 0);
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      let opaque = 0;
      let colored = 0;
      let total = 0;
      for (let i = 0; i < data.length; i += 64) {
        total++;
        if (data[i + 3] > 0) {
          opaque++;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r) > 40) colored++;
        }
      }
      out.push({
        name: img.alt,
        w: loaded.naturalWidth,
        h: loaded.naturalHeight,
        opaqueRatio: +(opaque / total).toFixed(2),
        coloredRatio: +(colored / total).toFixed(2),
      });
    } catch {
      out.push({ name: img.alt, error: true });
    }
  }
  return out;
});

const bad = results.filter((r) => r.error || r.opaqueRatio < 0.35 || r.coloredRatio < 0.03);
console.log(`checked ${results.length} assets`);
console.log(bad.length ? `BAD:\n${JSON.stringify(bad, null, 2)}` : "all assets have visible content");
console.log(`sample: ${JSON.stringify(results.slice(0, 4), null, 2)}`);
await browser.close();
