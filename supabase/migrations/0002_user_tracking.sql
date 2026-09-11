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
