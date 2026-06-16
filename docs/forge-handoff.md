# Forge Handoff

最終更新：**2026-06-16**（見届け人 W1–W4 main 反映 + Vercel deploy 確認）

---

## 現在の状態

- プレイ履歴 Phase 1 — main 反映済み
- **正式版 Phase 1** — 013 staging 適用済み、main 反映済み
- **見届け人 W1–W4** — **main 反映済み**（`771dfe6`）、Vercel deploy **success**
- migration **014** — **staging 適用済み**、本番 Dashboard 適用は **別 Run**
- W4 UI — `/mypage#official-release` のみ（作品詳細・人数・ランキング・通知 Out）
- PLAYER_VISIBLE=false 維持
- tier — 設計レビュー草案のみ（`docs/witness-tier-design-review.md`）、実装 GO 前

---

## 優先順位（2026-06-16 更新）

1. **見届け人 tier** — 設計レビュー GO → T1 lib（名称・文言確定後）
2. **014 本番 migration** — オーナー Dashboard GO 時（W4 カード表示に必要）
3. **伴走者**
4. **育成者**
5. **Phase 1b** — 作品詳細コンパクト履歴

---

## 見届け人 Phase（main 反映済み）

| 項目 | 正本 |
|------|------|
| W4 UI | `docs/witness-phase-w4-ui.md` |
| tier 草案 | `docs/witness-tier-design-review.md` |
| 本番 | https://forge-flame-gamma.vercel.app |
| commit | `771dfe6` |

**次**: tier 設計 GO（Silver/Gold 名称再検討）→ 実装は別 Phase

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

## 次

1. **tier** — `docs/witness-tier-design-review.md` を読んで名称・文言 GO
2. **014 本番** — Dashboard SQL（GO 後）
3. grant 保持アカウントで本番 `/mypage#official-release` 目視
4. 任意 — 古い `[witness-sandbox]` private 作品は staging に残置可
