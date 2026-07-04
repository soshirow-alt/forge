/**
 * One-shot generator for public/images/og-default.png
 * Usage: node scripts/generate-og-default-png.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outPath = join(root, "public", "images", "og-default.png");

async function loadSharp() {
  try {
    return (await import("sharp")).default;
  } catch {
    const require = createRequire(import.meta.url);
    try {
      return require(join(root, "tools", "promo-ai-images", "node_modules", "sharp"));
    } catch {
      return null;
    }
  }
}

const sharp = await loadSharp();
if (!sharp) {
  console.error("sharp is not available. Install sharp or run from tools/promo-ai-images.");
  process.exit(1);
}

const width = 1200;
const height = 630;
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#09090b"/>
  <rect x="48" y="48" width="1104" height="534" rx="24" fill="#18181b" stroke="#3f3f46" stroke-width="2"/>
  <text x="600" y="300" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="700" fill="#fafafa">Forge</text>
  <text x="600" y="380" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#a1a1aa">完成前のゲームの最新版・声・更新をまとめる場所</text>
</svg>
`;

await sharp(Buffer.from(svg)).png().toFile(outPath);
console.log(`Wrote ${outPath}`);
