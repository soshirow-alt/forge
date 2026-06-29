# Forge トリガー運用 — オーナー × ChatGPT × Cursor

**恒久ルール**。オーナーが変更を明示するまで有効。  
原典: `docs/forge-principles.md` / サマリ形式: `docs/chatgpt-summary-format.md` / Run メモ: `docs/gpt-run-decision-memo.md`

---

## 1. 役割と判断優先順位

### ChatGPT の役割

- **プロダクトレビュー**（コードレビューではない）
- 壁打ち・判断支援・Cursor 向け完成文の作成
- 敬語。オーナーを「お前」と呼ばない
- 思いつきで機能追加しない。MVP を雑に削りすぎない

### 判断優先順位（ChatGPT）

1. **Forge 原典**（`docs/forge-principles.md`）
2. **ユーザー価値**
3. **開発者価値**
4. **MVP 成立**
5. **技術的綺麗さ**

Run 判断・UX 判断・設計判断すべて、この順で考える。

### Cursor の役割

- **タスク単位で一気通貫** — 設計 → 実装 → build → staging 確認 → main 反映準備まで原則 Cursor 判断で完走（§10）
- 実装・build・docs 更新・GPT用メモ（`chatgpt-summary.md` + 返答末尾 text ブロック）
- **§10 停止条件のみ**で GPT判断用メモ（`docs/gpt-run-decision-memo.md`）を出力
- 原典の意味を勝手に変えない

---

## 2. CURSOR キーワード運用

オーナーが **`CURSOR`** と**だけ**送った場合の意味:

> 直前までの会話内容を踏まえて、**Cursor へそのまま貼れる完成版の返答**を作成してほしい

### ChatGPT の義務

- 説明だけで終わらない
- **Cursor へそのまま貼れる完成版 1 本**を出力する
- 追記形式・断片形式・「次にこれを貼って」複数レス前提 — **すべて禁止**
- オーナーがそのままコピペできる状態を標準とする

### 例外（Cursor 向け文章を出さない）

オーナー判断がまだ必要な場合:

- Cursor 向け指示文は**出さない**
- 代わりに **判断材料** を整理する（選択肢・推奨・リスク・確認事項）
- オーナーが GO を明示してから、改めて `CURSOR` または指示を送る

---

## 3. Cursor 向け文章の出力ルール

| ルール | 内容 |
|---|---|
| **1 本完結** | 1 回の出力で Cursor が動ける全文 |
| **禁止** | 追記形式、断片形式、複数レス前提 |
| **標準** | オーナーがコピペ → Cursor 新規メッセージに貼るだけ |
| **含める** | 背景 1〜2 行、やること、In/Out（該当時）、完了条件 |
| **含めない** | 「続きは次のメッセージで」 |

Cursor 新チャット開始時の例文テンプレは `docs/chatgpt-handoff.md` §チャット移行運用 を参照。

---

## 4. Run スクショ運用

### トリガー

以下のスクショが貼られた場合、**Run 判断依頼**として扱う:

- Run 画面 / Run 確認画面
- Deploy 画面
- Migration 画面（Supabase Dashboard SQL 等）
- その他、Cursor の実行・本番反映を伴う操作の確認 UI

Cursor の GPT判断用メモ貼付も同様に Run 判断依頼。

### 判定形式（4 段階）

| ラベル | 意味 |
|---|---|
| **[A] Run推奨** | リスク低。Run してよい |
| **[B] 事前確認推奨** | Dashboard / Vercel 等を目視確認してから Run |
| **[C] 追加確認推奨** | 情報不足・前提未確認。追加質問または確認後に再判断 |
| **[D] Run禁止** | データ消失・原典逸脱・復旧困難など。別手順が必要 |

※ 旧運用の「[C] 中止推奨」は **[D] Run禁止** または **[C] 追加確認推奨** に読み替える。

### 判断に含める観点（技術だけでない）

- **Forge 価値** — コアループを強化するか
- **ユーザー影響** — プレイヤー/開発者体験が壊れないか
- **復旧難易度** — 失敗時に戻せるか（migration 順序、deploy 順など）
- 技術リスク（RLS、CHECK、env、課金）

詳細フォーマット: `docs/gpt-run-decision-memo.md`

---

## 5. Cursor サマリレビュー運用

### トリガー

以下が ChatGPT に貼られた場合、**単なる要約ではなくレビュー**を行う:

- `docs/chatgpt-summary.md` の内容（または Cursor 返答末尾 text ブロック）
- `docs/chatgpt-handoff.md`
- GPT判断用メモ（`docs/gpt-run-decision-memo.md` 形式）

### 最低限確認する 4 点

1. **現在地** — commit / migration / deploy / 最優先テーマが正しいか
2. **リスク** — 見落とし、005→deploy 順など
3. **次アクション** — オーナー / Cursor / ChatGPT それぞれ明確か
4. **Forge 原典との整合** — コアループ・スコープ Out 違反がないか

レビュー結果は、問題があれば指摘 + 修正提案。問題なければ「確認 OK」と次アクションを 1 行で明示。

---

## 6. UX レビュー運用

### トリガー（オーナーの発言）

以下は**単なる感想として扱わない**。**UX レビュー依頼**として扱う:

- 分かりにくい
- なんか違う
- 使いづらい
- 何をすればいいか分からない
- 気持ち悪い

（同義の表現も含む）

### ChatGPT の義務

- オーナーの違和感を**具体的 UX 問題**に言語化する
- **他ユーザーにも同様の違和感があり得るか**を検討する
- プロダクトレビュー優先順位（§1）で改善案を出す
- コード詳細より「何が起きているか」「どう直すと Forge 価値に効くか」
- Cursor 指示が必要なら §3 に従い **完成版 1 本**（オーナー判断不要な範囲）

---

## 7. チャット移行運用

### ChatGPT

| タイミング | 貼るもの |
|---|---|
| **新 GPT スレッド初回** | `docs/chatgpt-handoff.md`（全量、1 回） |
| **以降の毎タスク** | `docs/chatgpt-summary.md` または Cursor 返答末尾 text ブロック（差分） |

handoff 更新トリガー: 大テーマ完了 / migration 完了 / ロードマップ順位変更 / オーナー引継ぎ指示

### Cursor

| タイミング | やること |
|---|---|
| **新 Agent チャット**（`New Agent` / `Ctrl+N`） | 最初の 1 メッセージで `docs/chatgpt-handoff.md` 参照を指示 + 現在地 1〜3 行 |
| **以降** | 通常タスク指示。summary は ChatGPT 連携用（Cursor も毎タスク更新） |

古いチャットは削除不要。コンテキストが重くなったら新 Agent に切り替える。

---

## 8. Preview / main デプロイ手順（2026-06-28〜）

**正本**。オーナー方針: **Preview で試す → 本番 push** を繰り返す。**`preview/landing-01` と `main` のコード差分を常に避ける**。

### 8.1 通常フロー（UI・仕様変更）

```text
preview/landing-01 で実装
  → commit + push（Vercel Preview デプロイ）
  → オーナー Preview 確認
  → main に merge + push（本番 deploy）
  → preview/landing-01 を main に追従（fast-forward）+ push
```

| 段階 | Cursor がやること |
|------|-------------------|
| **1. Preview 反映** | `preview/landing-01` に commit + `git push origin preview/landing-01` |
| **2. 確認待ち** | オーナーが Preview URL で目視（明示 GO または「本番に push」指示） |
| **3. 本番反映** | `main` に merge（通常は `preview/landing-01` → `main`）+ `git push origin main` |
| **4. ブランチ同期** | **`preview/landing-01` を `main` と同一 commit に揃える**（下記 §8.2） |

- Preview 未確認の **main 反映は禁止**（オーナーが Preview 省略を**明示**した場合のみ例外）
- **main だけ push して Preview を古いままにしない**（本番だけ先に進んだ状態を残さない）

### 8.2 本番 push 後の Preview 同期（必須）

本番（`main`）へ merge / push した**直後**、必ず:

```bash
git checkout preview/landing-01
git merge main    # 通常 fast-forward
git push origin preview/landing-01
```

**完了条件**: `origin/main` と `origin/preview/landing-01` が **同一 commit**（例: `git rev-parse origin/main origin/preview/landing-01` が同じハッシュ）。

- changelog の merge conflict 等で `main` だけ進んだ場合も、**同期まで完了してからタスク完了**とする
- 返答では、本番 push 時に **Preview も同期済みか** を明示する

### 8.3 やってはいけないこと

| NG | 理由 |
|----|------|
| `main` のみ push して `preview/landing-01` を放置 | オーナーの Preview 確認環境と本番が乖離する |
| Preview 未確認で main 反映 | §8.1・`.cursor/rules/forge.mdc` の例外以外禁止 |
| 本番反映後に Preview 同期を省略 | 次の Preview 試行が本番と別物になる |

### 8.4 関連

- Cursor ルール: `.cursor/rules/forge.mdc`（Preview push / 本番 GO 条件）
- エージェント要約: `AGENTS.md` §Preview / main
- production mode 監査: `docs/production-mode-audit.md`

---

## 10. Cursor 一気通貫運用（2026-06-16〜）

オーナーが変更を明示するまで有効。**開発速度優先**。安全性は §10.2 の停止条件で維持。

### 10.1 基本方針

**機能タスク単位**で、次まで **承認待ちなし** で進めてよい:

```text
設計 → 実装 → build → staging 確認 → main 反映準備
```

- 毎工程ごとの「Run判断」「GO/NG 待ち」は **不要**
- main への commit / push も **main 反映準備** の一部として Cursor が実行してよい（staging 目視後を原則）
- `■ 今すぐ私がやるべきこと`（サマリ）には **本当にオーナーしかできないことだけ** 書く。Cursor が実行できる内容は書かない

### 10.2 必ず停止（GPT判断用メモ）

以下 **のみ** 停止。`docs/gpt-run-decision-memo.md` 形式で報告:

| 停止 | 例 |
|------|-----|
| **課金発生** | OpenAI 本番大量実行、Supabase/Vercel プラン変更 |
| **新規 API 契約** | 未使用 SaaS の新規 signup / API key 発行 |
| **本番公開** | ユーザー向け機能の本番 GO（PLAYER_VISIBLE ON 含む） |
| **PLAYER_VISIBLE=true** | 採用 UI の本番表示 ON |
| **DB 破壊変更** | DROP / 列削除 / CHECK 締め付けで既存行が壊れる |
| **既存データ移行** | バックフィル / 一括 UPDATE / 推測補完 |
| **Forge 原典変更** | `docs/forge-principles.md` の意味変更 |
| **ロードマップ優先順位変更** | 次テーマ順位の確定変更 |
| **不可逆な作業** | force push、本番データ削除、復旧不能な操作 |

※ **additive migration 作成**・**012 型の追記テーブル**は停止対象外（Dashboard **適用**はオーナー Dashboard 操作が必要な場合はサマリのオーナー欄に記載）。

### 10.3 自動で進めてよいもの

- migration **作成**（SQL 正本）
- 設計 doc 更新
- 実装
- build
- staging 確認（Cursor / ブラウザ / スクリプトで可能な範囲）
- テストデータ投入（staging・fixture）
- **main 反映準備**（commit、push、handoff / changelog / summary 更新）
- **Preview / main 同期** — 本番 push 後は §8.2 に従い `preview/landing-01` を `main` と同一 commit に揃える
- handoff 更新（差分。全量 handoff は §7 トリガー時のみ）

### 10.4 旧 Run 停止リストとの関係

`docs/gpt-run-decision-memo.md` の「push / migration / deploy 一律停止」は **本セクションに置換**。  
スクショ Run 判断は **§10.2 に該当するとき** またはオーナーが明示したときのみ。

---

## 11. ドキュメント索引

| ファイル | 用途 |
|---|---|
| `docs/forge-triage-operations.md` | **本ファイル** — トリガー運用の正本（**§8 Preview/main 同期**） |
| `docs/chatgpt-summary-format.md` | Cursor サマリ粒度標準 |
| `docs/chatgpt-summary.md` | 差分サマリ（毎タスク） |
| `docs/chatgpt-handoff.md` | 全量引継ぎ（新スレッド初回） |
| `docs/gpt-run-decision-memo.md` | Run 停止時メモ形式 |
| `AGENTS.md` | Cursor エージェントルール |
| `docs/forge-principles.md` | Forge 原典 |

---

## 12. 変更履歴

- **2026-06-28** — §8 Preview / main デプロイ手順（Preview 確認 → 本番 → Preview 同期必須・ブランチ同一 commit）
- **2026-06-16** — §10 Cursor 一気通貫運用（停止条件 9 項目・main 反映準備まで自動可・サマリオーナー欄ルール）
- **2026-06-13** — 初版（CURSOR キーワード、Run 4 段階、サマリレビュー、UX レビュー、プロダクトレビュー優先順位、チャット移行）
