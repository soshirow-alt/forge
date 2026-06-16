# 設計レビュー — プレイヤー「自分の意見が採用された」体験（AI 紐づけ）

**ステータス**: 設計レビュー（**未 GO・実装なし**）  
**日付**: 2026-06-16  
**優先度**: P2（P0 Studio 導線 / P1 更新 UI 完了後に着手）

**原典参照**: `docs/forge-principles.md` — プレイヤーサイクル「声を届ける → **変化を見る** → 再プレイ」

**前提（オーナー判断）**:
- Forge の価値は「ゲームが成長する場所」
- プレイヤーが気持ちいいのは「みんなの声が反映された」ではなく **「自分の意見が採用された」**
- 開発者が手動で「この回答を参考にした」を選ぶ設計は **避ける**（面倒・忘れる・スケールしない）

---

## 1. フィジビリティ

**結論: 技術的には実現可能。ただし「100% 自動・誤判定ゼロ」は期待しない。**

| 要素 | 評価 |
|------|------|
| 入力データ | 既存: `project_voice_responses`（プレイヤー回答テキスト）、devlog（タイトル・本文）、`publishedVersion` |
| 判定方式 | LLM による意味的類似度 + ルール前処理（同一 project / 版以降の devlog のみ候補） |
| 通知タイミング | devlog 公開 or 新版公開時にバッチ判定 → 該当プレイヤーへ通知 |
| 人手不要の条件 | **閾値以上の confidence のみ自動通知**。それ未満は通知しない（誤通知より無通知を優先） |

**成立しないケース（許容）**:
- 開発者が回答を参考にしたが devlog に書かなかった → 紐づけ不可
- 間接的改善（「難しい」→ 難易度調整全体）→ 具体文言との 1:1 マッチが弱い
- 複数回答が同趣旨 → 1 devlog に複数プレイヤーを紐づけるか、代表のみか要設計

**MVP ハック vs 正式機能**: ルールベースのキーワード一致だけでは **正式機能として不十分**（誤判定・取りこぼしが多い）。LLM + confidence + 監査ログが最低ライン。

---

## 2. 実現方式

### 推奨: **公開イベント駆動 + 非同期 AI 判定**

```
[devlog 公開 / 新版公開]
        ↓
[候補ペア生成] 同一 project · 当該版以前の voice_responses × 今回の devlog
        ↓
[LLM バッチ] 各 (response, devlog) について related? + confidence + excerpt
        ↓
[閾値フィルタ] confidence >= 0.75（要調整）
        ↓
[voice_adoptions  INSERT] + player 通知 enqueue
        ↓
[マイページ / 通知] 「あなたは "…" と回答しました → 今回 "…" されました」
```

### LLM プロンプト方針

- 入力: プレイヤー回答（全文 or 要約）、devlog タイトル + 本文要約
- 出力 JSON: `{ "related": boolean, "confidence": 0-1, "player_quote": "...", "update_summary": "...", "reason": "..." }`
- **player_quote / update_summary は UI 表示用に短文化**（そのまま devlog タイトルを流用しない）

### 人手を避けつつ品質を保つ方法

1. **自動のみ** — 開発者 UI に「採用チェック」は置かない
2. **低 confidence は黙る** — 「反映されたかも」は育てた感を壊す
3. **後から監査** — サポート用に adoption ログは残すが、プレイヤー向けには出さない
4. **再判定禁止** — 同一 (response_id, devlog_id) は一度きり

### 非推奨

- 開発者が回答一覧から「参考にした」を手動選択
- 全回答に一律「反映されました」通知
- キーワードのみの naive マッチ（「チュートリアル」が devlog にあれば全員に通知 等）

---

## 3. DB 構成案

### 新規テーブル: `voice_adoptions`

```sql
create table voice_adoptions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  voice_response_id uuid not null references project_voice_responses(id) on delete cascade,
  devlog_id uuid not null references devlogs(id) on delete cascade,
  published_version text,
  player_quote text not null,        -- UI: プレイヤーが言ったこと（短句）
  update_summary text not null,      -- UI: 今回の更新（短句）
  confidence numeric(4,3) not null check (confidence >= 0 and confidence <= 1),
  model text not null,               -- 例: gpt-4o-mini-2024-...
  created_at timestamptz not null default now(),
  unique (voice_response_id, devlog_id)
);

create index voice_adoptions_project_id_idx on voice_adoptions(project_id);
create index voice_adoptions_voice_response_id_idx on voice_adoptions(voice_response_id);
```

### 通知拡張

- `notifications.type` に `voice_adopted` を追加
- payload: `player_quote`, `update_summary`, `devlog_id`, `project_id`
- RLS: プレイヤー本人のみ read

### ジョブ / Edge Function

- トリガー: devlog `published_version` セット時 or アプリ層の publish 完了フック
- `voice_adoption_jobs`（任意）: status, devlog_id, processed_at — リトライ用

### 既存との関係

- `project_voice_reads`（開発者読了）とは独立 — 採用はプレイヤー向け体験
- devlog が「参考にした」と明記しなくても AI が推論

---

## 4. AI コスト概算

**前提**: gpt-4o-mini クラス、1 判定 ≈ 500 input + 150 output tokens

| 規模 | 想定 | 月次コスト目安 |
|------|------|----------------|
| 初期（devlog 10件/月、回答 50件/版、候補ペア ~500） | 500 判定 | **$0.05〜0.15** |
| 成長期（devlog 100件/月、候補 5,000） | 5,000 判定 | **$0.5〜1.5** |
| スケール（候補 50,000） | バッチ最適化必須 | **$5〜15** |

**コスト削減**:
- 候補ペアを **同一 prompt_id / 同一版 / 公開 devlog 以降** に限定
- embedding 事前フィルタ（コサイン類似度 top-k のみ LLM）で 70〜90% 削減可能
- 1 devlog あたり 1 バッチ API 呼び出し（複数回答をまとめる）

**結論**: Forge 規模では **コストは問題にならない**。設計品質と誤判定の方がリスク。

---

## 5. 誤判定リスク

| リスク | 例 | 対策 |
|--------|-----|------|
| 偽陽性（関係ないのに採用通知） | 「BGM 欲しい」→ 無関係な UI 更新 | confidence 閾値、低スコアは通知しない |
| 偽陰性（参考にしたのに通知なし） | devlog が抽象語のみ | 許容 — プレイヤーは「更新」UI でカバー |
| 過剰通知 | 同趣旨 10 人に同一 devlog | 1 devlog あたり同一趣旨はまとめる or 上限 |
| 版ズレ | 旧版回答と新版更新 | **回答 version_key ≤ devlog の対象版** でフィルタ |
| 法的・信頼 | 「採用された」と嘘 | UI は「今回の更新と、あなたの回答の関連を検出しました」程度の断定を避け、具体引用で示す |

**Forge らしい安全側**: 疑わしいときは **通知しない**。P1「前回プレイ後の更新」で変化自体は伝わる。

---

## 6. Forge らしい見せ方

### NG（弱い出口）

- 「あなたの回答が反映されました」（抽象・他者と区別不可）
- 「開発者があなたの回答を参考にしました」（開発者手動前提）

### OK（具体引用の二段）

```
あなたは
「チュートリアルが欲しい」
と回答しました

今回の更新で
「チュートリアルが追加」
されました

[もう一度プレイする]  [更新内容を見る]
```

### 表示場所

1. **通知** — `voice_adopted` 型、マイページ通知一覧
2. **マイページ「前回プレイ後の更新」** — 通常更新カードに **採用リボン**（任意）または専用カード
3. **作品詳細 / 新版バナー** — ログイン中かつ本人の採用のみ「あなたの声がここに効いた」1 行

### トーン

- ランキング・バッジ・点数化は **しない**（原典 Out）
- 「採用数」競争ではなく **1 対 1 の物語**
- 他プレイヤーの採用は見せない（本人のみ）

---

## 7. 実装優先順位

| 順 | 内容 | 依存 |
|----|------|------|
| 1 | P0/P1 完了（Studio フェーズ・プレイヤー更新 UI） | ✅ 今回 |
| 2 | `voice_adoptions` migration + RLS | Dashboard 手動適用 |
| 3 | publish フック + Edge Function（LLM 判定） | service role |
| 4 | `voice_adopted` 通知 + マイページカード | notifications |
| 5 | embedding 事前フィルタ（コスト・精度） | 量が増えてから |
| 6 | 作品詳細バナー統合 | 5 安定後 |

**Cursor 推奨**: 2〜4 を **1 テーマ** で GO。5 は計測後。

---

## 8. MVP ではなく正式機能として成立するか

**結論: 条件付き YES**

成立条件:
1. LLM + confidence + 監査ログ（キーワードのみは NO）
2. 低 confidence は通知しない（誤通知より無通知）
3. 開発者手動「参考にした」UI **なし**
4. プレイヤーには **引用付き具体体験** のみ
5. P1 更新 UI と併存 — 採用通知がなくても「何が変わったか」は見える

正式機能として **不十分な線**:
- 手動チェック必須
- 全員に同文通知
- confidence なしの自動マッチ

---

## オーナー GO 前の確認事項

1. confidence 閾値（0.75 案）の許容 — 取りこぼし vs 誤通知
2. 同趣旨複数プレイヤー — 全員通知 vs 代表のみ
3. devlog 本文を AI に送る **プライバシー** — 回答・devlog とも anon 化不要だが、ログ保持期間
4. 通知文言の断定度 — 「されました」vs「関連する更新がありました」

**次アクション（GO 後）**: migration 草案 → Edge Function 試作 → ステージングで 10 ペア手動検証 → 本番
