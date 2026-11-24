-- ════════════════════════════════════════════════════════════════════════
-- Fuller health profile collected right after sign-up.
--   activity_level    drives daily calories (see lib/health/metrics.ts)
--   target_weight_kg  optional goal weight
-- New condition values (prediabetes, fatty_liver, pcos, lactose_intolerance)
-- need no schema change: `conditions` is a text[] validated by the app.
-- ════════════════════════════════════════════════════════════════════════

alter table public.profiles
  add column activity_level text not null default 'moderate'
    check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  add column target_weight_kg numeric check (target_weight_kg between 10 and 400);
