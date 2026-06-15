# Forge Handoff

> ChatGPT / Cursor 間の**現在地サマリ**。  
> 詳細な原典は `docs/forge-principles.md`、履歴は `docs/forge-changelog.md` を参照。

最終更新：**2026-06-15**（studio voice 中心化 実装完了・未 deploy）

---

## 現在の状態

Forge は **完成前のインディーゲームを発見 → プレイ → 声を届ける → 変化を見る → 再プレイ** する MVP。

**開発者ループ**: 投稿 → **育成（studio）** → **プレイヤーの回答を見る** → 改善 → 再公開  
**プレイヤーサイクル**: 発見 → プレイ → 声を届ける → 変化を見る → 再プレイ

- **作品育成**: `/projects/{id}/studio` — voice 集計が主。詳しい感想（project_feedback）は副
- **growth 判定**: `project_voice_responses` 中心。pending = 現行版 voice が devlog より新しい
- **読了**: localStorage `project_voice_reads:{projectId}:{version}`（DB 化は後続）
- **開発マイページ**: `/my-projects` — voice ベースの次アクション表示
- **本番 deploy**: 431cd4f（voice 中心化は **ローカル未 commit**）
- **次 Cursor 推奨**: ① push + 本番確認 → ② nurture 読了 Supabase 化 → ③ 通知 DB 化

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

### プロダクト（2026-06-15）

- **studio voice 中心化** — project-growth-state / read パネル / 読了キーを voice 版単位に

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

1. **voice 中心化を push + 本番確認**（本タスク実装済み・未 deploy）
2. **nurture 読了 Supabase 化**（009 案 — localStorage → DB）
3. **開発者「回答届いた」通知の DB 化**（localStorage 縮小）
4. **RLS 再確認**（006 feedback policy / voice owner read）
5. **migration 008 本番適用確認** — other_notes 列（未適用なら Dashboard SQL）

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
