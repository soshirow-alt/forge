# Forge Handoff

> ChatGPT / Cursor 間の**現在地サマリ**。  
> 詳細な原典は `docs/forge-principles.md`、履歴は `docs/forge-changelog.md` を参照。

最終更新：**2026-06-15**（UX Phase1 実装 — deploy / 008 適用待ち）

---

## 現在の状態

Forge は **完成前のインディーゲームを発見 → プレイ → 声を届ける → 変化を見る → 再プレイ** する MVP。

**開発者ループ**（従来）：投稿 → 発見 → プレイ → フィードバック → 改善 → 再プレイ  
**プレイヤーサイクル**（正式定義・2026-06-12 GO）：発見 → プレイ → 声を届ける → 変化を見る → 再プレイ

- **声を届けた** = **初声完了**（問いへの返答 1 件以上）。深い改善材料は任意
- **版プレイヤー問い**：1 版・最大 10 問。プレイヤー回答は 0〜全問自由
- **応援と初声**は別概念（統合しない）
- **個別回答は非公開**。**みんなの声** = 集計のみ公開（プレイヤー：グラフ / 開発者：解釈+数字）
- **デフォルト問い**（開発者未設定時）：もう一度遊びたい？
- **原典唯一の正**：`docs/forge-principles.md`（ChatGPT と共有）
- 詳細は `docs/forge-principles.md` §1・§5・§7・§8

- **公開**：トップ、一覧、ゲーム詳細の閲覧
- **ログイン必須**：プレイ、外部リンク、応援、あとで見る、更新追跡、フィードバック、投稿、通知、マイ作品
- **データ**：作品・プロフィール・エンゲージメント・**開発ログ**・**devlog 通知**は Supabase
- **DB**：migration **001〜007** 適用済み（006 初声 / 007 immutable RPC）。**本番 deploy 906b84d**（2026-06-15）
- **P0 修正 deploy 済**：6576b21 / https://forge-flame-gamma.vercel.app（本番確認 OK・クローズ）
- **UX Phase1 実装済（未 deploy）**：デフォルト問いプレビュー / 自由記述（短文）/ other_notes（**008 要**）
- **本番確認**：開発ログ → ゲスト別ブラウザ表示 **OK**（2026-06-12）
- **暫定 localStorage**：応援/FB 等の通知、クリエイターフォロー、テスター応募数、作品 extras
- **デプロイ**：Vercel プロジェクト **forge** → https://forge-flame-gamma.vercel.app
- **FB 将来**：バージョン別制御は `docs/feedback-roadmap.md` 参照（未実装）
- **開発フェーズ**：試作版 / プレイ可能版 / 通しプレイ版 / 公開準備中（2026-06-13）

---

## 直近で決まった仕様

1. **原典はリポジトリ内 `docs/forge-principles.md` が唯一の憲法**
2. **プレイヤーサイクル正式形**（オーナー GO 2026-06-12、更新）
   - 5 段：発見 → プレイ → 声を届ける → 変化を見る → 再プレイ
   - 声を届ける = 2 層（初声 / 深い改善材料任意）
   - 初声完了 = 問いへの返答 **1 件以上**。1 版・最大 10 問。回答 0〜全問自由
   - 応援 ≠ 初声（統合しない）
   - みんなの声：個別非公開 / プレイヤー向けグラフ / 開発者向け解釈（AI は後段）
3. **実装 GO**（2026-06-12）：migration 006 + 初声 UI + みんなの声集計
4. **開発者問い設定 UI**（2026-06-15）：`/submit` + `/projects/{id}/edit` — focusNotes から version_prompt へ
5. **ログイン方針**：発見は開放、プレイ以降はログイン必須。ボタンは隠さず `/login` へ
6. **応援**：投げ銭ではない。1人1回、「応援中」表示
7. **ChatGPT 連携**：Cursor 返答末尾 `text` ブロックの **Copy** を押して GPT に貼る（主経路）。代替：`npm run copy-summary`。ファイル Ctrl+A は不要
8. **ログイン後**：原則 `/` へ。**プレイ / 外部リンク** から来た場合のみ作品詳細へ return（`lib/login-return-url.ts`）

---

## 直近で実装した内容

### プレイヤーサイクル（2026-06-12〜15）

- migration **006** SQL（`project_version_prompts` / `project_voice_responses` / 集計 RPC）
- 初声 UI（`GameVoiceSection`）+ 深い改善材料（任意）
- みんなの声（プレイヤー向け集計グラフ / 開発者向け解釈）
- **開発者問い設定 UI**（`/submit` + `/projects/{id}/edit`）— 2026-06-15

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

1. **migration 006 本番適用 + 動作確認**（オーナー）
   - Dashboard SQL：`supabase/migrations/006_version_prompts_and_voice_responses.sql`
   - 確認：`docs/supabase-post-migration-checklist.md` §8（問い設定 → 初声 → みんなの声 → my-projects）
2. **プレイヤーサイクル残り**
   - 変化を見る（3 段目：devlog / 新版 / 参考にした声）
   - Phase A 接続の本番確認（プレイ→初声バナー）
3. **returnUrl 本番確認**（オーナー）
4. **Step 5**：projects extras カラム（focus_notes 完全移行）

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
