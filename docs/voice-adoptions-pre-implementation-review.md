# 実装前レビュー — voice_adoptions 正本 + Phase2 最小表示

**ステータス**: 実装前レビュー（**GO・実装はまだしない**）  
**日付**: 2026-06-16  
**開発テーマ**: Phase1（正本 DB + AI マッチ）+ Phase2（プレイヤー最小表示）を **1 テーマ**

**確定パラメータ**:
- `ADOPTION_THRESHOLD = 0.82`（偽陽性回避。オーナー GO）
- 通知・レジャー・再プレイ hook 本実装・本番 AI・migration 適用は **今回 Out**

**正本**: `docs/voice-adoptions-canonical-design-review.md`（スキール詳細・スケール）

---

## 実装フェーズ（確定）

| Phase | 今回 | 内容 |
|-------|------|------|
| **1+2** | **設計 GO → 次 Cursor 実装** | 正本 DB + matcher + **最小プレイヤー UI** |
| **3** | 設計のみ接続 | 再プレイ hook 強化（Phase2 CTA の延長） |
| **4** | 後回し | 育成履歴 = adoptions 時系列 VIEW |

**Phase1 単体で止めない** — DB だけではプレイヤーにも開発者にも価値が見えない。

---

## 1. voice_adoptions schema

```sql
CREATE TABLE public.voice_adoptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  project_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  voice_response_id uuid NOT NULL
    REFERENCES public.project_voice_responses (id) ON DELETE CASCADE,
  devlog_id uuid NOT NULL
    REFERENCES public.project_devlogs (id) ON DELETE CASCADE,

  voice_version_key text NOT NULL,
  published_version text NOT NULL,

  -- Phase2 UI が読む確定コピー（再生成禁止）
  player_quote text NOT NULL CHECK (char_length(player_quote) BETWEEN 1 AND 120),
  update_summary text NOT NULL CHECK (char_length(update_summary) BETWEEN 1 AND 120),
  prompt_text text NULL,

  confidence numeric(4,3) NOT NULL
    CHECK (confidence >= 0.82 AND confidence <= 1),
  model text NOT NULL,
  model_version text NULL,
  matcher_run_id uuid NOT NULL
    REFERENCES public.voice_adoption_matcher_runs (id) ON DELETE RESTRICT,

  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suppressed')),
  suppression_reason text NULL
    CHECK (suppression_reason IS NULL OR suppression_reason IN (
      'player_dispute', 'devlog_retracted', 'admin'
    )),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT voice_adoptions_response_devlog_unique
    UNIQUE (voice_response_id, devlog_id)
);
```

**変更点（前回から）**:
- `confidence` CHECK に **0.82 下限** — DB レベルでも閾値未満 INSERT 不可
- `pending_review` **廃止** — 閾値未満は行を作らない
- `player_quote` / `update_summary` 長さ上限（UI 1〜2 行）

---

## 2. matcher_runs schema

```sql
CREATE TABLE public.voice_adoption_matcher_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  devlog_id uuid NOT NULL
    REFERENCES public.project_devlogs (id) ON DELETE CASCADE,
  project_id text NOT NULL,

  trigger_type text NOT NULL
    CHECK (trigger_type IN ('devlog_published', 'backfill', 'model_upgrade')),
  trigger_version text NOT NULL DEFAULT 'matcher-v1',

  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed', 'skipped')),

  candidate_count int NOT NULL DEFAULT 0,
  evaluated_count int NOT NULL DEFAULT 0,
  adopted_count int NOT NULL DEFAULT 0,
  skipped_below_threshold int NOT NULL DEFAULT 0,

  devlog_content_hash text NULL,
  model text NOT NULL,
  prompt_version text NOT NULL DEFAULT 'adoption-prompt-v1',
  error_message text NULL,

  started_at timestamptz NULL,
  completed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT voice_adoption_matcher_runs_devlog_trigger_unique
    UNIQUE (devlog_id, trigger_type, trigger_version)
);
```

**追加**: `devlog_content_hash` — immutable 監査。`skipped_below_threshold` — precision 計測用。

---

## 3. disputes schema

```sql
CREATE TABLE public.voice_adoption_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adoption_id uuid NOT NULL
    REFERENCES public.voice_adoptions (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  note text NULL CHECK (note IS NULL OR char_length(note) <= 280),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (adoption_id, user_id)
);
```

**トリガー（DB or Edge Function）**: dispute INSERT → adoption `status=suppressed`, `suppression_reason=player_dispute`。

---

## 4. RLS 方針

| テーブル | anon | authenticated プレイヤー | project owner | service role |
|----------|------|---------------------------|---------------|--------------|
| voice_adoptions | 不可 | SELECT 自分 active のみ | SELECT 自 project（Phase2 Studio 将来） | INSERT/UPDATE |
| matcher_runs | 不可 | 不可 | SELECT 自 project | INSERT/UPDATE |
| disputes | 不可 | INSERT/SELECT 自分 | 不可 | UPDATE adoption |

**Phase2 UI**: Supabase client から `voice_adoptions` を直接 SELECT（RLS で自分のみ）。

**開発者 Phase2 最小**: Studio devlog 詳細に **採用件数のみ**（`COUNT(*) WHERE devlog_id`）。個別 player_quote は Studio に出さない（プレイヤー私的体験のため）。

---

## 5. index 方針

```sql
CREATE INDEX voice_adoptions_user_created_idx
  ON public.voice_adoptions (user_id, created_at DESC)
  WHERE status = 'active';

CREATE INDEX voice_adoptions_user_project_created_idx
  ON public.voice_adoptions (user_id, project_id, created_at DESC)
  WHERE status = 'active';

CREATE INDEX voice_adoptions_devlog_active_idx
  ON public.voice_adoptions (devlog_id) WHERE status = 'active';

CREATE INDEX voice_adoptions_voice_response_idx
  ON public.voice_adoptions (voice_response_id, created_at DESC);

CREATE INDEX voice_adoption_matcher_runs_project_idx
  ON public.voice_adoption_matcher_runs (project_id, created_at DESC);
```

Phase2 マイページ: `user_created_idx`。作品詳細: `user_project_created_idx`。

---

## 6. confidence / status 設計

| 値 | 意味 | DB 行 | Phase2 UI |
|----|------|-------|-----------|
| confidence ≥ **0.82** かつ related | 採用 | INSERT active | **表示** |
| 0.70–0.81 | グレー | **INSERT しない** | 非表示 |
| < 0.70 または related=false | 非関連 | INSERT しない | 非表示 |
| active | 正常 | — | 表示 |
| suppressed | dispute / devlog 撤回 | 行残す | **非表示** |

**偽陽性 > 偽陰性** — 閾値 0.82 は DB CHECK + アプリ二重チェック。

---

## 7. AI matcher 処理フロー

```text
[トリガー] devlog.published_version: NULL → 非 NULL
  │
  ├─ devlog.content_hash を計算・保存（matcher_run）
  ├─ matcher_run INSERT (queued)
  │
  ▼
[Stage A] SQL 候補
  project_id 一致
  voice.version_key ≤ devlog.published_version
  voice.created_at < devlog.published_at（※ published_at 列追加推奨）
  │
  ▼
[Stage B] batch LLM（1 devlog / 1 call、最大 50 候補）
  │
  ▼
[Stage C] 各 match
  IF related AND confidence >= 0.82
    AND NOT EXISTS (voice_response_id, devlog_id)
    → INSERT voice_adoptions
  ELSE
    → skipped_below_threshold++
  │
  ▼
[Stage D] matcher_run status=completed, adopted_count 更新
```

**今回 Out**: 本番 OpenAI 実行。実装時は **staging + fixture LLM** または手動 seed で Phase2 UI 先行も可。

---

## 8. AI prompt 案

**System**:

```text
You match player voice answers to a game update devlog for Forge.
Output JSON only. Be conservative: related=true only when the update clearly addresses the player's concern.
player_quote: short Japanese phrase from the player's answer (max 40 chars).
update_summary: short Japanese phrase describing what changed (max 40 chars), not marketing fluff.
confidence: 0-1. Use >=0.82 only when you would show this to the player without embarrassment.
```

**User（1 devlog + N candidates）**:

```text
## Update (version {published_version})
Title: {title}
Body: {content truncated 2000 chars}

## Player answers (each may or may not relate)
{for each candidate}
- id: {voice_response_id}
  question: {prompt_text}
  answer: {answer_label or answer_value}
  played_version: {version_key}
```

**禁止**: 「反映されました」等の抽象語を `update_summary` に使わせない — 具体変更のみ。

---

## 9. AI output JSON schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["update_summary", "matches"],
  "properties": {
    "update_summary": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120
    },
    "matches": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["voice_response_id", "related", "confidence", "player_quote"],
        "properties": {
          "voice_response_id": { "type": "string", "format": "uuid" },
          "related": { "type": "boolean" },
          "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
          "player_quote": { "type": "string", "minLength": 1, "maxLength": 120 },
          "reason": { "type": "string", "maxLength": 200 }
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
}
```

Edge Function: schema 検証失敗 → run `failed`、adoptions INSERT なし。

---

## 10. devlog immutable 方針

| ケース | 方針 | 再マッチ |
|--------|------|----------|
| **公開前** | 自由編集 | ジョブ未実行 |
| **公開後・タイトル誤字** | アプリ UI で **タイトルのみ** 修正可（任意） | **再マッチしない** |
| **公開後・本文編集** | **禁止**（UI 無効 + RLS） | — |
| **本文を直したい** | **新 devlog 新規作成** → 新版として公開 | 新 devlog で新 run |
| **管理画面で強制修正** | 既存 adoptions 全件 `suppressed` + `devlog_retracted` | **自動再マッチ禁止** |

**migration 011 追加列（推奨）**:

```sql
ALTER TABLE public.project_devlogs
  ADD COLUMN IF NOT EXISTS published_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS content_hash text NULL;
```

公開時: `published_at = now()`, `content_hash = sha256(title || content)`。

**誤字修正だけ許すか** → **タイトル誤字のみ許可。本文は immutable。** 本文誤字も新 devlog 推奨（マッチ正本の厳密性優先）。

---

## 11. Phase2 最小表示 UI 案

### セクション名

**「あなたの回答から変わったこと」**

（「反映されました」単独見出し **禁止**）

### カード構造（1 adoption = 1 カード）

```text
┌─────────────────────────────────────────────┐
│ [あなたの声]  v0.4 · {日付}                    │
│ {game.title}                                 │
│                                              │
│ あなたは                                     │
│ 「{player_quote}」                           │
│ と回答しました                               │
│                                              │
│         ↓                                    │
│                                              │
│ 今回の更新で                                 │
│ 「{update_summary}」                         │
│ されました                                   │
│                                              │
│ [もう一度プレイする]   [この関連は違う]        │
└─────────────────────────────────────────────┘
```

**データソース**: `voice_adoptions` のみ。`player_quote` / `update_summary` は **DB 列そのまま**。LLM 再呼び出し禁止。

**空状態**: セクションごと非表示（adoptions 0 件）。「まだありません」プレースホルダは **出さない**（空 UI 問題回避）。

### 既存「前回プレイ後の更新」との関係

| セクション | データ | 役割 |
|------------|--------|------|
| 前回プレイ後の更新 | notifications / devlog | **WHAT** が変わったか |
| **あなたの回答から変わったこと** | voice_adoptions | **WHY（自分）** — コア価値 |

両方并存。adoption がある更新は両方に出てよい（役割が異なる）。

---

## 12. どの画面に表示するか

| 画面 | URL | 優先 | 理由 |
|------|-----|------|------|
| **マイページ・プレイヤー活動** | `/mypage` `#voice-adoptions` | **Primary** | 横断一覧。「育てた作品」を一覧 |
| **作品詳細** | `/games/{id}` `#voice-adoptions` | **Secondary** | 再プレイ直前の文脈。Phase3 の土台 |

**マイページ配置**: 「前回プレイ後の更新」セクション **の上**（個人帰属 > 一般更新）。

**作品詳細配置**: ログイン & 当該 project の active adoption ≥1 のときのみ、「これまでの更新」の **上**。

**Studio（開発者）**: Phase2 最小 = devlog 行に **「プレイヤーの声と関連づいた件数: N」** のみ（内訳非表示）。

---

## 13. 「もう一度プレイする」導線

| 項目 | 内容 |
|------|------|
| **href** | `/games/{project_id}#new-playable-version-banner`（既存 `gameVersionBannerHref`） |
| **表示条件** | adoption の `published_version` ≤ 現行 `playable_version` |
| **Phase3 接続** | 同 CTA に query `?replay=adoption` または hash `#voice-adoption-replay` — バナー copy を Phase3 で personal hook に差し替え |
| **ラベル** | 「もう一度プレイする」（P1 と統一） |

Phase2 時点: 既存新版バナーへスクロール。Phase3 でバナー文言に `player_quote` を挿入。

---

## 14. 10 ペア precision 目視確認手順

**実装後・本番 AI 前に staging で実施**

1. テスト project 1 つ、版 v0.1 → v0.2
2. プレイヤー A/B で voice 10 件投入（5 件は明確に関連、3 件は無関連、2 件はグレー）
3. devlog 1 件公開（関連 5 件をカバーする内容）
4. matcher run 実行
5. スプレッドシートで記録:

| # | player_quote 期待 | update 期待 | 採用されたか | 正解？ |
|---|-------------------|-------------|--------------|--------|

6. **合格基準**: precision **100%**（採用された行に偽陽性 0）。recall は 60%+ で可（偽陰性許容）
7. 偽陽性 1 件でも → 閾値引き上げ or prompt 修正、再テスト
8. Phase2 UI で 5 件が正しくカード表示されることを目視
9. dispute 1 件 → UI から消えることを確認
10. オーナー GO → 本番 migration / AI 有効化判断

---

## 15. 本番導入リスク

| リスク | 深刻度 | 対策 |
|--------|--------|------|
| **偽陽性 UI 表示** | 致命的 | 0.82 + staging 10 ペア + dispute |
| **偽陰性多発** | 中 | P1 更新 UI で WHAT カバー。許容 |
| **devlog 事後編集** | 高 | immutable RLS + content_hash |
| **LLM コスト** | 低 | batch / devlog 単位 |
| **RLS 漏洩** | 致命的 | 他ユーザー adoption 不可を E2E 確認 |
| **空 Phase2 セクション** | 低 | 0 件なら非表示 |
| **OpenAI 障害** | 中 | run failed、adoptions なし。UI は空 |
| **matcher 二重実行** | 中 | UNIQUE (devlog_id, trigger_type, trigger_version) |

---

## 16. 実装順序（GO 後・1 テーマ）

```text
1. 011_voice_adoptions.sql 草案（+ devlog published_at/content_hash）
2. lib/adoption-types.ts + Supabase 型
3. Edge Function matcher（staging。fixture モード付き）
4. devlog 公開フック → enqueue run（アプリ層）
5. hooks/use-player-voice-adoptions.ts（RLS SELECT）
6. components/voice-adoptions-section.tsx（Phase2 カード）
7. mypage-player-tab 統合（#voice-adoptions）
8. game-detail-page-client 統合（条件付き）
9. dispute ボタン → disputes INSERT
10. Studio 採用件数バッジ（開発者最小）
11. staging 10 ペア precision
12. docs + Run 判断 → migration Dashboard 適用
13. staging AI 有効化 → 再検証
14. 本番（別 Run 判断）
```

**Phase3/4 はこの後。**

---

## 17. Run 判断用メモ（実装 GO 後・migration 適用前に使用）

```text
====================
GPT判断用メモ
====================

■ 何をしようとしているか
Supabase migration 011 を Dashboard 手動適用し、voice_adoptions / matcher_runs / disputes
正本テーブルと RLS を本番（または staging）に作成する。
続けて Edge Function matcher を staging で devlog 公開トリガー接続する。

■ なぜ止まったか
migration / DB 変更 / 課金（OpenAI）は Run 前停止対象のため。

■ Runすると何が起きるか
- 新テーブル 3 つ + index + RLS が DB に追加
- 既存 devlog / voice データは変更されない
- matcher 有効化後は devlog 公開のたび LLM API 呼び出し（課金）が発生しうる
- Phase2 UI は adoption 行があるユーザーにのみカード表示

■ Runしないと何が起きるか
- 正本データが作れず Phase2 UI は常に空
- 「俺が育てた」コア価値は未成立のまま

■ リスク
- 技術: RLS 誤設定で他ユーザー adoption 可視化（致命的）
- Forge価値: 偽陽性 adoption 行が UI に出ると信頼破壊（staging 10 ペアで先に潰す）
- ユーザー影響: migration 自体は additive。既存プレイ・回答に影響なし
- 復旧: テーブル DROP で rollback 可（adoptions データのみ消失）

■ Cursor推奨
[B] 事前確認推奨 — 011 を staging Dashboard で先適用 → 10 ペア precision → 問題なければ本番

■ 推奨理由
偽陽性は Forge コア信頼に直結。DB は additive だが AI は課金+品質リスク。

■ オーナーに判断してほしいこと
1. staging 011 適用 → fixture/手動 seed で Phase2 UI 確認 → matcher staging → 10 ペア OK 後に本番
2. OpenAI API キーは staging env のみから開始

結論：[B] 事前確認推奨
```

---

## Phase3 / Phase4 接続（設計のみ）

**Phase3**: Phase2 CTA と同 href。新版バナー copy:

```text
v0.4 が公開されました。
あなたが気になっていた「{player_quote}」に関する変更があります。
[もう一度プレイする]
```

**Phase4**: `SELECT * FROM voice_adoptions WHERE user_id=? ORDER BY created_at` — 専用テーブル不要。

---

## オーナー確認済み

- [x] ADOPTION_THRESHOLD 0.82
- [x] Phase1+2 同一テーマ
- [x] 通知・本番 AI・migration 適用は今回 Out

**次アクション（実装 GO 時）**: 上記 §16 の順で Cursor 実装開始。
