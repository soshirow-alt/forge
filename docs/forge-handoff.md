# Forge Handoff

最終更新：**2026-06-16**（プレイ履歴 Phase 1 実装）

---

## 現在の状態

- labeled 60 / shadow A/B / matcher 本番 GO / Phase3 完了
- **プレイ履歴 Phase 1 実装完了** — build PASS
- **main push 完了** — `d09dfa9`（2026-06-16）
- **PLAYER_VISIBLE=false** 維持

---

## 優先順位

1. matcher 本番 — Vercel env + deploy
2. **プレイ履歴** — Phase 1 コード完了 → **012 適用 + 目視**
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
