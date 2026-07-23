/**
 * Generates distinct, high-contrast local SVG thumbnails for Explore Prototype.
 * Forge black×purple tone, but bright enough to read on dark cards.
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

const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">${body}</svg>`;

// --- Game scenes ---
write(
  "game/meadow-runner.svg",
  svg(`
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#bae6fd"/><stop offset="45%" stop-color="#86efac"/><stop offset="100%" stop-color="#22c55e"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#sky)"/>
  <ellipse cx="500" cy="64" rx="56" ry="32" fill="#fef08a"/>
  <path d="M0 200 Q160 150 320 200 T640 180 L640 360 L0 360Z" fill="#16a34a"/>
  <path d="M0 250 Q200 210 400 260 T640 240 L640 360 L0 360Z" fill="#15803d"/>
  <circle cx="170" cy="195" r="34" fill="#fde68a" stroke="#92400e" stroke-width="4"/>
  <circle cx="156" cy="188" r="5" fill="#451a03"/><circle cx="186" cy="188" r="5" fill="#451a03"/>
  <path d="M156 206 Q170 218 186 206" fill="none" stroke="#92400e" stroke-width="3"/>
  <rect x="152" y="226" width="36" height="40" rx="8" fill="#fbbf24" stroke="#b45309" stroke-width="2"/>
  <g fill="#4ade80">
    <ellipse cx="80" cy="245" rx="22" ry="12"/><ellipse cx="120" cy="255" rx="18" ry="10"/>
    <ellipse cx="430" cy="235" rx="26" ry="14"/><ellipse cx="540" cy="250" rx="20" ry="11"/>
  </g>
  <rect x="300" y="140" width="20" height="80" fill="#92400e"/>
  <circle cx="310" cy="128" r="36" fill="#166534"/>
  <rect x="40" y="300" width="180" height="36" rx="8" fill="#1e1b4b" opacity="0.85"/>
  <text x="130" y="324" text-anchor="middle" fill="#f5f3ff" font-size="16" font-family="sans-serif">SCORE 1280</text>
`),
);

write(
  "game/card-duel.svg",
  svg(`
  <rect width="640" height="360" fill="#6366f1"/>
  <rect x="24" y="24" width="592" height="312" rx="18" fill="#7c3aed" stroke="#f5f3ff" stroke-width="3"/>
  <ellipse cx="320" cy="175" rx="130" ry="78" fill="#4c1d95" stroke="#faf5ff" stroke-width="3"/>
  <g transform="translate(110,70)">
    <rect width="110" height="160" rx="12" fill="#a855f7" stroke="#f5f3ff" stroke-width="3"/>
    <circle cx="55" cy="58" r="28" fill="#fb7185"/><text x="55" y="130" text-anchor="middle" fill="#fff" font-size="20" font-family="sans-serif">炎</text>
  </g>
  <g transform="translate(420,70)">
    <rect width="110" height="160" rx="12" fill="#14b8a6" stroke="#ccfbf1" stroke-width="3"/>
    <polygon points="55,30 78,82 32,82" fill="#99f6e4"/>
    <text x="55" y="130" text-anchor="middle" fill="#042f2e" font-size="20" font-family="sans-serif">水</text>
  </g>
  <rect x="230" y="268" width="180" height="42" rx="10" fill="#312e81" stroke="#e9d5ff" stroke-width="2"/>
  <text x="320" y="296" text-anchor="middle" fill="#f5f3ff" font-size="18" font-family="sans-serif">手札 5</text>
`),
);

write(
  "game/puzzle-grid.svg",
  svg(`
  <rect width="640" height="360" fill="#1e293b"/>
  <rect x="100" y="28" width="440" height="304" rx="16" fill="#334155" stroke="#38bdf8" stroke-width="3"/>
  ${[0, 1, 2, 3]
    .map((r) =>
      [0, 1, 2, 3]
        .map((c) => {
          const colors = ["#fb923c", "#22d3ee", "#c084fc", "#a3e635", "#f43f5e", "#facc15"];
          const i = (r * 4 + c) % colors.length;
          const empty = r === 2 && c === 1;
          return empty
            ? `<rect x="${128 + c * 96}" y="${48 + r * 66}" width="78" height="52" rx="8" fill="#0f172a" stroke="#94a3b8" stroke-width="2" stroke-dasharray="6 4"/>`
            : `<rect x="${128 + c * 96}" y="${48 + r * 66}" width="78" height="52" rx="8" fill="${colors[i]}"/>`;
        })
        .join(""),
    )
    .join("")}
`),
);

write(
  "game/novel-dialog.svg",
  svg(`
  <defs>
    <linearGradient id="room" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6d28d9"/><stop offset="100%" stop-color="#312e81"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#room)"/>
  <rect x="70" y="36" width="220" height="170" rx="6" fill="#fde68a" opacity="0.35"/>
  <circle cx="490" cy="140" r="78" fill="#f0abfc" opacity="0.55"/>
  <ellipse cx="490" cy="145" rx="40" ry="54" fill="#fce7f3"/>
  <circle cx="475" cy="135" r="5" fill="#4c1d95"/><circle cx="505" cy="135" r="5" fill="#4c1d95"/>
  <rect x="28" y="220" width="584" height="116" rx="14" fill="#1e1b4b" stroke="#e9d5ff" stroke-width="3"/>
  <text x="52" y="262" fill="#faf5ff" font-size="20" font-family="sans-serif">「……この街の灯りは、嘘をついている。」</text>
  <text x="52" y="298" fill="#c4b5fd" font-size="15" font-family="sans-serif">選択肢を選んで続きを読む</text>
  <rect x="420" y="280" width="160" height="34" rx="8" fill="#a78bfa"/>
  <text x="500" y="303" text-anchor="middle" fill="#1e1b4b" font-size="14" font-weight="700" font-family="sans-serif">次へ ▶</text>
`),
);

write(
  "game/town-map.svg",
  svg(`
  <rect width="640" height="360" fill="#0284c7"/>
  <rect x="0" y="190" width="640" height="170" fill="#0369a1"/>
  <path d="M0 210 L120 165 L240 200 L360 145 L480 190 L640 155 L640 360 L0 360Z" fill="#22c55e"/>
  <rect x="70" y="125" width="80" height="80" fill="#b45309"/><polygon points="70,125 110,90 150,125" fill="#ef4444"/>
  <rect x="210" y="105" width="100" height="100" fill="#ca8a04"/><polygon points="210,105 260,65 310,105" fill="#eab308"/>
  <rect x="390" y="135" width="70" height="65" fill="#9a3412"/>
  <rect x="490" y="95" width="90" height="110" fill="#1d4ed8"/><rect x="512" y="120" width="22" height="22" fill="#bfdbfe"/>
  <path d="M36 275 Q200 240 320 285 T600 260" fill="none" stroke="#fef08a" stroke-width="10" stroke-linecap="round"/>
  <circle cx="200" cy="258" r="14" fill="#fbbf24" stroke="#fff" stroke-width="3"/>
  <circle cx="430" cy="272" r="12" fill="#38bdf8" stroke="#fff" stroke-width="3"/>
  <rect x="20" y="20" width="160" height="36" rx="8" fill="#1e1b4b"/>
  <text x="100" y="44" text-anchor="middle" fill="#f5f3ff" font-size="16" font-family="sans-serif">街マップ</text>
`),
);

// --- Audio ---
write(
  "audio/album-cover.svg",
  svg(`
  <defs>
    <radialGradient id="vinyl" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#fda4af"/><stop offset="40%" stop-color="#e879f9"/><stop offset="100%" stop-color="#a855f7"/>
    </radialGradient>
  </defs>
  <rect width="640" height="360" fill="#c084fc"/>
  <rect x="40" y="40" width="560" height="280" rx="20" fill="#7c3aed" stroke="#fdf4ff" stroke-width="3"/>
  <circle cx="320" cy="170" r="120" fill="url(#vinyl)" stroke="#fdf4ff" stroke-width="5"/>
  <circle cx="320" cy="170" r="40" fill="#4c1d95" stroke="#fce7f3" stroke-width="4"/>
  <circle cx="320" cy="170" r="14" fill="#fb7185"/>
  <text x="320" y="320" text-anchor="middle" fill="#faf5ff" font-size="20" font-family="sans-serif">NEON PULSE</text>
`),
);

write(
  "audio/bgm-landscape.svg",
  svg(`
  <defs>
    <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#818cf8"/><stop offset="45%" stop-color="#a78bfa"/><stop offset="100%" stop-color="#4c1d95"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#dusk)"/>
  <circle cx="480" cy="80" r="48" fill="#fde68a"/>
  <path d="M0 200 L80 140 L160 185 L240 120 L320 175 L400 110 L480 165 L560 130 L640 180 L640 360 L0 360Z" fill="#6366f1"/>
  <path d="M0 260 Q160 220 320 265 T640 245 L640 360 L0 360Z" fill="#312e81"/>
  <g stroke="#f5f3ff" stroke-width="4" fill="none">
    <path d="M50 290 Q100 240 150 290 T250 290"/><path d="M280 300 Q330 250 380 300 T480 300"/><path d="M500 285 Q540 250 580 285"/>
  </g>
  <rect x="24" y="24" width="140" height="36" rx="8" fill="#1e1b4b"/>
  <text x="94" y="48" text-anchor="middle" fill="#e9d5ff" font-size="15" font-family="sans-serif">BGM · LOOP</text>
`),
);

write(
  "audio/sfx-wave.svg",
  svg(`
  <rect width="640" height="360" fill="#134e4a"/>
  <rect x="48" y="48" width="544" height="264" rx="18" fill="#0f766e" stroke="#5eead4" stroke-width="3"/>
  ${Array.from({ length: 40 }, (_, i) => {
    const h = 28 + ((i * 19) % 150);
    const x = 80 + i * 12;
    const fill = i % 3 === 0 ? "#ccfbf1" : i % 3 === 1 ? "#5eead4" : "#2dd4bf";
    return `<rect x="${x}" y="${180 - h / 2}" width="8" height="${h}" rx="3" fill="${fill}"/>`;
  }).join("")}
  <circle cx="320" cy="180" r="26" fill="#042f2e" stroke="#99f6e4" stroke-width="3"/>
  <polygon points="312,168 336,180 312,192" fill="#ecfdf5"/>
  <text x="320" y="300" text-anchor="middle" fill="#ecfdf5" font-size="16" font-family="sans-serif">SFX WAVEFORM</text>
`),
);

write(
  "audio/voice-booth.svg",
  svg(`
  <rect width="640" height="360" fill="#a78bfa"/>
  <rect x="160" y="36" width="320" height="288" rx="22" fill="#6b7280" stroke="#fafafa" stroke-width="3"/>
  <rect x="190" y="70" width="260" height="150" rx="10" fill="#312e81" stroke="#f0abfc" stroke-width="4"/>
  <ellipse cx="320" cy="140" rx="58" ry="46" fill="none" stroke="#fb7185" stroke-width="8"/>
  <rect x="296" y="182" width="48" height="56" rx="10" fill="#e4e4e7"/>
  <rect x="230" y="255" width="180" height="36" rx="8" fill="#3f3f46" stroke="#fafafa" stroke-width="2"/>
  <circle cx="270" cy="273" r="10" fill="#f87171"/><circle cx="320" cy="273" r="10" fill="#4ade80"/><circle cx="370" cy="273" r="10" fill="#60a5fa"/>
  <path d="M90 200 Q140 100 190 170" fill="none" stroke="#fdf4ff" stroke-width="6"/>
  <path d="M450 170 Q500 90 550 200" fill="none" stroke="#fdf4ff" stroke-width="6"/>
  <text x="320" y="330" text-anchor="middle" fill="#1e1b4b" font-size="16" font-family="sans-serif">VOICE BOOTH</text>
`),
);

write(
  "audio/drama-stage.svg",
  svg(`
  <defs>
    <linearGradient id="stage" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fb7185"/><stop offset="100%" stop-color="#a16207"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#stage)"/>
  <path d="M60 30 Q320 100 580 30 L580 90 Q320 160 60 90Z" fill="#be123c"/>
  <rect x="90" y="145" width="460" height="150" rx="12" fill="#44403c" stroke="#fde68a" stroke-width="4"/>
  <text x="320" y="210" text-anchor="middle" fill="#fef3c7" font-size="28" font-family="serif">夜汽車の対話</text>
  <text x="320" y="255" text-anchor="middle" fill="#fde68a" font-size="18" font-family="sans-serif">音声ドラマ · 第1話</text>
  <g fill="#fef08a">
    <circle cx="150" cy="95" r="14"/><circle cx="490" cy="95" r="14"/>
  </g>
`),
);

// --- Dev tools ---
write(
  "dev-tool/browser-convert.svg",
  svg(`
  <rect width="640" height="360" fill="#334155"/>
  <rect x="32" y="28" width="576" height="304" rx="14" fill="#475569" stroke="#e2e8f0" stroke-width="3"/>
  <rect x="32" y="28" width="576" height="44" rx="14" fill="#64748b"/>
  <circle cx="60" cy="50" r="8" fill="#f87171"/><circle cx="86" cy="50" r="8" fill="#fbbf24"/><circle cx="112" cy="50" r="8" fill="#4ade80"/>
  <rect x="150" y="40" width="300" height="20" rx="6" fill="#1e293b"/>
  <text x="160" y="55" fill="#94a3b8" font-size="12" font-family="sans-serif">convert.app</text>
  <rect x="60" y="100" width="210" height="180" rx="10" fill="#0f172a" stroke="#38bdf8" stroke-width="3"/>
  <text x="165" y="145" text-anchor="middle" fill="#7dd3fc" font-size="22" font-family="sans-serif">JSON</text>
  <rect x="85" y="170" width="160" height="14" rx="3" fill="#38bdf8"/><rect x="85" y="198" width="120" height="14" rx="3" fill="#7dd3fc"/>
  <polygon points="300,175 340,195 300,215" fill="#c4b5fd"/>
  <rect x="370" y="100" width="210" height="180" rx="10" fill="#1e1b4b" stroke="#c084fc" stroke-width="3"/>
  <text x="475" y="145" text-anchor="middle" fill="#e9d5ff" font-size="22" font-family="sans-serif">CSV</text>
  <rect x="395" y="170" width="160" height="14" rx="3" fill="#a78bfa"/><rect x="395" y="198" width="110" height="14" rx="3" fill="#c4b5fd"/>
`),
);

write(
  "dev-tool/editor-plugin.svg",
  svg(`
  <rect width="640" height="360" fill="#4b5563"/>
  <rect x="0" y="0" width="180" height="360" fill="#6b7280"/>
  <rect x="24" y="28" width="132" height="16" rx="3" fill="#f3f4f6"/>
  ${[0, 1, 2, 3, 4]
    .map(
      (i) =>
        `<rect x="24" y="${70 + i * 40}" width="${110 - i * 10}" height="22" rx="4" fill="${i === 2 ? "#c4b5fd" : "#9ca3af"}"/>`,
    )
    .join("")}
  <rect x="180" y="0" width="460" height="360" fill="#374151"/>
  <text x="210" y="48" fill="#e5e7eb" font-size="14" font-family="monospace">plugin.ts</text>
  <text x="210" y="100" fill="#7dd3fc" font-size="18" font-family="monospace">export function activate() {</text>
  <text x="230" y="140" fill="#bbf7d0" font-size="18" font-family="monospace">registerCommand(…)</text>
  <text x="210" y="180" fill="#7dd3fc" font-size="18" font-family="monospace">}</text>
  <rect x="380" y="210" width="220" height="120" rx="12" fill="#7c3aed" stroke="#faf5ff" stroke-width="3"/>
  <text x="490" y="265" text-anchor="middle" fill="#faf5ff" font-size="18" font-family="sans-serif">Forge Lint</text>
  <text x="490" y="300" text-anchor="middle" fill="#e9d5ff" font-size="14" font-family="sans-serif">拡張機能パネル</text>
`),
);

write(
  "dev-tool/node-workflow.svg",
  svg(`
  <rect width="640" height="360" fill="#312e81"/>
  <g stroke="#c4b5fd" stroke-width="4">
    <line x1="170" y1="120" x2="280" y2="180"/><line x1="170" y1="240" x2="280" y2="180"/>
    <line x1="380" y1="180" x2="490" y2="120"/><line x1="380" y1="180" x2="490" y2="240"/>
  </g>
  <rect x="50" y="85" width="120" height="70" rx="12" fill="#6366f1" stroke="#e0e7ff" stroke-width="3"/>
  <text x="110" y="128" text-anchor="middle" fill="#fff" font-size="18" font-family="sans-serif">入力</text>
  <rect x="50" y="205" width="120" height="70" rx="12" fill="#14b8a6" stroke="#ccfbf1" stroke-width="3"/>
  <text x="110" y="248" text-anchor="middle" fill="#042f2e" font-size="18" font-family="sans-serif">設定</text>
  <rect x="270" y="145" width="120" height="70" rx="12" fill="#a855f7" stroke="#f5f3ff" stroke-width="3"/>
  <text x="330" y="188" text-anchor="middle" fill="#fff" font-size="18" font-family="sans-serif">変換</text>
  <rect x="490" y="85" width="120" height="70" rx="12" fill="#3b82f6" stroke="#dbeafe" stroke-width="3"/>
  <text x="550" y="128" text-anchor="middle" fill="#fff" font-size="18" font-family="sans-serif">出力</text>
  <rect x="490" y="205" width="120" height="70" rx="12" fill="#f43f5e" stroke="#ffe4e6" stroke-width="3"/>
  <text x="550" y="248" text-anchor="middle" fill="#fff" font-size="18" font-family="sans-serif">ログ</text>
`),
);

write(
  "dev-tool/cli-terminal.svg",
  svg(`
  <rect width="640" height="360" fill="#22c55e"/>
  <rect x="40" y="32" width="560" height="296" rx="12" fill="#166534" stroke="#bbf7d0" stroke-width="3"/>
  <rect x="40" y="32" width="560" height="40" fill="#15803d"/>
  <text x="64" y="58" fill="#dcfce7" font-size="16" font-family="monospace">forge-cli — bash</text>
  <text x="64" y="120" fill="#bbf7d0" font-size="20" font-family="monospace">$ forge build --watch</text>
  <text x="64" y="165" fill="#fef08a" font-size="18" font-family="monospace">✓ compiled in 1.2s</text>
  <text x="64" y="205" fill="#fef08a" font-size="18" font-family="monospace">✓ 24 modules</text>
  <text x="64" y="245" fill="#dcfce7" font-size="18" font-family="monospace">watching for changes…</text>
  <text x="64" y="295" fill="#86efac" font-size="20" font-family="monospace">$ ▍</text>
`),
);

write(
  "dev-tool/api-console.svg",
  svg(`
  <rect width="640" height="360" fill="#6b7280"/>
  <rect x="24" y="24" width="592" height="312" rx="12" fill="#4b5563" stroke="#f3f4f6" stroke-width="3"/>
  <rect x="44" y="48" width="80" height="36" rx="8" fill="#4ade80"/>
  <text x="84" y="72" text-anchor="middle" fill="#052e16" font-size="16" font-weight="700" font-family="sans-serif">GET</text>
  <rect x="136" y="48" width="360" height="36" rx="8" fill="#1f2937" stroke="#e5e7eb" stroke-width="2"/>
  <text x="152" y="72" fill="#f9fafb" font-size="15" font-family="monospace">/v1/projects/:id</text>
  <rect x="512" y="48" width="80" height="36" rx="8" fill="#c4b5fd"/>
  <text x="552" y="72" text-anchor="middle" fill="#1e1b4b" font-size="15" font-weight="700" font-family="sans-serif">Send</text>
  <rect x="44" y="108" width="250" height="200" rx="10" fill="#374151" stroke="#e5e7eb" stroke-width="2"/>
  <text x="64" y="142" fill="#f3f4f6" font-size="15" font-family="sans-serif">Headers</text>
  <rect x="64" y="164" width="200" height="14" rx="3" fill="#9ca3af"/><rect x="64" y="192" width="160" height="14" rx="3" fill="#9ca3af"/>
  <rect x="320" y="108" width="272" height="200" rx="10" fill="#166534" stroke="#86efac" stroke-width="3"/>
  <text x="340" y="150" fill="#bbf7d0" font-size="18" font-family="monospace">200 OK</text>
  <text x="340" y="190" fill="#7dd3fc" font-size="16" font-family="monospace">{"id":"proj_01"}</text>
  <text x="340" y="230" fill="#e9d5ff" font-size="16" font-family="monospace">"status":"ok"</text>
`),
);

// --- Service / app (keep light UIs — high contrast on dark cards) ---
write(
  "service-app/habit-tracker.svg",
  svg(`
  <rect width="640" height="360" fill="#a7f3d0"/>
  <rect x="70" y="32" width="500" height="296" rx="24" fill="#ecfdf5" stroke="#059669" stroke-width="3"/>
  <text x="320" y="88" text-anchor="middle" fill="#064e3b" font-size="26" font-family="sans-serif">今日の習慣</text>
  ${["水分", "読書", "散歩"]
    .map(
      (label, i) => `
    <rect x="110" y="${120 + i * 58}" width="420" height="46" rx="12" fill="${i === 1 ? "#6ee7b7" : "#fff"}" stroke="#059669" stroke-width="2"/>
    <circle cx="145" cy="${143 + i * 58}" r="14" fill="${i < 2 ? "#059669" : "#fff"}" stroke="#047857" stroke-width="3"/>
    <text x="180" y="${150 + i * 58}" fill="#064e3b" font-size="20" font-family="sans-serif">${label}</text>
  `,
    )
    .join("")}
`),
);

write(
  "service-app/study-deck.svg",
  svg(`
  <rect width="640" height="360" fill="#93c5fd"/>
  <rect x="110" y="40" width="420" height="280" rx="22" fill="#fff" stroke="#1d4ed8" stroke-width="3" transform="rotate(-2 320 180)"/>
  <rect x="135" y="68" width="370" height="230" rx="16" fill="#dbeafe"/>
  <text x="320" y="155" text-anchor="middle" fill="#1e3a8a" font-size="26" font-family="sans-serif">光合成とは？</text>
  <text x="320" y="195" text-anchor="middle" fill="#2563eb" font-size="16" font-family="sans-serif">タップして答えを表示</text>
  <rect x="190" y="230" width="110" height="40" rx="10" fill="#ef4444"/>
  <rect x="340" y="230" width="110" height="40" rx="10" fill="#22c55e"/>
  <text x="245" y="256" text-anchor="middle" fill="#fff" font-size="16" font-family="sans-serif">Again</text>
  <text x="395" y="256" text-anchor="middle" fill="#052e16" font-size="16" font-family="sans-serif">Good</text>
`),
);

write(
  "service-app/notes-board.svg",
  svg(`
  <rect width="640" height="360" fill="#e7e5e4"/>
  <rect x="36" y="36" width="190" height="130" rx="10" fill="#facc15" transform="rotate(-3 130 100)" stroke="#a16207" stroke-width="2"/>
  <rect x="230" y="44" width="190" height="150" rx="10" fill="#86efac" stroke="#15803d" stroke-width="2"/>
  <rect x="440" y="36" width="170" height="120" rx="10" fill="#fca5a5" transform="rotate(2 525 96)" stroke="#b91c1c" stroke-width="2"/>
  <rect x="70" y="200" width="210" height="130" rx="10" fill="#c7d2fe" stroke="#4338ca" stroke-width="2"/>
  <rect x="310" y="210" width="260" height="110" rx="10" fill="#f9a8d4" stroke="#be185d" stroke-width="2"/>
  <text x="130" y="105" text-anchor="middle" fill="#713f12" font-size="20" font-family="sans-serif">アイデア</text>
  <text x="325" y="125" text-anchor="middle" fill="#14532d" font-size="20" font-family="sans-serif">タスク</text>
  <text x="525" y="100" text-anchor="middle" fill="#7f1d1d" font-size="20" font-family="sans-serif">メモ</text>
  <text x="175" y="270" text-anchor="middle" fill="#312e81" font-size="18" font-family="sans-serif">ボード</text>
  <text x="440" y="270" text-anchor="middle" fill="#9d174d" font-size="18" font-family="sans-serif">FBメモ</text>
`),
);

write(
  "service-app/budget-home.svg",
  svg(`
  <rect width="640" height="360" fill="#fdba74"/>
  <rect x="50" y="32" width="540" height="296" rx="18" fill="#fff7ed" stroke="#c2410c" stroke-width="3"/>
  <text x="320" y="88" text-anchor="middle" fill="#7c2d12" font-size="24" font-family="sans-serif">今月の家計</text>
  <circle cx="210" cy="210" r="78" fill="none" stroke="#fed7aa" stroke-width="22"/>
  <circle cx="210" cy="210" r="78" fill="none" stroke="#ea580c" stroke-width="22" stroke-dasharray="160 340" stroke-linecap="round" transform="rotate(-90 210 210)"/>
  <text x="210" y="218" text-anchor="middle" fill="#9a3412" font-size="22" font-family="sans-serif">68%</text>
  <rect x="330" y="150" width="210" height="22" rx="5" fill="#ffedd5"/><rect x="330" y="150" width="150" height="22" rx="5" fill="#fb923c"/>
  <rect x="330" y="195" width="210" height="22" rx="5" fill="#ffedd5"/><rect x="330" y="195" width="100" height="22" rx="5" fill="#fdba74"/>
  <rect x="330" y="240" width="210" height="22" rx="5" fill="#ffedd5"/><rect x="330" y="240" width="170" height="22" rx="5" fill="#ea580c"/>
`),
);

write(
  "service-app/community-feed.svg",
  svg(`
  <rect width="640" height="360" fill="#c4b5fd"/>
  <rect x="90" y="24" width="460" height="312" rx="22" fill="#faf5ff" stroke="#6d28d9" stroke-width="3"/>
  <circle cx="145" cy="80" r="26" fill="#7c3aed"/>
  <rect x="185" y="66" width="180" height="16" rx="4" fill="#a78bfa"/>
  <rect x="185" y="90" width="120" height="12" rx="3" fill="#ddd6fe"/>
  <rect x="120" y="125" width="400" height="110" rx="12" fill="#ede9fe" stroke="#8b5cf6" stroke-width="2"/>
  <text x="320" y="190" text-anchor="middle" fill="#4c1d95" font-size="18" font-family="sans-serif">今日のフィードバックまとめ</text>
  <rect x="120" y="255" width="185" height="52" rx="10" fill="#fff" stroke="#7c3aed" stroke-width="2"/>
  <rect x="325" y="255" width="185" height="52" rx="10" fill="#fff" stroke="#7c3aed" stroke-width="2"/>
  <text x="212" y="288" text-anchor="middle" fill="#5b21b6" font-size="16" font-family="sans-serif">共感 24</text>
  <text x="417" y="288" text-anchor="middle" fill="#5b21b6" font-size="16" font-family="sans-serif">返信 8</text>
`),
);

// --- Fallbacks (category scenes, not text-only placeholders) ---
write(
  "fallback/game.svg",
  svg(`
  <rect width="640" height="360" fill="#4c1d95"/>
  <rect x="60" y="50" width="220" height="140" rx="14" fill="#7c3aed" stroke="#f5f3ff" stroke-width="3"/>
  <circle cx="170" cy="110" r="36" fill="#fbbf24" stroke="#fff" stroke-width="3"/>
  <rect x="360" y="60" width="180" height="120" rx="12" fill="#312e81" stroke="#c4b5fd" stroke-width="3"/>
  ${[0, 1, 2]
    .map(
      (i) =>
        `<rect x="${380 + (i % 2) * 70}" y="${80 + Math.floor(i / 2) * 45}" width="55" height="35" rx="6" fill="${["#22d3ee", "#f472b6", "#a3e635"][i]}"/>`,
    )
    .join("")}
  <polygon points="320,210 390,310 250,310" fill="#e9d5ff" stroke="#fff" stroke-width="2"/>
  <text x="320" y="340" text-anchor="middle" fill="#faf5ff" font-size="18" font-family="sans-serif">ゲーム・インタラクティブ</text>
`),
);

write(
  "fallback/audio.svg",
  svg(`
  <rect width="640" height="360" fill="#0f766e"/>
  <circle cx="320" cy="150" r="90" fill="none" stroke="#99f6e4" stroke-width="14"/>
  <circle cx="320" cy="150" r="50" fill="none" stroke="#ccfbf1" stroke-width="10"/>
  <circle cx="320" cy="150" r="18" fill="#ecfdf5"/>
  <path d="M80 250 Q160 190 240 250 T400 250 T560 230" fill="none" stroke="#5eead4" stroke-width="8"/>
  ${Array.from({ length: 12 }, (_, i) => {
    const h = 20 + (i % 5) * 16;
    return `<rect x="${140 + i * 30}" y="${300 - h}" width="14" height="${h}" rx="3" fill="#a7f3d0"/>`;
  }).join("")}
  <text x="320" y="40" text-anchor="middle" fill="#ecfdf5" font-size="18" font-family="sans-serif">音楽・音声</text>
`),
);

write(
  "fallback/dev-tool.svg",
  svg(`
  <rect width="640" height="360" fill="#4338ca"/>
  <rect x="90" y="55" width="460" height="210" rx="14" fill="#312e81" stroke="#e0e7ff" stroke-width="3"/>
  <text x="140" y="130" fill="#c7d2fe" font-size="36" font-family="monospace">&lt;/&gt;</text>
  <rect x="140" y="160" width="280" height="18" rx="4" fill="#a78bfa"/>
  <rect x="140" y="195" width="200" height="18" rx="4" fill="#818cf8"/>
  <rect x="400" y="150" width="110" height="70" rx="10" fill="#22c55e"/>
  <text x="455" y="192" text-anchor="middle" fill="#052e16" font-size="16" font-family="sans-serif">RUN</text>
  <text x="320" y="320" text-anchor="middle" fill="#e0e7ff" font-size="18" font-family="sans-serif">開発ツール</text>
`),
);

write(
  "fallback/service-app.svg",
  svg(`
  <rect width="640" height="360" fill="#6d28d9"/>
  <rect x="190" y="40" width="260" height="240" rx="32" fill="#4c1d95" stroke="#f5f3ff" stroke-width="4"/>
  <rect x="212" y="72" width="216" height="160" rx="10" fill="#ede9fe"/>
  <rect x="228" y="92" width="90" height="48" rx="8" fill="#a78bfa"/>
  <rect x="328" y="92" width="84" height="48" rx="8" fill="#7c3aed"/>
  <rect x="228" y="156" width="184" height="56" rx="8" fill="#c4b5fd"/>
  <rect x="280" y="250" width="80" height="8" rx="4" fill="#ddd6fe"/>
  <text x="320" y="330" text-anchor="middle" fill="#faf5ff" font-size="18" font-family="sans-serif">Webサービス・アプリ</text>
`),
);

console.log("done");
