# 設計レビュー — voice_adoptions 正本（Phase1 土台）

**ステータス**: 実装前レビュー GO — **`docs/voice-adoptions-pre-implementation-review.md` が Phase1+2 正本**  
**日付**: 2026-06-16  
**確定**: `ADOPTION_THRESHOLD = 0.82` / Phase1+2 同一テーマ

**原典**: `docs/forge-principles.md`  
**関連**: `docs/player-nurture-core-experience-design-review.md`（体験全体）、`docs/player-voice-adoption-ai-design-review.md`（旧・通知中心。本書が Phase 順の正本）

---

## 0. 実装フェーズ（確定順）

| Phase | 内容 | 成果物 |
|-------|------|--------|
| **1+2** | 正本 DB + matcher + **最小プレイヤー UI** | 1 テーマ（DB 単体で止めない） |
| **3** | 再プレイ導線 | 新版 + personal hook — **ここで初めて「俺が育てた」** |
| **4** | 育成履歴（レジャー） | adoptions の時系列ビュー。**中身がある状態で初めて作る** |

**原則**: 通知 → 体験 ではない。**事実（voice_adoptions）→ 体験**。

---

## 1. voice_adoptions 正式スキーマ

### 1.1 正本としての役割

`voice_adoptions` は Forge における **「プレイヤーの声 X が、更新 Y に関連した」という唯一の公式記録**。

- 通知・マイページ・再プレイ hook・レジャーは **すべてこの行を参照**（再計算しない）
- UI 用の `player_quote` / `update_summary` も **判定時に確定保存**（表示のたびに LLM を呼ばない）
- 開発者手動採用 UI は **存在しない**

### 1.2 テーブル: `voice_adoptions`

```sql
CREATE TABLE public.voice_adoptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 参照（正規化 + クエリ用非正規化）
  project_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  voice_response_id uuid NOT NULL
    REFERENCES public.project_voice_responses (id) ON DELETE CASCADE,
  devlog_id uuid NOT NULL
    REFERENCES public.project_devlogs (id) ON DELETE CASCADE,

  -- 版コンテキスト（表示・フィルタ用。正本は devlog / voice の version）
  voice_version_key text NOT NULL,
  published_version text NOT NULL,

  -- UI 確定コピー（Phase2 以降が読む。再生成しない）
  player_quote text NOT NULL,
  update_summary text NOT NULL,
  prompt_text text NULL,

  -- 判定メタ
  confidence numeric(4,3) NOT NULL
    CHECK (confidence >= 0 AND confidence <= 1),
  model text NOT NULL,
  model_version text NULL,
  matcher_run_id uuid NOT NULL,

  -- ライフサイクル（誤判定・非表示。行は消さない）
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suppressed', 'pending_review')),
  suppression_reason text NULL
    CHECK (suppression_reason IS NULL OR suppression_reason IN (
      'player_dispute', 'model_error', 'devlog_retracted', 'admin'
    )),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT voice_adoptions_response_devlog_unique
    UNIQUE (voice_response_id, devlog_id)
);
```

**`user_id` 非正規化理由**: RLS・マイページクエリで `voice_responses` JOIN を毎回避ける。INSERT 時に response からコピー。

**`status`**: 偽陽性対応は DELETE しない。**suppressed** でプレイヤー UI から除外（監査・モデル改善用に行は残す）。

**`pending_review`**: confidence がグレーゾーン（後述）のとき **行は作るが Phase2 UI には出さない** 運用も可。正式版推奨は **グレーは INSERT しない**（行を増やさない）。

### 1.3 テーブル: `voice_adoption_matcher_runs`（ジョブ + 監査）

```sql
CREATE TABLE public.voice_adoption_matcher_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  devlog_id uuid NOT NULL
    REFERENCES public.project_devlogs (id) ON DELETE CASCADE,
  project_id text NOT NULL,

  trigger_type text NOT NULL
    CHECK (trigger_type IN ('devlog_published', 'backfill', 'model_upgrade')),
  trigger_version text NOT NULL,

  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed', 'skipped')),

  candidate_count int NOT NULL DEFAULT 0,
  evaluated_count int NOT NULL DEFAULT 0,
  adopted_count int NOT NULL DEFAULT 0,

  model text NOT NULL,
  error_message text NULL,
  started_at timestamptz NULL,
  completed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT voice_adoption_matcher_runs_devlog_trigger_unique
    UNIQUE (devlog_id, trigger_type, trigger_version)
);
```

**`trigger_version`**: 例 `matcher-v1` / `gpt-4o-mini-2024-07-18`。モデル変更時の **意図的再実行** のみ許可。

**1 devlog あたり通常 1 run**（`devlog_published`）。再実行は `model_upgrade` または `backfill` のみ。

### 1.4 テーブル: `voice_adoption_disputes`（プレイヤー申告・任意 Phase1）

```sql
CREATE TABLE public.voice_adoption_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adoption_id uuid NOT NULL
    REFERENCES public.voice_adoptions (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (adoption_id, user_id)
);
```

申告時: 対応 adoption を `status = suppressed`, `suppression_reason = player_dispute`。**開発者作業なし**。

### 1.5 Index

```sql
-- プレイヤー: 自分の採用一覧（Phase2/4）
CREATE INDEX voice_adoptions_user_project_created_idx
  ON public.voice_adoptions (user_id, project_id, created_at DESC)
  WHERE status = 'active';

-- 作品: 某 devlog に紐づく採用（Studio 将来・デバッグ）
CREATE INDEX voice_adoptions_devlog_idx
  ON public.voice_adoptions (devlog_id)
  WHERE status = 'active';

-- 回答: 1回答 → 複数更新（Q5）
CREATE INDEX voice_adoptions_voice_response_idx
  ON public.voice_adoptions (voice_response_id, created_at DESC)
  WHERE status = 'active';

CREATE INDEX voice_adoptions_project_published_idx
  ON public.voice_adoptions (project_id, published_version, created_at DESC)
  WHERE status = 'active';

CREATE INDEX voice_adoption_matcher_runs_devlog_idx
  ON public.voice_adoption_matcher_runs (devlog_id);
```

### 1.6 RLS

| 主体 | voice_adoptions | matcher_runs | disputes |
|------|-----------------|--------------|----------|
| **プレイヤー** | SELECT 自分の `user_id` かつ `status = active` | 不可 | INSERT/SELECT 自分 |
| **開発者（owner）** | SELECT 自 project（**集計のみ将来**。個別行は原則不要） | SELECT 自 project | 不可 |
| **service role** | INSERT/UPDATE（マッチャー） | INSERT/UPDATE | UPDATE adoption status |
| **anon** | 不可 | 不可 | 不可 |

```sql
ALTER TABLE public.voice_adoptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read own active adoptions"
  ON public.voice_adoptions FOR SELECT
  USING (auth.uid() = user_id AND status = 'active');

CREATE POLICY "Project owners read adoptions on owned projects"
  ON public.voice_adoptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  );
-- INSERT/UPDATE: service role only（Edge Function / backend）
```

**重要**: プレイヤーは **自分に active な adoption 行だけ** 読める。他プレイヤーの採用は見えない（原典・Out of scope のランキング回避）。

### 1.7 保持期間

| データ | 保持 | 理由 |
|--------|------|------|
| `voice_adoptions`（active/suppressed） | **無期限** | 正本・レジャー Phase4 の源泉 |
| `voice_adoption_matcher_runs` | **無期限**（要約のみ） | 再実行判断・監査 |
| LLM 生ログ（S3/別表、任意） | **90日** | デバッグ。正本行に quote は残る |
| `voice_adoption_disputes` | **無期限** | モデル改善 |
| embedding キャッシュ（将来） | **再計算可能** | devlog/response 更新で invalidate |

削除ポリシー: **論理削除（suppressed）のみ**。物理 DELETE は project カスケード時のみ。

---

## 2. AI 判定フロー

### 2.1 トリガー（Q4 と統合）

**正本トリガー: `project_devlogs.published_version` が NULL → 非 NULL になった瞬間**

理由:
- Forge 上「何が変わったか」の公式テキストは **devlog（title + content）**
- `published_version` は「この記録がプレイヤー向け新版として出た」印
- `version_published` 通知は **同イベントの別产物**。adoption ジョブは **devlog 公開に同期**

```text
devlog UPDATE/INSERT（published_version セット）
  → enqueue voice_adoption_matcher_runs（trigger_type = devlog_published）
  → （既存）watch 通知 / version 通知 は並行でよい
```

**新版公開のみで devlog なし**: ジョブ **skipped**（マッチ対象テキストなし）。Forge フロー上は devlog 必須 culture。

**devlog だけ公開（published_version 未セット）**: ジョブ **走らせない** — 下書き・未公開は候補外。

### 2.2 入力

**Run 単位（1 devlog）**:

| 入力 | ソース |
|------|--------|
| `devlog.title`, `devlog.content` | 更新側 |
| `devlog.published_version` | 版 |
| `project_id` | |
| 候補 `voice_responses[]` | 下記フィルタ後 |

**候補 voice_response フィルタ（LLM 前）**:

1. 同一 `project_id`
2. `voice.version_key` ≤ `devlog.published_version`（ semver / Forge の版比較関数）
3. `voice.created_at` < `devlog.created_at`（または published_at — devlog に `published_at` 列追加検討）
4. （スケール後）embedding top-k のみ LLM へ

**1 回答のテキスト構築**:

```text
prompt_text: "{prompt_text}"
answer: "{answer_label ?? answer_value}"
```

`short_text` は全文。`choice` / `scale_3` は label 優先。

### 2.3 出力（LLM → 保存）

**推奨: 1 devlog あたり 1 回の batch LLM 呼び出し**

```json
{
  "update_summary": "チュートリアルを追加しました",
  "matches": [
    {
      "voice_response_id": "uuid",
      "related": true,
      "confidence": 0.91,
      "player_quote": "チュートリアル不足"
    }
  ]
}
```

**保存ルール**:

| 条件 | 動作 |
|------|------|
| `related = true` かつ `confidence >= ADOPTION_THRESHOLD` | `voice_adoptions` INSERT（status=active） |
| `confidence` 閾値未満 | **行を作らない**（監査は matcher_run の evaluated_count のみ） |
| 同一 `(voice_response_id, devlog_id)` 既存 | **SKIP**（再実行禁止） |

**閾値（オーナー判断待ち）**:

- **推奨 `ADOPTION_THRESHOLD = 0.82`** — 偽陽性回避優先（後述）
- グレーゾーン 0.70–0.81: INSERT しない（`pending_review` 運用は Phase1 では不採用）

**`player_quote` / `update_summary`**:

- LLM が短文化した UI 用コピーを **必ず保存**
- 原文は `voice_responses` / `devlog` から辿れる。adoption 行は **表示スナップショット**

### 2.4 再実行戦略

| ケース | 再実行 |
|--------|--------|
| 同一 devlog・同一 matcher バージョン | **禁止** |
| モデル / プロンプト major 変更 | `trigger_type = model_upgrade`, `trigger_version` 更新。**suppressed 以外の既存行は維持**。新規マッチのみ追加 INSERT |
| 過去 devlog の backfill | `trigger_type = backfill`、オーナー / 運用トリガー |
| devlog 本文の事後編集 | **禁止** — 公開 devlog は immutable ポリシー（編集 = 新 devlog 推奨） |
| プレイヤー dispute | 再実行しない。status → suppressed |

**Idempotency key**: `(devlog_id, trigger_type, trigger_version)` on matcher_runs。

---

## 3. 誤判定時の扱い（Q3）

### 優先: **偽陽性を避ける**（偽陰性を許容）

| | 偽陽性 | 偽陰性 |
|---|--------|--------|
| 意味 | 関係ないのに「あなたの声が反映」 | 関係あるのに adoption 行なし |
| ダメージ | **信頼破壊。「Forge が嘘ついた」** | 「更新は見えるが育てた感は弱い」 |
| Phase1 | 閾値高め・INSERT 慎重 | P1 更新 UI で WHAT は伝わる |
| Phase2+ | 最悪。dispute → suppressed | 許容 |

**運用**:

- Phase1 では **UI なし** でも DB に active 行が残る → 本番前に **staging で precision 検証**
- dispute は開発者に回さない。自動 suppressed + 集計でモデル改善
- **謝罪通知は出さない** — 静かに UI から消える

---

## 4. devlog と新版公開 — トリガー（Q4 詳細）

| イベント | adoption ジョブ | 理由 |
|----------|-----------------|------|
| devlog `published_version` セット | **YES（主トリガー）** | 変更内容テキスト + 版が確定 |
| `projects.playable_version` bump のみ | **NO**（devlog 経由で間接） | 単体ではマッチ材料なし |
| devlog INSERT（未公開） | NO | |
| watch 向け `version_published` 通知 | 並行可 | 通知は Phase2 以降。Phase1 不要 |

**`published_version` と `voice.version_key` の関係**:

- 回答は「その版をプレイしたときの声」
- 更新 devlog は「版 X として公開」— 通常 X は voice より新しい
- マッチ: voice は **公開版より前の版** に限定（同版への回答は「この版へのフィードバック」であり、同版 devlog 公開とは時系列で整理）

---

## 5. 1 回答 → 複数更新（Q5）

**データモデル**: 1 `voice_response_id` × N `devlog_id` = **N 行**（UNIQUE はペア単位）

例:

```text
response R1 「チュートリアル不足」
  → devlog D1 (v0.4) 「チュートリアル追加」  adoption 行1
  → devlog D2 (v0.5) 「チュートリアル改善」  adoption 行2（別更新として独立判定）
```

**判定**: 各 devlog 公開ごとに **独立 run**。過去 adoption がある response も **新 devlog で再評価**（ペアが異なるため）。

**UI Phase2**: 同一作品で複数カード / 1 カード内リスト。

**Phase4 レジャー**: 時系列で複数エントリ — **中身は Phase1 の行の積み上げ**。

---

## 6. 複数回答 → 1 更新（Q6）

**データモデル**: N `voice_response_id` × 1 `devlog_id` = **最大 N 行**

- 各プレイヤー **独立判定**。confidence 達した人だけ行ができる
- 「23人が言ったから代表1人」**禁止** — 個人帰属のため全員独立
- 同一 devlog への LLM batch で **全候補を一度に評価**（コスト効率）

**同趣旨の short_text 大量**:

- embedding 事前フィルタ + batch LLM
- devlog あたり LLM 入力上限（例 50 候補）— 超過分は **次 run に分割しない**。超過 = 最も embedding 近い 50 のみ（偽陰性リスク。スケール時）

**案B（グループ通知）**: Phase1 では **行を作らない**。グループは将来 UI レイヤーで `COUNT(*)` 可能だが、正本は常に **1 user 1 row**。

---

## 7. スケール戦略 — 数十万回答（Q7）

### 7.1 段階的パイプライン

```text
[devlog 公開]
  → Run enqueue
  → Stage A: SQL フィルタ（project + version + 時系列）  … 10⁵ → 10³
  → Stage B: embedding 類似度 top-k（k=30〜50/devlog） … 10³ → 50
  → Stage C: 1 batch LLM / devlog（最大 50 回答）
  → Stage D: threshold → voice_adoptions INSERT
```

### 7.2 embedding

**テーブル（将来 migration 012+）**:

```sql
-- voice_response_embeddings (voice_response_id, embedding vector(1536), model, created_at)
-- devlog_embeddings (devlog_id, embedding, model, created_at)
```

- response: INSERT 時に非同期 embed（プレイヤー体感に影響しない）
- devlog: `published_version` セット時に embed してから Stage B
- 類似度: devlog ↔ response cosine、**プロジェクト内** top-k

**数十万規模**:

- pgvector + IVFFlat / HNSW（Supabase 対応確認）
- matcher worker 水平分割（project_id ハッシュ）
- devlog 公開は **非同期キュー**（同期 HTTP 禁止）

### 7.3 コスト（再掲・スケール時）

| 規模 | devlog/月 | LLM 呼び出し | 月次目安 |
|------|-----------|--------------|----------|
| 初期 | 10 | 10 batch | $0.05–0.15 |
| 中 | 100 | 100 batch | $0.5–1.5 |
| 大 | 1,000 | 1,000 batch | $5–15 |
| 特大 | 10,000+ | embedding 必須 | $50+（要 worker 最適化） |

**ボトルネック**: 金額より **precision**。スケールしても閾値は下げない。

---

## 8. voice_adoptions を正本として成立するか

### 8.1 成立条件チェック

| # | 条件 | 本設計 |
|---|------|--------|
| 1 | 事実が DB に残る | ◎ adoption 行 |
| 2 | UI が再計算しない | ◎ quote/summary 保存 |
| 3 | 1:N / N:1 を表現 | ◎ ペア UNIQUE |
| 4 | 誤判定を消せる | ◎ suppressed（非 DELETE） |
| 5 | 再実行が制御できる | ◎ matcher_runs |
| 6 | プレイヤー RLS | ◎ user_id + active |
| 7 | 開発者手動なし | ◎ service role のみ INSERT |
| 8 | 通知なし Phase1 | ◎ 可能 |

**結論: YES — Phase1 だけで正本として成立する。**

レジャー・通知・再プレイ hook は **SELECT voice_adoptions WHERE user_id = ? AND status = 'active'** の派生。

### 8.2 Phase1 完了の定義（DoD）

- migration 011 適用（本 doc のスキーマ）
- devlog 公開 → matcher run → adoption 行（staging で 10 ペア手動検証）
- **プレイヤー UI なし** でも Supabase / 管理クエリで行が確認できる
- precision 95%+ を目標（件数少の間は目視全件）

### 8.3 Phase2 以降との接続

| Phase | 読むデータ |
|-------|-----------|
| 2 プレイヤー表示 | `voice_adoptions` + JOIN devlog/project |
| 3 再プレイ | 同上 + `published_version` + 最新 playable |
| 4 レジャー | 同上 `ORDER BY created_at` — **新テーブル不要**（VIEW で可: `player_adoption_timeline`） |

**レジャー専用テーブルは Phase4 でも不要** — adoptions が既に年表の正本。Phase4 は **UI ビュー** のみ。

---

## 9. migration 番号・ファイル名（参考）

- `011_voice_adoptions.sql` — 本 doc 3 テーブル + RLS + index
- `012_voice_embeddings.sql` — スケール段階で（Phase1 外）

---

## 10. オーナー GO 前の確認（Phase1 のみ）

1. **ADOPTION_THRESHOLD** — 0.82 推奨の可否
2. **公開 devlog immutable** — 事後編集禁止ポリシー
3. **owner が adoption 個別行を見られる RLS** — 将来 Studio 用。Phase1 から入れるか
4. **Phase1 DoD** — UI なし staging 検証で GO するか

**次 Cursor 作業（GO 後）**: `011_voice_adoptions.sql` 草案 → Edge Function matcher 試作 → staging E2E
