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

-- Word challenge: one permanent completed score per CC code.
create table if not exists public.wordle_scores (
  id bigint generated always as identity primary key,
  cc_code text not null unique check (char_length(cc_code) between 1 and 32),
  attempts integer not null check (attempts between 1 and 6),
  created_at timestamptz not null default now()
);
alter table public.wordle_scores enable row level security;
create policy "Anyone can submit their first word score" on public.wordle_scores
  for insert to anon with check (char_length(cc_code) between 1 and 32 and attempts between 1 and 6);
