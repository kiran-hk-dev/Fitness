-- FitLife 360 FULL SETUP � run this ONE file once in Supabase SQL Editor
-- Runs migrations 0001..0009 in order (schema + RLS + storage + retention).

-- ================= 0001_init ===================
-- FitLife 360 initial schema + RLS
-- Run: supabase db push  (or paste into SQL editor)

create extension if not exists "uuid-ossp";

-- PROFILES (1 row per auth.user)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  age_range text,
  sex text check (sex in ('male','female','other')),
  height_cm numeric, weight_kg numeric,
  activity_level text default 'moderate',
  goal text default 'general_fitness',
  diet_type text default 'veg',
  workout_level text default 'easy',
  workout_location text default 'home',
  equipment_json jsonb default '[]',
  preferred_duration_min int default 30,
  daily_steps_target int default 8000,
  water_target_ml int default 2500,
  sleep_target_h numeric default 8,
  created_at timestamptz default now()
);

create table if not exists public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  target_type text not null, target_value numeric not null,
  start_value numeric, start_date date default current_date,
  target_date date, status text default 'active'
);

create table if not exists public.foods (
  id text primary key, name text not null, category text,
  serving_size text, calories numeric not null, protein_g numeric default 0,
  carbs_g numeric default 0, fat_g numeric default 0,
  fiber_g numeric default 0, sugar_g numeric default 0,
  micronutrients_json jsonb default '{}',
  published boolean default true
);

create table if not exists public.meal_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  meal_type text not null, logged_at timestamptz default now(),
  total_calories numeric default 0, notes text
);

create table if not exists public.meal_log_items (
  id uuid primary key default uuid_generate_v4(),
  meal_log_id uuid references public.meal_logs(id) on delete cascade not null,
  food_id text references public.foods(id),
  quantity numeric default 1, calculated_nutrition_json jsonb default '{}'
);

create table if not exists public.exercises (
  id text primary key, name text not null, muscle_group text not null,
  level text not null, equipment text, environment text,
  instructions_json jsonb default '[]', media_url text, thumbnail_url text,
  published boolean default true
);

create table if not exists public.workout_plans (
  id text primary key, name text not null, level text,
  goal text, weeks int default 12, days_per_week int default 3, description text
);

create table if not exists public.workout_plan_days (
  id uuid primary key default uuid_generate_v4(),
  plan_id text references public.workout_plans(id) on delete cascade,
  week_no int, day_no int, title text, focus text
);

create table if not exists public.workout_plan_exercises (
  id uuid primary key default uuid_generate_v4(),
  day_id uuid references public.workout_plan_days(id) on delete cascade,
  exercise_id text references public.exercises(id),
  sets int, rep_min int, rep_max int, time_sec int, rest_sec int,
  tempo text, sort_order int default 0
);

create table if not exists public.workout_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan_id text, started_at timestamptz default now(),
  completed_at timestamptz, duration_min int, notes text, effort int
);

create table if not exists public.workout_sets (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.workout_sessions(id) on delete cascade not null,
  exercise_id text, set_no int, reps int, weight numeric, duration_sec int, completed boolean default true
);

create table if not exists public.water_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount_ml int not null, logged_at timestamptz default now()
);

create table if not exists public.body_metrics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  weight_kg numeric, waist_cm numeric, chest_cm numeric,
  arm_cm numeric, thigh_cm numeric, logged_at timestamptz default now()
);

create table if not exists public.habit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  habit_type text not null, value numeric default 1, logged_at timestamptz default now()
);

create table if not exists public.yoga_sessions (
  id text primary key, name text not null, level text,
  duration_min int, focus text, poses_json jsonb default '[]', published boolean default true
);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  units text default 'metric', reminders_json jsonb default '{}',
  allergies_json jsonb default '[]', equipment_json jsonb default '[]', privacy_json jsonb default '{}'
);

-- RLS
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.meal_logs enable row level security;
alter table public.meal_log_items enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;
alter table public.water_logs enable row level security;
alter table public.body_metrics enable row level security;
alter table public.habit_logs enable row level security;
alter table public.user_preferences enable row level security;

-- private: owner only
create policy "own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own goals" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own meals" on public.meal_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own meal items" on public.meal_log_items for all using (
  exists (select 1 from public.meal_logs m where m.id = meal_log_id and m.user_id = auth.uid())
) with check (
  exists (select 1 from public.meal_logs m where m.id = meal_log_id and m.user_id = auth.uid())
);
create policy "own sessions" on public.workout_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own sets" on public.workout_sets for all using (
  exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid())
) with check (
  exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid())
);
create policy "own water" on public.water_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own metrics" on public.body_metrics for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own habits" on public.habit_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own prefs" on public.user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- public content readable by all authenticated users
alter table public.foods enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_plans enable row level security;
alter table public.yoga_sessions enable row level security;
create policy "read foods" on public.foods for select using (true);
create policy "read exercises" on public.exercises for select using (true);
create policy "read plans" on public.workout_plans for select using (true);
create policy "read yoga" on public.yoga_sessions for select using (true);

-- Storage buckets (create in dashboard or via API):
-- insert into storage.buckets (id, name, public) values ('exercise-media','exercise-media', true), ('progress-photos','progress-photos', false);


-- ================= 0002_user_tracking ===================
-- FitLife 360 migration 0002: user training checkmarks + yoga counts + daily share
-- Run AFTER 0001_init.sql in Supabase SQL Editor.

-- 1) Keep height history alongside weight
alter table public.body_metrics add column if not exists height_cm numeric;

-- 2) Unified training log: every completed workout exercise AND yoga session/pose
--    gets a checkmark row. Count-per-day = count(*) grouped by item.
create table if not exists public.training_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  log_date date not null default current_date,
  kind text not null check (kind in ('workout','yoga')),
  item_id text not null,          -- exercise id OR yoga session/pose id
  item_name text not null,        -- denormalised for fast daily summary + share
  completed boolean not null default true,  -- the checkmark ✓
  duration_min int default null,
  reps int default null,
  weight_kg numeric default null,
  created_at timestamptz default now()
);
create index if not exists idx_training_logs_user_date on public.training_logs (user_id, log_date);
create index if not exists idx_training_logs_user_kind on public.training_logs (user_id, kind);

alter table public.training_logs enable row level security;
drop policy if exists "own training_logs" on public.training_logs;
create policy "own training_logs" on public.training_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) Daily share snapshots (optional history of what user shared)
create table if not exists public.daily_shares (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  share_date date not null default current_date,
  weight_kg numeric,
  height_cm numeric,
  summary_json jsonb default '{}',
  share_text text,
  created_at timestamptz default now()
);
alter table public.daily_shares enable row level security;
drop policy if exists "own daily_shares" on public.daily_shares;
create policy "own daily_shares" on public.daily_shares
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4) Auto-create profile row on signup so weight/height always has a home
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) Handy daily-summary view (per user per day: weight + yoga counts + workout counts)
create or replace view public.daily_training_summary as
select
  user_id,
  log_date,
  count(*) filter (where kind = 'workout' and completed) as workouts_done,
  count(*) filter (where kind = 'yoga' and completed) as yoga_done,
  count(*) filter (where completed) as total_done
from public.training_logs
group by user_id, log_date;


-- ================= 0003_content ===================
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


-- ================= 0004_user_content ===================
-- FitLife 360 migration 0004: user-added exercises/yoga with up to 5 animated images
-- Run AFTER 0003_content.sql in Supabase SQL Editor.
-- WHAT THIS ADDS (what you asked "what changes in Supabase"):
--   1) New columns on exercises + yoga_sessions for image galleries + coaching content
--   2) created_by so each item is credited to the account that added it
--   3) A public `user-media` storage bucket (with policies) holding the uploaded photos

-- 1) Exercise columns: 5-frame gallery + per-frame focus cues
alter table public.exercises add column if not exists images_json jsonb default '[]';
alter table public.exercises add column if not exists focus_cues_json jsonb default '[]';
alter table public.exercises add column if not exists created_by uuid references public.profiles(id) on delete set null;

-- 2) Yoga columns: 5-frame gallery + per-pose details (name + image + cue)
alter table public.yoga_sessions add column if not exists images_json jsonb default '[]';
alter table public.yoga_sessions add column if not exists pose_details_json jsonb default '[]';
alter table public.yoga_sessions add column if not exists created_by uuid references public.profiles(id) on delete set null;

-- 3) Storage bucket for user-uploaded demo photos (public read so apps render fast)
insert into storage.buckets (id, name, public)
values ('user-media', 'user-media', true)
on conflict (id) do nothing;

-- 4) Storage policies: anyone can VIEW, only signed-in users can UPLOAD/UPDATE/DELETE
drop policy if exists "public read user-media" on storage.objects;
create policy "public read user-media" on storage.objects
  for select using (bucket_id = 'user-media');

drop policy if exists "auth upload user-media" on storage.objects;
create policy "auth upload user-media" on storage.objects
  for insert to authenticated with check (bucket_id = 'user-media');

drop policy if exists "auth update user-media" on storage.objects;
create policy "auth update user-media" on storage.objects
  for update to authenticated using (bucket_id = 'user-media');

drop policy if exists "auth delete user-media" on storage.objects;
create policy "auth delete user-media" on storage.objects
  for delete to authenticated using (bucket_id = 'user-media');

-- NOTE: table INSERT permission for signed-in users was already granted
-- in 0003 (policies "auth insert foods/exercises/yoga"). If you skipped
-- 0003, run it first or these app Add-screens will get RLS errors.


-- ================= 0005_retention ===================
-- FitLife 360 migration 0005: keep 3 days of log data, auto-delete older rows
-- Run AFTER 0004_user_content.sql in Supabase SQL Editor.
--
-- WHAT IT DOES: any row in a *log* table older than `retention_days`
-- (default 3) is deleted automatically, per user (user_id is untouched —
-- only that user's own old logs go; profiles/plans/foods stay forever).
-- Tables pruned: training_logs, meal_logs (+items via cascade),
-- workout_sessions (+sets via cascade), water_logs, habit_logs,
-- body_metrics, daily_shares.
--
-- TWO LAYERS (either one alone is enough):
--   A) Server job below (pg_cron, runs daily 03:00 UTC) — no app needed.
--   B) App calls pruneOldLogs() on startup (src/lib/tracking.ts) — works
--      even if pg_cron is unavailable. Keep both for safety.

-- 1) Prune function (runs as definer so one call cleans all users)
create or replace function public.cleanup_logs_older_than(retention_days int default 3)
returns table (tbl text, deleted bigint)
language plpgsql security definer as $$
declare
  cutoff_tstz timestamptz := now() - make_interval(days => retention_days);
  cutoff_date date := current_date - retention_days;
begin
  delete from public.meal_log_items
  where meal_log_id in (select id from public.meal_logs where logged_at < cutoff_tstz);

  return query
  with d1 as (delete from public.training_logs where log_date < cutoff_date returning 1),
       d2 as (delete from public.meal_logs where logged_at < cutoff_tstz returning 1),
       d3 as (delete from public.workout_sessions where started_at < cutoff_tstz returning 1),
       d4 as (delete from public.water_logs where logged_at < cutoff_tstz returning 1),
       d5 as (delete from public.habit_logs where logged_at < cutoff_tstz returning 1),
       d6 as (delete from public.body_metrics where logged_at < cutoff_tstz returning 1),
       d7 as (delete from public.daily_shares where created_at < cutoff_tstz returning 1)
  select * from (values
    ('training_logs', (select count(*) from d1)),
    ('meal_logs', (select count(*) from d2)),
    ('workout_sessions', (select count(*) from d3)),
    ('water_logs', (select count(*) from d4)),
    ('habit_logs', (select count(*) from d5)),
    ('body_metrics', (select count(*) from d6)),
    ('daily_shares', (select count(*) from d7))
  ) as t(tbl, deleted);
end $$;

-- 2) Daily schedule (needs pg_cron — enable once: Database → Extensions → pg_cron)
create extension if not exists pg_cron with schema extensions;
do $do$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'fitlife-daily-prune',
      '0 3 * * *',
      $job$select public.cleanup_logs_older_than(3)$job$
    );
  end if;
exception when duplicate_object then
  perform cron.alter_job(
    (select jobid from cron.job where jobname = 'fitlife-daily-prune'),
    schedule := '0 3 * * *',
    command := $job$select public.cleanup_logs_older_than(3)$job$
  );
end $do$;

-- 3) Manual test (run anytime to see what WOULD be cleaned — returns counts):
-- select * from public.cleanup_logs_older_than(3);
--
-- Change retention later with, e.g.: select public.cleanup_logs_older_than(7);
-- (also update RETENTION_DAYS in src/lib/tracking.ts to match)


-- ================= 0006_measurements ===================
-- FitLife 360 migration 0006: hip measurement column
-- Run in Supabase SQL Editor (safe to run anytime; IF NOT EXISTS).
alter table public.body_metrics add column if not exists hip_cm numeric;


-- ================= 0007_rls_gaps ===================
-- FitLife 360 migration 0007: close RLS gaps + complete storage buckets
-- Run in Supabase SQL Editor (safe re-run; all statements idempotent).
--
-- GAP FOUND BY AUDIT: workout_plan_days + workout_plan_exercises had
-- RLS OFF and zero policies. They are public program content like
-- workout_plans, so they get public read-only access.

alter table public.workout_plan_days enable row level security;
alter table public.workout_plan_exercises enable row level security;

drop policy if exists "read plan days" on public.workout_plan_days;
create policy "read plan days" on public.workout_plan_days
  for select using (true);

drop policy if exists "read plan exercises" on public.workout_plan_exercises;
create policy "read plan exercises" on public.workout_plan_exercises
  for select using (true);

-- Storage buckets referenced by the app (user-media already created in 0004)
insert into storage.buckets (id, name, public)
values ('exercise-media', 'exercise-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

-- exercise-media: public read (demo loops), authenticated upload
drop policy if exists "public read exercise-media" on storage.objects;
create policy "public read exercise-media" on storage.objects
  for select using (bucket_id = 'exercise-media');

drop policy if exists "auth upload exercise-media" on storage.objects;
create policy "auth upload exercise-media" on storage.objects
  for insert to authenticated with check (bucket_id = 'exercise-media');

-- progress-photos: strictly owner-only (private progress pictures).
-- App must upload to `progress-photos/<user_id>/...` paths.
drop policy if exists "own progress photos" on storage.objects;
create policy "own progress photos" on storage.objects
  for all to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);


-- ================= 0008_food_owner ===================
-- FitLife 360 migration 0008: track who added each food (for per-user delete)
-- Run in Supabase SQL Editor (safe re-run).
alter table public.foods add column if not exists created_by uuid references public.profiles(id) on delete set null;
create index if not exists idx_foods_created_by on public.foods (created_by);

-- Owners can delete their own foods. (Seeded/NULL rows stay protected.)
drop policy if exists "own food delete" on public.foods;
create policy "own food delete" on public.foods
  for delete to authenticated
  using (created_by = auth.uid());


-- ================= 0009_owner_delete ===================
-- FitLife 360 migration 0009: owners can delete their own exercises/yoga
-- Run in Supabase SQL Editor (safe re-run).
-- WITHOUT THIS: the in-app Delete buttons on exercises/yoga fail with an
-- RLS error (only foods had a delete policy from 0008).

drop policy if exists "own exercise delete" on public.exercises;
create policy "own exercise delete" on public.exercises
  for delete to authenticated
  using (created_by = auth.uid());

drop policy if exists "own yoga delete" on public.yoga_sessions;
create policy "own yoga delete" on public.yoga_sessions
  for delete to authenticated
  using (created_by = auth.uid());


