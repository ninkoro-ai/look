import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = process.env.QA_BASE || "http://localhost:4173";
const PHOTO = fileURLToPath(new URL("./test-assets/fullbody-test.jpg", import.meta.url));

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"],
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

const dbAll = (store) =>
  page.evaluate(async (store) => {
    const open = () =>
      new Promise((resolve, reject) => {
        const r = indexedDB.open("chuanda-walk-in-closet", 3);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
    const db = await open();
    const tx = db.transaction(store).objectStore(store);
    const value = await new Promise((resolve, reject) => {
      const req = tx.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return value;
  }, store);

try {
  // 1. 打开导入页
  await page.goto(`${BASE}/import`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("text=上传一张穿搭照片", { timeout: 20000 });
  check("import page opens", true);

  // 2. 上传照片并识别
  await page.locator('input[type="file"]').setInputFiles(PHOTO);
  await page.waitForSelector("text=发现 5 件单品", { timeout: 60000 });
  const rowCount = await page.locator('[data-testid="import-item"]').count();
  check("5 garments detected", rowCount === 5, `rows=${rowCount}`);
  check("summary shows 5", (await page.locator("text=发现 5 件单品").count()) === 1);

  // 3. 删除一件
  await page.locator('[data-testid="import-item"]').first().locator('button[aria-label="删除"]').click();
  const confirmText = await page.locator('[data-testid="import-confirm"]').innerText();
  check("remove works", confirmText.includes("4"), confirmText);

  // 4. 修改分类 + 名称
  const shoeRow = page.locator('[data-testid="import-item"]').filter({ has: page.locator('input[value="小白鞋"]') });
  await shoeRow.locator("select").selectOption("dress");
  const nameInput = shoeRow.locator("input").first();
  await nameInput.fill("奶油吊带裙");
  check("category+name editable", true);

  // 5. 确认导入
  await page.locator('[data-testid="import-confirm"]').click();
  await page.waitForSelector("text=已加入 4 件单品", { timeout: 120000 });
  check("4 items imported", true);
  await page.screenshot({ path: "scripts/shots/import-done.png" });

  // 6. 数据校验
  const wardrobe = await dbAll("wardrobe");
  const importedItems = wardrobe.filter((i) => i.source === "photo-extraction");
  check("db count = 39", wardrobe.length === 39, `count=${wardrobe.length}`);
  check("4 photo-extraction items", importedItems.length === 4, `n=${importedItems.length}`);
  check(
    "items have transparent + original + anchor",
    importedItems.every(
      (i) =>
        Boolean(i.transparentImageUrl) &&
        Boolean(i.originalImageUrl) &&
        Boolean(i.anchor) &&
        Boolean(i.aiMetadata?.confidence),
    ),
  );
  const dressItem = importedItems.find((i) => i.name === "奶油吊带裙");
  check("renamed+categorized item saved", Boolean(dressItem && dressItem.category === "dress"), JSON.stringify(dressItem && { name: dressItem.name, cat: dressItem.category }));
  const demoTop = wardrobe.find((i) => i.id === "top-01");
  check("demo items untouched", Boolean(demoTop && demoTop.source !== "photo-extraction" && demoTop.anchor.x === 190), JSON.stringify(demoTop?.anchor));

  // 7. 衣橱页可见
  await page.goto(`${BASE}/wardrobe`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("text=衣橱", { timeout: 20000 });
  const cardCount = await page.locator("button.group").count();
  check("wardrobe shows 39 cards", cardCount === 39, `cards=${cardCount}`);
  check("imported item visible", (await page.locator("text=奶油吊带裙").count()) >= 1);

  // 8. 换装间使用导入单品
  await page.goto(`${BASE}/dress?outfit=`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("text=我的换装间", { timeout: 20000 });
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "裙子", exact: true }).click();
  await page.waitForTimeout(200);
  const dressButton = page.locator('[data-testid="pick-item"]').filter({ hasText: "奶油吊带裙" });
  check("imported item shown in dress tab", (await dressButton.count()) === 1);
  await dressButton.first().click();
  await page.waitForTimeout(300);
  const layerSrc = await page.locator('[data-layer="dress"]').first().getAttribute("src");
  check(
    "imported garment worn on model",
    Boolean(layerSrc && layerSrc.startsWith("data:image")),
    layerSrc?.slice(0, 26),
  );
  await page.screenshot({ path: "scripts/shots/import-dress.png" });

  // 9. 刷新后数据仍在
  await page.reload({ waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("text=我的换装间", { timeout: 20000 });
  await page.getByRole("button", { name: "裙子", exact: true }).click();
  await page.waitForTimeout(200);
  check("persists after reload", (await page.locator('[data-testid="pick-item"]').filter({ hasText: "奶油吊带裙" }).count()) === 1);
} catch (e) {
  check("flow completed", false, e.message.slice(0, 240));
}

console.log(results.join("\n"));
console.log("---CONSOLE ERRORS---");
console.log(errors.length ? errors.slice(0, 8).join("\n") : "(none)");
await browser.close();
