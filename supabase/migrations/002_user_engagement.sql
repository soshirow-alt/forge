-- User engagement: supports, bookmarks, watches, plays, feedback

create table if not exists public.project_supports (
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);

create table if not exists public.project_bookmarks (
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);

create table if not exists public.project_watches (
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);

create table if not exists public.project_plays (
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);

create table if not exists public.project_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id text not null,
  good_points text,
  concerns text,
  bugs text,
  focus_response text,
  would_replay text check (would_replay in ('yes', 'maybe', 'no')),
  created_at timestamptz not null default now()
);

create index if not exists project_feedback_project_id_idx
  on public.project_feedback (project_id, created_at desc);

alter table public.project_supports enable row level security;
alter table public.project_bookmarks enable row level security;
alter table public.project_watches enable row level security;
alter table public.project_plays enable row level security;
alter table public.project_feedback enable row level security;

create policy "Project supports are publicly readable"
  on public.project_supports for select using (true);

create policy "Users insert own project support"
  on public.project_supports for insert with check (auth.uid() = user_id);

create policy "Users delete own project support"
  on public.project_supports for delete using (auth.uid() = user_id);

create policy "Users read own bookmarks"
  on public.project_bookmarks for select using (auth.uid() = user_id);

create policy "Users insert own bookmarks"
  on public.project_bookmarks for insert with check (auth.uid() = user_id);

create policy "Users delete own bookmarks"
  on public.project_bookmarks for delete using (auth.uid() = user_id);

create policy "Users read own watches"
  on public.project_watches for select using (auth.uid() = user_id);

create policy "Users insert own watches"
  on public.project_watches for insert with check (auth.uid() = user_id);

create policy "Users delete own watches"
  on public.project_watches for delete using (auth.uid() = user_id);

create policy "Users read own plays"
  on public.project_plays for select using (auth.uid() = user_id);

create policy "Users insert own plays"
  on public.project_plays for insert with check (auth.uid() = user_id);

create policy "Project feedback is publicly readable"
  on public.project_feedback for select using (true);

create policy "Users insert own feedback"
  on public.project_feedback for insert with check (auth.uid() = user_id);
