# UI モック受領ログ

**運用**: 画面モック到着ごとに 1 ファイル追加。実装 GO 前は **記録のみ**。

**画面番号正本**: `docs/forge-screen-inventory.md`（**2026-06 最終版**）  
**対照表**: [SCREEN-NUMBER-MAP.md](./ui-mocks/SCREEN-NUMBER-MAP.md)

**優先順位**:
1. **UI モック** — レイアウト・コピー・コンポーネント
2. **画面遷移図** — ナビ・画面存在
3. **画面一覧 / 追加決定 / 原典**

**サイドバー差分**: モック間でサイドバー項目が違う場合あり → **オーナー裁定待ち**（Cursor は両方記録し、確定後に正本更新）

| # | 画面 | モック | 状態 |
|---|------|--------|------|
| 01 | ランディング | [01-landing.md](./ui-mocks/01-landing.md) | 受領 |
| 02 | ログイン | [02-login.md](./ui-mocks/02-login.md) | 受領 |
| 03 | 新規登録 | [03-register.md](./ui-mocks/03-register.md) | 受領 |
| 04 | ホーム（発見） | [04-home.md](./ui-mocks/04-home.md) | 受領 |
| 05 | 作品検索 | [05-work-search.md](./ui-mocks/05-work-search.md) | 受領 |
| 05-2 | 開発者検索 | [05-2-developer-search.md](./ui-mocks/05-2-developer-search.md) | 受領 |
| 06 | ゲーム詳細 | [06-game-detail.md](./ui-mocks/06-game-detail.md) | 受領 |
| 07 | 開発者プロフィール | [07-developer-profile.md](./ui-mocks/07-developer-profile.md) | 受領 |
| 08 | フィードバック送信 | [08-feedback.md](./ui-mocks/08-feedback.md) | 受領 |
| 09 | プロフィール（自分用） | [09-profile-self.md](./ui-mocks/09-profile-self.md) | 受領 |
| 10 | 見届け中の作品 | [10-witnessing.md](./ui-mocks/10-witnessing.md) | 受領 |
| 11 | フィードバック履歴 | [11-feedback-history.md](./ui-mocks/11-feedback-history.md) | 受領 |
| 12 | プレイ履歴 | [12-play-history.md](./ui-mocks/12-play-history.md) | 受領 |
| 13 | 実績 | [13-achievements.md](./ui-mocks/13-achievements.md) | 受領 |
| 14 | あとで遊ぶ | [14-play-later.md](./ui-mocks/14-play-later.md) | 受領 |
| 15 | フォロー中の開発者 | [15-following-developers.md](./ui-mocks/15-following-developers.md) | 受領 |
| 16 | 通知一覧 | [16-notifications.md](./ui-mocks/16-notifications.md) | 受領 |
| 17 | 設定 | [17-settings.md](./ui-mocks/17-settings.md) | 受領 |
| 18 | 月間影響度ランキング | [18-monthly-influence-ranking.md](./ui-mocks/18-monthly-influence-ranking.md) | 受領 |
| 19 | — | 欠番 | — |
| ~~20~~ | ~~Studio ホーム~~ | [20-studio-home.md](./ui-mocks/20-studio-home.md) | **廃止** |
| **20** | **Studio 作品一覧** | [21-studio-works-list.md](./ui-mocks/21-studio-works-list.md) | 受領 |
| **21** | **分析ダッシュボード** | — | **未** |
| **22** | **作品情報** | [22-project-home-alt.md](./ui-mocks/22-project-home-alt.md) 正本 / [22-project-home.md](./ui-mocks/22-project-home.md) 参考 | 受領 |
| 23 | プレイヤーの声 | [23-player-voices.md](./ui-mocks/23-player-voices.md) | 受領 |
| **24** | **開発ログ公開** | — | 待ち |
| **25** | **作品設定** | — | 待ち |

**確認事項**: 送付完了まで [pending-owner-questions.md](./ui-mocks/pending-owner-questions.md) に蓄積 — **その場ではオーナーに聞かない**

**画像**: `assets/` 配下（ファイル名は受領時の UUID）

---

## IA 資料（モックではない）

| 資料 | 正本 | 状態 |
|------|------|------|
| 画面遷移図 2026-06 最終版 v2 | [forge-screen-transition-diagram.md](../forge-screen-transition-diagram.md) | **2026-06-16 オーナー送付** |
| 画面一覧 2026-06 最終版 | [forge-screen-inventory.md](../forge-screen-inventory.md) | 同期済み |
