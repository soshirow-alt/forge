# voice_adoptions staging 精度評価ガイド

**ステータス**: オーナー方針確定（2026-06-15 レビュー）  
**目的**: matcher 本番 GO 前に **偽陽性 0** を staging で証明する

---

## 1. labeled set

| カテゴリ | 件数 | 意味 |
|----------|------|------|
| **direct** | 20 | devlog に明示的な対応記述。採用期待 |
| **indirect** | 20 | 言葉は違うが因果合理的。confidence ≥ 0.88 で採用期待 |
| **reject** | 20 | 無関係・称賛・抽象 devlog 等。**不採用期待** |
| **合計** | **60** | |

**正本データ**: `lib/voice-adoption/staging-labeled-set/`

各ケース = 1 devlog + 1 voice 回答（単独ペア）。matcher は 1 ケースずつ OpenAI batch として実行。

---

## 2. 評価軸（優先順）

### ① False Positive（最重要）

**Forge で最悪なのは「あなたの声が反映されました」が嘘になること。**

| カテゴリ | GO 条件 |
|----------|---------|
| direct false positive | **0** |
| indirect false positive | **0** |
| reject false positive | **0** |

自動判定: `adopted && !shouldAdopt` が 1 件でもあれば **FAIL**。

reject セットでの誤採用は特に致命傷。

### ② Explanation Quality（目視必須）

採用された行について、プレイヤーが adoption 文言を読んで

「確かに自分の声と今回の変更は関係ある」

と思えるか。

- スクリプトは `--live` 実行後、採用ケース一覧を **manual review 用** に出力
- `referenceUpdateSummary` と LLM の `update_summary` を比較
- 弱い表現（「可能性があります」等）はコード側で reject 済みだが、目視も実施

### ③ Recall / FN（参考 — 許容）

見逃し（false negative）は **許容**。Forge は precision 優先。

- direct / indirect で recall が低くても **GO 阻害しない**
- FN = 本当は採用されたのに adoption が表示されない → 残念だが許容
- FP = 関係ないのに「あなたの声が反映されました」→ **Forge が嘘をつく** → 不可

**FN が多かった場合の対応順（オーナー確定）**

1. **prompt 改善**（最優先）
2. **explanation 生成改善**（`update_summary` / `player_quote` の質）
3. **labeled set 追加**（不足パターンの補完）
4. **閾値変更**（**最後**。Recall 取りに行かない）

**閾値は維持**（direct 0.82 / indirect 0.88）。閾値緩和で recall を取りに行かない。
prompt 改善で recall を上げる方向を優先。

---

## 3. 実行手順

### 3.1 構造検証（CI / 毎回）

```bash
npm run verify:voice-adoption:staging
```

labeled set が 20/20/20 = 60 件であることを確認。API 不要。

### 3.2 fixture 10 ペア（regression）

```bash
npm run verify:voice-adoption
```

決定論 fixture。CI 用。staging GO とは別。

### 3.3 staging 精度（OpenAI live）

**.env.local（サーバーのみ）**

```env
OPENAI_API_KEY=sk-...
VOICE_ADOPTION_MATCHER_MODE=live
SUPABASE_SERVICE_ROLE_KEY=...   # matcher run 本体確認時のみ
```

```bash
npm run verify:voice-adoption:staging -- --live
```

- 60 ケース × OpenAI 呼び出し（課金あり）
- 自動 GO: 全カテゴリ FP = 0
- 通過後: Explanation Quality をオーナー目視

**注意**: `--fixture` モードは stub 用。staging GO 判断には **--live のみ** 有効。

---

## 4. GO 判断フロー

```text
1. labeled set 構造 OK
2. --live 実行 → FP = 0（自動）
3. 採用ケース目視 → Explanation Quality OK
4. staging shadow（実 devlog 2 公開）→ FP = 0 を連続確認（別手順）
5. matcher 本番 GO Run（Edge deploy + OPENAI 本番）
6. **shadow 公開 A / B** — FP=0 × 2（`docs/voice-adoptions-shadow-guide.md`）→ プレイヤー表示 GO 候補
```

---

## 5. 次アクション（オーナー — 変更なし）

**最優先: matcher 精度の確定**

1. `OPENAI_API_KEY` 設定
2. `npm run verify:voice-adoption:staging -- --live`
3. Explanation Quality 目視
4. FP = 0 判定（direct / indirect / reject 各 0）
5. matcher 本番 GO 判断

**Phase3 実装はその後**（設計・文言・URL・UX モックは先行 OK）

**prompt v2**（`adoption-prompt-v2`）: 同一問題判定 + few-shot indirect/reject 例。FN 時は閾値ではなく prompt から調整。

---

## 6. 本番 GO 後の優先順位

1. staging 精度評価
2. matcher 本番 GO 判断
3. **Phase3（変化を確かめる）設計** ← `docs/phase3-adoption-verify-ux-design.md`
4. Phase3 実装
5. プレイ履歴
6. 正式版設計 ← `docs/official-release-design.md`
7. バッジ詳細設計
8. バッジ実装

---

## 7. 関連 doc

- `docs/voice-adoptions-openai-matcher-design.md` — matcher 全体
- `docs/phase3-adoption-verify-ux-design.md` — Phase3 UX
- `docs/official-release-design.md` — 正式版（開発者宣言）
- `docs/player-badges-design-review.md` — バッジ（Phase3 後）
