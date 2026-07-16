-- Staging only (vuqpwvjvgyxffmvpfrxo). Do not apply to Production.
-- Prerequisite: 003 RLS "Project owners read watches on owned projects" already applied.
--
-- Symptom: authenticated INSERT on user_notifications (073 watcher policy) and
-- fetchWatcherUserIds fail with permission denied for table project_watches.
-- Cause: Staging table GRANT drift — not a product migration change.
--
-- Apply before or with 074 verification. Do NOT GRANT developer_follows (074 uses DEFINER RPC).

GRANT SELECT ON TABLE public.project_watches TO authenticated;
