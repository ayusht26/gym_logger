# MASTER PROMPT — paste this into your coding agent

---

You are a senior full-stack engineer and product designer building **Gym Logger**, a personal, single-user workout tracker for me. I'll deploy it on Vercel with Supabase as the database.

## 0. Read before you write

1. Read `CONTEXT.md` end to end. It is the source of truth for scope, data model, domain rules, screens, and acceptance criteria.
2. Read `DESIGN.md`. This is the visual language I want (spring-mint `#00f0a0`, black, white; Titillium Web + Inter; pill buttons; rounded feature cards). `CONTEXT.md` §10 lists the app-specific adaptations and accessibility deviations; follow those where they differ from `DESIGN.md`.
3. Read the installed skills in `.agents/skills/` and use them:
   - `frontend-design` and `design-mobile-apps` for layout, hierarchy and touch ergonomics. The visual direction is already fixed by `DESIGN.md`, so use these skills for craft, not to pick a different look.
   - `vercel-react-best-practices` while writing components and data fetching.
   - `web-design-guidelines` as a review pass at the end of each UI phase.
   - `agent-browser` to open the running app and check it at **390px** and **1280px** widths.
   - `improve-codebase-architecture` once, after phase 3, to review structure.
4. Look at `supabase/migrations/` (the schema already exists), `scripts/fetch-machine-images.mjs`, `public/machines/`, and `gym_pics/` so you know what's available.

## 1. The product in one paragraph

I train one gym a day, either **Home** or **College**. When I open the app I pick the gym tab, and the app works out today's workout from the weekday in **Indian time (IST)**. I tap an exercise, enter weight (**kg or number of plates**, switchable) and reps for each set, and the app flags PRs. It also logs **cardio** (speed, incline, minutes) every day, charts my progress over weeks and months, and asks for **body weight twice a month**. It must be excellent on a phone in a gym and comfortable on a PC. Think Hevy, stripped to the essentials, wearing the Jobright design language.

## 2. Hard constraints

- Stack: Next.js App Router + TypeScript strict + Tailwind + Supabase (`@supabase/ssr`) + Recharts + lucide-react. No other backend, no external DB, no ORM.
- Timezone: every "today", weekday, and period calculation goes through `src/lib/time.ts` using `Asia/Kolkata`. Never call `getDay()` or `toISOString().slice(0, 10)` for "today".
- Security: RLS on all tables (already in the migration), no service-role key in app code, no `NEXT_PUBLIC_` secret other than URL + publishable key, sign-ups disabled, login page only.
- One session per day, one gym per session (DB-enforced). Never create a second session for a day.
- Do not build: social features, AI coaching, multi-user, subscriptions.
- Don't invent data. Don't leave TODOs, lorem ipsum, or dead buttons. Every control on screen must work.
- Images: never hotlink Grand Slam Fitness at runtime. Use local files in `public/machines/`.

## 3. How to work

- Work in the phases below. **Finish and verify a phase before starting the next. Commit after each phase** with a clear message.
- At the start of each phase, state in 3–5 lines what you're about to build and any assumption you're making. Don't ask me questions unless something blocks you. When something is ambiguous, pick the more conservative option, record it under "Assumptions" in `CONTEXT.md`, and move on. If you must ask, ask **once**, in one message, with a recommended default for each question.
- Put domain logic in pure, typed functions in `src/lib/*` with Vitest tests. UI components stay thin.
- After each phase run `npm run lint && npm run typecheck && npm test`, and for UI phases check the app in the browser at 390px and 1280px and fix what you see.
- Keep dependencies minimal. Justify any new package in one line in the commit message.

## 4. Phases

### Phase 1 — Foundation
- Tailwind theme tokens from `DESIGN.md` (colors, radii, spacing, type scale). `next/font` for Titillium Web + Inter. `globals.css` with focus ring, reduced-motion, safe-area insets.
- Supabase clients (`browser`, `server`, `middleware/proxy`), session refresh, route protection, `/login` page (email + password), sign-out.
- App shell: sticky header with logo and **Home | College** pill switch (cookie-backed), mobile bottom tab bar (Today · Progress · Body · History), desktop top nav with black pill "Start workout".
- `src/lib/time.ts` and `src/lib/routine.ts` with tests (include 23:30 IST and 00:30 IST cases).
- Generate `src/types/database.ts`. Add `.env.example`, `.gitignore` entries (`.env*.local`, `gym_pics/`).
- **Done when:** I can log in, switch gyms, see the shell on phone and desktop widths, and the tests pass.

### Phase 2 — Today screen
- Header with date and today's split. Muscle-group chips pre-selected from the routine with manual override.
- Exercise grid for the selected gym and chips: image (fallback tile if missing), name, machine model, "Last: …" summary, mint check if logged today. Search box.
- Cardio card visible every day (also Sunday). Rest-day state with "Train anyway".
- One-gym-per-day banner and "Switch today to …" action.
- **Done when:** the right exercises appear for each weekday (verify by faking the date in tests), images load from `public/machines/`, and nothing shifts at midnight IST.

### Phase 3 — Logging
- `/log/[exerciseId]`: previous-session panel with "Copy sets", set table with **kg | plates** toggle (remembers choice per exercise), reps, warm-up flag, add/delete set, totals, optimistic updates via server actions.
- Session is created lazily on the first set or cardio entry.
- `src/lib/units.ts` and `src/lib/prs.ts` with tests (ties are not PRs, first session is a baseline, warm-ups excluded, plates → kg conversion incl. barbell per-side logic).
- Live PR medal on the set row; **Finish workout** summary (duration, volume, sets, PR list) using the mint pill.
- Cardio entry form (speed, incline, minutes) and list.
- **Done when:** I can log a whole back day on a 390px screen with one thumb in under a minute, and PRs appear correctly.

### Phase 4 — Progress and body weight
- `/progress`: exercise picker, metric chips (Heaviest Weight · One Rep Max · Best Volume · # of Reps), range selector, combine-gyms toggle, Recharts line chart styled per `CONTEXT.md` §10, records board, cardio charts.
- `/body`: weight line chart, history list with edit/delete, "Add weight" (any date).
- `src/lib/weighin.ts` with tests (day 1, day 15, day 16, month end, leap Feb). Weigh-in prompt card on Today per `CONTEXT.md` §8.4.
- **Done when:** charts render with real logged data, empty states invite action, and the weigh-in prompt appears/disappears correctly.

### Phase 5 — History, settings, polish, ship
- `/history` and `/history/[sessionId]` (edit/delete sets and cardio).
- `/settings`: add/edit/archive exercises, kg-per-plate and bar weight, image, default gym, sign out.
- PWA: `manifest.ts`, icons, theme color, installable on Android/iOS.
- Run `improve-codebase-architecture` and `web-design-guidelines`; fix findings. Accessibility pass (labels, focus order, contrast per §10, 44px targets). Lighthouse mobile targets in `CONTEXT.md` §15.
- Write `README.md`: local setup, env vars, how to run migrations, how to deploy to Vercel.
- **Done when:** the Definition of Done in `CONTEXT.md` §15 is fully checked.

## 5. Quality bar

- It should feel like a real product, not a template. Real copy ("Log set", "Finish workout", "No sets yet. Add your first set"), sentence case, verbs that match across buttons and toasts.
- Fast: server-render the first paint, avoid client-side waterfalls, lazy-load charts, keep the client bundle small.
- Resilient: loading skeletons, inline errors that say what failed and how to fix it, no lost input if a save fails (keep the row editable and retry).
- Accessible: semantic HTML, labelled inputs, visible focus, `prefers-reduced-motion`, contrast per `CONTEXT.md` §10.

## 6. What to send me at the end of each phase

1. A short list of what was built and the commit hash.
2. Anything I need to do by hand (Supabase dashboard, Vercel env vars, files to add).
3. Assumptions you made.
4. Screenshots at 390px and 1280px if your tooling can take them.

Begin with Phase 1.
