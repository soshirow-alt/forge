/**
 * PNG export for promo artboards — run from tools/promo-artboards only.
 *
 *   npx --yes playwright install chromium
 *   node export-png.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, "output");

const PAGES = [
  { file: "home.html", name: "01-home" },
  { file: "game-detail.html", name: "02-game-detail" },
  { file: "voices.html", name: "03-voices" },
  { file: "community.html", name: "04-community" },
];

const VIEWPORTS = [{ width: 1200, height: 675, suffix: "1200x675" }];

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();

for (const viewport of VIEWPORTS) {
  for (const pageDef of PAGES) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
    });

    const fileUrl = pathToFileURL(path.join(__dirname, pageDef.file)).href;
    await page.goto(fileUrl, { waitUntil: "load" });

    const outPath = path.join(
      outputDir,
      `${pageDef.name}-${viewport.suffix}.png`,
    );

    await page.locator(".artboard").screenshot({ path: outPath });
    console.log("Wrote", outPath);
    await page.close();
  }
}

await browser.close();
console.log("Done.");
