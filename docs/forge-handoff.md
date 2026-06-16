# Forge Handoff

最終更新：**2026-06-16**（将来像デモ v2 — 成功した Forge 世界）

---

## 現在の状態

- プレイ履歴 Phase 1 — main 反映済み
- **正式版 Phase 1** — main 反映済み
- **見届け人 W1–W4 + tier T1/T2** — main 反映済み
- migration **014** — staging + 本番適用済み
- PLAYER_VISIBLE=false 維持
- **次テーマ**: 将来像デモ v2（世界中心、F0 GO 前）

---

## 優先順位（2026-06-16 更新）

1. **将来像デモ v2** — F0 GO → Seeder（**最優先**）
2. **UI 全面レビュー** — Veteran 実機 Walkthrough 後
3. **伴走者**
4. **育成者**
5. **Phase 1b** — 作品詳細コンパクト履歴

---

## 将来像デモ環境（v2）

| 項目 | 正本 |
|------|------|
| 設計 | `docs/future-demo-environment-design.md` |
| ログイン | Demo Veteran + Demo New User（固定パスワード） |
| 世界 | ~25 作品、NPC 18、Released 12 |

**目的**: 成功した Forge 世界を Veteran として歩く（ペルソナ検証ではない）

**Out**: 本番 UX 変更、8 ペルソナ、ランキング、通知、PLAYER_VISIBLE

---

## 見届け人 Phase（完了）

| 項目 | 正本 |
|------|------|
| W4 UI | `docs/witness-phase-w4-ui.md` |
| tier | `docs/witness-phase-t1-tier.md` |
| 本番 | https://forge-flame-gamma.vercel.app |

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

1. **将来像デモ v2** — design doc §17 確認 → F0 GO
2. Seeder 実装（25 作品・Veteran Gold・固定 credential）
3. Veteran で実機 Walkthrough → UI 全面レビュー
