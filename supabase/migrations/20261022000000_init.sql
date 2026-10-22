-- Gym Logger: initial schema
-- All dates are Indian Standard Time (Asia/Kolkata). One session per day, one gym per session.

-- ───────────────────────── Tables ─────────────────────────

create table public.exercises (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  gym            text not null check (gym in ('home', 'college')),
  slug           text not null,
  name           text not null,
  muscle_group   text not null check (muscle_group in ('back', 'biceps', 'chest', 'triceps', 'legs', 'shoulders')),
  equipment      text not null check (equipment in ('stack_machine', 'plate_machine', 'cable', 'dumbbell', 'barbell', 'bodyweight')),
  machine_model  text,
  default_input  text not null default 'kg' check (default_input in ('kg', 'plates')),
  kg_per_plate   numeric(5, 2) check (kg_per_plate is null or kg_per_plate > 0),
  bar_kg         numeric(5, 2) check (bar_kg is null or bar_kg >= 0),
  image_path     text,
  source_url     text,
  canonical_slug text not null,
  sort_order     int not null default 0,
  is_archived    boolean not null default false,
  created_at     timestamptz not null default now(),
  unique (user_id, gym, slug)
);

create table public.sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_date  date not null default ((now() at time zone 'Asia/Kolkata')::date),
  gym           text not null check (gym in ('home', 'college')),
  planned_split text not null default 'custom'
                check (planned_split in ('back_biceps', 'chest_triceps', 'legs_shoulders', 'rest', 'custom')),
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  notes         text,
  unique (user_id, session_date)
);

create table public.sets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id  uuid not null references public.sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  set_number  int not null check (set_number > 0),
  weight      numeric(7, 2) not null check (weight >= 0),
  weight_unit text not null check (weight_unit in ('kg', 'plates')),
  reps        int not null check (reps > 0),
  is_warmup   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table public.cardio_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id   uuid not null references public.sessions (id) on delete cascade,
  machine      text not null default 'treadmill',
  duration_min numeric(5, 1) not null check (duration_min > 0),
  speed_kmh    numeric(4, 1) not null check (speed_kmh >= 0),
  incline_pct  numeric(4, 1) not null default 0 check (incline_pct >= 0),
  created_at   timestamptz not null default now()
);

create table public.body_weights (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  measured_on date not null default ((now() at time zone 'Asia/Kolkata')::date),
  weight_kg   numeric(5, 1) not null check (weight_kg > 20 and weight_kg < 400),
  note        text,
  created_at  timestamptz not null default now(),
  unique (user_id, measured_on)
);

-- ───────────────────────── Indexes ─────────────────────────

create index exercises_user_gym_idx   on public.exercises (user_id, gym, muscle_group, sort_order);
create index sessions_user_date_idx   on public.sessions (user_id, session_date desc);
create index sets_user_exercise_idx   on public.sets (user_id, exercise_id, created_at desc);
create index sets_session_idx         on public.sets (session_id);
create index cardio_session_idx       on public.cardio_logs (session_id);
create index body_weights_user_idx    on public.body_weights (user_id, measured_on desc);

-- ───────────────────── RLS + grants (owner only) ─────────────────────
-- Explicit grants make this work whether or not "Automatically expose new tables" is on.

do $$
declare
  t text;
begin
  foreach t in array array['exercises', 'sessions', 'sets', 'cardio_logs', 'body_weights'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "%1$s_owner_all" on public.%1$I for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- ───────────────────── Seed: default exercise catalog ─────────────────────
-- Run once after creating your user (Auth → Users → copy the UUID), in the SQL editor:
--   select public.seed_default_exercises('<your-user-uuid>');
-- Safe to re-run; existing rows are left untouched.
-- Image paths point to files in /public/machines (see scripts/fetch-machine-images.mjs).
-- Columns: gym, slug, name, muscle_group, equipment, machine_model, default_input,
--          kg_per_plate, bar_kg, image_path, source_url, canonical_slug, sort_order

create or replace function public.seed_default_exercises(p_user uuid)
returns int
language plpgsql
set search_path = public
as $$
declare
  n int;
  gs constant text := 'https://grandslamfitness.co.in/products/commercial-fitness/strength/';
begin
  insert into public.exercises
    (user_id, gym, slug, name, muscle_group, equipment, machine_model, default_input,
     kg_per_plate, bar_kg, image_path, source_url, canonical_slug, sort_order)
  values
    -- ── HOME · back
    (p_user, 'home', 'iso-lat-pulldown',  'Iso Lat Pulldown (Unilateral)', 'back', 'stack_machine', 'Turbuster E916', 'kg', null, null,
       '/machines/home/e916-unilateral-lat-pulldown.webp', gs || 'pin-loaded-selectorized/e916-unilateral-lat-pull-down', 'iso-lat-pulldown', 10),
    (p_user, 'home', 'lat-pulldown',      'Lat Pulldown', 'back', 'stack_machine', 'Turbuster E926', 'kg', null, null,
       '/machines/home/e926-lat-pulldown.webp', gs || 'pin-loaded-selectorized/e926-lat-pull-down', 'lat-pulldown', 20),
    (p_user, 'home', 'back-row-machine',  'Back Row (Machine)', 'back', 'stack_machine', 'Turbuster E921 Mid Row', 'kg', null, null,
       '/machines/home/e921-mid-row.webp', gs || 'pin-loaded-selectorized/e921-mid-row', 'back-row-machine', 30),
    (p_user, 'home', 'mid-row',           'Mid Row (Lat Pulldown Stack)', 'back', 'cable', 'Turbuster E926', 'kg', null, null,
       '/machines/home/e926-lat-pulldown.webp', gs || 'pin-loaded-selectorized/e926-lat-pull-down', 'mid-row', 40),
    (p_user, 'home', 't-bar-row',         'T-Bar Row', 'back', 'plate_machine', 'Turbuster FW760', 'plates', 10, null,
       '/machines/home/fw760-t-bar-row.webp', gs || 'benches-and-racks/fw760-t-bar-row', 't-bar-row', 50),
    -- ── HOME · biceps
    (p_user, 'home', 'hammer-curl',       'Hammer Curl (Dumbbell)', 'biceps', 'dumbbell', null, 'kg', null, null, null, null, 'hammer-curl', 10),
    (p_user, 'home', 'preacher-curl-cable','Preacher Curl (Cable, low pulley)', 'biceps', 'cable', null, 'kg', null, null, null, null, 'preacher-curl-cable', 20),
    -- ── HOME · chest
    (p_user, 'home', 'seated-chest-press','Seated Chest Press (Machine)', 'chest', 'stack_machine', null, 'kg', null, null, null, null, 'chest-press', 10),
    (p_user, 'home', 'incline-db-press',  'Incline Chest Press (Dumbbell)', 'chest', 'dumbbell', null, 'kg', null, null, null, null, 'incline-db-press', 20),
    (p_user, 'home', 'pec-dec',           'Pec Dec (Chest Fly)', 'chest', 'stack_machine', 'PPD 803', 'kg', null, null,
       '/machines/home/ppd803-pec-fly-rear-delt.webp', gs || 'pin-loaded-selectorized/-ppd-803-pec-fly-rear-deltoid', 'pec-dec', 30),
    (p_user, 'home', 'cable-fly',         'Cable Fly', 'chest', 'cable', null, 'kg', null, null, null, null, 'cable-fly', 40),
    -- ── HOME · legs
    (p_user, 'home', 'hip-adduction',     'Hip Adduction', 'legs', 'stack_machine', 'SportsArt DF302', 'kg', 5, null,
       '/machines/home/df302-abductor-adductor.webp', gs || 'pin-loaded-selectorized/df-302-abductor-adductor', 'hip-adduction', 10),
    (p_user, 'home', 'hip-abduction',     'Hip Abduction', 'legs', 'stack_machine', 'SportsArt DF302', 'kg', 5, null,
       '/machines/home/df302-abductor-adductor.webp', gs || 'pin-loaded-selectorized/df-302-abductor-adductor', 'hip-abduction', 20),
    (p_user, 'home', 'calf-raise',        'Calf Raise', 'legs', 'stack_machine', null, 'kg', null, null, null, null, 'calf-raise', 30),
    (p_user, 'home', 'leg-extension',     'Leg Extension', 'legs', 'stack_machine', null, 'kg', null, null, null, null, 'leg-extension', 40),
    (p_user, 'home', 'leg-press',         'Leg Press', 'legs', 'stack_machine', null, 'kg', null, null, null, null, 'leg-press', 50),
    (p_user, 'home', 'weighted-squat',    'Weighted Squat', 'legs', 'barbell', null, 'plates', 10, 20, null, null, 'weighted-squat', 60),
    -- ── HOME · shoulders
    (p_user, 'home', 'shoulder-press-machine', 'Shoulder Press (Machine)', 'shoulders', 'stack_machine', null, 'kg', null, null, null, null, 'shoulder-press', 10),
    (p_user, 'home', 'rear-delt-pec-dec', 'Rear Delt Fly (Pec Dec)', 'shoulders', 'stack_machine', 'PPD 803', 'kg', null, null,
       '/machines/home/ppd803-pec-fly-rear-delt.webp', gs || 'pin-loaded-selectorized/-ppd-803-pec-fly-rear-deltoid', 'rear-delt-fly', 20),
    (p_user, 'home', 'lateral-raise-machine', 'Lateral Raise (Machine)', 'shoulders', 'stack_machine', null, 'kg', null, null, null, null, 'lateral-raise', 30),
    -- ── HOME · triceps
    (p_user, 'home', 'tricep-pushdown',   'Triceps Pushdown', 'triceps', 'cable', null, 'kg', null, null, null, null, 'tricep-pushdown', 10),
    (p_user, 'home', 'tricep-overhead',   'Triceps Overhead Extension', 'triceps', 'cable', null, 'kg', null, null, null, null, 'tricep-overhead', 20),

    -- ── COLLEGE · back
    (p_user, 'college', 'lat-pulldown',   'Lat Pulldown', 'back', 'stack_machine', null, 'kg', null, null, null, null, 'lat-pulldown', 10),
    (p_user, 'college', 'mid-row',        'Mid Row', 'back', 'stack_machine', null, 'kg', null, null, null, null, 'mid-row', 20),
    (p_user, 'college', 'rowing',         'Rowing', 'back', 'stack_machine', null, 'kg', null, null, null, null, 'seated-row', 30),
    -- ── COLLEGE · biceps
    (p_user, 'college', 'seated-bicep-curl', 'Seated Bicep Curl', 'biceps', 'stack_machine', null, 'kg', null, null, null, null, 'seated-bicep-curl', 10),
    (p_user, 'college', 'hammer-curl',    'Hammer Curl', 'biceps', 'dumbbell', null, 'kg', null, null, null, null, 'hammer-curl', 20),
    -- ── COLLEGE · chest
    (p_user, 'college', 'flat-chest-press',   'Flat Chest Press', 'chest', 'stack_machine', null, 'kg', null, null, null, null, 'chest-press', 10),
    (p_user, 'college', 'incline-chest-press','Incline Chest Press', 'chest', 'stack_machine', null, 'kg', null, null, null, null, 'incline-chest-press', 20),
    (p_user, 'college', 'cable-fly',      'Cable Fly', 'chest', 'cable', null, 'kg', null, null, null, null, 'cable-fly', 30),
    -- ── COLLEGE · triceps
    (p_user, 'college', 'tricep-pushdown','Triceps Pushdown', 'triceps', 'cable', null, 'kg', null, null, null, null, 'tricep-pushdown', 10),
    (p_user, 'college', 'tricep-overhead','Triceps Overhead', 'triceps', 'cable', null, 'kg', null, null, null, null, 'tricep-overhead', 20),
    -- ── COLLEGE · legs
    (p_user, 'college', 'leg-press',      'Leg Press', 'legs', 'stack_machine', null, 'kg', null, null, null, null, 'leg-press', 10),
    (p_user, 'college', 'leg-extension',  'Leg Extension', 'legs', 'stack_machine', null, 'kg', null, null, null, null, 'leg-extension', 20),
    (p_user, 'college', 'weighted-squat', 'Weighted Squat', 'legs', 'barbell', null, 'plates', 10, 20, null, null, 'weighted-squat', 30),
    (p_user, 'college', 'calf-raise',     'Calf Raise', 'legs', 'stack_machine', null, 'kg', null, null, null, null, 'calf-raise', 40),
    -- ── COLLEGE · shoulders
    (p_user, 'college', 'rear-delts',     'Rear Delts', 'shoulders', 'stack_machine', null, 'kg', null, null, null, null, 'rear-delt-fly', 10),
    (p_user, 'college', 'lateral-raise',  'Lateral Raise', 'shoulders', 'stack_machine', null, 'kg', null, null, null, null, 'lateral-raise', 20),
    (p_user, 'college', 'shoulder-press', 'Shoulder Press', 'shoulders', 'stack_machine', null, 'kg', null, null, null, null, 'shoulder-press', 30)
  on conflict (user_id, gym, slug) do nothing;

  get diagnostics n = row_count;
  return n;
end;
$$;

-- The seed function is for the SQL editor only; never callable through the Data API.
revoke all on function public.seed_default_exercises(uuid) from public, anon, authenticated;
