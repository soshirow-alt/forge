-- Forge core data: projects and developer profiles

create table if not exists public.developer_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  creator_id text not null unique,
  public_name text not null,
  profile text not null,
  x_account text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  owner_name text not null,
  title text not null,
  creator text not null,
  genre text not null,
  description text not null,
  phase text not null,
  status text not null,
  looking_for_testers boolean not null default false,
  tester_slots integer,
  section text not null default 'new' check (section in ('new', 'testers', 'beta')),
  thumbnail_url text,
  tags text[] not null default '{}',
  play_url text not null,
  steam_url text,
  itch_url text,
  github_url text,
  discord_url text,
  official_url text,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_owner_id_idx on public.projects (owner_id);
create index if not exists projects_visibility_idx on public.projects (visibility);
create index if not exists projects_created_at_idx on public.projects (created_at desc);

alter table public.developer_profiles enable row level security;
alter table public.projects enable row level security;

create policy "Developer profiles are publicly readable"
  on public.developer_profiles
  for select
  using (true);

create policy "Users can insert own developer profile"
  on public.developer_profiles
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own developer profile"
  on public.developer_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own developer profile"
  on public.developer_profiles
  for delete
  using (auth.uid() = user_id);

create policy "Projects are viewable if public or owned"
  on public.projects
  for select
  using (visibility = 'public' or auth.uid() = owner_id);

create policy "Users can insert own projects"
  on public.projects
  for insert
  with check (auth.uid() = owner_id);

create policy "Users can update own projects"
  on public.projects
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Users can delete own projects"
  on public.projects
  for delete
  using (auth.uid() = owner_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists developer_profiles_set_updated_at on public.developer_profiles;
create trigger developer_profiles_set_updated_at
  before update on public.developer_profiles
  for each row
  execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row
  execute function public.set_updated_at();
