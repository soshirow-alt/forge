# Forge Handoff

最終更新：**2026-06-16**（事業仮説 v2 + 原典コアループ改訂）

---

## 事業仮説 v2（GO 済み）

**正本**: `docs/forge-business-hypothesis.md`

| 項目 | 内容 |
|------|------|
| 本命価値 | **版ごとの学習ループ**（初声→次に直すこと→次版） |
| 無料期間 | 売上放棄ではなく **M1〜M4 因果証明**（半年〜1年想定） |
| 主論点 | **Good レビュー**をいかに引き出すか（スーパーレビュアーは将来） |
| 見届け人 | **価値増幅**。必須条件ではない |
| North Star | プレイ→版に紐づく初声→開発者の優先順位決定 |

原典（`forge-principles.md`）は **学習ループ＝コア、見届け人・再プレイ＝増幅** に同期済み。

---

## P0 改善ループ（GO 済み・Phase A/B 完了）

**正本**: `docs/forge-p0-improvement-loop-plan.md`

| 項目 | 内容 |
|------|------|
| Studio 正本 | `/projects/[id]/studio` + `project-growth-state` |
| 検証仮説 | M3/H1 次に直すこと（上位3）+ M1 初声率 + H2 再プレイ（副次・増幅） |
| 事業 North Star | P0 計画 §1.5 — `docs/forge-p0-improvement-loop-plan.md` |
| 保留 | S-20 polish、S-23、ランキング、KPI、課金、BYOP、Discord/Steam |

**Cursor 推奨 1 位（preview/landing-01）**: Studio 本番ルート整理（Player dead UI 主要分は完了）

---

## 現在の状態

**Preview v0 全面化（第1波 GO）** — 旧UIルート廃止、StudioShell/PlayerShell 統一、実データゲーム詳細の一部配線。本番・DB削除は未着手。
- **Preview URL**: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
- **Studio v0**: S-20〜S-27 mock 完成。**S-22** は preview 暫定が 6タブ（正式版あり）— **正本は 5タブ・P-06 編集モード**（2026-06-15 方針変更、実装未着手）
- **本番 prod deploy — 保留**
- **画面設計正本**: `docs/forge-screen-definition.md`（**Studio S-20〜S-27 ドラフト 2026-06-19**）
- **主戦場**: **Phase2 UX 設計**
- **正式フロー**: ChatGPT → UX設計 → v0 → Cursor 実装
- **01 LP**: **オーナー OK** — preview `/landing` v0 正本写経済。overlay 廃止。prod・`/` 未触
- **v0 写経 UI（preview/landing-01）**: … / **notifications**（P-18）
- **v0 Publish**（参照用）: login / register / mypage 200。マイページ「見届け中」「保存作品」タブは v0 上で切替確認済
- **P0/P1 UI レビュー** — 実装完了（ForgeGameCard + Veteran developer patch）
- **verify:future-demo:staging** — **18/18 PASS**
- **staging preview**: https://forge-etb0gsaz1-soshirow-alts-projects.vercel.app
- **本番 prod deploy — 保留**
- migration **014** — staging + 本番適用済み
- **将来像デモ F1** — staging seed + verify 13/13 PASS
- PLAYER_VISIBLE=false 維持
- **画面一覧**: `docs/forge-screen-inventory.md`（01〜25）
- **待ちモック**: 21 分析 / 24 開発ログ公開 / 25 作品設定 / 17 プレイヤー設定 等

---

## 優先順位（2026-06-15 — 価値仮説検証ベース再整理）

**前提**: Forge の本質は「感想収集」ではなく **学習ループ支援**（`docs/forge-business-hypothesis.md`）。開発者が払うのは将来・版ベースの意思決定支援。課金は無料期間後。

**旧 P0（プレイヤー初回 UX 全体）を分解** — プレイヤー導線は必要だが、仮説検証のボトルネックは **開発者の意思決定** 側。

| 層 | 内容 |
|----|------|
| **P0** | **改善ループ 1 本** — 声が届く → 開発者が「次に直すこと」を確定できる → 変更を公開 → プレイヤーが変化を見る → 再プレイが追える |
| **P1** | 仮説検証の質を上げる — T02/T03 分離の実データ化、採用候補、版間比較、voice adoption（声→変化の因果）、通知 deep link |
| **P2** | モチベ・発見・周辺 — Studio ランキング S-23、Player P-17、S-20 KPI/発見セクション、バッジ、正式版 UI、新 Studio v0 の見た目統一、BYOP 外部取込 |

**Cursor 推奨 1 位（変更）**: **P0 改善ループ** — 既存バックエンド（`/projects/[id]/studio` + `project-growth-state`）を正とし、新 Studio v0 mock の先走りを止める。次は **「上位3課題」提示の最小実装**（ルールベース可）。

**旧方針（参考）**: Phase2 プレイヤー初回体験 UX 全体最優先 / Studio Shell v0 先行 — 画面数拡大は仮説検証を遅らせる

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
