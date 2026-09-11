-- FitLife 360 migration 0003: diet plans in Supabase + user-added content
-- Run AFTER 0002_user_tracking.sql in Supabase SQL Editor.

-- 1) User diet/meal plans stored per account
create table if not exists public.user_meal_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  diet text default 'any',
  days_json jsonb not null default '[]',
  created_at timestamptz default now()
);
create index if not exists idx_meal_plans_user on public.user_meal_plans (user_id);

alter table public.user_meal_plans enable row level security;
drop policy if exists "own meal_plans" on public.user_meal_plans;
create policy "own meal_plans" on public.user_meal_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2) Let signed-in users ADD new foods / exercises / yoga sessions
--    (reads stay public; inserts restricted to authenticated role)
drop policy if exists "auth insert foods" on public.foods;
create policy "auth insert foods" on public.foods
  for insert to authenticated with check (true);

drop policy if exists "auth insert exercises" on public.exercises;
create policy "auth insert exercises" on public.exercises
  for insert to authenticated with check (true);

drop policy if exists "auth insert yoga" on public.yoga_sessions;
create policy "auth insert yoga" on public.yoga_sessions
  for insert to authenticated with check (true);
