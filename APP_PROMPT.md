# Build Prompt — "اختياري | Ikhtiyari" Smart Food Choice App

> Copy everything below the line into your AI app builder (Claude Code, Lovable, v0, Bolt, Cursor…) as one prompt.

---

## 1. What you are building

Build a full-stack web app (mobile-first, works great on phones) called **اختياري — Ikhtiyari** ("My Choice").

**Problem it solves:** There are many food products with different ingredients and nutritional values, so people struggle to pick foods that fit *their own* health needs. This hurts their eating habits and long-term health.

**Solution:** The user creates a health profile once. Then, for any food product, they scan its barcode or snap a photo of its label, and the app instantly gives a **personal verdict**:

- 🟢 **مناسب لك / Good for you**
- 🟡 **باعتدال / In moderation**
- 🔴 **تجنّبه / Avoid**

Each verdict comes with **max 3 short reasons** in plain language (e.g. "High sugar — you have diabetes") and **one healthier alternative**. A simple dashboard shows the user's progress over time.

**Language:** Arabic-first (RTL) with an English toggle. All UI text must live in translation files (`/messages/ar.json`, `/messages/en.json`).

---

## 2. Tech stack (use exactly this)

| Layer | Choice |
|---|---|
| Framework | **Next.js 15** (App Router, TypeScript, Server Actions) |
| Styling | **Tailwind CSS** + **shadcn/ui** components |
| Auth | **Clerk** (`@clerk/nextjs`) |
| Database | **Supabase** (Postgres + Row Level Security + Storage) |
| Charts | **Recharts** |
| Barcode scanning | `@zxing/browser` (camera in the browser) |
| Product data | **Open Food Facts API** (free, no key) |
| Label photo reading | Claude API (vision) — model `claude-sonnet-5-5` — called only from a server route |
| i18n | `next-intl` (Arabic default, RTL) |
| Font | `IBM Plex Sans Arabic` (Google Fonts) |
| Validation | `zod` |

### Environment variables (`.env.local`)

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server only, never sent to browser

ANTHROPIC_API_KEY=                # server only
```

Create a `.env.example` with these keys (empty values) and never commit real keys.

---

## 3. Authentication — Clerk + Supabase integration

Use **Clerk as Supabase's third-party auth provider** (the native integration — NOT the old JWT-template method):

1. In Clerk dashboard → *Integrations → Supabase* → activate; copy the Clerk domain.
2. In Supabase dashboard → *Authentication → Sign In / Providers → Third-Party Auth* → add **Clerk** with that domain.
3. Supabase then trusts Clerk session tokens. The Clerk user ID is available in SQL as `auth.jwt()->>'sub'`.

**Code requirements:**

- `middleware.ts` uses `clerkMiddleware()`; protect everything except `/`, `/sign-in(.*)`, `/sign-up(.*)`, and `/api/webhooks(.*)`.
- Wrap the app in `<ClerkProvider>` with Arabic localization (`@clerk/localizations` → `arSA`) when the locale is Arabic.
- Sign-in / sign-up pages use Clerk's `<SignIn />` and `<SignUp />` components, centered, styled with the app's colors via `appearance`.
- Sign-in methods: **email + password, email code, and Google**.
- Header shows Clerk's `<UserButton />`.

**Supabase clients** (create both in `/lib/supabase/`):

```ts
// server.ts — for Server Components / Server Actions / Route Handlers
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function createServerSupabase() {
  const { getToken } = await auth()
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { accessToken: async () => (await getToken()) ?? null }
  )
}
```

```ts
// client.ts — for Client Components
'use client'
import { useSession } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'
import { useMemo } from 'react'

export function useSupabase() {
  const { session } = useSession()
  return useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { accessToken: async () => (await session?.getToken()) ?? null }
  ), [session])
}
```

**First-login flow:** after sign-up, redirect to `/onboarding`. If a user without a `profiles` row visits any page other than onboarding, redirect them to `/onboarding`.

---

## 4. Database — Supabase schema

Create this as `supabase/migrations/0001_init.sql`. **Every user table has RLS enabled** and policies keyed on `auth.jwt()->>'sub'`.

```sql
-- ===== Profiles: one per Clerk user =====
create table public.profiles (
  user_id        text primary key default (auth.jwt()->>'sub'),
  full_name      text,
  birth_year     int check (birth_year between 1900 and 2100),
  sex            text check (sex in ('male','female')),
  height_cm      numeric,
  weight_kg      numeric,
  goal           text check (goal in ('lose_weight','maintain','gain_muscle','eat_healthier')) default 'eat_healthier',
  conditions     text[] not null default '{}',  -- diabetes, hypertension, high_cholesterol, celiac, kidney, pregnancy, heart
  allergies      text[] not null default '{}',  -- gluten, milk, eggs, nuts, peanuts, soy, fish, shellfish, sesame
  diet_prefs     text[] not null default '{}',  -- halal_only, vegetarian, vegan, low_carb
  language       text not null default 'ar' check (language in ('ar','en')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ===== Products cache (shared, readable by all signed-in users) =====
create table public.products (
  id              uuid primary key default gen_random_uuid(),
  barcode         text unique,
  name_ar         text,
  name_en         text,
  brand           text,
  image_url       text,
  category        text,
  -- nutrition per 100 g / 100 ml
  energy_kcal     numeric,
  sugar_g         numeric,
  fat_g           numeric,
  sat_fat_g       numeric,
  salt_g          numeric,
  fiber_g         numeric,
  protein_g       numeric,
  carbs_g         numeric,
  ingredients_text text,
  allergens       text[] not null default '{}',
  additives       text[] not null default '{}',   -- e.g. {'e621','e102'}
  is_halal        boolean,
  source          text not null check (source in ('openfoodfacts','label_photo','manual')),
  created_at      timestamptz not null default now()
);
create index on public.products (category);

-- ===== Scans: every product a user checks =====
create table public.scans (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null default (auth.jwt()->>'sub'),
  product_id   uuid not null references public.products(id) on delete cascade,
  score        int not null check (score between 0 and 100),
  verdict      text not null check (verdict in ('good','moderate','avoid')),
  reasons      jsonb not null default '[]',      -- [{ "key": "high_sugar", "severity": "high" }]
  alternative_product_id uuid references public.products(id),
  chose_alternative boolean not null default false,
  created_at   timestamptz not null default now()
);
create index on public.scans (user_id, created_at desc);

-- ===== Favorites =====
create table public.favorites (
  user_id     text not null default (auth.jwt()->>'sub'),
  product_id  uuid not null references public.products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ===== Weekly goals =====
create table public.goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null default (auth.jwt()->>'sub'),
  type        text not null check (type in ('max_avoid_per_week','min_good_percent','no_sugary_drinks')),
  target      int not null,
  week_start  date not null,
  created_at  timestamptz not null default now()
);

-- ===== RLS =====
alter table public.profiles  enable row level security;
alter table public.products  enable row level security;
alter table public.scans     enable row level security;
alter table public.favorites enable row level security;
alter table public.goals     enable row level security;

create policy "own profile" on public.profiles
  for all to authenticated
  using ((select auth.jwt()->>'sub') = user_id)
  with check ((select auth.jwt()->>'sub') = user_id);

create policy "read products" on public.products
  for select to authenticated using (true);
-- inserts into products happen only from the server with the service role key

create policy "own scans" on public.scans
  for all to authenticated
  using ((select auth.jwt()->>'sub') = user_id)
  with check ((select auth.jwt()->>'sub') = user_id);

create policy "own favorites" on public.favorites
  for all to authenticated
  using ((select auth.jwt()->>'sub') = user_id)
  with check ((select auth.jwt()->>'sub') = user_id);

create policy "own goals" on public.goals
  for all to authenticated
  using ((select auth.jwt()->>'sub') = user_id)
  with check ((select auth.jwt()->>'sub') = user_id);

-- ===== Dashboard helper view (respects RLS of the caller) =====
create view public.weekly_stats with (security_invoker = true) as
select
  user_id,
  date_trunc('week', created_at)::date as week_start,
  count(*)                                        as total_scans,
  count(*) filter (where verdict = 'good')        as good_count,
  count(*) filter (where verdict = 'moderate')    as moderate_count,
  count(*) filter (where verdict = 'avoid')       as avoid_count,
  round(avg(score))::int                          as avg_score,
  count(*) filter (where chose_alternative)       as swaps_count
from public.scans
group by user_id, date_trunc('week', created_at);
```

Also create a **Supabase Storage bucket** `label-photos` (private) with a policy that users can only read/write files under the folder named after their own user ID (`(storage.foldername(name))[1] = auth.jwt()->>'sub'`).

Add `supabase/seed.sql` with **~30 common products from the Gulf/Arab market** (milk, laban, dates, juices, soft drinks, chips, biscuits, bread, hummus, cheese, cereal…) with realistic nutrition values, so the demo works offline.

---

## 5. How the app works — screens and flows

### 5.1 Landing page `/` (public)
- Hero: big headline "اعرف إذا الأكل مناسب لك — بثانية", one sub-line, and a single green button "ابدأ مجاناً" (→ sign-up).
- 3 feature cards: Scan → Understand → Choose better.
- A visual example of a verdict card.

### 5.2 Onboarding `/onboarding` (3 short steps, progress bar on top)
1. **About you:** name, birth year, sex, height, weight (all optional except name).
2. **Your health:** big tappable chips (multi-select) for conditions and allergies, each with an icon. Include "None" as an option.
3. **Your goal & diet:** goal (single choice cards) + diet preferences (halal only, vegetarian, etc.).
- "Skip" is allowed on steps 1 and 3. Saves to `profiles` → redirect to `/dashboard`.

### 5.3 Scan `/scan` — the core feature
Two big tabs: **📷 Barcode** and **🏷️ Label photo**, plus a "Search by name" input.

**Barcode flow:**
1. Open the camera with `@zxing/browser`; also allow typing the barcode manually.
2. Server action `lookupProduct(barcode)`:
   - Check `products` table first (cache).
   - If missing → call `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`, map fields (`nutriments.sugars_100g`, `salt_100g`, `saturated-fat_100g`, `fat_100g`, `fiber_100g`, `proteins_100g`, `energy-kcal_100g`, `allergens_tags`, `additives_tags`, `ingredients_text_ar` / `ingredients_text`), and insert into `products` using the service-role client.
   - If not found anywhere → tell the user "We don't know this product yet — take a photo of the label" and switch to the photo tab.

**Label photo flow:**
1. User takes/uploads a photo of the nutrition table + ingredients. Upload to `label-photos/{userId}/{uuid}.jpg`.
2. Route handler `/api/read-label` sends the image to the Claude API and asks for **strict JSON only**, matching a zod schema: `{ name, brand, per_100g: { energy_kcal, sugar_g, fat_g, sat_fat_g, salt_g, fiber_g, protein_g, carbs_g }, ingredients_text, allergens[], additives[] }`. Must work for Arabic and English labels. If the label shows per-serving values only, convert to per-100g using the serving size. If sodium is given instead of salt: `salt = sodium × 2.5`.
3. Show the extracted values in an editable form ("Is this correct?") → user confirms → save as product with `source = 'label_photo'`.

**Then for both flows:** run the scoring engine (section 6), save a row in `scans`, and go to the result page.

### 5.4 Result `/product/[id]` — must be understood in 3 seconds
Top to bottom:
1. **Big verdict card** filling the top of the screen: color background (green/amber/red), large icon, verdict word, and score "72/100".
2. **"Why?"** — max 3 reasons, each a one-line sentence with an icon, ordered by severity. Example: "🍬 سكر عالي — 18 غ لكل 100 غ، وعندك سكري".
3. **Visual translation:** "This bottle ≈ 9 teaspoons of sugar" (sugar_g ÷ 4, using the package size if known), shown as teaspoon icons.
4. **Traffic-light strip** for sugar / fat / sat. fat / salt (low/medium/high pills).
5. **Better alternative** card: a product in the same `category` with the highest score for this user. Button "سأختار هذا" sets `chose_alternative = true`.
6. Collapsible sections: full nutrition table, ingredients with flagged ones highlighted, additives explained in one simple sentence each.
7. Buttons: ⭐ Save to favorites · 🔄 Scan another.

### 5.5 Dashboard `/dashboard` — EASY TO READ (see section 7 for rules)

### 5.6 History `/history`
List of past scans (newest first), each row: product image, name, colored verdict badge, date. Filters: All / 🟢 / 🟡 / 🔴, and a search box. Infinite scroll or "load more".

### 5.7 Profile `/profile`
Edit everything from onboarding, language toggle (AR/EN), and "Delete my data" (deletes profile, scans, favorites, goals, photos — with a confirmation dialog that names what will be deleted).

### Navigation
- **Mobile:** bottom tab bar with 4 items: Home (dashboard) · **Scan (big center button)** · History · Profile.
- **Desktop:** left sidebar (right sidebar in RTL) with the same items.

---

## 6. Scoring engine (`/lib/scoring.ts`, pure function, unit-tested)

`scoreProduct(product, profile) → { score: 0-100, verdict, reasons[] }`

**Step 1 — hard stops (verdict = `avoid`, score capped at 10):**
- Product contains an allergen the user listed.
- User has `celiac` and product contains gluten.
- User has `halal_only` and product `is_halal === false` or ingredients contain pork/gelatin of unknown source/alcohol.
- User is `vegan`/`vegetarian` and product contains animal ingredients.

**Step 2 — nutrient levels per 100 g** (UK FSA front-of-pack thresholds; for drinks use half the values):

| Nutrient | Low | High |
|---|---|---|
| Sugar | ≤ 5 g | > 22.5 g |
| Fat | ≤ 3 g | > 17.5 g |
| Saturated fat | ≤ 1.5 g | > 5 g |
| Salt | ≤ 0.3 g | > 1.5 g |

**Step 3 — points.** Start at 100.
- Each *high* nutrient: −20. Each *medium*: −8.
- Fiber ≥ 6 g: +10. Protein ≥ 10 g: +5.
- Each controversial additive (keep a list in `/lib/additives.ts` with an Arabic + English explanation for each): −3, max −12.
- Ultra-processed (≥ 5 additives): −10.

**Step 4 — personal weights** (multiply the penalty for that nutrient):
- `diabetes` → sugar ×2, carbs > 50 g → extra −10
- `hypertension`, `kidney`, `heart` → salt ×2
- `high_cholesterol`, `heart` → sat fat ×2
- `lose_weight` → energy > 400 kcal → −10
- `pregnancy` → flag high caffeine / raw-milk cheeses as reasons

**Step 5 — verdict:** score ≥ 70 → `good`, 40–69 → `moderate`, < 40 → `avoid`.

**Reasons:** return them as translation keys + values (e.g. `{ key: 'high_sugar_diabetes', value: 18 }`), sorted by impact, so the UI can show them in AR or EN. Always show at least one positive reason if any exist (e.g. "high in fiber").

Write unit tests (Vitest) for: allergen hard stop, diabetic + sugary drink = avoid, plain water = good, hypertension + chips = avoid/moderate.

> Add a small disclaimer in the footer and result page: "This app gives general guidance and does not replace advice from your doctor or dietitian."

---

## 7. Dashboard design — rules for "easy to read"

The dashboard must be readable **at a glance by anyone, including elderly users**. Follow these rules strictly:

**Layout (top to bottom, single column on mobile, 2 columns on desktop):**

1. **Greeting line:** "مساء الخير، سارة 👋" + one sentence summary: "هذا الأسبوع اخترت أكل مناسب ٧٠٪ من المرات".
2. **One hero number:** a large circular progress ring showing **this week's health score (0–100)** with its color and a one-word label (ممتاز / جيد / يحتاج تحسين). Under it, a small arrow: "↑ 8 points vs last week".
3. **Exactly 3 stat cards** in a row:
   - 🟢 Good choices (count)
   - 🔴 Products to avoid (count)
   - 🔄 Healthy swaps made (count)
4. **One chart only:** a simple stacked bar chart of the last 7 days (green / amber / red per day). No grid lines, no more than 3 colors, day names as labels, value on hover/tap. Show an empty-state message instead of an empty chart.
5. **"Today's tip"** card: one personalized tip based on what they scanned most (e.g. "Most of your red items were juices — try laban or water with lemon").
6. **Recent scans:** last 5 items as rows (image, name, verdict badge) + "View all" link.
7. **Weekly goal** progress bar (e.g. "Max 3 red items this week: 2/3").

**Visual rules:**
- Minimum body text 16px; key numbers 32–48px bold.
- Verdict colors always paired with an icon + word (never color alone — for color-blind users).
  - Good: green `#16A34A` · Moderate: amber `#D97706` · Avoid: red `#DC2626`
- Neutral background (`#F8FAF9` light / `#0F1412` dark), white cards with a soft border, 16px radius, generous spacing (8-pt grid).
- Maximum 7 blocks on the screen; no tables on the dashboard.
- Use Arabic-Indic or Western numerals based on the locale.
- Support dark mode via `prefers-color-scheme` and a toggle.
- Skeleton loaders while data loads; friendly empty state for new users: "لسا ما فحصت أي منتج — ابدأ بأول فحص" with a big Scan button.
- WCAG AA contrast, visible focus rings, all buttons ≥ 44px tall.

**Data:** fetch in a Server Component from the `weekly_stats` view and `scans` (last 7 days) using the server Supabase client — RLS guarantees each user sees only their own data.

---

## 8. Folder structure

```
/app
  /[locale]
    /(public)/page.tsx            # landing
    /sign-in/[[...sign-in]]/page.tsx
    /sign-up/[[...sign-up]]/page.tsx
    /(app)/layout.tsx             # nav + profile guard
    /(app)/onboarding/page.tsx
    /(app)/dashboard/page.tsx
    /(app)/scan/page.tsx
    /(app)/product/[id]/page.tsx
    /(app)/history/page.tsx
    /(app)/profile/page.tsx
  /api/read-label/route.ts
/components  (VerdictCard, ReasonList, NutrientPills, ScoreRing, StatCard, WeeklyChart, ScanCamera, ...)
/lib
  /supabase/server.ts, client.ts, admin.ts
  scoring.ts, additives.ts, openfoodfacts.ts, thresholds.ts
/messages/ar.json, en.json
/supabase/migrations/0001_init.sql, seed.sql
middleware.ts
```

---

## 9. Security & quality checklist

- `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` used only in server files (`import 'server-only'`).
- All user tables have RLS; test that user A cannot read user B's scans.
- Validate every Server Action input with zod.
- Rate-limit `/api/read-label` (e.g. 20 photos/user/day) — count from the `scans` table or a simple counter.
- Compress label photos client-side to ≤ 1600px before upload.
- Graceful errors that never blame the user and always offer a next step ("We couldn't read the label clearly — try again with better light, or enter the values manually").
- Lighthouse mobile score ≥ 90; works at 375px width with no horizontal scroll.

---

## 10. Definition of done

1. I can sign up with Clerk (email or Google), complete onboarding, and land on the dashboard.
2. I can scan a real barcode (e.g. a Coca-Cola can) and see a red/amber verdict with reasons and an alternative.
3. I can photograph an Arabic nutrition label and get correct values I can edit.
4. A diabetic profile and a non-diabetic profile get **different** verdicts for the same sugary product.
5. The dashboard shows my weekly score, 3 stats, a 7-day chart, a tip, and recent scans — readable at a glance.
6. Arabic RTL and English both work fully; dark mode works.
7. Signed-out users are redirected to sign-in; one user can never see another user's data.
8. A `README.md` explains setup: create Clerk app, enable the Supabase integration, run the migration + seed, fill `.env.local`, `npm run dev`.
