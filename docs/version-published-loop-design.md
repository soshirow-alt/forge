# 新版公開 → 再プレイ → 新FB — 設計メモ

**migration**: `005_version_published_notifications.sql`  
**状態**: コード実装済み。本番は **005 適用 → deploy** の順。

> **2026-06-26 以降の上位設計**: watch 全員通知・再プレイバナーは現行実装の正本。  
> 今後の拡張（確認依頼・変化チェック・任意ターゲティング）は **`docs/change-check-confirmation-loop.md`** を参照。

---

## 設計判断の回答

### user_notifications で対応可能か

**可能。** 既存 `user_notifications` テーブルを拡張。003 で devlog 通知のパターン確立済み。

### migration が必要か

**必要（005）。** 理由：

- `type` CHECK が `('devlog')` のみ
- INSERT RLS ポリシーが `type = 'devlog'` のみ

005 で `version_published` type、`published_version` 列、RLS 更新。

### 新通知 type が必要か

**はい。** `version_published` を追加。

- 版 bump 時：**version_published のみ**（devlog 通知と二重送信しない）
- 版 bump なし devlog：**devlog** 通知（従来どおり）

オーナー判断「概念的に別扱い」に合致。

### 追跡中ユーザー判定

- `project_watches` テーブル（002）
- フロント: `userEngagement.watchedProjectIds` / `isWatching(gameId)`
- 通知送信: `fetchWatcherUserIds`（003 RLS でオーナーが read 可）

### バナー表示条件

すべて満たすとき表示（`getNewPlayableVersionBannerState`）：

1. ログイン済み
2. **更新を追う** 中（watch）
3. 現行 `playable_version` 向け FB が **未投稿**
4. 過去に **別 version_key** 向け FB を投稿済み（＝新版が出たと判断）

初回プレイヤー（FB 未投稿）は「新版」バナーを出さない（通常のプレイ→FB 導線）。

### 通知重複対策

- 1 回の devlog 投稿 = 1 回 insert（watch ユーザー每人 1 行）
- 版 bump 時は devlog 通知を送らず version_published のみ
- 0.2 → 0.3 と連続 bump 時は版ごとに新通知（意図どおり）

### 既存 FB 編集仕様との整合

- 同版編集：変更なし（UPDATE）
- 新版：現行版向け FB が無い → 新規 INSERT 枠
- バナーは「現行版 FB 無し + 旧版 FB あり」で表示

### 実装難易度

**中（低〜中）。** 新 page なし。005 + 通知 insert 分岐 + バナー 1 コンポーネント。

### リスク

| リスク | 対策 |
|---|---|
| 005 前 deploy | CHECK 違反で通知 insert 失敗 | 005 → deploy 順 |
| mock 作品 | Supabase 通知対象外 | submitted のみ |
| Realtime なし | 通知はページ open 時 fetch | スコープ Out |

---

## 他案を採用しなかった理由

| 他案 | 不採用理由 |
|---|---|
| devlog 通知メッセージだけ変更 | type 分離できず、将来フィルタ・UX 整理が困難 |
| 版 bump 時に devlog + version 二重通知 | ノイズ。オーナー意図と反する |
| LS に新版フラグ | 端末間非共有。原典違反 |
| plays テーブルに版記録 | migration 増。FB version_key で十分 |

---

## In / Out

**In**: 版 bump 通知、通知→詳細、詳細バナー、追跡ユーザー再プレイ案内、新 FB 可能メッセージ

**Out**: ホームタブ、作品 dashboard、extras DB、AI、Realtime、Push、旧版 FB UI

---

## オーナー本番確認（5分）

1. **アカウント A**（開発者）・**B**（プレイヤー）準備
2. B が作品を **更新を追う**
3. B が版 0.1 向け FB 投稿 + プレイ記録
4. A が devlog + **新版 0.2 公開** チェック → 投稿
5. B：**通知** に「新しいプレイ可能版」→ クリック → 詳細に **オレンジバナー**
6. B：再プレイ → FB フォームが **空**（0.2 向け）→ 投稿
7. バナー消える（0.2 FB 投稿後）

※ 005 Dashboard 適用 + deploy 後に実施

**詳細手順（本番 E2E）**：`docs/e2e-version-published-loop-production.md` — 非エンジニア向け・1 クリック単位・失敗切り分け・結果記録テンプレ付き
