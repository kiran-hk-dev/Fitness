-- FitLife 360 migration 0006: hip measurement column
-- Run in Supabase SQL Editor (safe to run anytime; IF NOT EXISTS).
alter table public.body_metrics add column if not exists hip_cm numeric;
