# Gym Logger 🏋️‍♂️

A personal, single-user workout and body weight tracker engineered for mobile gym sessions (390px one-handed ergonomics) and desktop analytics (1280px+). Built with **Next.js 16 App Router**, **TypeScript**, **Tailwind CSS**, **Supabase** (`@supabase/ssr`), and **Recharts**, dressed in the Jobright aesthetic (spring-mint `#00f0a0`, ink black `#000000`, canvas-mint `#ecffe0`, and Titillium Web + Inter typography).

---

## ⚡ Core Features

- **IST-Anchored Scheduling (`Asia/Kolkata`)**: Calculates current calendar date and split strictly in Indian Standard Time (IST). Zero midnight shifts or UTC date slips.
- **Home & College Dual Gym Engine**: Cookie-backed segmented switch. Enforces the strict rule of **one gym per calendar day** with an intelligent switch banner if you train at the other location.
- **Hevy-Style Live Set Logging (`/log/[exerciseId]`)**:
  - Segmented **kg | plates** switch (remembers preference per exercise).
  - Barbell per-side math (`bar_kg + 2 × plates × kg_per_plate`) and machine stack conversion.
  - Epley formula Estimated 1RM (`weight × (1 + reps / 30)`).
  - Live **PR Medal** (`PR` mint circle badge) on working sets that strictly beat all-time bests.
  - Baseline session rule: first session sets baseline with no PRs awarded.
  - One-tap "Copy sets" from previous workouts and auto-prefill on "+ Add set".
  - Soundless 90-second rest timer with visual progress bar.
- **Cardio Tracking**: Log duration, speed (km/h), and incline (%) every day (including rest days). Automatic distance derivation.
- **Twice-Monthly Weigh-In Prompt (`/body`)**:
  - Automatically calculates Period A (1st–15th) and Period B (16th–end of month).
  - Prominent check-in card appears on Today whenever due. Snoozes for the day with "Not now".
  - Recharts progression curve with mint-filled data points and measurement history.
- **Workout Analysis & Records Board (`/progress`)**:
  - Hevy-style 4 metric chips: **Heaviest Weight**, **One Rep Max**, **Best Volume**, and **# of Reps**.
  - Range filter: 1M · 3M · 6M · 1Y · ALL.
  - "Combine gyms" toggle to merge performance records across Home and College.
  - Records board showing all-time bests and the date achieved.
  - Cardio volume charts and endurance logs.
- **Workout History (`/history` & `/history/[sessionId]`)**:
  - Month-by-month session archives with total volume, sets, and duration.
  - Detailed session drilldown with inline set editing and deletion.
- **Catalog Management (`/settings`)**:
  - Add custom exercises, machine models, plate weights, and bar weights.
  - Archive/unarchive exercises to keep the active routine clean.
  - Default gym selection and authenticated sign-out.
- **Progressive Web App (PWA)**:
  - Installable standalone app on iOS and Android via `manifest.ts` with spring-mint theme colors.

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js 18.18+ or 20+
- A Supabase project (free tier works great)

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/ayusht26/gym_logger.git
cd gym_logger
npm install
```

### 3. Configure Environment Variables
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

### 4. Database Setup & Migrations
1. Run the database migration script in your Supabase SQL editor from:
   `supabase/migrations/20261022000000_init.sql`
2. Seed your default exercise catalog with your user ID:
   ```sql
   select public.seed_default_exercises('<your-supabase-user-uuid>');
   ```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Quality & Test Suite

Run the complete pipeline (ESLint, TypeScript strict typecheck, and Vitest test suite):
```bash
npm run check
```

Or run individual commands:
```bash
npm run lint         # ESLint checks
npm run typecheck    # TypeScript compiler check
npm test             # Vitest test suite (47 unit tests)
npm run build        # Next.js production bundle build
```

---

## 🌐 Deploying to Vercel

1. Push your code to GitHub.
2. In Vercel, import your repository.
3. Add the two environment variables in **Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. In your **Supabase Dashboard → Authentication → URL Configuration**:
   - Set **Site URL** to your production Vercel domain (e.g. `https://your-app.vercel.app`).
   - Add `http://localhost:3000` to **Redirect URLs** for local development.
5. Deploy! Vercel will automatically build the Next.js App Router application with Turbopack.

---

## 📐 Architecture & Domain Rules

```
gym_logger/
  src/
    app/
      (auth)/login/page.tsx           # Jobright auth card
      (app)/layout.tsx                # App shell (Header, GymSwitch, BottomTabs)
      (app)/page.tsx                  # Today workout screen
      (app)/log/[exerciseId]/page.tsx # Exercise logging & PR engine
      (app)/progress/page.tsx         # Hevy-style progression charts
      (app)/body/page.tsx             # Body weight tracker
      (app)/history/page.tsx          # Month-grouped session archive
      (app)/history/[sessionId]/      # Set edit/delete detail view
      (app)/settings/page.tsx         # Catalog & gym configuration
      manifest.ts                     # PWA manifest
    components/
      layout/                         # Header, GymSwitch, BottomTabBar
      today/                          # ExerciseGrid, ExerciseCard, CardioCard, WeighInPrompt
      log/                            # SetTable, LogHero, PreviousSetsPanel, RestTimer
      progress/                       # ProgressView, RecordsBoard, CardioCharts
      body/                           # BodyWeightChart, AddWeightModal, BodyWeightHistory
      settings/                       # SettingsView, CatalogModals
    lib/
      time.ts                         # Pure IST (Asia/Kolkata) date/time functions
      routine.ts                      # Weekday-to-split routine mapping
      units.ts                        # kg <-> plates conversion
      prs.ts                          # Epley 1RM and PR detection engine
      weighin.ts                      # Twice-monthly period due engine
      actions/                        # Server actions with cache revalidation
      data/                           # Server-side data fetchers
      supabase/                       # Browser, server, and middleware clients
```

---

## 🔒 Security & Privacy

- **Row Level Security (RLS)** is strictly enabled across all tables (`exercises`, `sessions`, `sets`, `cardio_logs`, `body_weights`).
- No anonymous or public reads; users can only access rows matching their authenticated `user_id`.
- No service-role key is exposed in client or server code.

---

## 📄 License
Personal use only. Machine images belong to Grand Slam Fitness and are used strictly for personal tracking.
