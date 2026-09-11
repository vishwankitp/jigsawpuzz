-- Run this in Supabase SQL Editor to enable the Word Challenge.
create table if not exists public.wordle_scores (
  id bigint generated always as identity primary key,
  cc_code text not null unique check (char_length(cc_code) between 1 and 32),
  attempts integer not null check (attempts >= 1),
  created_at timestamptz not null default now()
);

alter table public.wordle_scores enable row level security;

-- This database function makes the first score permanent for each CC code.
create or replace function public.record_wordle_score(p_cc_code text, p_attempts integer)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  insert into public.wordle_scores (cc_code, attempts)
  values (upper(trim(p_cc_code)), p_attempts)
  on conflict (cc_code) do nothing;
  return found;
end;
$$;

grant execute on function public.record_wordle_score(text, integer) to anon;

create table if not exists public.puzzle_scores (
  id bigint generated always as identity primary key,
  cc_code text not null unique check (char_length(cc_code) between 1 and 32),
  time_seconds integer not null check (time_seconds between 0 and 150),
  created_at timestamptz not null default now()
);
alter table public.puzzle_scores enable row level security;
drop policy if exists "Anyone can view puzzle completion tracker" on public.puzzle_scores;
create policy "Anyone can view puzzle completion tracker" on public.puzzle_scores for select to anon using (true);
drop policy if exists "Anyone can view word completion tracker" on public.wordle_scores;
create policy "Anyone can view word completion tracker" on public.wordle_scores for select to anon using (true);

create or replace function public.record_puzzle_score(p_cc_code text, p_time_seconds integer)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  insert into public.puzzle_scores (cc_code, time_seconds)
  values (upper(trim(p_cc_code)), p_time_seconds)
  on conflict (cc_code) do nothing;
  return found;
end;
$$;
grant execute on function public.record_puzzle_score(text, integer) to anon;
