-- Persist estimated play time on projects (was localStorage-only).

alter table public.projects
  add column if not exists estimated_play_time text;
