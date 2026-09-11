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
