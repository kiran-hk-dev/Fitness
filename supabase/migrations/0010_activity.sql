-- FitLife 360 migration 0010: steps, running and water tracking
-- Run AFTER 0009_owner_delete.sql in Supabase SQL Editor.

-- 1) Step counter. One row per log event; daily total = SUM(steps) per day.
create table if not exists public.step_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  log_date date not null default current_date,
  steps int not null check (steps > 0 and steps <= 100000),
  source text not null default 'manual' check (source in ('manual','health','import')),
  logged_at timestamptz default now()
);
create index if not exists idx_step_logs_user_date on public.step_logs (user_id, log_date desc);

alter table public.step_logs enable row level security;
drop policy if exists "own step_logs" on public.step_logs;
create policy "own step_logs" on public.step_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2) Running sessions (start/stop with distance + duration).
create table if not exists public.run_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  log_date date not null default current_date,
  distance_km numeric not null default 0 check (distance_km >= 0),
  duration_min int not null default 0 check (duration_min >= 0),
  calories int default 0,
  started_at timestamptz default now()
);
create index if not exists idx_run_logs_user_date on public.run_logs (user_id, log_date desc);

alter table public.run_logs enable row level security;
drop policy if exists "own run_logs" on public.run_logs;
create policy "own run_logs" on public.run_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) Water needs a local-day column so "today" matches the user, not UTC.
alter table public.water_logs add column if not exists log_date date default current_date;
create index if not exists idx_water_logs_user_date on public.water_logs (user_id, log_date desc);

-- 4) Optional personal step / water / running targets on the profile row.
alter table public.profiles add column if not exists daily_steps_target int default 8000;
alter table public.profiles add column if not exists water_target_ml int default 2500;
alter table public.profiles add column if not exists run_goal_km_per_week numeric default 15;

-- 5) Unlocked milestones, so an achievement is celebrated exactly once ever.
create table if not exists public.achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  code text not null,
  log_date date default current_date,
  unlocked_at timestamptz default now(),
  unique (user_id, code)
);
create index if not exists idx_achievements_user on public.achievements (user_id, unlocked_at desc);

alter table public.achievements enable row level security;
drop policy if exists "own achievements" on public.achievements;
create policy "own achievements" on public.achievements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 6) Daily rollup used by the Progress graphs (steps / water / running per day).
create or replace view public.daily_activity_summary as
select
  s.user_id,
  s.log_date,
  coalesce(sum(s.steps), 0) as steps,
  coalesce(max(w.water_ml), 0) as water_ml,
  coalesce(max(r.run_km), 0) as run_km,
  coalesce(max(r.run_min), 0) as run_min
from public.step_logs s
left join lateral (
  select sum(w2.amount_ml) as water_ml from public.water_logs w2
  where w2.user_id = s.user_id and w2.log_date = s.log_date
) w on true
left join lateral (
  select sum(r2.distance_km) as run_km, sum(r2.duration_min) as run_min
  from public.run_logs r2
  where r2.user_id = s.user_id and r2.log_date = s.log_date
) r on true
group by s.user_id, s.log_date;

-- 7) Retention: drop step/run/achievement rows with the other 3-day logs.
delete from public.step_logs where logged_at < now() - interval '3 days';
delete from public.run_logs where started_at < now() - interval '3 days';
delete from public.achievements where unlocked_at < now() - interval '90 days';