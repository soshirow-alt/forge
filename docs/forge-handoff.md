# Forge Handoff

最終更新：**2026-06-16**（正式版 Phase 1）

---

## 現在の状態

- プレイ履歴 Phase 1 — main 反映済み
- **正式版 Phase 1** — 実装完了、build PASS、**013 Dashboard 適用はオーナー**
- PLAYER_VISIBLE=false 維持
- 一気通貫運用 — `docs/forge-triage-operations.md` §10

---

## 優先順位（2026-06-16 更新）

1. **正式版** — Phase 1 コード完了 → 013 適用 + staging 目視
2. **見届け人** — 正式版イベント正本に依存
3. **伴走者**
4. **育成者**
5. **Phase 1b** — 作品詳細コンパクト履歴

---

## 正式版 Phase 1

| 項目 | 正本 |
|------|------|
| 設計 | `docs/official-release-design.md` |
| migration | `013_project_release_events.sql` |
| 検証 | `docs/official-release-phase1-verification.md` |

Studio: 開発中 / 正式版 / 正式版再調整中  
マイページ: `#official-release` — プレイした作品の正式版到達一覧  
プレイ履歴: `release` イベント + 「正式版到達を見届けた」サマリ（見届け人土台）

---

## 次: オーナー

1. Supabase Dashboard — **013 適用**（staging）
2. Studio Released / Reopened 目視
3. プレイヤー `/mypage` 目視
