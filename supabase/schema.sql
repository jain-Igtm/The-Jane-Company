-- The Jane Company Supabase schema
-- Run this in Supabase SQL Editor after creating the project.

create extension if not exists pgcrypto;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  date date not null default current_date,
  category text not null default 'notes' check (category in ('notes', 'music', 'fiction')),
  excerpt text default '',
  body text default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  author_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_status_date_idx on public.posts (status, date desc);
create index if not exists posts_author_date_idx on public.posts (author_id, date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
before update on public.posts
for each row
execute function public.set_updated_at();

alter table public.posts enable row level security;

-- Anyone can read published posts.
drop policy if exists "Published posts are readable" on public.posts;
create policy "Published posts are readable"
on public.posts
for select
to anon, authenticated
using (status = 'published');

-- Logged-in authors can read their own drafts and published posts.
drop policy if exists "Authors can read their own posts" on public.posts;
create policy "Authors can read their own posts"
on public.posts
for select
to authenticated
using (auth.uid() = author_id);

-- Logged-in authors can create posts for themselves.
drop policy if exists "Authors can create their own posts" on public.posts;
create policy "Authors can create their own posts"
on public.posts
for insert
to authenticated
with check (auth.uid() = author_id);

-- Logged-in authors can update their own posts.
drop policy if exists "Authors can update their own posts" on public.posts;
create policy "Authors can update their own posts"
on public.posts
for update
to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

-- Logged-in authors can delete their own posts.
drop policy if exists "Authors can delete their own posts" on public.posts;
create policy "Authors can delete their own posts"
on public.posts
for delete
to authenticated
using (auth.uid() = author_id);
