-- STAGING ONLY apply pack for home discovery (050 → 051 → 052)
-- Project ref: vuqpwvjvgyxffmvpfrxo
-- DO NOT RUN ON PRODUCTION (bpnisgzxuwdxelhnduuf)
--
-- Apply order: paste/run each migration file separately in Dashboard SQL Editor,
-- or run this pack only if you understand it concatenates three transactions.
--
-- Preferred: run these three files in order:
--   supabase/migrations/050_projects_first_published_at.sql
--   supabase/migrations/051_devlog_initial_flag_and_publish_rpc.sql
--   supabase/migrations/052_home_discovery_feed_rpc.sql
--
-- Then: scripts/staging-only/initial-devlog-candidates.sql (SELECT)
-- Then: UPDATE confirmed Staging IDs only (see initial-devlog-flag.md)

SELECT 'Use the three migration files in order; this pack is a pointer only.' AS note;
