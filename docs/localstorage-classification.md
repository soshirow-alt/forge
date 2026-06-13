# localStorage 分類一覧（2026-06-13 更新）

Forge の localStorage 利用状況。マイページ実装前の参照用。

---

## ■ 削除してよい localStorage（Step 2 実施済み）

| キー / コード | 状態 |
|---|---|
| `forge-played-games` / `lib/play-session.ts` | **削除済み**（`project_plays` に置換） |
| `forge-game-feedback` 読み書き関数 | **削除済み**（`project_feedback` に置換） |
| `forge-game-comments` レガシー読込 | **削除済み** |
| `loadDeveloperProfiles()` / `forge-developer-profiles` | **削除済み**（Supabase `developer_profiles`） |
| demo の `forge-support-counts` / `forge-game-feedback` seed | **削除済み**（本番 UI は未使用） |

---

## ■ まだ残すべき localStorage

| キー | 理由 |
|---|---|
| `forge-demo-project-ids` | デモ作品の再セットアップ用 |
| `forge-applicant-counts` | テスター応募数表示（DB 未実装） |
| `forge-follower-counts` / `forge-following-creators` | クリエイター follow 表示（DB 未実装・「フォロー」は増やさない方針） |
| `forge-notifications` | 応援・FB・テスター応募の**オーナー向け通知**（端末ローカル） |
| `forge-game-extras` | 投稿作品のプレイ時間・観点（extras カラム未実装） |

---

## ■ DB移行が必要な localStorage

| キー | 優先度 | 備考 |
|---|---|---|
| `forge-notifications`（support / feedback / tester） | **中** | 応援**通知**は後回し。応援**状態**は DB 済み |
| `forge-applicant-counts` | 低〜中 | テスター応募テーブル |
| `forge-follower-counts` / `forge-following-creators` | 低 | 現状「更新を追う」と混同しない |
| `forge-game-extras` | **低** | projects extras カラム（Step 5・後回し） |

---

## ■ 仕様として不要な localStorage

| 対象 | 備考 |
|---|---|
| 削除済み dead code 系 | Step 2 完了 |
| demo support/feedback seed | UI が読まないため不要だった |

---

## DB 保存確認（コード調査結果）

| 機能 | Supabase テーブル | LS フォールバック | 別端末再現 |
|---|---|---|---|
| 応援 | `project_supports` | なし | **可**（002 適用済み） |
| 更新を追う | `project_watches` | なし | **可** |
| あとで見る | `project_bookmarks` | なし | **可** |
| フィードバック | `project_feedback` | なし | **可**（読取は公開） |
| プレイ済み | `project_plays` | なし（dead code 削除済み） | **可** |
| 開発ログ | `project_devlogs` | なし | **可**（本番確認済み） |
| devlog 通知 | `user_notifications` | なし | **可** |

**エラー時**：FB / devlog は throw → UI でエラー表示。応援・watch・bookmark・play は silent no-op（ログイン or Supabase 未設定時）。

---

## マイページへ進める状態か

**ほぼ YES** — マイページが参照するコアデータ（応援・追跡・保存・プレイ・FB・devlog）は DB 一本化済み。  
**オーナー確認推奨**：応援・追跡・保存を別ブラウザで再現テスト後、マイページ着手。
