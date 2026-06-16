# Forge Handoff

最終更新：**2026-06-16**（P0/P1 実装 — verify 18/18 PASS）

---

## 現在の状態

- **P0/P1 UI レビュー** — 実装完了（ForgeGameCard + Veteran developer patch）
- **verify:future-demo:staging** — **18/18 PASS**（Veteran 所有 7 / Gold 回帰）
- commit **42179f3** — main push + preview deploy 済み
- **staging preview**: https://forge-etb0gsaz1-soshirow-alts-projects.vercel.app（`dpl_4crzKWLk2Ez3Vonnt7D7LFZNEDNR` READY）
- **本番 prod deploy — 保留**
- 正式版 Phase 1 / 見届け人 W1–W4 + tier — main 反映済み
- migration **014** — staging + 本番適用済み
- **将来像デモ F1** — staging seed + verify 13/13 PASS
- PLAYER_VISIBLE=false 維持

---

## 優先順位（2026-06-16 更新 — ロードマップ順位変更）

**prod deploy までの流れ**

1. **Veteran walkthrough** — preview deploy 後、実機確認
2. **スクリーンショット確認**
3. **UI 全面レビュー継続**
4. **prod deploy 判断**

**Cursor 推奨 1 位**: Veteran Walkthrough + 実機 UI 確認

| 優先 | 論点 | 状態 |
|------|------|------|
| **P0** | Demo Veteran 開発者 | **完了** — patch 7 本、verify PASS |
| **P1** | 正式版 grid | **完了** |
| **P1** | ForgeGameCard | **完了**（プレイヤー側） |
| **P1** | サムネ | **完了** — GeneratedThumbnailPoster |
| **P2** | タブ名称 | **完了** |

**その後**: **開発者タブ ForgeGameCard 化** → 伴走者 → 育成者 → Phase 1b

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

1. **Veteran walkthrough** — 実機 + スクショ
2. **UI 全面レビュー継続** — P0–P2 消化
3. **prod deploy 判断** — 主要 UI 修正後に GO/NO-GO
4. 世界戦切替 — hide / show（オーナー指示時）

**触らない**: `vercel deploy --prod` / 本番反映（オーナー保留中）
