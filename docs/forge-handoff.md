# Forge Handoff

最終更新：**2026-06-16**（オーナー判断 — Studio Sidebar / 21–22 責務 / 実装 GO 順）

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
- **01 ランディング preview** — ブランチ `preview/landing-01` — **1920×1080 キャンバス + 全体 scale**（dvh/fr 方式は廃止）/ prod 未触
- **待ちモック** — **21** 分析ダッシュボード / **24** 開発ログ公開 / **25** 作品設定 / **17** プレイヤー個人設定（受領 `17-settings.md` は Studio シェル）
- **画面一覧 2026-06 最終版** — `docs/forge-screen-inventory.md`（Studio 階層・番号再編の正本）
- **モック↔番号** — `docs/ui-mocks/SCREEN-NUMBER-MAP.md`
- **オーナー判断 2026-06-16** — Studio **階層 Sidebar** 正本 / **21↔22 KPI 分離** / **実装 GO Phase1–6**（`forge-ui-product-decisions.md` §17–§19）
- **pending 解決** — #103 / #132 / #133 / #145
- **確認事項** — `docs/ui-mocks/pending-owner-questions.md` **#1–#145**（モック batch 完了後に一括提示）
- **正式リリース初期版方針** — 小さな MVP ではない。ランキング・実績・共感・影響度は初期版対象
- **原典更新** — 応援→フォロー統合を `forge-principles.md` に反映済み
- **out-of-scope** — 2026-06 更新（コミュニティ機能 in / 課金・販売 out）

---

## 優先順位（2026-06-16 更新 — 実装 GO 順確定）

**モック batch 完了 → オーナー GO 後の実装順**（`forge-ui-product-decisions.md` §19–§20）:

| Phase | 内容 | 備考 |
|-------|------|------|
| **1-A** | **Studio Shell** — 20–25 | **最優先**。階層 nav 含む。**プレイヤー Shell と同時 NG** |
| **1-B** | **Player Shell** — 09–18 | 1-A 後。`/mypage` タブ分離 |
| **2** | 開発者フォロー DB | 応援廃止 |
| **3** | 23 プレイヤーの声 | 開発に役立った / AI / 集計 |
| **4** | 08 FB | 質問 → 自由記述 |
| **5** | 18 月間影響度 | **最後** |

**GO 直前（必須）**: Veteran Walkthrough — 導線4本（§20）。全モック完成後・実装前。

**Cursor 推奨 1 位（GO 後）**: **Phase 1-A Studio Shell**

| 優先 | 論点 | 状態 |
|------|------|------|
| **P0** | Demo Veteran 開発者 | **完了** |
| **P1** | 正式版 grid / ForgeGameCard | **完了** |
| **待ち** | UI モック batch + オーナー GO | 24/25/21/17 未着 |

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
