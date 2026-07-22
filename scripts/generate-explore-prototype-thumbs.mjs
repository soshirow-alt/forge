/**
 * Generates distinct local SVG thumbnails for Explore Prototype.
 * Run: node scripts/generate-explore-prototype-thumbs.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = join(root, "public/images/explore-prototype");

function write(rel, svg) {
  const path = join(base, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, svg.trim() + "\n");
  console.log("wrote", rel);
}

const wrap = (body, bg = "#0c0a12") =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">${body.replace(
    "{{BG}}",
    bg,
  )}</svg>`;

// --- Game scenes ---
write(
  "game/meadow-runner.svg",
  wrap(`
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7dd3fc"/><stop offset="55%" stop-color="#86efac"/><stop offset="100%" stop-color="#166534"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#sky)"/>
  <ellipse cx="480" cy="70" rx="48" ry="28" fill="#fef9c3" opacity="0.9"/>
  <path d="M0 220 Q160 180 320 220 T640 200 L640 360 L0 360Z" fill="#15803d"/>
  <path d="M0 260 Q200 230 400 270 T640 250 L640 360 L0 360Z" fill="#14532d"/>
  <circle cx="180" cy="210" r="28" fill="#fde68a" stroke="#92400e" stroke-width="3"/>
  <circle cx="168" cy="204" r="4" fill="#451a03"/><circle cx="192" cy="204" r="4" fill="#451a03"/>
  <path d="M170 218 Q180 226 190 218" fill="none" stroke="#92400e" stroke-width="2"/>
  <rect x="168" y="236" width="24" height="30" rx="6" fill="#fbbf24"/>
  <g fill="#22c55e" opacity="0.85">
    <ellipse cx="90" cy="250" rx="18" ry="10"/><ellipse cx="120" cy="255" rx="14" ry="8"/>
    <ellipse cx="420" cy="240" rx="22" ry="12"/><ellipse cx="520" cy="255" rx="16" ry="9"/>
  </g>
  <rect x="300" y="160" width="16" height="70" fill="#78350f"/>
  <circle cx="308" cy="150" r="28" fill="#166534"/>
`),
);

write(
  "game/card-duel.svg",
  wrap(`
  <rect width="640" height="360" fill="#1e1b4b"/>
  <rect x="40" y="40" width="560" height="280" rx="16" fill="#312e81" stroke="#6366f1" stroke-width="2"/>
  <ellipse cx="320" cy="180" rx="120" ry="70" fill="#1e1b4b" stroke="#a78bfa" stroke-width="2"/>
  <g transform="translate(140,90)">
    <rect width="90" height="130" rx="10" fill="#4c1d95" stroke="#c4b5fd" stroke-width="2"/>
    <circle cx="45" cy="50" r="22" fill="#f472b6"/><text x="45" y="110" text-anchor="middle" fill="#ede9fe" font-size="14" font-family="sans-serif">炎</text>
  </g>
  <g transform="translate(410,90)">
    <rect width="90" height="130" rx="10" fill="#0f766e" stroke="#5eead4" stroke-width="2"/>
    <polygon points="45,28 62,70 28,70" fill="#99f6e4"/>
    <text x="45" y="110" text-anchor="middle" fill="#ccfbf1" font-size="14" font-family="sans-serif">水</text>
  </g>
  <rect x="250" y="250" width="140" height="36" rx="8" fill="#18181b" stroke="#818cf8" stroke-width="1.5"/>
  <text x="320" y="274" text-anchor="middle" fill="#c7d2fe" font-size="13" font-family="sans-serif">手札 5</text>
`),
);

write(
  "game/puzzle-grid.svg",
  wrap(`
  <rect width="640" height="360" fill="#0f172a"/>
  <rect x="120" y="40" width="400" height="280" rx="12" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
  ${[0, 1, 2, 3]
    .map((r) =>
      [0, 1, 2, 3]
        .map((c) => {
          const colors = ["#f97316", "#22d3ee", "#a855f7", "#84cc16", "#f43f5e", "#eab308"];
          const i = (r * 4 + c) % colors.length;
          const empty = r === 2 && c === 1;
          return empty
            ? `<rect x="${140 + c * 90}" y="${60 + r * 60}" width="70" height="48" rx="6" fill="#0f172a" stroke="#475569" stroke-width="1.5" stroke-dasharray="4 3"/>`
            : `<rect x="${140 + c * 90}" y="${60 + r * 60}" width="70" height="48" rx="6" fill="${colors[i]}" opacity="0.9"/>`;
        })
        .join(""),
    )
    .join("")}
`),
);

write(
  "game/novel-dialog.svg",
  wrap(`
  <defs>
    <linearGradient id="room" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3b0764"/><stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#room)"/>
  <rect x="80" y="40" width="200" height="160" rx="4" fill="#fef3c7" opacity="0.15"/>
  <circle cx="480" cy="150" r="70" fill="#f5d0fe" opacity="0.25"/>
  <ellipse cx="480" cy="150" rx="36" ry="48" fill="#fce7f3" opacity="0.5"/>
  <rect x="40" y="230" width="560" height="100" rx="12" fill="#18181b" stroke="#c084fc" stroke-width="2"/>
  <text x="64" y="268" fill="#e9d5ff" font-size="18" font-family="sans-serif">「……この街の灯りは、嘘をついている。」</text>
  <text x="64" y="300" fill="#a1a1aa" font-size="14" font-family="sans-serif">選択肢を選んで続きを読む</text>
  <rect x="400" y="286" width="160" height="28" rx="6" fill="#4c1d95"/>
  <text x="480" y="305" text-anchor="middle" fill="#f5f3ff" font-size="12" font-family="sans-serif">次へ ▶</text>
`),
);

write(
  "game/town-map.svg",
  wrap(`
  <rect width="640" height="360" fill="#0c4a6e"/>
  <rect x="0" y="200" width="640" height="160" fill="#075985"/>
  <path d="M0 220 L120 180 L240 210 L360 160 L480 200 L640 170 L640 360 L0 360Z" fill="#166534" opacity="0.7"/>
  <rect x="80" y="140" width="70" height="70" fill="#92400e"/><polygon points="80,140 115,110 150,140" fill="#b91c1c"/>
  <rect x="220" y="120" width="90" height="90" fill="#a16207"/><polygon points="220,120 265,85 310,120" fill="#ca8a04"/>
  <rect x="400" y="150" width="60" height="55" fill="#7c2d12"/>
  <rect x="500" y="110" width="80" height="100" fill="#1e3a8a"/><rect x="520" y="130" width="18" height="18" fill="#93c5fd"/>
  <path d="M40 280 Q200 250 320 290 T600 270" fill="none" stroke="#fde68a" stroke-width="8" stroke-linecap="round"/>
  <circle cx="200" cy="265" r="10" fill="#fbbf24" stroke="#fff" stroke-width="2"/>
  <circle cx="420" cy="278" r="8" fill="#38bdf8" stroke="#fff" stroke-width="2"/>
`),
);

// --- Audio ---
write(
  "audio/album-cover.svg",
  wrap(`
  <defs>
    <radialGradient id="vinyl" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#f472b6"/><stop offset="55%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#0f172a"/>
    </radialGradient>
  </defs>
  <rect width="640" height="360" fill="#0a0a0a"/>
  <circle cx="320" cy="180" r="130" fill="url(#vinyl)"/>
  <circle cx="320" cy="180" r="28" fill="#18181b" stroke="#f9a8d4" stroke-width="3"/>
  <circle cx="320" cy="180" r="8" fill="#f472b6"/>
  <path d="M200 120 Q320 60 440 120" fill="none" stroke="#fce7f3" stroke-width="2" opacity="0.5"/>
  <path d="M210 240 Q320 300 430 240" fill="none" stroke="#c4b5fd" stroke-width="2" opacity="0.5"/>
`),
);

write(
  "audio/bgm-landscape.svg",
  wrap(`
  <defs>
    <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e3a8a"/><stop offset="40%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#dusk)"/>
  <circle cx="480" cy="90" r="40" fill="#fde68a" opacity="0.85"/>
  <path d="M0 220 L80 160 L160 200 L240 140 L320 190 L400 130 L480 180 L560 150 L640 200 L640 360 L0 360Z" fill="#1e1b4b"/>
  <path d="M0 280 Q160 240 320 280 T640 260 L640 360 L0 360Z" fill="#0f172a"/>
  <g stroke="#a78bfa" stroke-width="2" fill="none" opacity="0.7">
    <path d="M60 300 Q100 260 140 300 T220 300"/><path d="M280 310 Q320 270 360 310 T440 310"/>
  </g>
`),
);

write(
  "audio/sfx-wave.svg",
  wrap(`
  <rect width="640" height="360" fill="#111827"/>
  <rect x="60" y="60" width="520" height="240" rx="16" fill="#1f2937" stroke="#34d399" stroke-width="2"/>
  ${Array.from({ length: 48 }, (_, i) => {
    const h = 20 + ((i * 17) % 140);
    const x = 90 + i * 10;
    return `<rect x="${x}" y="${180 - h / 2}" width="6" height="${h}" rx="2" fill="${i % 3 === 0 ? "#34d399" : i % 3 === 1 ? "#6ee7b7" : "#a7f3d0"}" opacity="0.9"/>`;
  }).join("")}
  <circle cx="320" cy="180" r="18" fill="#064e3b" stroke="#6ee7b7" stroke-width="2"/>
`),
);

write(
  "audio/voice-booth.svg",
  wrap(`
  <rect width="640" height="360" fill="#18181b"/>
  <rect x="180" y="50" width="280" height="260" rx="20" fill="#27272a" stroke="#a1a1aa" stroke-width="2"/>
  <rect x="210" y="80" width="220" height="140" rx="8" fill="#0f172a"/>
  <ellipse cx="320" cy="150" rx="50" ry="40" fill="none" stroke="#f472b6" stroke-width="4"/>
  <rect x="300" y="188" width="40" height="50" rx="8" fill="#52525b"/>
  <rect x="250" y="250" width="140" height="28" rx="6" fill="#3f3f46"/>
  <circle cx="280" cy="264" r="6" fill="#ef4444"/><circle cx="320" cy="264" r="6" fill="#22c55e"/><circle cx="360" cy="264" r="6" fill="#3b82f6"/>
  <path d="M120 200 Q160 120 200 180" fill="none" stroke="#c084fc" stroke-width="3" opacity="0.6"/>
  <path d="M440 180 Q480 100 520 200" fill="none" stroke="#c084fc" stroke-width="3" opacity="0.6"/>
`),
);

write(
  "audio/drama-stage.svg",
  wrap(`
  <defs>
    <linearGradient id="stage" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4c0519"/><stop offset="100%" stop-color="#1c1917"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#stage)"/>
  <path d="M80 40 Q320 100 560 40 L560 80 Q320 140 80 80Z" fill="#7f1d1d" opacity="0.8"/>
  <rect x="100" y="160" width="440" height="120" rx="8" fill="#292524" stroke="#fbbf24" stroke-width="2"/>
  <text x="320" y="210" text-anchor="middle" fill="#fde68a" font-size="20" font-family="serif">夜汽車の対話</text>
  <text x="320" y="245" text-anchor="middle" fill="#a8a29e" font-size="13" font-family="sans-serif">音声ドラマ · 第1話</text>
  <g fill="#fbbf24" opacity="0.4">
    <circle cx="160" cy="100" r="8"/><circle cx="480" cy="100" r="8"/>
  </g>
`),
);

// --- Dev tools ---
write(
  "dev-tool/browser-convert.svg",
  wrap(`
  <rect width="640" height="360" fill="#0f172a"/>
  <rect x="40" y="36" width="560" height="288" rx="12" fill="#1e293b" stroke="#64748b" stroke-width="2"/>
  <rect x="40" y="36" width="560" height="36" rx="12" fill="#334155"/>
  <circle cx="64" cy="54" r="6" fill="#f87171"/><circle cx="84" cy="54" r="6" fill="#fbbf24"/><circle cx="104" cy="54" r="6" fill="#4ade80"/>
  <rect x="140" y="46" width="280" height="16" rx="4" fill="#0f172a"/>
  <rect x="70" y="100" width="200" height="160" rx="8" fill="#0f172a" stroke="#38bdf8"/>
  <text x="170" y="140" text-anchor="middle" fill="#94a3b8" font-size="14" font-family="sans-serif">JSON</text>
  <rect x="90" y="160" width="160" height="10" rx="2" fill="#334155"/><rect x="90" y="180" width="120" height="10" rx="2" fill="#334155"/>
  <polygon points="300,170 330,185 300,200" fill="#818cf8"/>
  <rect x="360" y="100" width="200" height="160" rx="8" fill="#0f172a" stroke="#a78bfa"/>
  <text x="460" y="140" text-anchor="middle" fill="#c4b5fd" font-size="14" font-family="sans-serif">CSV</text>
  <rect x="380" y="160" width="160" height="10" rx="2" fill="#4c1d95"/><rect x="380" y="180" width="100" height="10" rx="2" fill="#4c1d95"/>
`),
);

write(
  "dev-tool/editor-plugin.svg",
  wrap(`
  <rect width="640" height="360" fill="#111827"/>
  <rect x="0" y="0" width="160" height="360" fill="#1f2937"/>
  <rect x="20" y="24" width="120" height="12" rx="2" fill="#6b7280"/>
  ${[0, 1, 2, 3, 4].map((i) => `<rect x="20" y="${60 + i * 36}" width="${90 - i * 8}" height="16" rx="3" fill="${i === 2 ? "#7c3aed" : "#374151"}"/>`).join("")}
  <rect x="160" y="0" width="480" height="360" fill="#0b1220"/>
  <text x="190" y="50" fill="#64748b" font-size="12" font-family="monospace">plugin.ts</text>
  <text x="190" y="90" fill="#93c5fd" font-size="14" font-family="monospace">export function activate() {</text>
  <text x="210" y="120" fill="#86efac" font-size="14" font-family="monospace">registerCommand(…)</text>
  <text x="190" y="150" fill="#93c5fd" font-size="14" font-family="monospace">}</text>
  <rect x="400" y="200" width="200" height="120" rx="8" fill="#1e1b4b" stroke="#a78bfa"/>
  <text x="500" y="250" text-anchor="middle" fill="#e9d5ff" font-size="13" font-family="sans-serif">Forge Lint</text>
  <text x="500" y="280" text-anchor="middle" fill="#a78bfa" font-size="11" font-family="sans-serif">拡張機能パネル</text>
`),
);

write(
  "dev-tool/node-workflow.svg",
  wrap(`
  <rect width="640" height="360" fill="#0c0a12"/>
  <g stroke="#6366f1" stroke-width="2">
    <line x1="160" y1="120" x2="280" y2="180"/><line x1="160" y1="240" x2="280" y2="180"/>
    <line x1="380" y1="180" x2="500" y2="120"/><line x1="380" y1="180" x2="500" y2="240"/>
  </g>
  <rect x="60" y="90" width="100" height="60" rx="10" fill="#312e81" stroke="#818cf8" stroke-width="2"/>
  <text x="110" y="125" text-anchor="middle" fill="#e0e7ff" font-size="12" font-family="sans-serif">入力</text>
  <rect x="60" y="210" width="100" height="60" rx="10" fill="#134e4a" stroke="#2dd4bf" stroke-width="2"/>
  <text x="110" y="245" text-anchor="middle" fill="#ccfbf1" font-size="12" font-family="sans-serif">設定</text>
  <rect x="280" y="150" width="100" height="60" rx="10" fill="#4c1d95" stroke="#c084fc" stroke-width="2"/>
  <text x="330" y="185" text-anchor="middle" fill="#f3e8ff" font-size="12" font-family="sans-serif">変換</text>
  <rect x="500" y="90" width="100" height="60" rx="10" fill="#1e3a8a" stroke="#60a5fa" stroke-width="2"/>
  <text x="550" y="125" text-anchor="middle" fill="#dbeafe" font-size="12" font-family="sans-serif">出力</text>
  <rect x="500" y="210" width="100" height="60" rx="10" fill="#7f1d1d" stroke="#f87171" stroke-width="2"/>
  <text x="550" y="245" text-anchor="middle" fill="#fecaca" font-size="12" font-family="sans-serif">ログ</text>
`),
);

write(
  "dev-tool/cli-terminal.svg",
  wrap(`
  <rect width="640" height="360" fill="#020617"/>
  <rect x="50" y="40" width="540" height="280" rx="10" fill="#0f172a" stroke="#22c55e" stroke-width="2"/>
  <rect x="50" y="40" width="540" height="32" fill="#14532d"/>
  <text x="70" y="62" fill="#86efac" font-size="13" font-family="monospace">forge-cli — bash</text>
  <text x="70" y="110" fill="#4ade80" font-size="15" font-family="monospace">$ forge build --watch</text>
  <text x="70" y="145" fill="#a3e635" font-size="14" font-family="monospace">✓ compiled in 1.2s</text>
  <text x="70" y="180" fill="#a3e635" font-size="14" font-family="monospace">✓ 24 modules</text>
  <text x="70" y="215" fill="#86efac" font-size="14" font-family="monospace">watching for changes…</text>
  <text x="70" y="260" fill="#4ade80" font-size="15" font-family="monospace">$ ▍</text>
`),
);

write(
  "dev-tool/api-console.svg",
  wrap(`
  <rect width="640" height="360" fill="#111827"/>
  <rect x="30" y="30" width="580" height="300" rx="10" fill="#1f2937"/>
  <rect x="50" y="50" width="70" height="28" rx="6" fill="#16a34a"/>
  <text x="85" y="69" text-anchor="middle" fill="#fff" font-size="12" font-family="sans-serif">GET</text>
  <rect x="130" y="50" width="360" height="28" rx="6" fill="#0f172a" stroke="#475569"/>
  <text x="145" y="69" fill="#94a3b8" font-size="12" font-family="monospace">/v1/projects/:id</text>
  <rect x="510" y="50" width="80" height="28" rx="6" fill="#7c3aed"/>
  <text x="550" y="69" text-anchor="middle" fill="#fff" font-size="12" font-family="sans-serif">Send</text>
  <rect x="50" y="100" width="250" height="200" rx="8" fill="#0f172a" stroke="#334155"/>
  <text x="70" y="130" fill="#64748b" font-size="12" font-family="sans-serif">Headers</text>
  <rect x="70" y="150" width="200" height="10" rx="2" fill="#334155"/><rect x="70" y="170" width="160" height="10" rx="2" fill="#334155"/>
  <rect x="320" y="100" width="270" height="200" rx="8" fill="#0f172a" stroke="#334155"/>
  <text x="340" y="130" fill="#86efac" font-size="12" font-family="monospace">200 OK</text>
  <text x="340" y="160" fill="#93c5fd" font-size="12" font-family="monospace">{"id":"…"}</text>
`),
);

// --- Service / app ---
write(
  "service-app/habit-tracker.svg",
  wrap(`
  <rect width="640" height="360" fill="#ecfdf5"/>
  <rect x="80" y="40" width="480" height="280" rx="24" fill="#fff" stroke="#a7f3d0" stroke-width="3"/>
  <text x="320" y="90" text-anchor="middle" fill="#065f46" font-size="22" font-family="sans-serif">今日の習慣</text>
  ${["水分", "読書", "散歩"].map((label, i) => `
    <rect x="120" y="${120 + i * 55}" width="400" height="42" rx="10" fill="${i === 1 ? "#d1fae5" : "#f0fdf4"}" stroke="#6ee7b7"/>
    <circle cx="150" cy="${141 + i * 55}" r="12" fill="${i < 2 ? "#10b981" : "#fff"}" stroke="#059669" stroke-width="2"/>
    <text x="180" y="${147 + i * 55}" fill="#064e3b" font-size="16" font-family="sans-serif">${label}</text>
  `).join("")}
`),
);

write(
  "service-app/study-deck.svg",
  wrap(`
  <rect width="640" height="360" fill="#eff6ff"/>
  <rect x="120" y="50" width="400" height="260" rx="20" fill="#fff" stroke="#93c5fd" stroke-width="3" transform="rotate(-2 320 180)"/>
  <rect x="140" y="70" width="360" height="220" rx="16" fill="#dbeafe"/>
  <text x="320" y="160" text-anchor="middle" fill="#1e3a8a" font-size="20" font-family="sans-serif">光合成とは？</text>
  <text x="320" y="200" text-anchor="middle" fill="#3b82f6" font-size="14" font-family="sans-serif">タップして答えを表示</text>
  <rect x="200" y="240" width="100" height="32" rx="8" fill="#ef4444" opacity="0.85"/>
  <rect x="340" y="240" width="100" height="32" rx="8" fill="#22c55e" opacity="0.85"/>
`),
);

write(
  "service-app/notes-board.svg",
  wrap(`
  <rect width="640" height="360" fill="#fafaf9"/>
  <rect x="40" y="40" width="180" height="120" rx="8" fill="#fef08a" transform="rotate(-3 130 100)"/>
  <rect x="240" y="50" width="180" height="140" rx="8" fill="#bbf7d0"/>
  <rect x="440" y="40" width="160" height="110" rx="8" fill="#fecaca" transform="rotate(2 520 95)"/>
  <rect x="80" y="200" width="200" height="120" rx="8" fill="#e0e7ff"/>
  <rect x="320" y="220" width="240" height="100" rx="8" fill="#fce7f3"/>
  <text x="130" y="100" text-anchor="middle" fill="#713f12" font-size="14" font-family="sans-serif">アイデア</text>
  <text x="330" y="120" text-anchor="middle" fill="#14532d" font-size="14" font-family="sans-serif">タスク</text>
  <text x="520" y="95" text-anchor="middle" fill="#7f1d1d" font-size="14" font-family="sans-serif">メモ</text>
`),
);

write(
  "service-app/budget-home.svg",
  wrap(`
  <rect width="640" height="360" fill="#fff7ed"/>
  <rect x="60" y="40" width="520" height="280" rx="16" fill="#fff" stroke="#fdba74" stroke-width="2"/>
  <text x="320" y="90" text-anchor="middle" fill="#9a3412" font-size="18" font-family="sans-serif">今月の家計</text>
  <circle cx="220" cy="200" r="70" fill="none" stroke="#fed7aa" stroke-width="18"/>
  <circle cx="220" cy="200" r="70" fill="none" stroke="#f97316" stroke-width="18" stroke-dasharray="140 300" stroke-linecap="round" transform="rotate(-90 220 200)"/>
  <text x="220" y="205" text-anchor="middle" fill="#c2410c" font-size="16" font-family="sans-serif">68%</text>
  <rect x="340" y="150" width="200" height="18" rx="4" fill="#ffedd5"/><rect x="340" y="150" width="140" height="18" rx="4" fill="#fb923c"/>
  <rect x="340" y="190" width="200" height="18" rx="4" fill="#ffedd5"/><rect x="340" y="190" width="90" height="18" rx="4" fill="#fdba74"/>
  <rect x="340" y="230" width="200" height="18" rx="4" fill="#ffedd5"/><rect x="340" y="230" width="160" height="18" rx="4" fill="#ea580c"/>
`),
);

write(
  "service-app/community-feed.svg",
  wrap(`
  <rect width="640" height="360" fill="#f5f3ff"/>
  <rect x="100" y="30" width="440" height="300" rx="20" fill="#fff" stroke="#c4b5fd" stroke-width="2"/>
  <circle cx="150" cy="80" r="22" fill="#a78bfa"/>
  <rect x="190" y="68" width="160" height="12" rx="3" fill="#ddd6fe"/>
  <rect x="190" y="88" width="100" height="8" rx="2" fill="#ede9fe"/>
  <rect x="130" y="120" width="380" height="100" rx="10" fill="#ede9fe"/>
  <rect x="130" y="240" width="180" height="50" rx="8" fill="#f5f3ff" stroke="#c4b5fd"/>
  <rect x="330" y="240" width="180" height="50" rx="8" fill="#f5f3ff" stroke="#c4b5fd"/>
  <text x="220" y="270" text-anchor="middle" fill="#6d28d9" font-size="13" font-family="sans-serif">共感 24</text>
  <text x="420" y="270" text-anchor="middle" fill="#6d28d9" font-size="13" font-family="sans-serif">返信 8</text>
`),
);

// --- Fallbacks ---
write(
  "fallback/game.svg",
  wrap(`
  <rect width="640" height="360" fill="#1a1025"/>
  <rect x="80" y="70" width="200" height="120" rx="12" fill="#4c1d95" stroke="#a78bfa" stroke-width="2"/>
  <circle cx="420" cy="140" r="55" fill="#7c3aed" opacity="0.5"/>
  <polygon points="320,220 380,300 260,300" fill="#c084fc" opacity="0.7"/>
  <text x="320" y="330" text-anchor="middle" fill="#c4b5fd" font-size="16" font-family="sans-serif">ゲーム・インタラクティブ</text>
`),
);

write(
  "fallback/audio.svg",
  wrap(`
  <rect width="640" height="360" fill="#0f172a"/>
  <circle cx="320" cy="160" r="80" fill="none" stroke="#34d399" stroke-width="8"/>
  <circle cx="320" cy="160" r="40" fill="none" stroke="#6ee7b7" stroke-width="5"/>
  <circle cx="320" cy="160" r="12" fill="#34d399"/>
  <path d="M120 260 Q200 200 280 260 T440 260 T560 240" fill="none" stroke="#a7f3d0" stroke-width="3"/>
  <text x="320" y="320" text-anchor="middle" fill="#6ee7b7" font-size="16" font-family="sans-serif">音楽・音声</text>
`),
);

write(
  "fallback/dev-tool.svg",
  wrap(`
  <rect width="640" height="360" fill="#111827"/>
  <rect x="120" y="80" width="400" height="180" rx="10" fill="#1f2937" stroke="#818cf8" stroke-width="2"/>
  <text x="160" y="140" fill="#a5b4fc" font-size="18" font-family="monospace">&lt;/&gt;</text>
  <rect x="160" y="170" width="220" height="12" rx="2" fill="#4c1d95"/>
  <rect x="160" y="200" width="160" height="12" rx="2" fill="#312e81"/>
  <text x="320" y="310" text-anchor="middle" fill="#a5b4fc" font-size="16" font-family="sans-serif">開発ツール</text>
`),
);

write(
  "fallback/service-app.svg",
  wrap(`
  <rect width="640" height="360" fill="#1e1b4b"/>
  <rect x="200" y="50" width="240" height="220" rx="28" fill="#312e81" stroke="#c4b5fd" stroke-width="3"/>
  <rect x="220" y="80" width="200" height="150" rx="8" fill="#1e1b4b"/>
  <rect x="235" y="100" width="80" height="40" rx="6" fill="#7c3aed"/>
  <rect x="325" y="100" width="80" height="40" rx="6" fill="#5b21b6"/>
  <rect x="235" y="155" width="170" height="50" rx="6" fill="#4c1d95"/>
  <text x="320" y="310" text-anchor="middle" fill="#ddd6fe" font-size="16" font-family="sans-serif">Webサービス・アプリ</text>
`),
);

console.log("done");
