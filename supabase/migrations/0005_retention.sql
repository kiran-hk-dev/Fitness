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
