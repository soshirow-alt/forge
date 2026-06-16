# Forge Handoff

最終更新：**2026-06-16**（プレイヤー UI — プレイ履歴・更新通知 方向修正）

---

## 現在の状態

- プレイ履歴 Phase 1 — **UI 方向修正済み**（関係性バッジ + プレイヤー視点タイムライン）
- **正式版 Phase 1** — main 反映済み
- **見届け人 W1–W4 + tier T1/T2** — main 反映済み
- migration **014** — staging + 本番適用済み
- **将来像デモ F1** — staging seed + verify 13/13 PASS
- PLAYER_VISIBLE=false 維持

---

## 優先順位（2026-06-16 更新）

1. **Veteran 実機 Walkthrough** → **UI 全面レビュー**
2. **伴走者**
3. **育成者**
4. **Phase 1b** — 作品詳細コンパクト履歴

---

## 将来像デモ世界（F1 完了）

| 項目 | 正本 |
|------|------|
| 設計 | `docs/future-demo-environment-design.md` |
| Walkthrough | `docs/future-demo-walkthrough.md` |
| ログイン | `veteran@forge-future-demo.local` / `ForgeDemo!Veteran2026` |
| 世界戦 | `hide:future-demo:staging` / `show:future-demo:staging` |

**staging verify**: 13/13 PASS

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
プレイ履歴: 折りたたみ＝関係性バッジ（見届け人・声・更新・複数版）、展開＝時系列履歴（プレイヤー視点文言）

更新通知（マイページ）: Devlog タイトル非表示。プレイヤーに起きた変化の文言のみ。

---

## 次

1. **Veteran 実機 Walkthrough** — `docs/future-demo-walkthrough.md`
2. **UI 全面レビュー**
3. 世界戦切替 — hide / show（オーナー指示時）
