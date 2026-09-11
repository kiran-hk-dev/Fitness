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
