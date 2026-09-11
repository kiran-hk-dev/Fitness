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
