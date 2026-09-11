-- FitLife 360 migration 0008: track who added each food (for per-user delete)
-- Run in Supabase SQL Editor (safe re-run).
alter table public.foods add column if not exists created_by uuid references public.profiles(id) on delete set null;
create index if not exists idx_foods_created_by on public.foods (created_by);

-- Owners can delete their own foods. (Seeded/NULL rows stay protected.)
drop policy if exists "own food delete" on public.foods;
create policy "own food delete" on public.foods
  for delete to authenticated
  using (created_by = auth.uid());
