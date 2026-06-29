-- Multi-genre support: genres[] is canonical; genre text kept for legacy readers.

alter table public.projects
  add column if not exists genres text[] not null default '{}';

update public.projects
set genres = array[genre]
where genre is not null
  and trim(genre) <> ''
  and cardinality(genres) = 0;

create index if not exists projects_genres_gin_idx
  on public.projects using gin (genres);
