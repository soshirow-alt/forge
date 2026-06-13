-- Project devlogs and user notifications (watch → devlog)

create table if not exists public.project_devlogs (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  author_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists project_devlogs_project_id_idx
  on public.project_devlogs (project_id, created_at desc);

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('devlog')),
  project_id text not null,
  devlog_id uuid references public.project_devlogs (id) on delete cascade,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists user_notifications_user_id_idx
  on public.user_notifications (user_id, created_at desc);

alter table public.project_devlogs enable row level security;
alter table public.user_notifications enable row level security;

create policy "Devlogs are publicly readable"
  on public.project_devlogs for select using (true);

create policy "Project owners insert devlogs"
  on public.project_devlogs for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.projects p
      where p.id::text = project_id and p.owner_id = auth.uid()
    )
  );

create policy "Project owners update own devlogs"
  on public.project_devlogs for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "Project owners delete own devlogs"
  on public.project_devlogs for delete
  using (author_id = auth.uid());

create policy "Users read own notifications"
  on public.user_notifications for select
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.user_notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Project owners insert devlog notifications"
  on public.user_notifications for insert
  with check (
    type = 'devlog'
    and exists (
      select 1 from public.projects p
      where p.id::text = project_id and p.owner_id = auth.uid()
    )
  );

-- Allow project owners to read watches on their projects (for devlog notification recipients)
create policy "Project owners read watches on owned projects"
  on public.project_watches for select
  using (
    exists (
      select 1 from public.projects p
      where p.id::text = project_watches.project_id and p.owner_id = auth.uid()
    )
  );
