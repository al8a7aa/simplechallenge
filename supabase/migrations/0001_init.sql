-- ════════════════════════════════════════════════════════════════════════
-- Ikhtiyari schema
--
-- Auth: Clerk is configured as Supabase's third-party auth provider, so the
-- Clerk user id is available in SQL as  auth.jwt()->>'sub'.
-- Every per-user table has Row Level Security keyed on that id, so a user
-- can only ever read or write their own rows.
--
-- The shared `products` table is readable by every signed-in user and is
-- written only by the server with the service-role key.
-- ════════════════════════════════════════════════════════════════════════

-- ── Profiles: one row per Clerk user ────────────────────────────────────
create table public.profiles (
  user_id     text primary key default (auth.jwt()->>'sub'),
  full_name   text not null,
  birth_year  int  check (birth_year between 1900 and 2100),
  sex         text check (sex in ('male', 'female')),
  height_cm   numeric check (height_cm between 50 and 260),
  weight_kg   numeric check (weight_kg between 10 and 400),
  goal        text not null default 'eat_healthier'
              check (goal in ('lose_weight', 'maintain', 'gain_muscle', 'eat_healthier')),
  conditions  text[] not null default '{}',  -- see lib/nutrition/types.ts CONDITIONS
  allergies   text[] not null default '{}',  -- see ALLERGENS
  diet_prefs  text[] not null default '{}',  -- see DIET_PREFS
  max_avoid_per_week int not null default 4 check (max_avoid_per_week between 0 and 50),
  language    text not null default 'ar' check (language in ('ar', 'en')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Products: packaged products and photographed meals (shared cache) ────
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  barcode     text unique,                -- null for meals
  kind        text not null default 'packaged' check (kind in ('packaged', 'meal')),
  name_ar     text not null,
  name_en     text,
  brand       text,
  image_url   text,
  category    text not null default 'other',
  is_drink    boolean not null default false,
  portion_g   numeric,                    -- estimated portion for meals / pack size
  -- Nutrition per 100 g (or 100 ml for drinks). null = unknown.
  energy_kcal numeric,
  sugar_g     numeric,
  fat_g       numeric,
  sat_fat_g   numeric,
  salt_g      numeric,
  fiber_g     numeric,
  protein_g   numeric,
  carbs_g     numeric,
  ingredients_text text,
  allergens   text[] not null default '{}',
  additives   text[] not null default '{}',
  is_halal    boolean,
  has_animal_ingredients boolean,
  has_animal_products    boolean,
  source      text not null check (source in ('openfoodfacts', 'photo', 'seed', 'manual')),
  confidence  text check (confidence in ('high', 'medium', 'low')),  -- for AI estimates
  created_by  text,                       -- Clerk id for photo products
  created_at  timestamptz not null default now()
);
create index products_category_idx on public.products (category);
create index products_name_idx on public.products using gin (to_tsvector('simple', name_ar || ' ' || coalesce(name_en, '')));

-- ── Scans: every product a user checks, with their personal verdict ──────
create table public.scans (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null default (auth.jwt()->>'sub'),
  product_id  uuid not null references public.products (id) on delete cascade,
  method      text not null check (method in ('photo', 'barcode', 'search')),
  score       int  not null check (score between 0 and 100),
  verdict     text not null check (verdict in ('good', 'moderate', 'avoid')),
  reasons     jsonb not null default '[]',
  alternative_product_id uuid references public.products (id) on delete set null,
  chose_alternative boolean not null default false,
  created_at  timestamptz not null default now()
);
create index scans_user_created_idx on public.scans (user_id, created_at desc);

-- ── Favorites ────────────────────────────────────────────────────────────
create table public.favorites (
  user_id     text not null default (auth.jwt()->>'sub'),
  product_id  uuid not null references public.products (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ── Row Level Security ───────────────────────────────────────────────────
alter table public.profiles  enable row level security;
alter table public.products  enable row level security;
alter table public.scans     enable row level security;
alter table public.favorites enable row level security;

create policy "own profile" on public.profiles for all to authenticated
  using ((select auth.jwt()->>'sub') = user_id)
  with check ((select auth.jwt()->>'sub') = user_id);

create policy "read products" on public.products for select to authenticated
  using (true);

create policy "own scans" on public.scans for all to authenticated
  using ((select auth.jwt()->>'sub') = user_id)
  with check ((select auth.jwt()->>'sub') = user_id);

create policy "own favorites" on public.favorites for all to authenticated
  using ((select auth.jwt()->>'sub') = user_id)
  with check ((select auth.jwt()->>'sub') = user_id);

-- Keep updated_at fresh.
create function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
