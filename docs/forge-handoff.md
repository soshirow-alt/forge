# Forge Handoff

最終更新：**2026-06-16**（一気通貫運用）

---

## 現在の状態

- labeled 60 / shadow A/B / matcher 本番 GO / Phase3 完了
- **プレイ履歴 Phase 1** — main 反映済み（6c8e992 / fb13306）
- **012** staging 適用 + 目視 OK
- **PLAYER_VISIBLE=false** 維持

---

## 運用（2026-06-16〜）

- **一気通貫**: 設計 → 実装 → build → staging → main反映準備 — Cursor 判断
- **停止 9 条件のみ**: `docs/forge-triage-operations.md` §10.2
- サマリ「今すぐ私がやるべきこと」= **オーナー作業のみ**

---

## 優先順位

1. matcher 本番 — Vercel env
2. **プレイ履歴** — Phase 1b / updateWatchCount B 定義
3. 正式版
4. バッジ

---

## プレイ履歴 Phase 1（実装済み）

| 項目 | 正本 |
|------|------|
| 設計 | `docs/player-play-history-design.md` |
| migration | `supabase/migrations/012_project_play_sessions.sql` |
| 検証 | `docs/player-play-history-verification.md` |
| セクション名 | **プレイ履歴**（`#play-history`） |

**コード**: `play-sessions-db.ts`, `player-play-timeline.ts`, `use-player-play-history.ts`, `play-history-section.tsx`, `recordProjectPlayWithSession`

---

## 次: オーナー

1. Supabase Dashboard — 012 適用
2. 本番/ staging でプレイ → session 行確認
3. `/mypage` プレイ履歴目視
4. Vercel matcher env（並行）

## 次: Cursor

1. Phase 1b — 作品詳細コンパクト履歴
2. PLAYER_VISIBLE GO 後 — adoption 行をタイムラインに追加
