# CONTEXT.md — Gym Logger (personal workout tracker)

> Source of truth for every decision in this repo. If code and this file disagree, fix the code or update this file in the same commit.
> Visual language lives in `DESIGN.md` (Jobright-style: spring-mint + black + white). Read both before writing UI.

---

## 1. What we are building

A **personal, single-user gym logging app** (think Hevy, but trimmed to what I actually use) that works as a responsive website on **phone and PC** and is installable as a PWA on my phone.

I train **one gym per day**, either **Home** or **College**. The app opens on a Home / College switch, figures out today's workout from the weekday (India time), lets me tap an exercise, and log sets as **weight (kg) or number of plates** + **reps**. It shows graphs over time, flags **PRs**, logs **cardio** (speed, incline, time) every day, and asks for **body weight twice a month**.

**Non-goals:** social feed, followers, community, subscriptions, multi-user, AI coaching, workout programs marketplace, wearable sync. Do not build these.

---

## 2. Stack and hosting

| Concern | Choice |
|---|---|
| Framework | Next.js (latest stable, App Router) + TypeScript (strict) |
| Styling | Tailwind CSS (v4 `@theme` tokens if v4 is installed) |
| Database + Auth | **Supabase** (Postgres + Supabase Auth), region Mumbai/Asia-Pacific |
| Supabase client | `@supabase/supabase-js` + `@supabase/ssr` |
| Charts | `recharts` |
| Icons | `lucide-react` |
| Fonts | `next/font/google`: **Titillium Web** (display) + **Inter** (UI/body) |
| Tests | `vitest` for pure logic in `src/lib` |
| Hosting | Vercel (env vars set in Vercel project) |
| Dates/time | Native `Intl` with explicit `timeZone: 'Asia/Kolkata'`. No date library needed. |

Rules for using the stack:
- Server Components by default; Client Components only for interactive pieces (set-entry form, charts, switchers).
- Mutations via **Server Actions** (validate input with a small hand-written validator or `zod` if added), then `revalidatePath`.
- Use optimistic UI for set logging (it must feel instant on gym Wi-Fi).
- Route protection file is `middleware.ts` (Next ≤15) or `proxy.ts` (Next 16+). Use whichever the installed version expects.
- Follow the installed `vercel-react-best-practices` skill for data fetching, waterfalls, bundle size.

---

## 3. Hard rules (non-negotiable)

1. **Timezone is always `Asia/Kolkata` (IST).** Never use `new Date().getDay()` / `toISOString().slice(0,10)` for "today" — Vercel runs in UTC and will return the wrong day between 00:00 and 05:30 IST. Use the helpers in `src/lib/time.ts` everywhere.
2. **One session per calendar day, one gym per session.** Enforced in DB: `unique (user_id, session_date)`.
3. **Row Level Security on every table**, policy `user_id = (select auth.uid())`. No table is readable by `anon`.
4. **No service-role key in the app or in `NEXT_PUBLIC_*` vars.** Only the Supabase URL + publishable (or legacy anon) key are used by the app.
5. **Sign-ups disabled** in Supabase Auth after my one account exists. The app has a login page only, no register page.
6. **All text inputs ≥ 16px font size** (prevents iOS zoom) and all tap targets ≥ 44×44px.
7. **Respect `prefers-reduced-motion`.** Motion only in response to user actions, plus the optional PR ticker (which must be static under reduced motion).
8. No placeholder/lorem content, no fake data in production paths. A dev-only seed script for sample history is fine.

---

## 4. Training routine (auto-picked by weekday, IST)

| Weekday | Split key | Muscle groups |
|---|---|---|
| Monday | `back_biceps` | Back, Biceps |
| Tuesday | `chest_triceps` | Chest, Triceps |
| Wednesday | `legs_shoulders` | Legs, Shoulders |
| Thursday | `back_biceps` | Back, Biceps |
| Friday | `chest_triceps` | Chest, Triceps |
| Saturday | `legs_shoulders` | Legs, Shoulders |
| Sunday | `rest` | — (cardio and light work still loggable) |

Behaviour:
- Today screen pre-selects the muscle-group chips for today's split. I can toggle any group on/off to override (e.g., I swapped days). A manual override is stored as `planned_split = 'custom'`.
- On Sunday show "Rest day", but still show the Cardio card and an "Train anyway" action.
- **Cardio is available every day** (including rest day) and in both gyms.

`weekdayIST(dateStr)` must derive the weekday from the `YYYY-MM-DD` string at **12:00 UTC** (`new Date(\`${d}T12:00:00Z\`).getUTCDay()`) so it never shifts across timezones.

---

## 5. Gyms and exercise catalog

Two gyms: `home`, `college`. Exercises are **per gym** (the same-named lift on a different machine has different numbers, so PRs and charts are per gym row). Rows share a `canonical_slug` so I can optionally view "both gyms combined".

The catalog is seeded by `supabase/migrations/*_init.sql` via `select public.seed_default_exercises('<my-user-uuid>');`. The app must also let me **add / edit / archive exercises** in Settings (name, gym, muscle group, equipment, default input, kg-per-plate, photo).

### Home gym (Grand Slam equipment)

| Muscle | Exercise | Equipment | Image source |
|---|---|---|---|
| Back | Iso Lat Pulldown (Unilateral) | Turbuster E916 (stack) | E916 |
| Back | Lat Pulldown | Turbuster E926 (stack) | E926 |
| Back | Back Row (Machine) | Turbuster E921 Mid Row (stack) | E921 |
| Back | Mid Row (on the lat-pulldown stack) | Turbuster E926 (cable) | E926 |
| Back | T-Bar Row | Turbuster FW760 (plate-loaded) | FW760 |
| Biceps | Hammer Curl (Dumbbell) | dumbbell | my photo / placeholder |
| Biceps | Preacher Curl (Cable, low pulley) | cable | my photo / placeholder |
| Chest | Seated Chest Press (Machine) | stack | my photo / placeholder |
| Chest | Incline Chest Press (Dumbbell) | dumbbell | my photo / placeholder |
| Chest | Pec Dec (Chest Fly) | PPD 803 (stack) | PPD803 |
| Chest | Cable Fly | cable | my photo / placeholder |
| Legs | Hip Adduction | SportsArt DF302 (stack) | DF302 |
| Legs | Hip Abduction | SportsArt DF302 (stack) | DF302 |
| Legs | Calf Raise | stack | my photo / placeholder |
| Legs | Leg Extension | stack | my photo / placeholder |
| Legs | Leg Press | stack | my photo / placeholder |
| Legs | Weighted Squat | barbell | my photo / placeholder |
| Shoulders | Shoulder Press (Machine) | stack | my photo / placeholder |
| Shoulders | Rear Delt Fly (Pec Dec) | PPD 803 (stack) | PPD803 |
| Shoulders | Lateral Raise (Machine) | stack | my photo / placeholder |
| Triceps | Triceps Pushdown | cable | my photo / placeholder |
| Triceps | Triceps Overhead Extension | cable | my photo / placeholder |

Note: the Pec Dec appears **twice** (chest day = Pec Dec, shoulder day = Rear Delt Fly) as two separate exercises on the same machine. DF302 likewise has Adduction and Abduction as two exercises (different weights).

### College gym

| Muscle | Exercises |
|---|---|
| Back | Lat Pulldown, Mid Row, Rowing |
| Biceps | Seated Bicep Curl, Hammer Curl |
| Chest | Flat Chest Press, Incline Chest Press, Cable Fly |
| Triceps | Triceps Pushdown, Triceps Overhead |
| Legs | Leg Press, Leg Extension, Weighted Squat, Calf Raise |
| Shoulders | Rear Delts, Lateral Raise, Shoulder Press |

### Cardio (everyday, both gyms)

Fields: **speed (km/h)**, **incline (%)**, **time (minutes)**. Machine defaults to "Treadmill" (free text allowed). Multiple cardio entries per day allowed. Derived: distance ≈ speed × minutes / 60.

---

## 6. Machine images

Goal: every exercise card shows a photo of the machine/exercise.

**Priority order for an exercise image:**
1. The six Grand Slam machines I linked (downloaded once to `public/machines/home/` by `scripts/fetch-machine-images.mjs`; **do not hotlink** at runtime — the host can change or block).
2. My own photos in `gym_pics/Home` and `gym_pics/College` (repo root). Inspect the folders, match files to exercises by filename or by looking at them, resize to ≤ 800px wide WebP (use `sharp` in a one-off script), and write them to `public/machines/{home|college}/<exercise-slug>.webp`. If a match is ambiguous, list the ambiguities and ask me once, in a single message.
3. A neutral placeholder: muscle-group icon on a `canvas-mint` tile. Never a broken image.

Update `exercises.image_path` accordingly (a small SQL/TS script or a Settings upload). Raw originals in `gym_pics/` are git-ignored; only optimized copies are committed. Keep the repo **private** (images belong to Grand Slam Fitness and are for personal use only).

| Machine | Product page | Image file (on `www.grandslamfitness.co.in/admin/upload/commercial_products/`) | Local file |
|---|---|---|---|
| E916 Iso Lat Pulldown | `/products/commercial-fitness/strength/pin-loaded-selectorized/e916-unilateral-lat-pull-down` | `latpull-down016.webp` | `e916-unilateral-lat-pulldown.webp` |
| E926 Lat Pulldown | `/products/commercial-fitness/strength/pin-loaded-selectorized/e926-lat-pull-down` | `lat-pull-down-02bbdzx.webp` | `e926-lat-pulldown.webp` |
| E921 Mid Row | `/products/commercial-fitness/strength/pin-loaded-selectorized/e921-mid-row` | `E921-Mid-Row921.webp` | `e921-mid-row.webp` |
| PPD 803 Pec Fly / Rear Delt | `/products/commercial-fitness/strength/pin-loaded-selectorized/-ppd-803-pec-fly-rear-deltoid` | `PPD803.webp` | `ppd803-pec-fly-rear-delt.webp` |
| FW760 T-Bar Row | `/products/commercial-fitness/strength/benches-and-racks/fw760-t-bar-row` | `T-Bar-row.webp` | `fw760-t-bar-row.webp` |
| DF302 Abductor/Adductor | `/products/commercial-fitness/strength/pin-loaded-selectorized/df-302-abductor-adductor` | `DF-302-Abductor-Adductor.webp` | `df302-abductor-adductor.webp` |

Use `next/image` with explicit `width`/`height` (or `fill` + `sizes`), `loading="lazy"` below the fold, `alt` = exercise name + machine model.

---

## 7. Data model (full SQL in `supabase/migrations/*_init.sql`)

```
exercises     id, user_id, gym('home'|'college'), slug, name, muscle_group, equipment,
              machine_model, default_input('kg'|'plates'), kg_per_plate, bar_kg,
              image_path, source_url, canonical_slug, sort_order, is_archived
              unique(user_id, gym, slug)

sessions      id, user_id, session_date (IST date), gym, planned_split, started_at, ended_at, notes
              unique(user_id, session_date)          -- one gym per day

sets          id, user_id, session_id → sessions, exercise_id → exercises,
              set_number, weight, weight_unit('kg'|'plates'), reps, is_warmup, created_at

cardio_logs   id, user_id, session_id → sessions, machine, duration_min, speed_kmh, incline_pct

body_weights  id, user_id, measured_on (IST date), weight_kg, note
              unique(user_id, measured_on)
```

Generate TS types with `supabase gen types typescript --linked > src/types/database.ts` and use them everywhere (no `any`).

---

## 8. Domain logic (all pure functions in `src/lib`, all unit-tested)

### 8.1 Weight entry: kg ↔ plates
Each set stores **what I typed** (`weight`, `weight_unit`). Per exercise I can toggle **kg | plates** in the set row; the choice is remembered in `exercises.default_input`.

Conversion to kg (for charts/PRs) in `src/lib/units.ts`:
- `kg` → as is.
- `plates` + stack/cable/plate_machine → `plates × kg_per_plate`
- `plates` + barbell → `bar_kg + 2 × plates × kg_per_plate` (**plates per side**)
- If `kg_per_plate` is null, the set cannot be converted: chart/PR in **plates** for that exercise and show a small "Set kg per plate" hint linking to exercise settings.
- Dumbbell weight = kg per dumbbell (one hand).

### 8.2 Estimated 1RM
Epley: `1RM = w × (1 + reps / 30)`. Exclude warm-up sets from every PR/volume/chart calculation.

### 8.3 PRs (Hevy-style)
Four metrics per exercise (per gym row):
1. **Heaviest Weight** — max weight on any working set.
2. **One Rep Max** — max estimated 1RM.
3. **Best Volume** — max single-set `weight × reps`.
4. **# of Reps** — chart shows total reps per session; PR = most reps in a single set.

A set is a PR for a metric if it is **strictly greater** than every earlier set (by `created_at`) for that exercise. Ties are not PRs. The first-ever session of an exercise sets a baseline and shows **no** PR badge. When a PR is logged: show an inline "PR" medal on the set row (mint circle, black "PR"), and list it in the finish-workout summary.

### 8.4 Body weight prompt (twice a month)
- Period A = day 1–15, Period B = day 16–end of month (IST). `periodKey = YYYY-MM-A|B`.
- **Due** = no `body_weights` row with `measured_on` in the current period.
- Show a prompt card on Today **whenever due** (not only on the 1st/16th). If the first day lands on a rest day or I skip the gym, the card simply appears the next time I open the app — and stays until logged or the period rolls over.
- On a day I'm actually training, the card is prominent (top of the screen, black pill "Log weight"). Otherwise it's a quieter mint banner.
- "Not now" snoozes for the rest of that day only (client-side).
- `/body` always has an **Add weight** button (any date, defaults to today) so a missed period can be backfilled.
- Constants live in `src/lib/weighin.ts` so the split (1–15 / 16–end) is easy to change.

### 8.5 Cardio
Per entry: minutes, speed, incline. Charts: weekly total minutes, average speed by week, and a table of recent entries.

### 8.6 One gym per day
- Gym tab selection is stored in a cookie (`gym=home|college`) so SSR renders the right tab. Default = gym of today's session if one exists, else the last used, else `home`.
- The session row is created on the **first logged set or cardio entry** (not on page view).
- If a session already exists today for the *other* gym, show a banner on the other tab: "You trained at Home today." with actions **Switch today to College** (updates `sessions.gym`; existing sets stay) and **Stay on Home**. Never create a second session.

---

## 9. Screens and information architecture

Mobile (< 768px): sticky top header (logo + gym switch pill) and a **bottom tab bar**: Today · Progress · Body · History. Desktop (≥ 768px): top nav per `DESIGN.md` (white bar, logo left, links centre, black pill "Start workout" right); content centred in a ~1200px container; Today and Progress use 2-column layouts.

The **Home | College switch** is a segmented pill at the top of every screen (not buried in settings).

### 9.1 Today `/`
1. Header with gym switch, date ("Mon, 22 Oct"), split name ("Back + Biceps") in Titillium Web.
2. Weigh-in due card (if due).
3. Muscle-group chips (today's pre-selected).
4. **Exercise grid**: cards with image, name, machine model, last performance ("Last: 3 sets · 45 kg × 12 · 3 days ago"), a mint check if logged today. Tap → `/log/[exerciseId]`. Search box above the grid to find any exercise in this gym.
5. **Cardio card** (always visible): quick add speed / incline / minutes.
6. Today's summary strip: sets, total volume, duration, PRs. Mint pill **Finish workout** (the one accent action on this screen).
7. Optional black band "Recent PRs" (horizontal scroll; no marquee under reduced motion).

### 9.2 Log exercise `/log/[exerciseId]`
- Hero: exercise image in a 40px feature card, name, machine, muscle group.
- "Previous" panel: last session's sets for this exercise, one tap to **copy** into today.
- **Set table**: `#`, weight input with **kg | plates** toggle, reps input, ✓ button. Add set (prefills from the previous set), delete set, warm-up flag. Totals: sets, total reps, volume.
- Live PR medal on the set row that beat a record.
- Optional rest timer (default 90 s) after ✓ — stretch goal.
- Large numeric keypad-friendly inputs (`inputmode="decimal"` / `"numeric"`).

### 9.3 Progress `/progress`
Mirror the Hevy "Analyze your workouts" screenshot:
- Exercise picker (searchable select, defaults to last trained).
- Chips: **Heaviest Weight · One Rep Max · Best Volume · # of Reps** (active chip = blue in Hevy → **black pill** here).
- Range: 1M · 3M · 6M · 1Y · All. Toggle: "Combine gyms" (by `canonical_slug`).
- Line chart: ink line, mint-filled dots, faint mint area wash, hairline grid, PR badge for the current best.
- **Records board**: current PR for each metric with the date it was set.
- A **Cardio** tab with its charts.

### 9.4 Body `/body`
Mirror the Hevy "Measurements" screenshot: line chart of body weight, History list (date + kg, edit/delete), **Add weight** button. Only body weight is required. Progress photos are a stretch goal (Supabase Storage).

### 9.5 History `/history` and `/history/[sessionId]`
Month-grouped list of sessions (date, gym badge, split, volume, duration, PR count) → detail view with every set and cardio entry, editable and deletable. Stretch: calendar heatmap.

### 9.6 Settings `/settings`
Manage exercises (add/edit/archive, kg-per-plate, bar weight, image), default gym, export CSV (stretch), sign out.

### 9.7 Login `/login`
Email + password (Supabase Auth). No sign-up link. Auth form card per `DESIGN.md` (`ex-auth-form-card`).

---

## 10. Design system (condensed — `DESIGN.md` is authoritative)

**Colors:** primary mint `#00f0a0` · ink `#000000` · canvas `#ffffff` · canvas-mint `#ecffe0` · surface-soft `#f2f4f5` · hairline `#e5e7eb` · muted `#86909c`.

**Type:** Titillium Web 700 for headings/stat numbers; Inter for everything else (body 16/500, small 14/500, caption 13/500, button 16/600). Do not set body in Titillium or headings in Inter. Fluid headings: display 80px → ~44px on mobile.

**Radii:** inputs/chips 12 · cards 16–24 · black CTA pill 28 · mint pill 36 · feature card 40 (one sharp corner) · avatars/rings full.

**Buttons:** primary = black pill, white label. The mint pill (black label, 1px black border) is the *one* accent action per screen (e.g., Finish workout, Save weigh-in). Utility = black 12px-radius square button.

**Surfaces:** white page; `canvas-mint` bands for hero/summary; black bands for emphasis (Recent PRs). Elevation = hairline or whisper-soft shadow; no heavy shadows, no gradients.

**App-specific adaptations (the design file is a marketing site):**
- Mint is for fills, dots, highlights, and the PR medal. **Never use mint as text on white** (fails contrast). Mint text only on black.
- `muted #86909c` fails AA for small text on white. Use `#5b6573` for body-size secondary text; keep `#86909c` for icons, disabled states, and ≥ 18px text.
- Inputs: 12px radius, 1px hairline border, 16px text, visible focus ring (2px ink with 2px mint offset).
- Chart colors: line = ink, dots = mint with ink stroke, area = canvas-mint, grid = hairline.
- Light theme only.
- Sentence case everywhere. Buttons say exactly what happens ("Log set", "Save weight", "Finish workout"), and toasts reuse the same verb ("Set logged").
- Empty states are invitations ("No sets yet. Add your first set").
- Don't use all-caps eyebrows, numbered markers on non-sequential content, or middle-dot meta strings.

**Responsive:** breakpoints per `DESIGN.md` (576 / 768 / 992 / 1200). Single column on mobile; exercise grid 2-up on phones, 3-up tablet, 4-up desktop. Verify at **390px** and **1280px** wide at minimum. No horizontal scroll on the page body; charts and tables scroll inside their own container.

---

## 11. Folder structure

```
gym_logger/
  CONTEXT.md  MASTER_PROMPT.md  DESIGN.md
  .env.local  (git-ignored)   .env.example
  gym_pics/                    (raw photos, git-ignored)
  public/machines/{home,college}/   (optimized WebP, committed)
  scripts/fetch-machine-images.mjs
  supabase/  config.toml  migrations/*_init.sql
  src/
    app/
      (auth)/login/page.tsx
      (app)/layout.tsx           header, gym switch, bottom tabs
      (app)/page.tsx             Today
      (app)/log/[exerciseId]/page.tsx
      (app)/progress/page.tsx
      (app)/body/page.tsx
      (app)/history/page.tsx  (app)/history/[sessionId]/page.tsx
      (app)/settings/page.tsx
      manifest.ts  layout.tsx  globals.css
    components/  ui/  today/  log/  charts/  body/
    lib/
      supabase/{client,server,middleware}.ts
      time.ts routine.ts units.ts prs.ts weighin.ts cardio.ts   (+ *.test.ts)
      actions/   (server actions)
    types/database.ts
```

---

## 12. Environment and deployment

`.env.example`
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # legacy projects: the anon key
```
Vercel: add the same two vars (Production + Preview). In Supabase → Auth → URL configuration, set **Site URL** to the Vercel domain and add `http://localhost:3000` as a redirect URL.

---

## 13. Assumptions (change here if wrong)

- "Total reps" = reps per set, with totals shown per exercise and per session.
- Default input is **kg**; plate-loaded and barbell exercises default to **plates**.
- `kg_per_plate`: DF302 = 5 kg (per manufacturer spec), plate-loaded = 10 kg (my guess), stack machines = **unset** until I set them in Settings.
- Barbell squat plates = plates **per side**, bar = 20 kg.
- Equipment types for the College gym and for unspecified Home exercises are best guesses and editable in Settings.
- Body-weight periods are 1–15 and 16–end of month.

## 14. Out of scope / stretch (only after everything above is done)

Rest timer · progress photos (Supabase Storage) · calendar heatmap · CSV export · offline queue for set logging · cross-gym combined PRs.

---

## 15. Definition of done

- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all pass.
- [ ] Unit tests cover: IST date/weekday (including 00:30 IST and 23:30 IST cases), routine mapping, kg/plates conversion, 1RM, PR detection (ties, first session, warm-ups), weigh-in due logic (day 1, day 15, day 16, month end).
- [ ] RLS verified: a request with the anon key returns no rows from any table.
- [ ] Usable one-handed on a 390px-wide phone; all flows work on 1280px desktop.
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95.
- [ ] Deployed on Vercel; PWA installable.
