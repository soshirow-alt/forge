# voice_adoptions — staging 011 適用前パック

**目的**: Dashboard で 011 を適用する前に、SQL・確認・Run 判断を1か所に集約する。  
**正本 migration**: `supabase/migrations/011_voice_adoptions.sql`（本 doc §2 と同一）

**まだ NG（オーナー判断 2026-06-16）**

- 本番 OpenAI 実行
- 本番 Edge Function deploy（live モード）
- 本番 Vercel env で `VOICE_ADOPTION_MATCHER_MODE=live`
- voice_adopted 通知 / 再プレイ hook / 育成履歴 UI

**OK（次の staging 検証）**

- Dashboard で 011 適用（additive DB）
- fixture UI + `npm run verify:voice-adoption`（ローカル、migration 不要）
- 011 適用後の RLS 2 アカウント確認
- Edge Function deploy（**fixture モードのみ** — 別 Run）

---

## §0 事前確認 SQL（011 実行前）

Dashboard → SQL Editor → New query → Run

```sql
-- 001–010 前提
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'projects',
    'project_devlogs',
    'project_voice_responses',
    'project_voice_reads',
    'user_notifications'
  )
ORDER BY 1;
-- 期待: 5 行すべて存在

-- 011 未適用確認（0 行なら OK）
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'voice_adoptions',
    'voice_adoption_matcher_runs',
    'voice_adoption_disputes'
  );
-- 期待: 0 行（再適用時は存在する — §2 はスキップまたは DROP 判断が必要）
```

---

## §1 Dashboard 適用手順（011）

1. Supabase Dashboard → **staging 用プロジェクト**（本番と分離している場合は staging 側。同一 DB の場合はオーナーが「011 staging 適用 GO」と明示した Run のみ）
2. SQL Editor → New query
3. **`supabase/migrations/011_voice_adoptions.sql` を全文コピー**して貼付
4. Run → Success を確認
5. §3 確認 SQL を実行

---

## §2 適用 SQL 全文（011）

```sql
-- 011: voice_adoptions canonical data + matcher runs + disputes
-- Prerequisite: 001–010 applied
-- Staging-first: apply on Dashboard before production

BEGIN;

-- A. devlog publish metadata (immutable support)
ALTER TABLE public.project_devlogs
  ADD COLUMN IF NOT EXISTS published_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS content_hash text NULL;

-- B. matcher runs (job audit)
CREATE TABLE IF NOT EXISTS public.voice_adoption_matcher_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  devlog_id uuid NOT NULL REFERENCES public.project_devlogs (id) ON DELETE CASCADE,
  project_id text NOT NULL,
  trigger_type text NOT NULL CHECK (
    trigger_type IN ('devlog_published', 'backfill', 'model_upgrade')
  ),
  trigger_version text NOT NULL DEFAULT 'matcher-v1',
  status text NOT NULL DEFAULT 'queued' CHECK (
    status IN ('queued', 'running', 'completed', 'failed', 'skipped')
  ),
  candidate_count int NOT NULL DEFAULT 0,
  evaluated_count int NOT NULL DEFAULT 0,
  adopted_count int NOT NULL DEFAULT 0,
  skipped_below_threshold int NOT NULL DEFAULT 0,
  devlog_content_hash text NULL,
  model text NOT NULL DEFAULT 'fixture',
  prompt_version text NOT NULL DEFAULT 'adoption-prompt-v1',
  error_message text NULL,
  started_at timestamptz NULL,
  completed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT voice_adoption_matcher_runs_devlog_trigger_unique
    UNIQUE (devlog_id, trigger_type, trigger_version)
);

CREATE INDEX IF NOT EXISTS voice_adoption_matcher_runs_devlog_idx
  ON public.voice_adoption_matcher_runs (devlog_id);

CREATE INDEX IF NOT EXISTS voice_adoption_matcher_runs_project_idx
  ON public.voice_adoption_matcher_runs (project_id, created_at DESC);

-- C. voice adoptions (canonical facts)
CREATE TABLE IF NOT EXISTS public.voice_adoptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  voice_response_id uuid NOT NULL
    REFERENCES public.project_voice_responses (id) ON DELETE CASCADE,
  devlog_id uuid NOT NULL
    REFERENCES public.project_devlogs (id) ON DELETE CASCADE,
  voice_version_key text NOT NULL,
  published_version text NOT NULL,
  player_quote text NOT NULL CHECK (char_length(player_quote) BETWEEN 1 AND 120),
  update_summary text NOT NULL CHECK (char_length(update_summary) BETWEEN 1 AND 120),
  prompt_text text NULL,
  confidence numeric(4,3) NOT NULL
    CHECK (confidence >= 0.82 AND confidence <= 1),
  model text NOT NULL,
  model_version text NULL,
  matcher_run_id uuid NOT NULL
    REFERENCES public.voice_adoption_matcher_runs (id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suppressed')),
  suppression_reason text NULL CHECK (
    suppression_reason IS NULL OR suppression_reason IN (
      'player_dispute', 'devlog_retracted', 'admin'
    )
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT voice_adoptions_response_devlog_unique
    UNIQUE (voice_response_id, devlog_id)
);

CREATE INDEX IF NOT EXISTS voice_adoptions_user_created_idx
  ON public.voice_adoptions (user_id, created_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS voice_adoptions_user_project_created_idx
  ON public.voice_adoptions (user_id, project_id, created_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS voice_adoptions_devlog_active_idx
  ON public.voice_adoptions (devlog_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS voice_adoptions_voice_response_idx
  ON public.voice_adoptions (voice_response_id, created_at DESC);

CREATE INDEX IF NOT EXISTS voice_adoptions_project_published_idx
  ON public.voice_adoptions (project_id, published_version, created_at DESC)
  WHERE status = 'active';

-- D. disputes
CREATE TABLE IF NOT EXISTS public.voice_adoption_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adoption_id uuid NOT NULL
    REFERENCES public.voice_adoptions (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  note text NULL CHECK (note IS NULL OR char_length(note) <= 280),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (adoption_id, user_id)
);

-- E. RLS
ALTER TABLE public.voice_adoption_matcher_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_adoptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_adoption_disputes ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Project owners read matcher runs"
  ON public.voice_adoption_matcher_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Players insert own disputes"
  ON public.voice_adoption_disputes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.voice_adoptions a
      WHERE a.id = adoption_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Players read own disputes"
  ON public.voice_adoption_disputes FOR SELECT
  USING (auth.uid() = user_id);

-- F. dispute → suppress adoption
CREATE OR REPLACE FUNCTION public.suppress_voice_adoption_on_dispute()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.voice_adoptions
  SET
    status = 'suppressed',
    suppression_reason = 'player_dispute',
    updated_at = now()
  WHERE id = NEW.adoption_id
    AND user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS voice_adoption_disputes_suppress ON public.voice_adoption_disputes;

CREATE TRIGGER voice_adoption_disputes_suppress
  AFTER INSERT ON public.voice_adoption_disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.suppress_voice_adoption_on_dispute();

-- G. published devlog: block body edits (title still editable via app)
CREATE OR REPLACE FUNCTION public.enforce_devlog_immutable_body()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.published_version IS NOT NULL AND NEW.content IS DISTINCT FROM OLD.content THEN
    RAISE EXCEPTION 'Published devlog body is immutable. Create a new devlog instead.';
  END IF;

  IF NEW.published_version IS NOT NULL AND OLD.published_version IS NULL THEN
    NEW.published_at := COALESCE(NEW.published_at, now());
    NEW.content_hash := encode(
      sha256(convert_to(COALESCE(NEW.title, '') || E'\n' || COALESCE(NEW.content, ''), 'UTF8')),
      'hex'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_devlogs_immutable_body ON public.project_devlogs;

CREATE TRIGGER project_devlogs_immutable_body
  BEFORE UPDATE ON public.project_devlogs
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_devlog_immutable_body();

COMMIT;
```

---

## §3 011 適用後 確認 SQL

```sql
-- 3-1 テーブル存在
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'voice_adoptions',
    'voice_adoption_matcher_runs',
    'voice_adoption_disputes'
  )
ORDER BY 1;
-- 期待: 3 行

-- 3-2 devlog 列追加
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'project_devlogs'
  AND column_name IN ('published_at', 'content_hash');
-- 期待: 2 行

-- 3-3 RLS 有効
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'voice_adoptions',
    'voice_adoption_matcher_runs',
    'voice_adoption_disputes'
  );
-- 期待: rowsecurity = true が 3 行

-- 3-4 ポリシー
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'voice_adoptions',
    'voice_adoption_matcher_runs',
    'voice_adoption_disputes'
  )
ORDER BY tablename, policyname;
-- 期待: 6 ポリシー（adoptions×2, matcher_runs×1, disputes×2, players active×1 含む）

-- 3-5 trigger
SELECT tgname, tgrelid::regclass AS table_name
FROM pg_trigger
WHERE tgname IN (
  'voice_adoption_disputes_suppress',
  'project_devlogs_immutable_body'
)
  AND NOT tgisinternal;
-- 期待: 2 行

-- 3-6 confidence CHECK（0.81 は拒否される）
-- 注意: 実データ INSERT テスト。staging のみ。失敗すれば OK。
-- DO $$ BEGIN
--   INSERT INTO voice_adoption_matcher_runs (devlog_id, project_id, trigger_type)
--   VALUES ('00000000-0000-0000-0000-000000000000', 'test', 'devlog_published');
-- EXCEPTION WHEN others THEN NULL;
-- END $$;
-- 上記は FK で失敗するため、本番 seed は service role + 実 devlog/voice で行う

-- 3-7 初期行数（適用直後）
SELECT
  (SELECT count(*) FROM voice_adoptions) AS adoptions,
  (SELECT count(*) FROM voice_adoption_matcher_runs) AS runs,
  (SELECT count(*) FROM voice_adoption_disputes) AS disputes;
-- 期待: すべて 0（適用直後）
```

---

## §4 RLS 2 アカウント確認（簡潔）

**準備**: プレイヤー A / プレイヤー B / オーナー O。O の作品に A が voice 回答済み。011 適用後、service role で test adoption 1 行を A に紐づけ（または matcher fixture 実行後）。

**アプリ確認（推奨）**

1. A でログイン → `/mypage#voice-adoptions` — 自分の active のみ表示
2. B でログイン → 同 URL — A の行は **見えない**（0 件ならセクション非表示）
3. A で「この関連は違う」→ カード消失
4. Dashboard `voice_adoptions` — 該当行 `status=suppressed`, `suppression_reason=player_dispute`
5. O で Studio 公開パネル — 自 project の採用件数（suppressed 除く active のみ）

**Dashboard 確認（service role / Table Editor）**

- `voice_adoptions` に A の行が存在
- B の `user_id` では RLS 経由 SELECT 不可（アプリで確認）

**NG パターン**

- B の画面に A の `player_quote` が見える → RLS 事故（Run 禁止・修正 migration）

---

## §5 fixture UI 確認（migration 不要・先に実施可）

`.env.local`:

```env
NEXT_PUBLIC_VOICE_ADOPTION_FIXTURE=true
VOICE_ADOPTION_MATCHER_MODE=fixture
```

| 手順 | 操作 | 期待 |
|------|------|------|
| 1 | `npm run verify:voice-adoption` | precision 100%, recall ≥ 60% |
| 2 | `npm run dev` + ログイン | — |
| 3 | `/mypage#voice-adoptions` | quote↔summary ペア表示 |
| 4 | `/games/emberfall` | compact セクション（adoption>0） |
| 5 | dispute 1 件 | カード消失 |
| 6 | Studio 公開パネル | 採用件数（fixture 時 Emberfall） |

011 適用後（Supabase 経路）:

- `.env.local` から **`NEXT_PUBLIC_VOICE_ADOPTION_FIXTURE` を削除**（または false）
- adoption 行を DB に seed / matcher 実行後、同 UI を Supabase SELECT で再確認

---

## §6 staging Edge Function deploy 前 — 必要 env

**Edge Function 名**: `voice-adoption-matcher`  
**現状**: fixture stub のみ。`mode=live` は **501** を返す。

| env（Supabase Edge Secrets） | staging 値 | 本番 |
|------------------------------|------------|------|
| `VOICE_ADOPTION_MATCHER_MODE` | **`fixture`**（必須） | live は別 Run |
| `SUPABASE_URL` | 自動 | 自動 |
| `SUPABASE_SERVICE_ROLE_KEY` | deploy 時 | deploy 時 |
| `OPENAI_API_KEY` | **未設定で OK**（fixture 時） | live Run 時のみ |

**Vercel（staging preview / 本番とも）**

| env | staging 検証 | 本番（現時点 NG） |
|-----|-------------|-------------------|
| `NEXT_PUBLIC_VOICE_ADOPTION_FIXTURE` | true=localStorage / false=Supabase | false |
| `VOICE_ADOPTION_MATCHER_MODE` | **fixture** | live は NG |

**本番で誤って AI が動かないガード（実装済み + deploy 時必須）**

1. `lib/voice-adoption/matcher.ts` — live は throw（OpenAI 未実装）
2. Edge `index.ts` — `mode=live` → HTTP 501
3. `resolveMatcherMode()` — env が fixture でないと live 扱いだが **live 本体未実装**
4. deploy 前チェック: `VOICE_ADOPTION_MATCHER_MODE=fixture` を Edge Secrets に明示
5. 本番 Vercel に `OPENAI_API_KEY` を **入れない**（live Run まで）
6. `app/api/voice-adoption/matcher` — `NODE_ENV=production` で 403

---

## §7 fixture matcher vs live matcher（次レビュー用）

| 項目 | fixture matcher | live matcher（未実装） |
|------|-----------------|------------------------|
| 実装 | `lib/voice-adoption/fixture-matcher.ts` | 未作成（Edge + OpenAI） |
| 入力 | devlog + voice 候補 | 同左 |
| 判定 | 決定論（期待表 + キーワード） | OpenAI structured output |
| 出力 | `player_quote`, `update_summary`, `confidence` | 同左 |
| 閾値 | 0.82 未満は行を作らない | 同左 |
| コスト | **0 円** | devlog 公開 1 回 ≒ 1 batch API 呼び出し |
| OpenAI 使用箇所 | **なし** | **Edge Function のみ**（UI 表示時は DB のみ） |
| 料金発生タイミング | なし | devlog 初回公開トリガーで matcher run 実行時 |
| 本番ガード | env=fixture / live throw / Edge 501 | live Run 時: staging precision 再検証 + env 二重確認 |

**live 実装時に追加するもの**

1. Edge Function 内 OpenAI 呼び出し（prompt v1、JSON schema）
2. service role で `matcher_runs` + `voice_adoptions` INSERT
3. devlog 公開フック → Edge invoke（アプリ or DB webhook）
4. staging 10 ペア相当の実 voice で precision 再計測
5. `OPENAI_API_KEY` を Edge Secrets のみ（Vercel クライアントに置かない）

---

## §8 GPT判断用メモ — 011 Dashboard 適用

```
====================
GPT判断用メモ（011 staging 適用）
====================

■ 何をしようとしているか
Supabase Dashboard SQL Editor で migration 011 を実行する。
voice_adoptions 正本 3 テーブル + RLS + devlog immutable trigger を additive で追加。

■ なぜ止まったか
migration / DB 変更は Run 前停止対象。オーナーは staging 検証優先・本番 AI NG。

■ Runすると何が起きるか
- 新テーブル 3 + index + RLS + trigger 2 本が DB に追加
- project_devlogs に published_at / content_hash 列追加
- 公開済み devlog の本文 UPDATE は DB レベルで拒否
- 既存 voice / devlog / 通知データは変更されない
- adoption 行は 0 のまま（matcher 未接続）→ UI は引き続き空（fixture off 時）

■ Runしないと何が起きるか
- Supabase 経路・RLS・dispute trigger が未検証のまま
- Phase2 UI は fixture localStorage のみ

■ リスク
- 技術: RLS 誤設定 → 他ユーザー adoption 可視化（致命的）→ §4 で確認
- Forge価値: 011 自体は UI に行を出さない（行は matcher 後）。immutable devlog が既存編集フローと衝突する可能性
- ユーザー影響: additive。既存プレイ・回答・通知はそのまま
- 復旧: 新テーブル DROP + 列 DROP で rollback（adoptions データのみ消失）

■ Cursor推奨
[B] 事前確認推奨 — §0 事前 SQL → §2 適用 → §3 確認 → §4 RLS

■ 推奨理由
011 は staging 検証の前提。OpenAI 課金は別。RLS だけは必ず 2 アカウントで潰す。

■ オーナーに判断してほしいこと
§0 で 001–010 済み・011 未適用を確認したうえで Dashboard Run してよいか。

結論：[B] 事前確認推奨
```

---

## §9 GPT判断用メモ — staging Edge Function deploy（011 後・別 Run）

```
====================
GPT判断用メモ（Edge fixture deploy）
====================

■ 何をしようとしているか
supabase/functions/voice-adoption-matcher を staging に deploy。
現状は fixture stub（OpenAI なし）。devlog 公開 → matcher 接続は次フェーズ。

■ なぜ止まったか
Edge deploy / 本番環境変更は Run 前停止対象。

■ Runすると何が起きるか
- Edge Function が staging プロジェクトにデプロイされる
- VOICE_ADOPTION_MATCHER_MODE=fixture なら OpenAI 課金なし
- live モード要求は 501（現 stub）

■ Runしないと何が起きるか
- DB だけ 011 適用済みでも、サーバー側 matcher パイプラインは未接続

■ リスク
- Edge Secrets に OPENAI_API_KEY を誤設定 → live 実装後に意図せず課金（現 stub は未使用）
- deploy 時 env 未設定 → デフォルトが live 扱いになる可能性 → **必ず fixture を Secrets に設定**

■ Cursor推奨
[B] 事前確認推奨 — 011 + RLS 完了後。Secrets: VOICE_ADOPTION_MATCHER_MODE=fixture のみ。OPENAI 未設定。

■ 推奨理由
Edge deploy 自体は AI 課金と独立。fixture stub なら安全。

■ オーナーに判断してほしいこと
011 §4 RLS OK 後、Edge deploy（fixture）を Run してよいか。

結論：[B] 事前確認推奨
```

---

## 関連

- `docs/voice-adoptions-staging-fixture-guide.md`
- `docs/voice-adoptions-pre-implementation-review.md`
- `docs/supabase-dashboard-migration-guide.md`
