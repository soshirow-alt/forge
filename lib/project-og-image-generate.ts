import "server-only";

import sharp from "sharp";

export const OG_CARD_WIDTH = 1200;
export const OG_CARD_HEIGHT = 630;

const MAX_SOURCE_BYTES = 5 * 1024 * 1024;

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clipTitle(title: string, max = 48): string {
  const normalized = title.replace(/\s+/g, " ").trim() || "Forge";
  if (normalized.length <= max) {
    return normalized;
  }
  return `${normalized.slice(0, max - 1)}…`;
}

function titleOverlaySvg(title: string): Buffer {
  const safeTitle = escapeXml(clipTitle(title));
  const svg = `<svg width="${OG_CARD_WIDTH}" height="${OG_CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="55%" stop-color="rgba(9,9,11,0)"/>
      <stop offset="100%" stop-color="rgba(9,9,11,0.82)"/>
    </linearGradient>
  </defs>
  <rect x="0" y="320" width="${OG_CARD_WIDTH}" height="310" fill="url(#fade)"/>
  <text x="40" y="560" font-family="system-ui, sans-serif" font-size="42" font-weight="700" fill="#fafafa">${safeTitle}</text>
  <text x="40" y="598" font-family="system-ui, sans-serif" font-size="20" font-weight="600" fill="#a1a1aa">Forge</text>
</svg>`;
  return Buffer.from(svg);
}

/**
 * Build a 1200×630 JPEG OGP card — cover crop from thumb, title label at bottom.
 */
export async function generateProjectOgJpeg(
  title: string,
  sourceBytes: Buffer,
): Promise<Buffer> {
  if (sourceBytes.length > MAX_SOURCE_BYTES) {
    throw new Error("Source image too large for OGP");
  }

  const cover = await sharp(sourceBytes)
    .rotate()
    .resize(OG_CARD_WIDTH, OG_CARD_HEIGHT, {
      fit: "cover",
      position: "centre",
    })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();

  return sharp(cover)
    .composite([{ input: titleOverlaySvg(title), top: 0, left: 0 }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
}

/** Title-only card when no usable thumb (edge case — still project-specific). */
export async function generateProjectOgJpegWithoutThumb(
  title: string,
): Promise<Buffer> {
  const safeTitle = escapeXml(clipTitle(title, 56));
  const svg = `<svg width="${OG_CARD_WIDTH}" height="${OG_CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#18181b"/>
  <text x="72" y="300" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="#a78bfa">FORGE</text>
  <text x="72" y="380" font-family="system-ui, sans-serif" font-size="64" font-weight="700" fill="#fafafa">${safeTitle}</text>
</svg>`;

  return sharp(Buffer.from(svg)).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
}
