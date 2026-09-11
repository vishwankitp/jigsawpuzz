-- Run this in Supabase SQL Editor to enable the Word Challenge.
create table if not exists public.wordle_scores (
  id bigint generated always as identity primary key,
  cc_code text not null unique check (char_length(cc_code) between 1 and 32),
  attempts integer not null check (attempts between 1 and 6),
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
