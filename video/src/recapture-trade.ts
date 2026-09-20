import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dest = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "captures", "trade.png");

async function pick(page: import("playwright").Page, index: number, query: string) {
  const tokenButtons = page.locator("button").filter({ has: page.locator("b") });
  await tokenButtons.nth(index).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 8000 });
  const search = dialog.locator("input").first();
  if (await search.count()) await search.fill(query);
  await page.waitForTimeout(300);
  await dialog.getByText(query, { exact: true }).first().click({ timeout: 8000 });
  await page.waitForTimeout(400);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  await page.goto("http://127.0.0.1:3002/trade/swap", { waitUntil: "networkidle", timeout: 60000 });
  await page.addStyleTag({ content: "* { cursor: none !important; } nextjs-portal { display: none !important; }" });
  await page.waitForTimeout(1800);
  await pick(page, 1, "NVDA");
  await pick(page, 0, "USDG");
  const input = page.locator('input[inputmode="decimal"]').first();
  if (await input.count()) {
    await input.fill("1000");
    await page.waitForTimeout(2500);
  }
  await page.screenshot({ path: dest, type: "png", animations: "disabled", caret: "hide" });
  console.log("wrote", dest);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
