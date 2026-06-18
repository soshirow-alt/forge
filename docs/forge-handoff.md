# Forge Handoff

最終更新：**2026-06-18**（オーナー — Forge Roadmap 2026-06 正本 / Phase2 UX 主戦場）

---

## 現在の状態

- **工程フェーズ正本**: `docs/forge-roadmap-2026-06-canonical.md`
- **画面設計正本**: `docs/forge-screen-definition.md`（2026-06-18）
- **主戦場**: **Phase2 UX 設計**
- **正式フロー**: ChatGPT → UX設計 → v0 → Cursor 実装
- **01 LP**: **オーナー OK** — preview `/landing` v0 正本写経済。overlay 廃止。prod・`/` 未触
- **v0 写経 UI（preview/landing-01）**: login / register / mypage / search / home / games/[id] + **P-19 FB モーダル**
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

## 優先順位（2026-06-18 — ロードマップ正本）

**画面番号順ではなくコアループ順。UX 確定前に Phase5 実装を進めない。**

| 優先 | 内容 |
|------|------|
| **P0** | **プレイヤー初回体験 UX** — LP→発見→詳細→プレイ→声→変化→再プレイ |
| P1 | 開発者初回体験 UX（登録→投稿→声→改善→devlog→再プレイ獲得） |
| P2 | 継続利用 UX（通知→戻る→再プレイ） |
| P3 | Phase3 UI（v0）→ Phase5 実装（Cursor） |
| 後 | Walkthrough（Phase6）→ β → 正式公開 |

**Cursor 推奨 1 位（現時点）**: Phase2 — **プレイヤー初回体験の UX 設計・ギャップ整理**（実装 GO 待ち）

**旧方針（参考・実装 GO 時に再開）**: Studio Shell 1-A → Player Shell 1-B → フォロー DB → 23 → 08 → 18

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
