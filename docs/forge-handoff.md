# Forge Handoff

最終更新：**2026-06-16**（正式版 Phase 1 staging 検証）

---

## 現在の状態

- プレイ履歴 Phase 1 — main 反映済み、staging 目視済み
- **正式版 Phase 1** — 013 staging 適用済み、DB フロー検証 PASS、build PASS
- UI 目視 — Studio / マイページはログイン要（オーナー 2 分推奨）
- PLAYER_VISIBLE=false 維持
- 一気通貫運用 — `docs/forge-triage-operations.md` §10

---

## 優先順位（2026-06-16 更新）

1. **正式版** — Phase 1 **staging GO**
2. **見届け人** — **設計レビュー完了** → 条件 GO 待ち → W1 lib
3. **伴走者**
4. **育成者**
5. **Phase 1b** — 作品詳細コンパクト履歴

---

## 見届け人 Phase（main 反映後）

| 項目 | 正本 |
|------|------|
| W4 UI | `docs/witness-phase-w4-ui.md` |
| tier 草案 | `docs/witness-tier-design-review.md` |
| 本番 | https://forge-flame-gamma.vercel.app |

**次**: tier 設計 GO → 実装（別 Phase）

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

1. **W4** — 見届け人バッジ UI（オーナー GO 後）
2. 任意 — 古い `[witness-sandbox]` private 作品は staging に残置可
