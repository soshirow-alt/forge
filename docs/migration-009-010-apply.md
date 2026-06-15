# migration 009 / 010 — Dashboard 適用手順

**正本 SQL**: `supabase/migrations/009_voice_received_notifications.sql` / `010_project_voice_reads.sql`

**適用順（オーナー確定）**: **009 → 009 確認 → 010 → 010 確認 → commit/push/deploy → E2E**

009 / 010 は additive で旧本番コード未使用のため、**両 migration を先に適用してから deploy** する（010 未適用の deploy 中間状態を避ける）。

---

## STEP 1 — migration 009

1. Supabase Dashboard → SQL Editor → New query
2. `supabase/migrations/009_voice_received_notifications.sql` 全文を Run

### 009 確認 SQL

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_notifications'
  AND column_name = 'version_key';

SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.user_notifications'::regclass
  AND conname = 'user_notifications_type_check';

SELECT tgname
FROM pg_trigger
WHERE tgname = 'project_voice_responses_notify_owner';

SELECT proname
FROM pg_proc
WHERE proname = 'notify_owner_on_voice_response';
```

期待: 各行 1 件以上。

---

## STEP 2 — migration 010

1. 009 確認後、同じ SQL Editor で `010_project_voice_reads.sql` 全文を Run

### 010 確認 SQL

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'project_voice_reads'
ORDER BY ordinal_position;

SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'project_voice_reads';
```

期待: `user_id`, `project_id`, `version_key`, `source_type`, `read_at` と SELECT/INSERT/UPDATE policy 各1件。

---

## STEP 3 — deploy

009 + 010 両方確認後:

- git push → Vercel production deploy

---

## STEP 4 — E2E

`docs/mvp-production-e2e-checklist.md` を正本として本番確認。

---

## ロールバック（緊急時のみ）

009:

```sql
DROP TRIGGER IF EXISTS project_voice_responses_notify_owner ON public.project_voice_responses;
DROP FUNCTION IF EXISTS public.notify_owner_on_voice_response();
DROP INDEX IF EXISTS user_notifications_voice_unread_unique;
```

010:

```sql
DROP TABLE IF EXISTS public.project_voice_reads;
```
