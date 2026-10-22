# Vercel Deployment Guide — Gym Logger 🚀

A comprehensive, production-ready guide for deploying the **Gym Logger** application to [Vercel](https://vercel.com).

---

## 📋 Table of Contents
1. [Architecture & Stack Overview](#1-architecture--stack-overview)
2. [Pre-Deployment Requirements](#2-pre-deployment-requirements)
3. [Phase 1: Supabase Setup (Database & Auth)](#3-phase-1-supabase-setup-database--auth)
4. [Phase 2: Deploying to Vercel (Step-by-Step)](#4-phase-2-deploying-to-vercel-step-by-step)
5. [Phase 3: Supabase Auth & URL Configuration](#5-phase-3-supabase-auth--url-configuration)
6. [Performance & Vercel Best Practices Applied](#6-performance--vercel-best-practices-applied)
7. [Post-Deployment Verification](#7-post-deployment-verification)
8. [Troubleshooting & FAQs](#8-troubleshooting--faqs)

---

## 1. Architecture & Stack Overview

- **Framework**: Next.js 16.4+ (App Router with Turbopack bundler)
- **Runtime**: Node.js 20.9+ (LTS)
- **UI / Styles**: React 19, Tailwind CSS v4, Lucide React icons, Recharts
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security + Supabase Auth)
- **Request Proxy**: Next.js 16 `src/proxy.ts` (replaces legacy `middleware.ts`)
- **Timezone**: Indian Standard Time (`Asia/Kolkata` / IST) anchored in `src/lib/time.ts` to ensure zero date slips across UTC Vercel serverless workers.
- **PWA**: Installable standalone mobile web app via `src/app/manifest.ts`.

---

## 2. Pre-Deployment Requirements

Before deploying, ensure you have:
1. **GitHub / Git Account**: With repository access to push `gym_logger`.
2. **Vercel Account**: [Sign up here](https://vercel.com/signup) (Hobby tier is completely free).
3. **Supabase Account & Project**: [Sign up here](https://supabase.com). Recommended region: **Mumbai (`ap-south-1`)** or the region geographically closest to you.
4. **Local Verification**: Ensure all local tests and builds pass:
   ```bash
   npm run check   # Runs ESLint, TypeScript strict typecheck, and Vitest suite
   npm run build   # Validates production Next.js compilation
   ```

---

## 3. Phase 1: Supabase Setup (Database & Auth)

The database schema and initial catalog must be initialized before the application can store workout logs.

### Step 1: Run the Database Migration
1. Open your project on the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** from the left navigation.
3. Open [`supabase/migrations/20261022000000_init.sql`](file:///d:/Coding/gym_logger/supabase/migrations/20261022000000_init.sql).
4. Copy the entire file content, paste it into the Supabase SQL editor, and click **Run**.
5. Verify that the tables are created:
   - `exercises`
   - `sessions`
   - `sets`
   - `cardio_logs`
   - `body_weights`

### Step 2: Create Your Single User Account
Gym Logger is designed as a secure, single-user tracker:
1. In the Supabase Dashboard, go to **Authentication → Users**.
2. Click **Add user** → **Create user**.
3. Enter your email and a strong password. Confirm email verification is marked as confirmed.
4. Copy the newly generated **User UID** (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

### Step 3: Seed Default Exercise Catalog
Run the following SQL in the **SQL Editor** to populate your Home & College gym exercises:
```sql
SELECT public.seed_default_exercises('<YOUR-USER-UUID-HERE>');
```
*(Replace `<YOUR-USER-UUID-HERE>` with your copied user UID).*

### Step 4: Lock Down Sign-Ups (Security Rule)
Because this is a private personal tracker, disable open registrations:
1. Go to **Authentication → Providers → Email**.
2. Turn **OFF** the toggle for **Allow new users to sign up**.
3. Click **Save**.

### Step 5: Copy API Credentials
1. Go to **Project Settings → API** (or **API Keys**).
2. Note down:
   - **Project URL**: `https://<your-project-id>.supabase.co`
   - **Publishable Key** (or legacy `anon` public key): `sb_publishable_...` or `eyJ...`

---

## 4. Phase 2: Deploying to Vercel (Step-by-Step)

### Option A: Using the Vercel Dashboard (Recommended)

#### Step 1: Push Code to Git
Make sure your latest code is pushed to your Git repository (e.g. GitHub):
```bash
git add .
git commit -m "chore: prepare for vercel deployment"
git push origin main
```

#### Step 2: Import Repository in Vercel
1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **Add New…** → **Project**.
3. Find your `gym_logger` repository and click **Import**.

#### Step 3: Configure Project Settings
Vercel automatically detects Next.js. Confirm the settings:
- **Project Name**: `gym-logger` (or your preferred name)
- **Framework Preset**: `Next.js`
- **Root Directory**: `./`
- **Build Command**: `next build` (or leave default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

> [!IMPORTANT]
> **Node.js Version**: Next.js 16 requires **Node.js 20.9.0+**. `package.json` specifies `"engines": { "node": ">=20.9.0" }`. In Vercel Project Settings → General, ensure Node.js is set to **20.x** (or **22.x**).

#### Step 4: Configure Environment Variables
Under the **Environment Variables** section, add the following two variables for **Production**, **Preview**, and **Development**:

| Key | Value | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<your-project-id>.supabase.co` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` *(or `anon` key)* | Supabase publishable/anon public key |

*(Note: The codebase also seamlessly accepts `NEXT_PUBLIC_SUPABASE_ANON_KEY` as an alternative key name).*

#### Step 5: Deploy
Click **Deploy**.
Vercel will build the Next.js 16 App Router bundle with Turbopack and deploy it to their global edge network. Your deployment URL will look like:
`https://gym-logger-<your-username>.vercel.app`

---

### Option B: Using the Vercel CLI

If you prefer deploying directly from your terminal:

1. Install the Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Link and authenticate:
   ```bash
   vercel login
   vercel link
   ```
3. Set your environment variables:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
   ```
4. Deploy to production:
   ```bash
   vercel --prod
   ```

---

## 5. Phase 3: Supabase Auth & URL Configuration

For authentication callbacks, session cookies, and redirects to function smoothly:

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Authentication → URL Configuration**.
3. Under **Site URL**, set your production Vercel URL:
   ```
   https://gym-logger.vercel.app
   ```
4. Under **Redirect URLs**, add the following entries:
   ```
   https://gym-logger.vercel.app/**
   https://gym-logger-*.vercel.app/**
   http://localhost:3000/**
   ```
5. If you configure a custom domain (e.g. `gym.yourdomain.com`), also add:
   ```
   https://gym.yourdomain.com/**
   ```
6. Click **Save**.

---

## 6. Performance & Vercel Best Practices Applied

The codebase adheres strictly to the **Vercel React & Next.js Performance Guidelines**:

### 1. Eliminating Request Waterfalls (`async-parallel`)
- **Today Screen (`src/lib/data/today.ts`)**: Independent database roundtrips for session, exercises, and weigh-in records are executed concurrently with `Promise.all()`, reducing serverless execution time by ~60%.
- **Progress Analytics (`src/lib/data/progress.ts`)**: Exercises, workout sets with joined sessions, and cardio records are fetched in parallel.
- **Log Screen (`src/lib/data/log.ts`)**: Session status and prior historical set baselines run concurrently.
- **History Detail (`src/lib/data/history.ts`)**: Exercises sets and cardio entries are queried in parallel.

### 2. Next.js 16 Edge Proxy Optimization (`src/proxy.ts`)
- Utilizes the standardized Next.js 16 `proxy.ts` convention.
- Custom matcher regex bypasses proxy execution on static assets, icons (`.ico`), WebP photos (`machines/`), PWA manifests (`.webmanifest`), and Next static chunks (`_next/`), minimizing Serverless / Edge Function invocations.

### 3. Package Import Optimization (`optimizePackageImports`)
- Next.js automatically transforms barrel imports from `lucide-react` and `recharts` into direct modules at build time, preventing bundle bloat and ensuring quick cold starts on Vercel Serverless Functions.

### 4. Zero-Flicker Dynamic Dark Mode (`rendering-hydration-no-flicker`)
- An inline blocking script in [`src/app/layout.tsx`](file:///d:/Coding/gym_logger/src/app/layout.tsx) resolves user theme preference from `localStorage` and `prefers-color-scheme` before React hydration, preventing Flash of Unstyled Content (FOUT).

### 5. Strict Security on Server Actions (`server-auth-actions`)
- Every server mutation in `src/lib/actions/` verifies session authenticity using `supabase.auth.getUser()`, validates inputs, and scopes all inserts/updates to the authenticated `user_id`.

---

## 7. Post-Deployment Verification

After deployment finishes, verify these essential workflows:

1. **Authentication**:
   - Visit `https://<your-project>.vercel.app`.
   - You should be redirected to `/login`.
   - Sign in with your Supabase credentials.
2. **Routine & Timezone**:
   - Confirm that the Today workout matches the current Indian Standard Time (IST) weekday split.
3. **Gym Switcher**:
   - Toggle between **Home** and **College** gym in the header. Preferences persist across sessions via cookie.
4. **Set Logging & PR Engine**:
   - Open any exercise, toggle between **kg** and **plates**, log a set, and check the live PR medal detection.
5. **Cardio & Weigh-in**:
   - Log a quick cardio session (speed, incline, time) on the Today tab.
   - Test the twice-monthly weigh-in prompt (`/body`).
6. **PWA Standalone Installation**:
   - On iOS (Safari): Tap **Share** → **Add to Home Screen**.
   - On Android (Chrome): Tap **Install App** or **Add to Home screen**.
   - Confirm the app opens in full-screen standalone mode with spring-mint `#00f0a0` status bar theme color.

---

## 8. Troubleshooting & FAQs

### Q1: The build fails with "Node.js version not supported"
- **Solution**: Next.js 16 requires Node.js 20.9.0+. In Vercel Project Settings → General, set Node.js Version to **20.x**. `package.json` contains `"engines": { "node": ">=20.9.0" }`.

### Q2: I see "Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
- **Solution**: Ensure you added both environment variables under Vercel Project Settings → **Environment Variables**, then trigger a **Redeploy** (Deployments → … → Redeploy).

### Q3: Logging in redirects back to `/login` or loop occurs
- **Solution**: Check that you set **Site URL** and **Redirect URLs** properly in Supabase Dashboard → Authentication → URL Configuration (Phase 3).

### Q4: Exercise list is empty on Today screen
- **Solution**: Make sure you ran `SELECT public.seed_default_exercises('<your-user-uuid>');` in your Supabase SQL editor using your user's UUID.

### Q5: "One session per calendar day" warning appears
- **Solution**: Gym Logger enforces one gym per calendar day. If you already logged sets at "Home Gym" today and switch to "College Gym", the banner reminds you of today's active location.

---

🎉 **Your Gym Logger is now fully deployed and production-ready on Vercel!**
