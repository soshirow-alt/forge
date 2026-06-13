# Forge Handoff

> ChatGPT / Cursor 間の**現在地サマリ**。  
> 詳細な原典は `docs/forge-principles.md`、履歴は `docs/forge-changelog.md` を参照。

最終更新：**2026-06-13**（FB 表示改善 & 開発者 FB 一覧）

---

## 現在の状態

Forge は **完成前のインディーゲームを発見 → プレイ → フィードバック → 改善 → 再プレイ** する MVP。

- **公開**：トップ、一覧、ゲーム詳細の閲覧
- **ログイン必須**：プレイ、外部リンク、応援、あとで見る、更新追跡、フィードバック、投稿、通知、マイ作品
- **データ**：作品・プロフィール・エンゲージメント・**開発ログ**・**devlog 通知**は Supabase
- **DB**：migration **001 / 002 / 003 適用済み**（9 テーブル確認済み）
- **本番確認**：開発ログ → ゲスト別ブラウザ表示 **OK**（2026-06-12）
- **暫定 localStorage**：応援/FB 等の通知、クリエイターフォロー、テスター応募数、作品 extras
- **デプロイ**：Vercel プロジェクト **forge** → https://forge-flame-gamma.vercel.app
- **FB 表示**：詳細ページ構造化表示、開発者ダッシュボード FB 一覧（2026-06-13）
- **FB 将来**：バージョン別制御は `docs/feedback-roadmap.md` 参照（未実装）

---

## 直近で決まった仕様

1. **原典はリポジトリ内 `docs/forge-principles.md` が唯一の憲法**
2. **ログイン方針**：発見は開放、プレイ以降はログイン必須。ボタンは隠さず `/login` へ
3. **応援**：投げ銭ではない。1人1回、「応援中」表示
4. **ChatGPT 連携**：Cursor 返答末尾 `text` ブロックの **Copy** を押して GPT に貼る（主経路）。代替：`npm run copy-summary`。ファイル Ctrl+A は不要
5. **ログイン後**：原則 `/` へ。**プレイ / 外部リンク** から来た場合のみ作品詳細へ return（`lib/login-return-url.ts`）

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
| 本番動作未確認 | migration 適用済みだが画面確認が未完の可能性 |
| Supabase 未設定環境 | ログイン・投稿が動かない（forge-app URL 注意） |
| localStorage 暫定データ | 端末・ブラウザをまたいで消える / 本番共有不可 |
| extras（プレイ時間等） | localStorage のみ — 投稿者が別端末だと見えない |
| ログイン後 `/` 固定 | 詳細からログインするとトップに戻る |
| redirect 履歴 | 過去に壊れたため、再導入は慎重に |

---

## 次にやるべきこと

1. **returnUrl 本番確認**（オーナー）
2. **フィードバック体験 Phase 1** — 表示の構造化（入力は原典どおり済み）
3. **Step 5**：projects extras カラム（focus_notes 含む・低優先）

## 運用ルール（2026-06-12 追加）

- Cursor が Run 前に止まったら **`docs/gpt-run-decision-memo.md`** 形式のメモを ChatGPT に貼る（スクショ不要）
- Supabase プラン・課金は **`docs/supabase-owner-operations.md`**（オーナーが Dashboard で確認）
- **GPT用メモ省略禁止**：Forge 関連の返答末尾に `docs/chatgpt-summary.md` 同内容の text ブロック必須（AGENTS.md 参照）

---

## ChatGPTに相談したいこと

- **開発フェーズ**：4名称の最終案（試作/プレイ可能/継続改善/公開準備 vs 現行4択の改良）
- **FB 版管理**：`playable_version` + devlog 連動 bump vs 手動のみ
- 旧 `phase` 文字列の DB 移行要否
- localStorage 暫定データの **Supabase 移行優先順位**
- ログイン後に元ページへ戻す **最小リスクの UX**（redirect なしで可能か）
- MVP 公開前の **体験確認チェックリスト**（非エンジニア向け）
- マネタイズ仮説の **優先順位付け**（原典を壊さない範囲）
