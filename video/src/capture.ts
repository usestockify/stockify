/**
 * Capture the live Vaultly UI at film resolution.
 * Isolated from production — does not change app data or wallet state.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const captures = path.join(root, "public", "captures");
const stocks = path.join(root, "public", "stocks");
const WIDTH = 1920;
const HEIGHT = 1080;

const PAGES: Array<{ name: string; url: string; wait?: number; ready?: string }> = [
  { name: "home", url: "/", wait: 2200 },
  { name: "markets", url: "/markets", wait: 1800 },
  { name: "nvda", url: "/vaults/nvda", wait: 2200 },
  { name: "trade", url: "/trade/swap", wait: 1600 },
  { name: "docs", url: "/docs", wait: 1400 },
  { name: "portfolio", url: "/portfolio", wait: 1200 },
];

async function findBase(): Promise<string> {
  const ports = (process.env.STOCKIFY_URL ? [process.env.STOCKIFY_URL] : []).concat([
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:3001",
  ]);
  for (const base of ports) {
    try {
      const res = await fetch(base, { signal: AbortSignal.timeout(4000) });
      if (res.ok || res.status === 304) return base.replace(/\/$/, "");
    } catch {
      // try next
    }
  }
  throw new Error("Vaultly dev server not reachable on 3000/3001/3002. Start it, then re-run capture.");
}

async function main() {
  fs.mkdirSync(captures, { recursive: true });
  fs.mkdirSync(stocks, { recursive: true });
  const base = await findBase();
  console.log("capturing", base);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 2,
    colorScheme: "light",
  });
  await page.addInitScript(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: String(query).includes("prefers-reduced-motion") ? false : false,
        media: query,
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() {
          return false;
        },
      }),
    });
  });

  try {
    const catalog = await page.request.get(`${base}/api/markets/catalog`);
    if (catalog.ok()) {
      const json = (await catalog.json()) as { data?: Array<{ symbol: string; logoUrl?: string | null }> };
      const rows = json.data ?? [];
      for (const row of rows) {
        if (!row.logoUrl) continue;
        const dest = path.join(stocks, `${row.symbol.toLowerCase()}.png`);
        try {
          const img = await page.request.get(row.logoUrl);
          if (img.ok()) {
            const buf = Buffer.from(await img.body());
            fs.writeFileSync(dest, buf);
            console.log("logo", row.symbol, dest);
          }
        } catch (err) {
          console.warn("logo failed", row.symbol, err);
        }
      }
    }
  } catch (err) {
    console.warn("catalog logos skipped", err);
  }

  const hide = `
    * { cursor: none !important; }
    nextjs-portal, [data-nextjs-toast], #webpack-dev-server-client-overlay { display: none !important; }
  `;

  for (const shot of PAGES) {
    const target = `${base}${shot.url}`;
    console.log("page", target);
    await page.goto(target, { waitUntil: "networkidle", timeout: 60000 });
    await page.addStyleTag({ content: hide });
    await page.waitForTimeout(shot.wait ?? 1000);
    if (shot.name === "trade") {
      await page.waitForTimeout(800);
      const pick = async (index: number, query: string) => {
        const tokenButtons = page.locator("button").filter({ has: page.locator("b") });
        await tokenButtons.nth(index).click();
        const dialog = page.getByRole("dialog");
        await dialog.waitFor({ timeout: 8000 });
        const search = dialog.locator("input").first();
        if (await search.count()) await search.fill(query);
        await page.waitForTimeout(250);
        await dialog.getByText(query, { exact: true }).first().click({ timeout: 8000 });
        await page.waitForTimeout(350);
      };
      try {
        await pick(1, "NVDA");
        await pick(0, "USDG");
      } catch (err) {
        console.warn("trade token pick failed", err);
      }
      const input = page.locator('input[inputmode="decimal"]').first();
      if (await input.count()) {
        await input.fill("1000");
        await page.waitForTimeout(2200);
      }
    }
    await page.screenshot({
      path: path.join(captures, `${shot.name}.png`),
      type: "png",
      animations: "disabled",
      caret: "hide",
    });
  }

  await browser.close();
  console.log("captures written to", captures);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
