# Forge Handoff

最終更新：**2026-06-16**（将来像デモ環境 設計案）

---

## 現在の状態

- プレイ履歴 Phase 1 — main 反映済み
- **正式版 Phase 1** — main 反映済み
- **見届け人 W1–W4 + tier T1/T2** — main 反映済み（759b0dd 以降）
- migration **014** — staging + **本番適用済み**（オーナー確認済み）
- PLAYER_VISIBLE=false 維持
- **次テーマ**: 将来像デモ環境（設計案作成済み、実装 GO 前）

---

## 優先順位（2026-06-16 更新）

1. **将来像デモ環境** — 設計 GO → Seeder 実装（**最優先**）
2. **UI 全面レビュー** — デモ環境目視後
3. **伴走者**
4. **育成者**
5. **Phase 1b** — 作品詳細コンパクト履歴

---

## 将来像デモ環境

| 項目 | 正本 |
|------|------|
| 設計 | `docs/future-demo-environment-design.md` |
| 環境 | staging Supabase |
| 方式 | CLI Seeder + 8 ペルソナ + `[future-demo]` 作品 |

**Out**: 本番 UX 変更、新ルート、ランキング、通知追加、PLAYER_VISIBLE

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

1. **将来像デモ** — `docs/future-demo-environment-design.md` レビュー → F0 GO
2. Seeder 実装（staging）
3. ペルソナ目視 → UI 全面レビュー
