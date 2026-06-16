# voice_adoptions — 011 適用後確認フェーズ

**前提**: migration 011 は Dashboard 適用済み。011 適用手順・Run 判断は **終了**。

**次の価値**: AI が voice と devlog 更新を紐付け → プレイヤーが「俺が育てた」を体験。

---

## ① 011 適用後確認 SQL

Dashboard → SQL Editor で実行。

### A. テーブル 3

```sql
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
```

### B. published_at / content_hash

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'project_devlogs'
  AND column_name IN ('published_at', 'content_hash')
ORDER BY column_name;
-- 期待: 2 行（timestamptz, text）

-- 公開済み devlog に hash が付いているか（公開後に 1 件以上あれば）
SELECT id, title, published_version, published_at, content_hash
FROM public.project_devlogs
WHERE published_version IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
-- 期待: published_at / content_hash が NULL でない行（011 適用**後**に初公開した devlog）
-- 注意: 011 適用前に公開済みの devlog は backfill されない（次回「新版公開」で SET）
```

### C. rowsecurity

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'voice_adoptions',
    'voice_adoption_matcher_runs',
    'voice_adoption_disputes'
  )
ORDER BY tablename;
-- 期待: 3 行とも rowsecurity = true
```

### D. policy 数（期待 **5**）

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'voice_adoptions',
    'voice_adoption_matcher_runs',
    'voice_adoption_disputes'
  )
ORDER BY tablename, policyname;

SELECT tablename, count(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'voice_adoptions',
    'voice_adoption_matcher_runs',
    'voice_adoption_disputes'
  )
GROUP BY tablename
ORDER BY tablename;
-- 期待:
-- voice_adoptions          → 2（Players active SELECT / Owners SELECT）
-- voice_adoption_matcher_runs → 1（Owners SELECT）
-- voice_adoption_disputes  → 2（Players INSERT / Players SELECT）
-- 合計 5
```

### E. trigger 数（期待 **2**）

```sql
SELECT tgname, tgrelid::regclass AS on_table, tgenabled
FROM pg_trigger
WHERE tgname IN (
  'voice_adoption_disputes_suppress',
  'project_devlogs_immutable_body'
)
  AND NOT tgisinternal
ORDER BY tgname;
-- 期待: 2 行
```

### F. 行数（matcher 未接続時）

```sql
SELECT
  (SELECT count(*) FROM voice_adoptions) AS adoptions,
  (SELECT count(*) FROM voice_adoption_matcher_runs) AS runs,
  (SELECT count(*) FROM voice_adoption_disputes) AS disputes;
-- matcher 未実行なら 0 / 0 / 0 で正常
```

---

## ② RLS 確認 — 3 アカウント × 画面操作

**前提**

- `.env.local` から `NEXT_PUBLIC_VOICE_ADOPTION_FIXTURE` を **外す**（Supabase 経路）
- `voice_adoptions` に **A 向け active 行が 1 件以上** あること  
  （matcher 接続前は Dashboard service role で test 行を入れるか、matcher staging 実行後）

| 誰 | 画面 | 操作 | 期待 |
|----|------|------|------|
| **O** | 自分の作品 Studio → 育成「公開」 | 採用件数表示 | 自 project の active 件数（A の行を含む） |
| **A** | `/mypage#voice-adoptions` | 開く | 自分の quote↔summary カードのみ |
| **A** | 同 | 「この関連は違う」 | カード消失 |
| **B** | `/mypage#voice-adoptions` | 開く | **A のカード不可視**（0 件ならセクション非表示） |
| **B** | `/games/{Oの作品}` | スクロール | A の adoption 不可視 |
| **O** | Dashboard Table Editor | `voice_adoptions` を service role で見る | A の行 status=suppressed（dispute 後） |

**NG**: B の画面に A の `player_quote` が見える。

**補足**: matcher 未接続で adoption 行が 0 のとき、RLS は SQL で policy 存在確認まで。行がある状態でのアプリ確認が本番同等。

---

## ③ devlog immutable 確認

**現状 UI**: 公開済み devlog の**編集画面は存在しない**（`/projects/{id}/devlog/new` は新規 INSERT のみ）。  
よって immutable の確認は **Dashboard SQL** が正本。

### 手順

1. 公開済み devlog 1 件の `id` を取得:

```sql
SELECT id, title, left(content, 40) AS content_preview, published_version, published_at, content_hash
FROM public.project_devlogs
WHERE published_version IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;
```

2. 本文 UPDATE を試す（**拒否されること**）:

```sql
UPDATE public.project_devlogs
SET content = content || E'\n（テスト追記）'
WHERE id = '<上記 id>';
-- 期待: ERROR — Published devlog body is immutable. Create a new devlog instead.
```

3. タイトルだけ UPDATE（**許容**）:

```sql
UPDATE public.project_devlogs
SET title = title || '（誤字修正）'
WHERE id = '<上記 id>';
-- 期待: SUCCESS（1 row）
-- ロールバックするなら元タイトルに戻す UPDATE
```

4. 011 適用**後**の初「新版公開」で `published_at` / `content_hash` が付くことを確認:

- O で `/projects/{id}/devlog/new` → チェック「新版として公開」→ 投稿
- 上記 SELECT で新行に `published_at`, `content_hash` NOT NULL

**将来**: devlog 編集 UI を足す場合は、公開済みは本文フィールド read-only + API で UPDATE 拒否をアプリ層でも二重化。

---

## ④ 次の実装テーマ（OpenAI matcher → staging 精度）

| # | タスク | 成果物 | 備考 |
|---|--------|--------|------|
| **4-1** | Edge live matcher 本体 | `supabase/functions/voice-adoption-matcher` OpenAI 呼び出し + JSON 出力 | `player_quote`, `update_summary`, `confidence` per candidate |
| **4-2** | service role INSERT | 同一 Function 内 | `matcher_runs` → threshold 0.82 以上のみ `voice_adoptions` |
| **4-3** | devlog 公開トリガー | `addDevlog` 成功後（`publishPlayableVersion` あり）→ Edge invoke | アプリ層が先。DB webhook は後回し可 |
| **4-4** | 候補 voice 取得 | Function 内 query | project + version + devlog 公開前の `project_voice_responses` |
| **4-5** | staging env | Edge Secrets: `OPENAI_API_KEY`, `VOICE_ADOPTION_MATCHER_MODE=live`（staging のみ） | Vercel 本番は fixture/off のまま |
| **4-6** | ガード維持 | production Edge / Vercel で live  accidental 防止 | 本番 Secrets に OPENAI 未設定 until Run |
| **4-7** | staging 精度検証 | 実 voice 10 ペア相当 | precision 100% 目標 / recall ≥ 60% |
| **4-8** | UI 接続確認 | fixture off + Supabase SELECT | A が `/mypage` で DB 行を表示 |
| **4-9** | dispute E2E | A dispute → suppressed | §② 再実行 |
| **4-10** | Run 判断 | staging AI OK → 本番は別 Run | 通知・Phase3 はまだ Out |

**依存順**: 4-1 → 4-2 → 4-4 → 4-3 → 4-5 → 4-7 → 4-8

---

## ⑤ 関連

- fixture UI（migration 不要）: `docs/voice-adoptions-staging-fixture-guide.md`
- 設計正本: `docs/voice-adoptions-pre-implementation-review.md`
- 体験: `docs/player-nurture-core-experience-design-review.md`
