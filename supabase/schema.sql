-- Run this once in Supabase: SQL Editor → New query → paste → Run.
create table if not exists public.leaderboard_entries (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 32),
  time_seconds integer not null check (time_seconds between 0 and 150),
  points integer not null default 20 check (points = 20),
  created_at timestamptz not null default now()
);

alter table public.leaderboard_entries enable row level security;

create policy "Anyone can view leaderboard entries" on public.leaderboard_entries
  for select to anon using (true);

create policy "Anyone can add a valid leaderboard entry" on public.leaderboard_entries
  for insert to anon with check (char_length(name) between 1 and 32 and time_seconds between 0 and 150 and points = 20);
