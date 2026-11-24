# اختياري · Ikhtiyari

**Snap any food or label, and see if it's right for *your* health.**

People struggle to pick foods that fit their health needs because products differ so much in ingredients and nutrition. Ikhtiyari works like a photo calorie tracker (snap → instant result), but answers a more useful question: *is this good for me?* Every verdict is personal: it depends on the user's conditions (diabetes, blood pressure, celiac…), allergies, diet (halal, vegetarian) and goal.

Arabic-first (RTL), dark UI, built with Next.js 15, Clerk, Supabase and Claude.

---

## How it works

```
Landing ─► Sign up (Clerk) ─► Health profile (3 steps) ─► Dashboard
                                                             │
                ┌──────────────── Scan ◄─────────────────────┤
                │  Photo of a meal / pack / label ─► Claude reads it
                │  Barcode (camera or typed)     ─► Open Food Facts
                ▼
           Result: verdict (good / moderate / avoid) + 3 reasons
                   + sugar in teaspoons + traffic lights
                   + a better alternative ─► "Choose this" counts as a healthy swap
                │
                └──► History, Dashboard (weekly score, 7-day chart, tip, goal)
```

| Page | Route | Pattern | What's on it |
|---|---|---|---|
| Landing | `/` | Marketing | Logo, promise, how it works, example verdict |
| Sign in / up | `/sign-in`, `/sign-up` | Auth form | Clerk, in Arabic, brand colors |
| Onboarding | `/onboarding` | Form | Step 2 of sign-up: you → body and activity → conditions and allergies → goal and diet |
| Home | `/dashboard` | Dashboard | Weekly score ring, verdict bubbles + % bars, daily score bars, tip, weekly goal, last 5 scans |
| My health | `/health` | Dashboard | Weight, height, age, daily burn; BMI gauge; daily calories and limits (sugar, salt, sat fat, fiber, protein, water); conditions; nutrient range bars; category donut |
| Scan | `/scan` | Form | Barcode, whole product photo, label (nutrition table and/or ingredients), or ingredients only |
| Result | `/product/[id]` | Detail | Verdict, why, sugar teaspoons, traffic lights, alternative, details |
| History | `/history` | List | Search, verdict filter, paginated list |
| Profile | `/profile` | Settings | Health profile, sign out, delete my data |
| Motion Lab | `/motion` | — | A play button for every animation and page transition (public) |
| Preview | `/preview` | — | Home, My health and Scan with sample data, no account needed (public) |

## Design

- **Colors:** ink black `#11151C`, deep space blue `#212D40`, charcoal blue `#364156`. Verdict colors are used only for status.
- **Liquid glass:** every card, chip and the floating tab bar use `.glass` (blur, 1px light edge, top highlight, opaque fallback).
- **Type:** Readex Pro for big titles, IBM Plex Sans Arabic for text, Space Grotesk for numbers, IBM Plex Mono for code labels.
- **Charts:** score ring, verdict bubbles, pill bars, BMI gauge, range (bullet) bars, category donut — plain SVG and CSS, no chart library.
- **Responsive:** phones and tablets use a floating glass tab bar; from 1024px a side menu. Layouts are checked at 375, 768 and 1280px with no sideways scrolling.

## My health numbers

`lib/health/metrics.ts` (tested): BMI with WHO bands, resting energy with Mifflin–St Jeor, daily burn by activity level, a calorie target for the goal (−500 kcal to lose weight, never below 1200/1500, never a deficit in pregnancy), and daily limits: free sugar <10% of energy (5% with diabetes, prediabetes, PCOS or fatty liver), salt 5 g (3.75 g with high blood pressure, kidney or heart disease), saturated fat <10% (6% with cholesterol or heart disease), fiber 14 g per 1000 kcal, protein 0.8 g/kg (1.6 to build muscle), water 35 ml/kg.

## The scoring engine

`lib/nutrition/scoring.ts` is a pure function with unit tests (`npm test`):

1. **Hard stops**: an allergen, gluten for celiac, non-halal, or animal products for vegetarians/vegans means "avoid", with the score capped at 10.
2. **Traffic lights**: sugar, fat, saturates and salt are rated per 100 g using UK FSA thresholds. Drinks use half of each value.
3. **Points**: start at 100. Subtract for high or medium nutrients and flagged additives. Add for fiber and protein.
4. **Personal weights**: sugar ×2 for diabetes (where medium counts as high, and sugary drinks get an extra penalty), salt ×2 for blood pressure, kidney or heart conditions, saturates ×2 for cholesterol or heart conditions, and a calorie penalty when the goal is weight loss.
5. **Verdict**: 70 or more is good, 40–69 is moderate, under 40 is avoid.

The result page recomputes the score from the *current* profile, so adding an allergy updates old results too.

---

## Setup

### 1. Install

```bash
npm install
```

```bash
cp .env.example .env.local
```

### 2. Clerk (login)

1. Create an application at [dashboard.clerk.com](https://dashboard.clerk.com) with Email and Google sign-in.
2. Copy the publishable key and secret key into `.env.local`.
3. In Clerk, go to **Integrations → Supabase** and activate it. Copy the Clerk domain it shows.

### 3. Supabase (database)

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Authentication → Sign In / Providers → Third-Party Auth**, add **Clerk**, and paste the Clerk domain.
3. Open the **SQL editor** and run `supabase/migrations/0001_init.sql`, `supabase/migrations/0002_health_profile.sql`, then `supabase/seed.sql`.
4. Copy the project URL, anon key and service-role key into `.env.local`.

### 4. Anthropic (photo reading)

Put an API key from [console.anthropic.com](https://console.anthropic.com) in `ANTHROPIC_API_KEY`.

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000. Other scripts: `npm run build`, `npm test`, `npm run typecheck`.

---

## Code map

```
app/
  layout.tsx              Root: Clerk (Arabic, dark), font, splash, transitions
  globals.css             Design tokens + every animation (documented)
  page.tsx                Landing
  onboarding/             Health profile form
  (app)/                  Signed-in pages; layout = nav shell + profile guard
    template.tsx          Plays the page-enter transition
    dashboard/ scan/ product/[id]/ history/ profile/
  (lab)/motion/           Motion Lab (public)
  actions/                Server Actions: scan.ts, profile.ts
components/
  brand/                  Logo (SVG with animatable parts), SplashScreen
  motion/                 TransitionProvider, TransitionLink, PageTransition, MotionLab
  scan/  result/  profile/  nav/  ui/
lib/
  nutrition/              types, thresholds, additives, scoring (+ tests)
  ai/analyze-photo.ts     Claude vision → structured nutrition (Zod schema)
  openfoodfacts.ts        Barcode lookup
  data/                   Supabase queries and row ↔ domain mappers
  supabase/server.ts      Clients: user (RLS via Clerk token) and admin
  i18n/ar.ts              Arabic strings for verdicts, reasons, options
supabase/                 Schema with Row Level Security, seed data
```

### Security

- Every user table uses Row Level Security keyed on the Clerk user id (`auth.jwt()->>'sub'`). Users can only read and write their own rows.
- The service-role key and the Anthropic key are only imported in `server-only` modules.
- Photos are resized in the browser, checked for type and size on the server, sent to Claude, and **not stored**.
- Photo scans are limited to 30 per user per day.
- Health data is never saved to the browser.

---

## Motion

All animations live in `app/globals.css`, each with a comment saying where it's used and how long it runs. Open **`/motion`** to play every one, or watch the recording: [`docs/motion-demo.mp4`](docs/motion-demo.mp4).

**Logo launch (splash).** Your logo is drawn as SVG, so each part animates on its own. The cart outline draws itself, then the wheels pop in and the leaf grows into the basket, then the check badge pops and the check draws, and finally the name rises. The splash fades out at 1.9s. It plays once per session (a tiny inline script prevents any flash on return visits) and is skipped when the device asks for reduced motion.

**Page transitions.** Pick one with `<TransitionLink transition="…">`:

| Type | Use for | Duration |
|---|---|---|
| `fade` | Switching tabs | 150ms |
| `forward` | Going deeper (history → product) | 200ms |
| `back` | Going back (also the browser Back button) | 200ms |
| `rise` | Opening a task (→ scan) | 200ms |
| `zoom` | The verdict reveal after a scan | 300ms |
| `none` | Instant | 0 |

Under the hood, the link stores the type in `TransitionProvider`. `PageTransition` (in each `template.tsx`) is keyed on the URL path, reads the stored type once, and adds the class `page-enter--{type}`.

**Component animations:** `anim-pop`, `anim-rise`, `anim-stagger`, `anim-grow-y`, `anim-grow-x`, `anim-ring`, `anim-draw`, `anim-shake`, `anim-toast`, `anim-sheet`, `anim-fade`, `anim-scanline`, `anim-shimmer`, `press`.

**Rules** (from `.ux-profile.md`):

- Only `transform` and `opacity` animate.
- Durations are 100, 150, 200 or 300ms, with ease-out on enter and ease-in on exit.
- Under `prefers-reduced-motion`, everything shows its final state instantly.

---

*Ikhtiyari gives general guidance and does not replace advice from a doctor or dietitian.*
