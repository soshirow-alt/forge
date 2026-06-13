# Forge Handoff

> ChatGPT / Cursor 間の**現在地サマリ**。  
> 詳細な原典は `docs/forge-principles.md`、履歴は `docs/forge-changelog.md` を参照。

最終更新：**2026-06-12**

---

## 現在の状態

Forge は **完成前のインディーゲームを発見 → プレイ → フィードバック → 改善 → 再プレイ** する MVP。

- **公開**：トップ、一覧、ゲーム詳細の閲覧
- **ログイン必須**：プレイ、外部リンク、応援、あとで見る、更新追跡、フィードバック、投稿、通知、マイ作品
- **データ**：作品・プロフィール・エンゲージメント・**開発ログ**・**devlog 通知**は Supabase
- **暫定 localStorage**：応援/FB 等の通知、クリエイターフォロー、テスター応募数、作品 extras
- **デプロイ**：Vercel + Supabase（環境変数要設定）

---

## 直近で決まった仕様

1. **原典はリポジトリ内 `docs/forge-principles.md` が唯一の憲法**
2. **ログイン方針**：発見は開放、プレイ以降はログイン必須。ボタンは隠さず `/login` へ
3. **応援**：投げ銭ではない。1人1回、「応援中」表示
4. **ChatGPT 連携**：`docs/chatgpt-summary.md` を貼るだけ（`npm run copy-summary` でクリップボードにコピー可）
5. **ログイン後**：常に `/` へ（redirect 複雑化はしない）

---

## 直近で実装した内容

### プロダクト（2026-06-12 前後）

- ログイン必須アクション UX + Supabase エンゲージメント保存
- 原典に沿った詳細ページ・構造化フィードバック・発見フィルタ
- 投稿フォーム MVP 整理、ホーム visual / ショーケース刷新

### ドキュメント（2026-06-12 本日）

- `forge-principles.md` / `forge-changelog.md` / `forge-handoff.md` 新設
- `AGENTS.md` に Forge 開発ルール追記

---

## 危険箇所

| 項目 | リスク |
|------|--------|
| Supabase migration 002 未適用 | 応援・保存・プレイ記録・FB が保存されない |
| Supabase 未設定環境 | ログイン・投稿が動かない |
| localStorage 暫定データ | 端末・ブラウザをまたいで消える / 本番共有不可 |
| extras（プレイ時間等） | localStorage のみ — 投稿者が別端末だと見えない |
| ログイン後 `/` 固定 | 詳細からログインするとトップに戻る |
| redirect 履歴 | 過去に壊れたため、再導入は慎重に |

---

## 次にやるべきこと

1. **Supabase**：`002_user_engagement.sql` と **`003_project_devlogs_and_notifications.sql`** を本番に適用
2. **動作確認**：A が watch → B（owner）が devlog 投稿 → A の通知一覧
3. **Step 2（LS 残骸削除）**：play-session.ts、feedback LS 関数、demo support/feedback LS seed
4. **Step 5**：projects extras カラム

---

## ChatGPTに相談したいこと

- localStorage 暫定データの **Supabase 移行優先順位**（何から移すか）
- ログイン後に元ページへ戻す **最小リスクの UX**（redirect なしで可能か）
- MVP 公開前の **体験確認チェックリスト**（非エンジニア向け）
- マネタイズ仮説の **優先順位付け**（原典を壊さない範囲）
