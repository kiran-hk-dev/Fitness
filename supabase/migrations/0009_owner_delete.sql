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
