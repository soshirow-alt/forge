-- Multi-thumbnail support: thumbnail_urls[] is canonical; thumbnail_url keeps first for legacy readers.

alter table public.projects
  add column if not exists thumbnail_urls text[] not null default '{}';

update public.projects
set thumbnail_urls = array[thumbnail_url]
where thumbnail_url is not null
  and trim(thumbnail_url) <> ''
  and cardinality(thumbnail_urls) = 0;
