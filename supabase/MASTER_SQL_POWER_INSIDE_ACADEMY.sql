-- ============================================================================
--  MASTER SQL — POWER INSIDE DATA ACADEMY
--  Schéma de production complet pour Supabase (PostgreSQL 15+)
--
--  Contenu :
--    Module  0 : Extensions & fonctions utilitaires
--    Module  1 : LMS (formations, modules, leçons, sessions, inscriptions)
--    Module  2 : Quizzes (quiz, questions, tentatives, scoring auto)
--    Module  3 : Certificats (templates, émission auto, vérification publique)
--    Module  4 : Paiements (Stripe, Orange Money, MTN MoMo + extensible)
--    Module  5 : Analytics (learning_analytics, analytics_daily)
--    Module  6 : Administration (rôles, permissions)
--    Module  7 : Audit (audit_logs + triggers)
--    Module  8 : Storage (buckets + policies)
--    Module  9 : Sécurité (RLS complet)
--    Module 10 : Automatisations (fonctions + triggers)
--    Module 11 : Performance (indexes, vues, vues matérialisées)
--
--  Exécutable directement dans Supabase SQL Editor.
--  Idempotent : ré-exécutable sans erreur (IF NOT EXISTS / OR REPLACE / DROP IF EXISTS).
-- ============================================================================


-- ============================================================================
--  MODULE 0 — EXTENSIONS & FONCTIONS UTILITAIRES
-- ============================================================================

-- Les fonctions helpers référencent des tables créées plus loin dans ce script :
-- on désactive la validation des corps de fonctions pendant l'installation.
set check_function_bodies = off;

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";        -- recherche full-text trigram
create extension if not exists "unaccent";       -- recherche sans accents

-- ----------------------------------------------------------------------------
-- Fonction générique : maintien automatique de updated_at
-- ----------------------------------------------------------------------------
create or replace function public.fn_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Helpers de rôle (SECURITY DEFINER pour éviter la récursion RLS)
-- ----------------------------------------------------------------------------
create or replace function public.fn_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'anonymous'
  );
$$;

create or replace function public.fn_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  )
  or exists (
    select 1 from public.admin_users au
    join public.admin_roles ar on ar.id = au.role_id
    where au.user_id = auth.uid() and au.is_active
  );
$$;

create or replace function public.fn_is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  )
  or exists (
    select 1 from public.admin_users au
    join public.admin_roles ar on ar.id = au.role_id
    where au.user_id = auth.uid() and au.is_active and ar.code = 'SUPER_ADMIN'
  );
$$;

create or replace function public.fn_is_instructor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('instructor', 'admin', 'super_admin')
  );
$$;

create or replace function public.fn_has_admin_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.fn_is_super_admin()
  or exists (
    select 1
    from public.admin_users au
    join public.role_permissions rp on rp.role_id = au.role_id
    join public.admin_permissions ap on ap.id = rp.permission_id
    where au.user_id = auth.uid()
      and au.is_active
      and ap.code = p_permission
  );
$$;


-- ============================================================================
--  MODULE 1 — LMS : RÉFÉRENTIELS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1.1 Domaines (IA, Data, Cloud, BI)
-- ----------------------------------------------------------------------------
create table if not exists public.domains (
  id          uuid primary key default uuid_generate_v4(),
  code        text not null unique,
  name        text not null,
  description text,
  icon        text,
  color       text,
  order_rank  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 1.2 Niveaux
-- ----------------------------------------------------------------------------
create table if not exists public.levels (
  id         uuid primary key default uuid_generate_v4(),
  code       text not null unique,
  name       text not null,
  order_rank int  not null default 0
);

-- ----------------------------------------------------------------------------
-- 1.3 Formats de formation
-- ----------------------------------------------------------------------------
create table if not exists public.formats (
  id          uuid primary key default uuid_generate_v4(),
  code        text not null unique,
  name        text not null,
  description text
);

-- ----------------------------------------------------------------------------
-- 1.4 Outils / technologies
-- ----------------------------------------------------------------------------
create table if not exists public.tools (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  category    text,
  icon_url    text,
  description text,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 1.5 Options de financement
-- ----------------------------------------------------------------------------
create table if not exists public.financing_options (
  id          uuid primary key default uuid_generate_v4(),
  code        text not null unique,
  name        text not null,
  description text,
  code_rs     text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 1.6 Formateurs / instructeurs
-- ----------------------------------------------------------------------------
create table if not exists public.instructors (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references auth.users(id) on delete set null,
  first_name       text not null,
  last_name        text not null,
  bio              text,
  expertise_areas  text[],
  company          text,
  avatar_url       text,
  linkedin_url     text,
  rating           numeric(3,2) not null default 0 check (rating between 0 and 5),
  rating_count     int not null default 0 check (rating_count >= 0),
  students_count   int not null default 0 check (students_count >= 0),
  formations_count int not null default 0 check (formations_count >= 0),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.instructors
  add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.instructors
  add column if not exists updated_at timestamptz not null default now();

-- ----------------------------------------------------------------------------
-- 1.7 Profils utilisateurs (étend auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  prenom                  text,
  nom                     text,
  email                   text,
  phone                   text,
  company                 text,
  job_title               text,
  avatar_url              text,
  bio                     text,
  linkedin                text,
  country                 text,
  city                    text,
  role                    text not null default 'student'
                          check (role in ('student','instructor','admin','super_admin')),
  subscription_plan       text not null default 'free'
                          check (subscription_plan in ('free','pro','annual','enterprise')),
  subscription_updated_at timestamptz,
  -- Statistiques apprenant (maintenues par trigger update_student_stats)
  total_learning_minutes  int not null default 0 check (total_learning_minutes >= 0),
  courses_enrolled        int not null default 0 check (courses_enrolled >= 0),
  courses_completed       int not null default 0 check (courses_completed >= 0),
  certificates_count      int not null default 0 check (certificates_count >= 0),
  quiz_passed_count       int not null default 0 check (quiz_passed_count >= 0),
  last_seen_at            timestamptz,
  onboarding_completed    boolean not null default false,
  marketing_opt_in        boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Colonnes ajoutées si la table existait déjà (migration douce)
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists total_learning_minutes int not null default 0;
alter table public.profiles add column if not exists courses_enrolled int not null default 0;
alter table public.profiles add column if not exists courses_completed int not null default 0;
alter table public.profiles add column if not exists certificates_count int not null default 0;
alter table public.profiles add column if not exists quiz_passed_count int not null default 0;
alter table public.profiles add column if not exists last_seen_at timestamptz;
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.profiles add column if not exists marketing_opt_in boolean not null default false;

-- Création automatique du profil à l'inscription auth
create or replace function public.fn_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, prenom, nom)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'prenom', split_part(coalesce(new.raw_user_meta_data->>'full_name',''), ' ', 1)),
    coalesce(new.raw_user_meta_data->>'nom',    split_part(coalesce(new.raw_user_meta_data->>'full_name',''), ' ', 2))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.fn_handle_new_user();

-- ----------------------------------------------------------------------------
-- 1.8 Formations
-- ----------------------------------------------------------------------------
create table if not exists public.formations (
  id                 uuid primary key default uuid_generate_v4(),
  slug               text not null unique,
  title              text not null,
  short_description  text,
  description        text,
  domain_id          uuid references public.domains(id) on delete set null,
  level_id           uuid references public.levels(id)  on delete set null,
  format_id          uuid references public.formats(id) on delete set null,
  duration_hours     int check (duration_hours is null or duration_hours > 0),
  duration_days      int check (duration_days  is null or duration_days  > 0),
  price_ht           numeric(10,2) check (price_ht is null or price_ht >= 0),
  price_sur_devis    boolean not null default false,
  currency           text not null default 'EUR' check (char_length(currency) = 3),
  certification_code text,
  is_certifying      boolean not null default false,
  is_cpf_eligible    boolean not null default false,
  is_opco_eligible   boolean not null default false,
  is_featured        boolean not null default false,
  is_published       boolean not null default false,
  published_at       timestamptz,
  modules_count      int not null default 0 check (modules_count  >= 0),
  projects_count     int not null default 0 check (projects_count >= 0),
  students_count     int not null default 0 check (students_count >= 0),
  rating             numeric(3,2) not null default 0 check (rating between 0 and 5),
  rating_count       int not null default 0 check (rating_count >= 0),
  thumbnail_url      text,
  promo_video_url    text,
  search_vector      tsvector,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.formations add column if not exists published_at timestamptz;
alter table public.formations add column if not exists promo_video_url text;
alter table public.formations add column if not exists search_vector tsvector;

-- Maintien du vecteur de recherche
create or replace function public.fn_formations_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('french', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(new.short_description, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(new.description, '')), 'C');
  return new;
end;
$$;

drop trigger if exists trg_formations_search_vector on public.formations;
create trigger trg_formations_search_vector
  before insert or update of title, short_description, description
  on public.formations
  for each row execute function public.fn_formations_search_vector();

-- ----------------------------------------------------------------------------
-- 1.9 Liaisons M2M formations
-- ----------------------------------------------------------------------------
create table if not exists public.formation_tools (
  formation_id uuid not null references public.formations(id) on delete cascade,
  tool_id      uuid not null references public.tools(id)      on delete cascade,
  primary key (formation_id, tool_id)
);

create table if not exists public.formation_financing (
  formation_id uuid not null references public.formations(id)        on delete cascade,
  financing_id uuid not null references public.financing_options(id) on delete cascade,
  primary key (formation_id, financing_id)
);

create table if not exists public.formation_instructors (
  formation_id  uuid not null references public.formations(id)  on delete cascade,
  instructor_id uuid not null references public.instructors(id) on delete cascade,
  is_lead       boolean not null default false,
  primary key (formation_id, instructor_id)
);

-- ----------------------------------------------------------------------------
-- 1.10 Modules (chapitres)
-- ----------------------------------------------------------------------------
create table if not exists public.modules (
  id             uuid primary key default uuid_generate_v4(),
  formation_id   uuid not null references public.formations(id) on delete cascade,
  title          text not null,
  description    text,
  order_index    int  not null default 0 check (order_index >= 0),
  duration_hours numeric(4,1) check (duration_hours is null or duration_hours >= 0),
  is_practical   boolean not null default false,
  created_at     timestamptz not null default now(),
  unique (formation_id, order_index)
);

-- ----------------------------------------------------------------------------
-- 1.11 Leçons
-- ----------------------------------------------------------------------------
create table if not exists public.lessons (
  id           uuid primary key default uuid_generate_v4(),
  module_id    uuid not null references public.modules(id) on delete cascade,
  title        text not null,
  order_index  int  not null default 0 check (order_index >= 0),
  lesson_type  text not null default 'video'
               check (lesson_type in ('video','workshop','quiz','project','certification','article','live')),
  duration_min int check (duration_min is null or duration_min >= 0),
  is_preview   boolean not null default false,
  video_url    text,
  content_url  text,
  content_md   text,
  created_at   timestamptz not null default now(),
  unique (module_id, order_index)
);

alter table public.lessons add column if not exists content_md text;

-- ----------------------------------------------------------------------------
-- 1.12 Sessions planifiées
-- ----------------------------------------------------------------------------
create table if not exists public.sessions (
  id               uuid primary key default uuid_generate_v4(),
  formation_id     uuid not null references public.formations(id) on delete cascade,
  instructor_id    uuid references public.instructors(id) on delete set null,
  date_start       date not null,
  date_end         date,
  time_start       time,
  time_end         time,
  format_id        uuid references public.formats(id) on delete set null,
  location         text,
  max_participants int not null default 12 check (max_participants > 0),
  enrolled_count   int not null default 0 check (enrolled_count >= 0),
  status           text not null default 'available'
                   check (status in ('available','few_spots','full','closed','cancelled')),
  is_intra         boolean not null default false,
  notes            text,
  created_at       timestamptz not null default now(),
  check (date_end is null or date_end >= date_start),
  check (enrolled_count <= max_participants)
);

-- ----------------------------------------------------------------------------
-- 1.13 Inscriptions
-- ----------------------------------------------------------------------------
create table if not exists public.enrollments (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.profiles(id)   on delete cascade,
  formation_id     uuid not null references public.formations(id) on delete cascade,
  session_id       uuid references public.sessions(id) on delete set null,
  status           text not null default 'enrolled'
                   check (status in ('enrolled','in_progress','completed','cancelled','expired')),
  progress_pct     int  not null default 0 check (progress_pct between 0 and 100),
  enrolled_at      timestamptz not null default now(),
  started_at       timestamptz,
  completed_at     timestamptz,
  certificate_code text unique,
  certificate_url  text,
  payment_status   text not null default 'pending'
                   check (payment_status in ('pending','paid','refunded','cpf','opco','free')),
  amount_paid      numeric(10,2) check (amount_paid is null or amount_paid >= 0),
  financing_id     uuid references public.financing_options(id),
  notes            text,
  updated_at       timestamptz not null default now(),
  unique (user_id, formation_id)
);

alter table public.enrollments add column if not exists updated_at timestamptz not null default now();

-- ----------------------------------------------------------------------------
-- 1.14 Progression par module
-- ----------------------------------------------------------------------------
create table if not exists public.enrollment_modules (
  id            uuid primary key default uuid_generate_v4(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  module_id     uuid not null references public.modules(id)     on delete cascade,
  is_completed  boolean not null default false,
  completed_at  timestamptz,
  time_spent_min int not null default 0 check (time_spent_min >= 0),
  unique (enrollment_id, module_id)
);

alter table public.enrollment_modules add column if not exists time_spent_min int not null default 0;

-- ----------------------------------------------------------------------------
-- 1.15 Progression par leçon
-- ----------------------------------------------------------------------------
create table if not exists public.lesson_progress (
  id            uuid primary key default uuid_generate_v4(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  lesson_id     uuid not null references public.lessons(id)     on delete cascade,
  is_completed  boolean not null default false,
  completed_at  timestamptz,
  watch_time_sec int not null default 0 check (watch_time_sec >= 0),
  last_position_sec int not null default 0 check (last_position_sec >= 0),
  updated_at    timestamptz not null default now(),
  unique (enrollment_id, lesson_id)
);

-- ----------------------------------------------------------------------------
-- 1.16 Parcours certifiants
-- ----------------------------------------------------------------------------
create table if not exists public.parcours (
  id               uuid primary key default uuid_generate_v4(),
  slug             text not null unique,
  title            text not null,
  description      text,
  level_id         uuid references public.levels(id),
  domain_id        uuid references public.domains(id),
  duration_weeks   int check (duration_weeks is null or duration_weeks > 0),
  formations_count int not null default 0 check (formations_count >= 0),
  is_certifying    boolean not null default true,
  is_published     boolean not null default false,
  thumbnail_url    text,
  created_at       timestamptz not null default now()
);

create table if not exists public.parcours_formations (
  parcours_id  uuid not null references public.parcours(id)   on delete cascade,
  formation_id uuid not null references public.formations(id) on delete cascade,
  order_index  int not null default 0,
  is_required  boolean not null default true,
  primary key (parcours_id, formation_id)
);

-- ----------------------------------------------------------------------------
-- 1.17 Avis
-- ----------------------------------------------------------------------------
create table if not exists public.reviews (
  id            uuid primary key default uuid_generate_v4(),
  formation_id  uuid not null references public.formations(id) on delete cascade,
  user_id       uuid not null references public.profiles(id)   on delete cascade,
  rating        int  not null check (rating between 1 and 5),
  title         text,
  content       text,
  is_verified   boolean not null default false,
  is_featured   boolean not null default false,
  helpful_count int not null default 0 check (helpful_count >= 0),
  status        text not null default 'pending'
                check (status in ('published','pending','rejected')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, formation_id)
);

alter table public.reviews add column if not exists updated_at timestamptz not null default now();

-- ----------------------------------------------------------------------------
-- 1.18 FAQ
-- ----------------------------------------------------------------------------
create table if not exists public.faqs (
  id           uuid primary key default uuid_generate_v4(),
  question     text not null,
  answer       text not null,
  category     text,
  formation_id uuid references public.formations(id) on delete cascade,
  order_rank   int not null default 0,
  is_visible   boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 1.19 Contacts / leads
-- ----------------------------------------------------------------------------
create table if not exists public.contacts (
  id          uuid primary key default uuid_generate_v4(),
  prenom      text not null,
  nom         text not null,
  email       text not null,
  telephone   text,
  sujet       text,
  message     text not null,
  status      text not null default 'new'
              check (status in ('new','in_progress','replied','closed','spam')),
  assigned_to uuid references public.profiles(id) on delete set null,
  replied_at  timestamptz,
  source      text not null default 'website',
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 1.20 Partenaires
-- ----------------------------------------------------------------------------
create table if not exists public.partners (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  logo_url    text,
  website     text,
  category    text,
  description text,
  order_rank  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 1.21 Notifications
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  body       text,
  type       text not null default 'info'
             check (type in ('info','success','reminder','certificate','payment','quiz','system')),
  link       text,
  is_read    boolean not null default false,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications add column if not exists read_at timestamptz;


-- ============================================================================
--  MODULE 2 — QUIZZES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 Quiz (rattaché à une formation, un module ou une leçon)
-- ----------------------------------------------------------------------------
create table if not exists public.quizzes (
  id                 uuid primary key default uuid_generate_v4(),
  formation_id       uuid references public.formations(id) on delete cascade,
  module_id          uuid references public.modules(id)    on delete cascade,
  lesson_id          uuid references public.lessons(id)    on delete cascade,
  title              text not null,
  description        text,
  passing_score_pct  int  not null default 70 check (passing_score_pct between 0 and 100),
  max_attempts       int  not null default 3  check (max_attempts > 0),
  time_limit_min     int  check (time_limit_min is null or time_limit_min > 0),
  shuffle_questions  boolean not null default true,
  shuffle_answers    boolean not null default true,
  show_correct_after boolean not null default true,
  is_required_for_certificate boolean not null default false,
  is_published       boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- Un quiz doit être rattaché à au moins un niveau (formation, module ou leçon)
  check (formation_id is not null or module_id is not null or lesson_id is not null)
);

-- ----------------------------------------------------------------------------
-- 2.2 Questions
-- ----------------------------------------------------------------------------
create table if not exists public.questions (
  id            uuid primary key default uuid_generate_v4(),
  quiz_id       uuid not null references public.quizzes(id) on delete cascade,
  question_text text not null,
  question_type text not null default 'single_choice'
                check (question_type in ('single_choice','multiple_choice','true_false','short_text')),
  explanation   text,
  points        int  not null default 1 check (points > 0),
  order_index   int  not null default 0 check (order_index >= 0),
  image_url     text,
  code_snippet  text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2.3 Réponses possibles
-- ----------------------------------------------------------------------------
create table if not exists public.question_answers (
  id          uuid primary key default uuid_generate_v4(),
  question_id uuid not null references public.questions(id) on delete cascade,
  answer_text text not null,
  is_correct  boolean not null default false,
  order_index int not null default 0,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2.4 Tentatives de quiz
-- ----------------------------------------------------------------------------
create table if not exists public.quiz_attempts (
  id             uuid primary key default uuid_generate_v4(),
  quiz_id        uuid not null references public.quizzes(id)  on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  enrollment_id  uuid references public.enrollments(id) on delete set null,
  attempt_number int  not null default 1 check (attempt_number > 0),
  started_at     timestamptz not null default now(),
  submitted_at   timestamptz,
  score_points   int  not null default 0 check (score_points >= 0),
  max_points     int  not null default 0 check (max_points  >= 0),
  score_pct      numeric(5,2) not null default 0 check (score_pct between 0 and 100),
  passed         boolean not null default false,
  time_spent_sec int check (time_spent_sec is null or time_spent_sec >= 0),
  status         text not null default 'in_progress'
                 check (status in ('in_progress','submitted','expired','abandoned')),
  unique (quiz_id, user_id, attempt_number)
);

-- ----------------------------------------------------------------------------
-- 2.5 Réponses données par l'apprenant
-- ----------------------------------------------------------------------------
create table if not exists public.quiz_responses (
  id            uuid primary key default uuid_generate_v4(),
  attempt_id    uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id   uuid not null references public.questions(id)     on delete cascade,
  answer_ids    uuid[],
  answer_text   text,
  is_correct    boolean not null default false,
  points_earned int not null default 0 check (points_earned >= 0),
  answered_at   timestamptz not null default now(),
  unique (attempt_id, question_id)
);

-- ----------------------------------------------------------------------------
-- 2.6 Limitation du nombre de tentatives + numérotation automatique
-- ----------------------------------------------------------------------------
create or replace function public.fn_check_quiz_attempt_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max_attempts int;
  v_used int;
begin
  select max_attempts into v_max_attempts
  from public.quizzes where id = new.quiz_id;

  select count(*) into v_used
  from public.quiz_attempts
  where quiz_id = new.quiz_id and user_id = new.user_id;

  if v_used >= v_max_attempts then
    raise exception 'Nombre maximum de tentatives atteint (% / %)', v_used, v_max_attempts
      using errcode = 'P0001';
  end if;

  new.attempt_number := v_used + 1;
  return new;
end;
$$;

drop trigger if exists trg_quiz_attempt_limit on public.quiz_attempts;
create trigger trg_quiz_attempt_limit
  before insert on public.quiz_attempts
  for each row execute function public.fn_check_quiz_attempt_limit();

-- ----------------------------------------------------------------------------
-- 2.7 Correction automatique d'une réponse
-- ----------------------------------------------------------------------------
create or replace function public.fn_grade_quiz_response()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type     text;
  v_points   int;
  v_correct  uuid[];
begin
  select question_type, points into v_type, v_points
  from public.questions where id = new.question_id;

  if v_type in ('single_choice','multiple_choice','true_false') then
    select coalesce(array_agg(id order by id), '{}') into v_correct
    from public.question_answers
    where question_id = new.question_id and is_correct;

    -- Comparaison ensembliste : mêmes réponses, ni plus ni moins
    if new.answer_ids is not null
       and (select coalesce(array_agg(x order by x), '{}')
            from unnest(new.answer_ids) as x) = v_correct then
      new.is_correct    := true;
      new.points_earned := v_points;
    else
      new.is_correct    := false;
      new.points_earned := 0;
    end if;

  elsif v_type = 'short_text' then
    -- Comparaison insensible à la casse avec les réponses acceptées
    if exists (
      select 1 from public.question_answers
      where question_id = new.question_id
        and is_correct
        and lower(trim(answer_text)) = lower(trim(coalesce(new.answer_text, '')))
    ) then
      new.is_correct    := true;
      new.points_earned := v_points;
    else
      new.is_correct    := false;
      new.points_earned := 0;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_grade_quiz_response on public.quiz_responses;
create trigger trg_grade_quiz_response
  before insert or update of answer_ids, answer_text on public.quiz_responses
  for each row execute function public.fn_grade_quiz_response();

-- ----------------------------------------------------------------------------
-- 2.8 calculate_quiz_score() : score + réussite à la soumission
-- ----------------------------------------------------------------------------
create or replace function public.calculate_quiz_score(p_attempt_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quiz_id      uuid;
  v_user_id      uuid;
  v_score        int;
  v_max          int;
  v_pct          numeric(5,2);
  v_passing      int;
  v_passed       boolean;
begin
  select qa.quiz_id, qa.user_id into v_quiz_id, v_user_id
  from public.quiz_attempts qa where qa.id = p_attempt_id;

  select coalesce(sum(qr.points_earned), 0) into v_score
  from public.quiz_responses qr where qr.attempt_id = p_attempt_id;

  select coalesce(sum(q.points), 0) into v_max
  from public.questions q
  where q.quiz_id = v_quiz_id and q.is_active;

  v_pct := case when v_max > 0 then round((v_score::numeric / v_max) * 100, 2) else 0 end;

  select passing_score_pct into v_passing from public.quizzes where id = v_quiz_id;
  v_passed := v_pct >= v_passing;

  update public.quiz_attempts
  set score_points = v_score,
      max_points   = v_max,
      score_pct    = v_pct,
      passed       = v_passed,
      submitted_at = coalesce(submitted_at, now()),
      time_spent_sec = coalesce(time_spent_sec,
        extract(epoch from (now() - started_at))::int)
  where id = p_attempt_id;

  -- Statistique apprenant : première réussite de ce quiz uniquement
  if v_passed and not exists (
    select 1 from public.quiz_attempts
    where quiz_id = v_quiz_id and user_id = v_user_id
      and passed and id <> p_attempt_id
  ) then
    update public.profiles
    set quiz_passed_count = quiz_passed_count + 1
    where id = v_user_id;
  end if;
end;
$$;

-- Trigger AFTER : calcul automatique à la soumission (évite la récursion :
-- l'UPDATE interne de calculate_quiz_score ne modifie pas status)
create or replace function public.fn_quiz_attempt_after_submit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'submitted' and coalesce(old.status, '') <> 'submitted' then
    perform public.calculate_quiz_score(new.id);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_quiz_attempt_submitted on public.quiz_attempts;
create trigger trg_quiz_attempt_submitted
  after update of status on public.quiz_attempts
  for each row execute function public.fn_quiz_attempt_after_submit();


-- ============================================================================
--  MODULE 3 — CERTIFICATS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 Templates de certificat
-- ----------------------------------------------------------------------------
create table if not exists public.certificate_templates (
  id              uuid primary key default uuid_generate_v4(),
  code            text not null unique,
  name            text not null,
  description     text,
  background_url  text,
  logo_url        text,
  signature_url   text,
  signature_name  text,
  signature_title text,
  body_template   text,
  validity_months int check (validity_months is null or validity_months > 0),
  is_default      boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3.2 Certificats émis
-- ----------------------------------------------------------------------------
create table if not exists public.certificates (
  id               uuid primary key default uuid_generate_v4(),
  certificate_code text not null unique,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  formation_id     uuid references public.formations(id) on delete set null,
  parcours_id      uuid references public.parcours(id)   on delete set null,
  enrollment_id    uuid references public.enrollments(id) on delete set null,
  template_id      uuid references public.certificate_templates(id) on delete set null,
  student_name     text not null,
  formation_title  text not null,
  final_score_pct  numeric(5,2),
  pdf_url          text,
  issued_at        timestamptz not null default now(),
  expires_at       timestamptz,
  status           text not null default 'issued'
                   check (status in ('issued','revoked','expired')),
  revoked_at       timestamptz,
  revoked_reason   text,
  metadata         jsonb not null default '{}'::jsonb,
  check (formation_id is not null or parcours_id is not null)
);

-- ----------------------------------------------------------------------------
-- 3.3 Historique des certificats
-- ----------------------------------------------------------------------------
create table if not exists public.certificate_events (
  id             uuid primary key default uuid_generate_v4(),
  certificate_id uuid not null references public.certificates(id) on delete cascade,
  event_type     text not null check (event_type in ('issued','revoked','reinstated','regenerated','verified')),
  actor_id       uuid references public.profiles(id) on delete set null,
  details        jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3.4 Génération du code de certificat : PIDA-YYYY-XXXXXXXX
-- ----------------------------------------------------------------------------
create or replace function public.fn_generate_certificate_code()
returns text
language plpgsql
as $$
declare
  v_code text;
begin
  loop
    v_code := 'PIDA-' || to_char(now(), 'YYYY') || '-' ||
              upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
    exit when not exists (
      select 1 from public.certificates where certificate_code = v_code
    );
  end loop;
  return v_code;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3.5 issue_certificate() : émission d'un certificat pour une inscription
-- ----------------------------------------------------------------------------
create or replace function public.issue_certificate(p_enrollment_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enr       record;
  v_profile   record;
  v_formation record;
  v_template  record;
  v_code      text;
  v_cert_id   uuid;
  v_expires   timestamptz;
  v_score     numeric(5,2);
begin
  select * into v_enr from public.enrollments where id = p_enrollment_id;
  if not found then
    raise exception 'Inscription introuvable: %', p_enrollment_id;
  end if;

  -- Pas de doublon : renvoie le certificat existant
  select id into v_cert_id from public.certificates
  where enrollment_id = p_enrollment_id and status = 'issued';
  if found then
    return v_cert_id;
  end if;

  select * into v_profile   from public.profiles   where id = v_enr.user_id;
  select * into v_formation from public.formations where id = v_enr.formation_id;

  -- Si un quiz est requis pour le certificat, vérifier la réussite
  if exists (
    select 1 from public.quizzes q
    where q.formation_id = v_enr.formation_id
      and q.is_required_for_certificate
      and q.is_published
      and not exists (
        select 1 from public.quiz_attempts qa
        where qa.quiz_id = q.id and qa.user_id = v_enr.user_id and qa.passed
      )
  ) then
    raise exception 'Quiz requis non réussi pour la formation %', v_formation.title;
  end if;

  -- Meilleur score de quiz pour la formation
  select max(qa.score_pct) into v_score
  from public.quiz_attempts qa
  join public.quizzes q on q.id = qa.quiz_id
  where q.formation_id = v_enr.formation_id
    and qa.user_id = v_enr.user_id and qa.passed;

  -- Template par défaut + expiration optionnelle
  select * into v_template from public.certificate_templates
  where is_default and is_active limit 1;

  if v_template.validity_months is not null then
    v_expires := now() + (v_template.validity_months || ' months')::interval;
  end if;

  v_code := public.fn_generate_certificate_code();

  insert into public.certificates (
    certificate_code, user_id, formation_id, enrollment_id, template_id,
    student_name, formation_title, final_score_pct, expires_at
  ) values (
    v_code,
    v_enr.user_id,
    v_enr.formation_id,
    p_enrollment_id,
    v_template.id,
    trim(coalesce(v_profile.prenom,'') || ' ' || coalesce(v_profile.nom,'')),
    v_formation.title,
    v_score,
    v_expires
  )
  returning id into v_cert_id;

  -- Synchronisation sur l'inscription
  update public.enrollments
  set certificate_code = v_code
  where id = p_enrollment_id;

  -- Historique
  insert into public.certificate_events (certificate_id, event_type, actor_id)
  values (v_cert_id, 'issued', v_enr.user_id);

  -- Notification
  insert into public.notifications (user_id, title, body, type, link)
  values (
    v_enr.user_id,
    'Certificat disponible',
    'Votre certificat pour la formation « ' || v_formation.title || ' » est prêt.',
    'certificate',
    '/dashboard/certificates'
  );

  return v_cert_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3.6 Vérification publique d'un certificat (sans exposer la table)
-- ----------------------------------------------------------------------------
create or replace function public.verify_certificate(p_code text)
returns table (
  is_valid        boolean,
  student_name    text,
  formation_title text,
  issued_at       timestamptz,
  expires_at      timestamptz,
  status          text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  select
    (c.status = 'issued' and (c.expires_at is null or c.expires_at > now())) as is_valid,
    c.student_name,
    c.formation_title,
    c.issued_at,
    c.expires_at,
    case
      when c.status = 'revoked' then 'revoked'
      when c.expires_at is not null and c.expires_at <= now() then 'expired'
      else c.status
    end as status
  from public.certificates c
  where c.certificate_code = upper(trim(p_code));
end;
$$;

-- Expiration automatique (planifier via pg_cron : select public.fn_expire_certificates();)
create or replace function public.fn_expire_certificates()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  update public.certificates
  set status = 'expired'
  where status = 'issued'
    and expires_at is not null
    and expires_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;


-- ============================================================================
--  MODULE 4 — PAIEMENTS
--  Providers : Stripe, Orange Money, MTN Mobile Money
--  Extensible : Wave, PayPal, Flutterwave, CinetPay
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1 Providers de paiement
-- ----------------------------------------------------------------------------
create table if not exists public.payment_providers (
  id              uuid primary key default uuid_generate_v4(),
  code            text not null unique,        -- 'stripe', 'orange_money', 'mtn_momo', ...
  name            text not null,
  description     text,
  provider_type   text not null default 'card'
                  check (provider_type in ('card','mobile_money','wallet','bank_transfer','aggregator')),
  supported_currencies text[] not null default array['EUR'],
  supported_countries  text[] not null default array['FR'],
  fee_pct         numeric(5,2) not null default 0 check (fee_pct >= 0),
  fee_fixed       numeric(10,2) not null default 0 check (fee_fixed >= 0),
  config          jsonb not null default '{}'::jsonb,   -- clés publiques, endpoints (jamais de secrets)
  webhook_path    text,                                  -- ex: /api/webhooks/stripe
  is_active       boolean not null default false,
  order_rank      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4.2 Moyens de paiement enregistrés par utilisateur
-- ----------------------------------------------------------------------------
create table if not exists public.payment_methods (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  provider_id   uuid not null references public.payment_providers(id) on delete cascade,
  method_type   text not null default 'card'
                check (method_type in ('card','mobile_money','wallet','bank_account')),
  -- Identifiants tokenisés côté provider — JAMAIS de numéro complet
  provider_method_id text,            -- ex: pm_xxx (Stripe)
  display_label text,                 -- ex: 'Visa •••• 4242' / 'OM +237 6•• ••• •89'
  card_brand    text,
  card_last4    text check (card_last4 is null or char_length(card_last4) = 4),
  card_exp_month int check (card_exp_month is null or card_exp_month between 1 and 12),
  card_exp_year  int check (card_exp_year  is null or card_exp_year >= 2024),
  phone_number_masked text,           -- mobile money : numéro masqué
  is_default    boolean not null default false,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4.3 Codes promo
-- ----------------------------------------------------------------------------
create table if not exists public.promo_codes (
  id              uuid primary key default uuid_generate_v4(),
  code            text not null unique,
  description     text,
  discount_type   text not null default 'percentage'
                  check (discount_type in ('percentage','fixed_amount')),
  discount_value  numeric(10,2) not null check (discount_value > 0),
  currency        text default 'EUR',
  max_redemptions int check (max_redemptions is null or max_redemptions > 0),
  redemptions_count int not null default 0 check (redemptions_count >= 0),
  max_per_user    int not null default 1 check (max_per_user > 0),
  min_amount      numeric(10,2) check (min_amount is null or min_amount >= 0),
  formation_id    uuid references public.formations(id) on delete cascade,  -- null = global
  starts_at       timestamptz,
  expires_at      timestamptz,
  is_active       boolean not null default true,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  check (expires_at is null or starts_at is null or expires_at > starts_at),
  check (discount_type <> 'percentage' or discount_value <= 100)
);

create table if not exists public.promo_code_redemptions (
  id            uuid primary key default uuid_generate_v4(),
  promo_code_id uuid not null references public.promo_codes(id) on delete cascade,
  user_id       uuid not null references public.profiles(id)    on delete cascade,
  payment_id    uuid,                          -- FK ajoutée après création de payments
  amount_saved  numeric(10,2) not null default 0,
  redeemed_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4.4 Paiements
-- ----------------------------------------------------------------------------
create table if not exists public.payments (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.profiles(id) on delete restrict,
  formation_id        uuid references public.formations(id) on delete set null,
  parcours_id         uuid references public.parcours(id)   on delete set null,
  enrollment_id       uuid references public.enrollments(id) on delete set null,
  subscription_id     uuid,                    -- FK ajoutée après création de subscriptions
  provider_id         uuid not null references public.payment_providers(id) on delete restrict,
  payment_method_id   uuid references public.payment_methods(id) on delete set null,
  promo_code_id       uuid references public.promo_codes(id) on delete set null,
  amount_gross        numeric(12,2) not null check (amount_gross >= 0),   -- avant remise
  discount_amount     numeric(12,2) not null default 0 check (discount_amount >= 0),
  amount              numeric(12,2) not null check (amount >= 0),         -- net payé
  fee_amount          numeric(12,2) not null default 0 check (fee_amount >= 0),
  currency            text not null default 'EUR' check (char_length(currency) = 3),
  status              text not null default 'pending'
                      check (status in ('pending','processing','requires_action','succeeded',
                                        'failed','cancelled','refunded','partially_refunded')),
  -- Références provider
  provider_payment_id text,                    -- payment_intent (Stripe) / transaction id (OM, MoMo)
  provider_session_id text,                    -- checkout session
  provider_reference  text,                    -- référence marchande envoyée au provider
  phone_number        text,                    -- mobile money : numéro débité (masqué en lecture)
  failure_code        text,
  failure_message     text,
  paid_at             timestamptz,
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (amount = amount_gross - discount_amount)
);

create unique index if not exists uq_payments_provider_payment
  on public.payments (provider_id, provider_payment_id)
  where provider_payment_id is not null;

-- FK différées (références croisées)
alter table public.promo_code_redemptions
  drop constraint if exists fk_redemption_payment;
alter table public.promo_code_redemptions
  add constraint fk_redemption_payment
  foreign key (payment_id) references public.payments(id) on delete set null;

-- ----------------------------------------------------------------------------
-- 4.5 Historique des statuts de paiement
-- ----------------------------------------------------------------------------
create table if not exists public.payment_status_history (
  id          uuid primary key default uuid_generate_v4(),
  payment_id  uuid not null references public.payments(id) on delete cascade,
  from_status text,
  to_status   text not null,
  reason      text,
  actor       text not null default 'system',   -- 'system', 'webhook', 'admin', 'user'
  actor_id    uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create or replace function public.fn_track_payment_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.payment_status_history (payment_id, from_status, to_status, actor)
    values (new.id, null, new.status, 'system');
  elsif new.status is distinct from old.status then
    insert into public.payment_status_history (payment_id, from_status, to_status, actor)
    values (new.id, old.status, new.status, 'system');
    if new.status = 'succeeded' and new.paid_at is null then
      new.paid_at := now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_payment_status_history on public.payments;
create trigger trg_payment_status_history
  before insert or update of status on public.payments
  for each row execute function public.fn_track_payment_status();

-- ----------------------------------------------------------------------------
-- 4.6 Remboursements
-- ----------------------------------------------------------------------------
create table if not exists public.refunds (
  id                 uuid primary key default uuid_generate_v4(),
  payment_id         uuid not null references public.payments(id) on delete restrict,
  amount             numeric(12,2) not null check (amount > 0),
  currency           text not null default 'EUR',
  reason             text not null default 'requested_by_customer'
                     check (reason in ('requested_by_customer','duplicate','fraudulent','course_cancelled','other')),
  reason_details     text,
  status             text not null default 'pending'
                     check (status in ('pending','processing','succeeded','failed','cancelled')),
  provider_refund_id text,
  requested_by       uuid references public.profiles(id) on delete set null,
  approved_by        uuid references public.profiles(id) on delete set null,
  processed_at       timestamptz,
  created_at         timestamptz not null default now()
);

-- Validation : le total remboursé ne peut dépasser le montant payé
create or replace function public.fn_validate_refund()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paid     numeric(12,2);
  v_refunded numeric(12,2);
begin
  select amount into v_paid from public.payments where id = new.payment_id;

  select coalesce(sum(amount), 0) into v_refunded
  from public.refunds
  where payment_id = new.payment_id
    and status in ('pending','processing','succeeded')
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if v_refunded + new.amount > v_paid then
    raise exception 'Remboursement (%) supérieur au montant payé restant (%)',
      new.amount, v_paid - v_refunded;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_refund on public.refunds;
create trigger trg_validate_refund
  before insert or update of amount, status on public.refunds
  for each row execute function public.fn_validate_refund();

-- Synchronisation du statut du paiement après remboursement réussi
create or replace function public.fn_sync_payment_after_refund()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paid     numeric(12,2);
  v_refunded numeric(12,2);
begin
  if new.status = 'succeeded' and coalesce(old.status,'') <> 'succeeded' then
    select amount into v_paid from public.payments where id = new.payment_id;
    select coalesce(sum(amount), 0) into v_refunded
    from public.refunds where payment_id = new.payment_id and status = 'succeeded';

    update public.payments
    set status = case when v_refunded >= v_paid then 'refunded' else 'partially_refunded' end
    where id = new.payment_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_payment_after_refund on public.refunds;
create trigger trg_sync_payment_after_refund
  after update of status on public.refunds
  for each row execute function public.fn_sync_payment_after_refund();

-- ----------------------------------------------------------------------------
-- 4.7 Abonnements
-- ----------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null references public.profiles(id) on delete cascade,
  provider_id              uuid references public.payment_providers(id) on delete set null,
  plan                     text not null check (plan in ('pro','annual','enterprise')),
  status                   text not null default 'active'
                           check (status in ('trialing','active','past_due','cancelled','expired','paused')),
  provider_subscription_id text unique,
  amount                   numeric(12,2) not null check (amount >= 0),
  currency                 text not null default 'EUR',
  billing_interval         text not null default 'month'
                           check (billing_interval in ('month','year')),
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  trial_ends_at            timestamptz,
  cancel_at_period_end     boolean not null default false,
  cancelled_at             timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- FK croisée payments → subscriptions
alter table public.payments drop constraint if exists fk_payments_subscription;
alter table public.payments
  add constraint fk_payments_subscription
  foreign key (subscription_id) references public.subscriptions(id) on delete set null;

-- Synchronisation du plan dans profiles
create or replace function public.fn_sync_profile_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active' then
    update public.profiles
    set subscription_plan = new.plan, subscription_updated_at = now()
    where id = new.user_id;
  elsif new.status in ('cancelled','expired')
        and not exists (
          select 1 from public.subscriptions
          where user_id = new.user_id and status = 'active' and id <> new.id
        ) then
    update public.profiles
    set subscription_plan = 'free', subscription_updated_at = now()
    where id = new.user_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_profile_subscription on public.subscriptions;
create trigger trg_sync_profile_subscription
  after insert or update of status on public.subscriptions
  for each row execute function public.fn_sync_profile_subscription();

-- ----------------------------------------------------------------------------
-- 4.8 Factures
-- ----------------------------------------------------------------------------
create sequence if not exists public.invoice_number_seq;

create table if not exists public.invoices (
  id              uuid primary key default uuid_generate_v4(),
  invoice_number  text not null unique,
  payment_id      uuid references public.payments(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  user_id         uuid not null references public.profiles(id) on delete restrict,
  -- Données figées à l'émission (immuables même si le profil change)
  billing_name    text not null,
  billing_email   text not null,
  billing_address text,
  billing_country text,
  billing_company text,
  billing_vat     text,
  description     text not null,
  amount_ht       numeric(12,2) not null check (amount_ht >= 0),
  tax_rate_pct    numeric(5,2)  not null default 0 check (tax_rate_pct >= 0),
  tax_amount      numeric(12,2) not null default 0 check (tax_amount >= 0),
  amount_ttc      numeric(12,2) not null check (amount_ttc >= 0),
  currency        text not null default 'EUR',
  status          text not null default 'issued'
                  check (status in ('draft','issued','paid','overdue','void','credit_note')),
  pdf_url         text,
  issued_at       timestamptz not null default now(),
  due_at          timestamptz,
  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);

-- Génération du numéro de facture : PIDA-INV-YYYY-000123
create or replace function public.fn_generate_invoice_number()
returns text
language sql
as $$
  select 'PIDA-INV-' || to_char(now(), 'YYYY') || '-' ||
         lpad(nextval('public.invoice_number_seq')::text, 6, '0');
$$;

-- ----------------------------------------------------------------------------
-- 4.9 create_invoice() : facture automatique au paiement réussi
-- ----------------------------------------------------------------------------
create or replace function public.create_invoice(p_payment_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pay        record;
  v_profile    record;
  v_desc       text;
  v_invoice_id uuid;
  v_tax_rate   numeric(5,2) := 0;   -- adapter selon la fiscalité (TVA FR = 20)
  v_ht         numeric(12,2);
  v_tax        numeric(12,2);
begin
  select * into v_pay from public.payments where id = p_payment_id;
  if not found or v_pay.status <> 'succeeded' then
    raise exception 'Paiement % introuvable ou non aboutí', p_payment_id;
  end if;

  -- Idempotence
  select id into v_invoice_id from public.invoices where payment_id = p_payment_id;
  if found then
    return v_invoice_id;
  end if;

  select * into v_profile from public.profiles where id = v_pay.user_id;

  select coalesce(
    (select 'Formation : ' || title from public.formations where id = v_pay.formation_id),
    (select 'Parcours : '  || title from public.parcours   where id = v_pay.parcours_id),
    'Abonnement Power Inside Data Academy'
  ) into v_desc;

  v_ht  := round(v_pay.amount / (1 + v_tax_rate / 100), 2);
  v_tax := v_pay.amount - v_ht;

  insert into public.invoices (
    invoice_number, payment_id, subscription_id, user_id,
    billing_name, billing_email, billing_country, billing_company,
    description, amount_ht, tax_rate_pct, tax_amount, amount_ttc,
    currency, status, paid_at
  ) values (
    public.fn_generate_invoice_number(),
    p_payment_id,
    v_pay.subscription_id,
    v_pay.user_id,
    trim(coalesce(v_profile.prenom,'') || ' ' || coalesce(v_profile.nom,'')),
    coalesce(v_profile.email, ''),
    v_profile.country,
    v_profile.company,
    v_desc,
    v_ht, v_tax_rate, v_tax, v_pay.amount,
    v_pay.currency,
    'paid',
    coalesce(v_pay.paid_at, now())
  )
  returning id into v_invoice_id;

  return v_invoice_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4.10 Paiement réussi → inscription + facture + notification
-- ----------------------------------------------------------------------------
create or replace function public.fn_on_payment_succeeded()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enrollment_id uuid;
begin
  if new.status = 'succeeded' and coalesce(old.status, '') <> 'succeeded' then

    -- 1. Inscription automatique (formation à l'unité)
    if new.formation_id is not null then
      insert into public.enrollments (user_id, formation_id, payment_status, amount_paid, status)
      values (new.user_id, new.formation_id, 'paid', new.amount, 'enrolled')
      on conflict (user_id, formation_id)
      do update set payment_status = 'paid',
                    amount_paid    = excluded.amount_paid,
                    status         = case when enrollments.status = 'cancelled'
                                          then 'enrolled' else enrollments.status end
      returning id into v_enrollment_id;

      update public.payments set enrollment_id = v_enrollment_id where id = new.id;
    end if;

    -- 2. Facture automatique
    perform public.create_invoice(new.id);

    -- 3. Incrément redemption code promo
    if new.promo_code_id is not null then
      update public.promo_codes
      set redemptions_count = redemptions_count + 1
      where id = new.promo_code_id;

      insert into public.promo_code_redemptions (promo_code_id, user_id, payment_id, amount_saved)
      values (new.promo_code_id, new.user_id, new.id, new.discount_amount);
    end if;

    -- 4. Notification
    insert into public.notifications (user_id, title, body, type, link)
    values (
      new.user_id,
      'Paiement confirmé',
      'Votre paiement de ' || new.amount || ' ' || new.currency || ' a bien été reçu.',
      'payment',
      '/dashboard/payments'
    );
  end if;
  return null;
end;
$$;

drop trigger if exists trg_on_payment_succeeded on public.payments;
create trigger trg_on_payment_succeeded
  after update of status on public.payments
  for each row execute function public.fn_on_payment_succeeded();

-- ----------------------------------------------------------------------------
-- 4.11 Validation d'un code promo (appelée côté API avant checkout)
-- ----------------------------------------------------------------------------
create or replace function public.validate_promo_code(
  p_code         text,
  p_user_id      uuid,
  p_formation_id uuid default null,
  p_amount       numeric default null
)
returns table (
  valid          boolean,
  promo_id       uuid,
  discount_type  text,
  discount_value numeric,
  error_code     text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_promo record;
  v_user_uses int;
begin
  select * into v_promo from public.promo_codes
  where code = upper(trim(p_code)) and is_active;

  if not found then
    return query select false, null::uuid, null::text, null::numeric, 'NOT_FOUND'; return;
  end if;
  if v_promo.starts_at is not null and v_promo.starts_at > now() then
    return query select false, v_promo.id, null::text, null::numeric, 'NOT_STARTED'; return;
  end if;
  if v_promo.expires_at is not null and v_promo.expires_at <= now() then
    return query select false, v_promo.id, null::text, null::numeric, 'EXPIRED'; return;
  end if;
  if v_promo.max_redemptions is not null
     and v_promo.redemptions_count >= v_promo.max_redemptions then
    return query select false, v_promo.id, null::text, null::numeric, 'MAX_REDEMPTIONS'; return;
  end if;
  if v_promo.formation_id is not null
     and (p_formation_id is null or v_promo.formation_id <> p_formation_id) then
    return query select false, v_promo.id, null::text, null::numeric, 'WRONG_FORMATION'; return;
  end if;
  if v_promo.min_amount is not null and p_amount is not null
     and p_amount < v_promo.min_amount then
    return query select false, v_promo.id, null::text, null::numeric, 'MIN_AMOUNT'; return;
  end if;

  select count(*) into v_user_uses
  from public.promo_code_redemptions
  where promo_code_id = v_promo.id and user_id = p_user_id;
  if v_user_uses >= v_promo.max_per_user then
    return query select false, v_promo.id, null::text, null::numeric, 'ALREADY_USED'; return;
  end if;

  return query select true, v_promo.id, v_promo.discount_type, v_promo.discount_value, null::text;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4.12 Webhooks providers (réception brute, idempotence, traçabilité)
-- ----------------------------------------------------------------------------
create table if not exists public.payment_webhooks (
  id              uuid primary key default uuid_generate_v4(),
  provider_id     uuid references public.payment_providers(id) on delete set null,
  provider_code   text not null,                 -- 'stripe', 'orange_money', ...
  event_id        text,                          -- id événement côté provider (idempotence)
  event_type      text not null,                 -- 'checkout.session.completed', 'PAYMENT_SUCCESS', ...
  payload         jsonb not null,
  signature       text,
  signature_valid boolean,
  payment_id      uuid references public.payments(id) on delete set null,
  status          text not null default 'received'
                  check (status in ('received','processed','ignored','error')),
  error_message   text,
  processed_at    timestamptz,
  received_at     timestamptz not null default now()
);

create unique index if not exists uq_payment_webhooks_event
  on public.payment_webhooks (provider_code, event_id)
  where event_id is not null;


-- ============================================================================
--  MODULE 5 — ANALYTICS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 5.1 Événements d'apprentissage (granulaire, par utilisateur)
-- ----------------------------------------------------------------------------
create table if not exists public.learning_analytics (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  formation_id   uuid references public.formations(id) on delete cascade,
  module_id      uuid references public.modules(id)    on delete cascade,
  lesson_id      uuid references public.lessons(id)    on delete cascade,
  enrollment_id  uuid references public.enrollments(id) on delete cascade,
  event_type     text not null
                 check (event_type in ('lesson_start','lesson_complete','video_progress',
                                       'module_complete','formation_start','formation_complete',
                                       'quiz_start','quiz_submit','quiz_pass','quiz_fail',
                                       'certificate_issued','login','page_view','download')),
  time_spent_sec int not null default 0 check (time_spent_sec >= 0),
  progress_pct   int check (progress_pct is null or progress_pct between 0 and 100),
  device         text,
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5.2 Agrégats quotidiens (dashboard admin)
-- ----------------------------------------------------------------------------
create table if not exists public.analytics_daily (
  id                     uuid primary key default uuid_generate_v4(),
  day                    date not null unique,
  new_users              int not null default 0,
  active_users           int not null default 0,
  new_enrollments        int not null default 0,
  completed_enrollments  int not null default 0,
  total_learning_minutes int not null default 0,
  quiz_attempts          int not null default 0,
  quiz_passed            int not null default 0,
  certificates_issued    int not null default 0,
  payments_count         int not null default 0,
  revenue                numeric(14,2) not null default 0,
  refunds_amount         numeric(14,2) not null default 0,
  currency               text not null default 'EUR',
  updated_at             timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5.3 update_analytics() : upsert d'un compteur du jour
-- ----------------------------------------------------------------------------
create or replace function public.update_analytics(
  p_metric text,
  p_increment numeric default 1,
  p_day date default current_date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.analytics_daily (day) values (p_day)
  on conflict (day) do nothing;

  execute format(
    'update public.analytics_daily set %I = %I + $1, updated_at = now() where day = $2',
    p_metric, p_metric
  ) using p_increment, p_day;
end;
$$;

-- Triggers analytics : paiements
create or replace function public.fn_analytics_on_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'succeeded' and coalesce(old.status,'') <> 'succeeded' then
    perform public.update_analytics('payments_count', 1);
    perform public.update_analytics('revenue', new.amount);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_analytics_on_payment on public.payments;
create trigger trg_analytics_on_payment
  after update of status on public.payments
  for each row execute function public.fn_analytics_on_payment();

-- Triggers analytics : remboursements
create or replace function public.fn_analytics_on_refund()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'succeeded' and coalesce(old.status,'') <> 'succeeded' then
    perform public.update_analytics('refunds_amount', new.amount);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_analytics_on_refund on public.refunds;
create trigger trg_analytics_on_refund
  after update of status on public.refunds
  for each row execute function public.fn_analytics_on_refund();

-- Triggers analytics : inscriptions
create or replace function public.fn_analytics_on_enrollment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.update_analytics('new_enrollments', 1);
  elsif new.status = 'completed' and coalesce(old.status,'') <> 'completed' then
    perform public.update_analytics('completed_enrollments', 1);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_analytics_on_enrollment on public.enrollments;
create trigger trg_analytics_on_enrollment
  after insert or update of status on public.enrollments
  for each row execute function public.fn_analytics_on_enrollment();

-- Triggers analytics : nouveaux utilisateurs
create or replace function public.fn_analytics_on_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.update_analytics('new_users', 1);
  return null;
end;
$$;

drop trigger if exists trg_analytics_on_profile on public.profiles;
create trigger trg_analytics_on_profile
  after insert on public.profiles
  for each row execute function public.fn_analytics_on_profile();

-- Triggers analytics : quiz
create or replace function public.fn_analytics_on_quiz_attempt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'submitted' and coalesce(old.status,'') <> 'submitted' then
    perform public.update_analytics('quiz_attempts', 1);
    if new.passed then
      perform public.update_analytics('quiz_passed', 1);
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_analytics_on_quiz_attempt on public.quiz_attempts;
create trigger trg_analytics_on_quiz_attempt
  after update of status on public.quiz_attempts
  for each row execute function public.fn_analytics_on_quiz_attempt();

-- Triggers analytics : certificats + temps d'apprentissage
create or replace function public.fn_analytics_on_certificate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.update_analytics('certificates_issued', 1);
  return null;
end;
$$;

drop trigger if exists trg_analytics_on_certificate on public.certificates;
create trigger trg_analytics_on_certificate
  after insert on public.certificates
  for each row execute function public.fn_analytics_on_certificate();

create or replace function public.fn_analytics_on_learning_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.time_spent_sec > 0 then
    perform public.update_analytics('total_learning_minutes',
      ceil(new.time_spent_sec / 60.0));
  end if;
  return null;
end;
$$;

drop trigger if exists trg_analytics_on_learning_event on public.learning_analytics;
create trigger trg_analytics_on_learning_event
  after insert on public.learning_analytics
  for each row execute function public.fn_analytics_on_learning_event();


-- ============================================================================
--  MODULE 6 — ADMINISTRATION (rôles & permissions)
-- ============================================================================

create table if not exists public.admin_roles (
  id          uuid primary key default uuid_generate_v4(),
  code        text not null unique,     -- 'SUPER_ADMIN', 'ACADEMY_ADMIN', ...
  name        text not null,
  description text,
  is_system   boolean not null default false,   -- non supprimable
  created_at  timestamptz not null default now()
);

create table if not exists public.admin_permissions (
  id          uuid primary key default uuid_generate_v4(),
  code        text not null unique,     -- 'formations.write', 'payments.refund', ...
  name        text not null,
  category    text not null default 'general',
  created_at  timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id       uuid not null references public.admin_roles(id)       on delete cascade,
  permission_id uuid not null references public.admin_permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.admin_users (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id)   on delete cascade,
  role_id     uuid not null references public.admin_roles(id) on delete cascade,
  granted_by  uuid references public.profiles(id) on delete set null,
  is_active   boolean not null default true,
  notes       text,
  created_at  timestamptz not null default now(),
  unique (user_id, role_id)
);


-- ============================================================================
--  MODULE 7 — AUDIT
-- ============================================================================

create table if not exists public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid,                       -- pas de FK : conserver après suppression user
  user_email  text,
  action      text not null,              -- 'INSERT', 'UPDATE', 'DELETE', 'LOGIN',
                                          -- 'PAYMENT', 'CERTIFICATE_ISSUED', ...
  entity_type text not null,              -- nom de la table / domaine
  entity_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- Fonction générique d'audit attachable à n'importe quelle table
create or replace function public.fn_audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_id  uuid;
begin
  if tg_op = 'DELETE' then
    v_old := to_jsonb(old);
    v_id  := old.id;
  elsif tg_op = 'INSERT' then
    v_new := to_jsonb(new);
    v_id  := new.id;
  else
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    v_id  := new.id;
  end if;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
  values (auth.uid(), tg_op, tg_table_name, v_id, v_old, v_new);

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

-- Audit des tables sensibles
drop trigger if exists trg_audit_formations on public.formations;
create trigger trg_audit_formations
  after insert or update or delete on public.formations
  for each row execute function public.fn_audit_trigger();

drop trigger if exists trg_audit_enrollments on public.enrollments;
create trigger trg_audit_enrollments
  after insert or update or delete on public.enrollments
  for each row execute function public.fn_audit_trigger();

drop trigger if exists trg_audit_payments on public.payments;
create trigger trg_audit_payments
  after insert or update or delete on public.payments
  for each row execute function public.fn_audit_trigger();

drop trigger if exists trg_audit_refunds on public.refunds;
create trigger trg_audit_refunds
  after insert or update or delete on public.refunds
  for each row execute function public.fn_audit_trigger();

drop trigger if exists trg_audit_certificates on public.certificates;
create trigger trg_audit_certificates
  after insert or update or delete on public.certificates
  for each row execute function public.fn_audit_trigger();

drop trigger if exists trg_audit_admin_users on public.admin_users;
create trigger trg_audit_admin_users
  after insert or update or delete on public.admin_users
  for each row execute function public.fn_audit_trigger();

drop trigger if exists trg_audit_promo_codes on public.promo_codes;
create trigger trg_audit_promo_codes
  after insert or update or delete on public.promo_codes
  for each row execute function public.fn_audit_trigger();

-- Helper pour journaliser un événement applicatif (login, etc.) depuis l'API
create or replace function public.log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (user_id, action, entity_type, entity_id, new_data)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_metadata);
end;
$$;


-- ============================================================================
--  MODULE 10 — AUTOMATISATIONS LMS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 10.1 update_progress() : recalcul de la progression d'une inscription
-- ----------------------------------------------------------------------------
create or replace function public.update_progress(p_enrollment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total     int;
  v_done      int;
  v_pct       int;
  v_formation uuid;
begin
  select formation_id into v_formation
  from public.enrollments where id = p_enrollment_id;

  select count(*) into v_total
  from public.modules where formation_id = v_formation;

  select count(*) into v_done
  from public.enrollment_modules
  where enrollment_id = p_enrollment_id and is_completed;

  v_pct := case when v_total > 0 then round((v_done::numeric / v_total) * 100) else 0 end;

  update public.enrollments
  set progress_pct = v_pct,
      status = case
        when v_pct = 100 then 'completed'
        when v_pct > 0 and status = 'enrolled' then 'in_progress'
        else status
      end,
      started_at   = coalesce(started_at, case when v_pct > 0 then now() end),
      completed_at = case when v_pct = 100 then coalesce(completed_at, now()) else completed_at end
  where id = p_enrollment_id;
end;
$$;

-- Trigger : progression module → recalcul inscription
create or replace function public.fn_on_module_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.update_progress(old.enrollment_id);
    return old;
  end if;
  if new.is_completed and new.completed_at is null then
    new.completed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_module_progress_before on public.enrollment_modules;
create trigger trg_module_progress_before
  before insert or update of is_completed on public.enrollment_modules
  for each row execute function public.fn_on_module_progress();

create or replace function public.fn_on_module_progress_after()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.update_progress((case when tg_op = 'DELETE' then old.enrollment_id else new.enrollment_id end));
  return null;
end;
$$;

drop trigger if exists trg_module_progress_after on public.enrollment_modules;
create trigger trg_module_progress_after
  after insert or update of is_completed or delete on public.enrollment_modules
  for each row execute function public.fn_on_module_progress_after();

-- Trigger : leçon complétée → module complété si toutes les leçons le sont
create or replace function public.fn_on_lesson_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_module_id    uuid;
  v_total        int;
  v_done         int;
begin
  if new.is_completed and (tg_op = 'INSERT' or not old.is_completed) then
    new.completed_at := coalesce(new.completed_at, now());

    select module_id into v_module_id from public.lessons where id = new.lesson_id;

    select count(*) into v_total
    from public.lessons where module_id = v_module_id;

    select count(*) into v_done
    from public.lesson_progress lp
    join public.lessons l on l.id = lp.lesson_id
    where lp.enrollment_id = new.enrollment_id
      and l.module_id = v_module_id
      and lp.is_completed
      and lp.lesson_id <> new.lesson_id;

    if v_done + 1 >= v_total then
      insert into public.enrollment_modules (enrollment_id, module_id, is_completed, completed_at)
      values (new.enrollment_id, v_module_id, true, now())
      on conflict (enrollment_id, module_id)
      do update set is_completed = true, completed_at = coalesce(enrollment_modules.completed_at, now());
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lesson_progress on public.lesson_progress;
create trigger trg_lesson_progress
  before insert or update of is_completed on public.lesson_progress
  for each row execute function public.fn_on_lesson_progress();

-- ----------------------------------------------------------------------------
-- 10.2 Inscription complétée → certificat automatique (si formation certifiante)
-- ----------------------------------------------------------------------------
create or replace function public.fn_on_enrollment_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_certifying boolean;
begin
  if new.status = 'completed' and coalesce(old.status, '') <> 'completed' then
    select is_certifying into v_is_certifying
    from public.formations where id = new.formation_id;

    if coalesce(v_is_certifying, false) then
      begin
        perform public.issue_certificate(new.id);
      exception when others then
        -- Quiz requis non réussi : on n'interrompt pas la complétion
        raise notice 'Certificat non émis pour % : %', new.id, sqlerrm;
      end;
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_on_enrollment_completed on public.enrollments;
create trigger trg_on_enrollment_completed
  after update of status on public.enrollments
  for each row execute function public.fn_on_enrollment_completed();

-- ----------------------------------------------------------------------------
-- 10.3 update_course_rating() : note moyenne des formations
-- ----------------------------------------------------------------------------
create or replace function public.update_course_rating(p_formation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.formations f
  set rating = coalesce(sub.avg_rating, 0),
      rating_count = coalesce(sub.cnt, 0)
  from (
    select round(avg(rating)::numeric, 2) as avg_rating, count(*) as cnt
    from public.reviews
    where formation_id = p_formation_id and status = 'published'
  ) sub
  where f.id = p_formation_id;
end;
$$;

create or replace function public.fn_on_review_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.update_course_rating((case when tg_op = 'DELETE' then old.formation_id else new.formation_id end));
  return null;
end;
$$;

drop trigger if exists trg_on_review_change on public.reviews;
create trigger trg_on_review_change
  after insert or update of rating, status or delete on public.reviews
  for each row execute function public.fn_on_review_change();

-- ----------------------------------------------------------------------------
-- 10.4 update_student_stats() : statistiques du profil apprenant
-- ----------------------------------------------------------------------------
create or replace function public.update_student_stats(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles p
  set courses_enrolled  = coalesce(e.total, 0),
      courses_completed = coalesce(e.completed, 0),
      certificates_count = coalesce(c.cnt, 0),
      total_learning_minutes = coalesce(la.minutes, 0)
  from (
    select
      count(*) filter (where status <> 'cancelled') as total,
      count(*) filter (where status = 'completed')  as completed
    from public.enrollments where user_id = p_user_id
  ) e,
  (
    select count(*) as cnt from public.certificates
    where user_id = p_user_id and status = 'issued'
  ) c,
  (
    select coalesce(sum(ceil(time_spent_sec / 60.0)), 0)::int as minutes
    from public.learning_analytics where user_id = p_user_id
  ) la
  where p.id = p_user_id;
end;
$$;

create or replace function public.fn_on_enrollment_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.update_student_stats((case when tg_op = 'DELETE' then old.user_id else new.user_id end));
  return null;
end;
$$;

drop trigger if exists trg_enrollment_stats on public.enrollments;
create trigger trg_enrollment_stats
  after insert or update of status or delete on public.enrollments
  for each row execute function public.fn_on_enrollment_stats();

create or replace function public.fn_on_certificate_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.update_student_stats((case when tg_op = 'DELETE' then old.user_id else new.user_id end));
  return null;
end;
$$;

drop trigger if exists trg_certificate_stats on public.certificates;
create trigger trg_certificate_stats
  after insert or update of status or delete on public.certificates
  for each row execute function public.fn_on_certificate_stats();

-- ----------------------------------------------------------------------------
-- 10.5 Compteurs dénormalisés : formations.students_count / modules_count
-- ----------------------------------------------------------------------------
create or replace function public.fn_sync_formation_counters()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_formation uuid;
begin
  v_formation := (case when tg_op = 'DELETE' then old.formation_id else new.formation_id end);

  if tg_table_name = 'enrollments' then
    update public.formations
    set students_count = (
      select count(*) from public.enrollments
      where formation_id = v_formation and status <> 'cancelled'
    )
    where id = v_formation;
  elsif tg_table_name = 'modules' then
    update public.formations
    set modules_count = (
      select count(*) from public.modules where formation_id = v_formation
    )
    where id = v_formation;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_formation_students_count on public.enrollments;
create trigger trg_formation_students_count
  after insert or update of status or delete on public.enrollments
  for each row execute function public.fn_sync_formation_counters();

drop trigger if exists trg_formation_modules_count on public.modules;
create trigger trg_formation_modules_count
  after insert or delete on public.modules
  for each row execute function public.fn_sync_formation_counters();

-- ----------------------------------------------------------------------------
-- 10.6 Sessions : compteur d'inscrits + statut automatique
-- ----------------------------------------------------------------------------
create or replace function public.fn_sync_session_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session uuid;
  v_max     int;
  v_count   int;
begin
  v_session := (case when tg_op = 'DELETE' then old.session_id else new.session_id end);
  if v_session is null then return null; end if;

  select count(*) into v_count
  from public.enrollments
  where session_id = v_session and status <> 'cancelled';

  select max_participants into v_max
  from public.sessions where id = v_session;

  update public.sessions
  set enrolled_count = v_count,
      status = case
        when status in ('closed','cancelled') then status
        when v_count >= v_max then 'full'
        when v_count >= v_max * 0.8 then 'few_spots'
        else 'available'
      end
  where id = v_session;
  return null;
end;
$$;

drop trigger if exists trg_session_count on public.enrollments;
create trigger trg_session_count
  after insert or update of session_id, status or delete on public.enrollments
  for each row execute function public.fn_sync_session_count();

-- ----------------------------------------------------------------------------
-- 10.7 Compteur formations des parcours
-- ----------------------------------------------------------------------------
create or replace function public.fn_sync_parcours_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parcours uuid;
begin
  v_parcours := (case when tg_op = 'DELETE' then old.parcours_id else new.parcours_id end);
  update public.parcours
  set formations_count = (
    select count(*) from public.parcours_formations where parcours_id = v_parcours
  )
  where id = v_parcours;
  return null;
end;
$$;

drop trigger if exists trg_parcours_count on public.parcours_formations;
create trigger trg_parcours_count
  after insert or delete on public.parcours_formations
  for each row execute function public.fn_sync_parcours_count();

-- ----------------------------------------------------------------------------
-- 10.8 Compteur formations des instructeurs
-- ----------------------------------------------------------------------------
create or replace function public.fn_sync_instructor_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_instructor uuid;
begin
  v_instructor := (case when tg_op = 'DELETE' then old.instructor_id else new.instructor_id end);
  update public.instructors
  set formations_count = (
    select count(*) from public.formation_instructors where instructor_id = v_instructor
  )
  where id = v_instructor;
  return null;
end;
$$;

drop trigger if exists trg_instructor_count on public.formation_instructors;
create trigger trg_instructor_count
  after insert or delete on public.formation_instructors
  for each row execute function public.fn_sync_instructor_count();

-- ----------------------------------------------------------------------------
-- 10.9 updated_at automatique sur toutes les tables concernées
-- ----------------------------------------------------------------------------
drop trigger if exists trg_updated_at_profiles on public.profiles;
create trigger trg_updated_at_profiles
  before update on public.profiles
  for each row execute function public.fn_set_updated_at();

drop trigger if exists trg_updated_at_formations on public.formations;
create trigger trg_updated_at_formations
  before update on public.formations
  for each row execute function public.fn_set_updated_at();

drop trigger if exists trg_updated_at_instructors on public.instructors;
create trigger trg_updated_at_instructors
  before update on public.instructors
  for each row execute function public.fn_set_updated_at();

drop trigger if exists trg_updated_at_enrollments on public.enrollments;
create trigger trg_updated_at_enrollments
  before update on public.enrollments
  for each row execute function public.fn_set_updated_at();

drop trigger if exists trg_updated_at_reviews on public.reviews;
create trigger trg_updated_at_reviews
  before update on public.reviews
  for each row execute function public.fn_set_updated_at();

drop trigger if exists trg_updated_at_quizzes on public.quizzes;
create trigger trg_updated_at_quizzes
  before update on public.quizzes
  for each row execute function public.fn_set_updated_at();

drop trigger if exists trg_updated_at_payments on public.payments;
create trigger trg_updated_at_payments
  before update on public.payments
  for each row execute function public.fn_set_updated_at();

drop trigger if exists trg_updated_at_subscriptions on public.subscriptions;
create trigger trg_updated_at_subscriptions
  before update on public.subscriptions
  for each row execute function public.fn_set_updated_at();

drop trigger if exists trg_updated_at_providers on public.payment_providers;
create trigger trg_updated_at_providers
  before update on public.payment_providers
  for each row execute function public.fn_set_updated_at();

drop trigger if exists trg_updated_at_lesson_progress on public.lesson_progress;
create trigger trg_updated_at_lesson_progress
  before update on public.lesson_progress
  for each row execute function public.fn_set_updated_at();


-- ============================================================================
--  MODULE 11 — PERFORMANCE : INDEXES
-- ============================================================================

-- LMS
create index if not exists idx_formations_domain      on public.formations (domain_id);
create index if not exists idx_formations_level       on public.formations (level_id);
create index if not exists idx_formations_published   on public.formations (is_published, is_featured) where is_published;
create index if not exists idx_formations_slug        on public.formations (slug);
create index if not exists idx_formations_search      on public.formations using gin (search_vector);
create index if not exists idx_formations_title_trgm  on public.formations using gin (title gin_trgm_ops);

create index if not exists idx_modules_formation      on public.modules (formation_id, order_index);
create index if not exists idx_lessons_module         on public.lessons (module_id, order_index);
create index if not exists idx_sessions_formation     on public.sessions (formation_id, date_start);
create index if not exists idx_sessions_upcoming      on public.sessions (date_start) where status in ('available','few_spots');

create index if not exists idx_enrollments_user       on public.enrollments (user_id);
create index if not exists idx_enrollments_formation  on public.enrollments (formation_id);
create index if not exists idx_enrollments_status     on public.enrollments (status);
create index if not exists idx_enrollments_user_status on public.enrollments (user_id, status);
create index if not exists idx_enrollment_modules_enr on public.enrollment_modules (enrollment_id);
create index if not exists idx_lesson_progress_enr    on public.lesson_progress (enrollment_id);
create index if not exists idx_lesson_progress_lesson on public.lesson_progress (lesson_id);

create index if not exists idx_reviews_formation      on public.reviews (formation_id) where status = 'published';
create index if not exists idx_reviews_user           on public.reviews (user_id);
create index if not exists idx_notifications_user     on public.notifications (user_id, is_read, created_at desc);
create index if not exists idx_contacts_status        on public.contacts (status, created_at desc);
create index if not exists idx_faqs_formation         on public.faqs (formation_id) where is_visible;

-- Quizzes
create index if not exists idx_quizzes_formation      on public.quizzes (formation_id) where is_published;
create index if not exists idx_questions_quiz         on public.questions (quiz_id, order_index) where is_active;
create index if not exists idx_question_answers_q     on public.question_answers (question_id);
create index if not exists idx_quiz_attempts_user     on public.quiz_attempts (user_id, quiz_id);
create index if not exists idx_quiz_attempts_quiz     on public.quiz_attempts (quiz_id) where passed;
create index if not exists idx_quiz_responses_attempt on public.quiz_responses (attempt_id);

-- Certificats
create index if not exists idx_certificates_user      on public.certificates (user_id);
create index if not exists idx_certificates_code      on public.certificates (certificate_code);
create index if not exists idx_certificates_status    on public.certificates (status) where status = 'issued';
create index if not exists idx_certificate_events_c   on public.certificate_events (certificate_id, created_at desc);

-- Paiements
create index if not exists idx_payments_user          on public.payments (user_id, created_at desc);
create index if not exists idx_payments_status        on public.payments (status);
create index if not exists idx_payments_provider      on public.payments (provider_id);
create index if not exists idx_payments_succeeded     on public.payments (paid_at desc) where status = 'succeeded';
create index if not exists idx_payment_history_p      on public.payment_status_history (payment_id, created_at);
create index if not exists idx_refunds_payment        on public.refunds (payment_id);
create index if not exists idx_subscriptions_user     on public.subscriptions (user_id) where status = 'active';
create index if not exists idx_invoices_user          on public.invoices (user_id, issued_at desc);
create index if not exists idx_invoices_number        on public.invoices (invoice_number);
create index if not exists idx_promo_codes_code       on public.promo_codes (code) where is_active;
create index if not exists idx_promo_redemptions_user on public.promo_code_redemptions (user_id, promo_code_id);
create index if not exists idx_webhooks_received      on public.payment_webhooks (provider_code, received_at desc);
create index if not exists idx_webhooks_unprocessed   on public.payment_webhooks (received_at) where status = 'received';
create index if not exists idx_payment_methods_user   on public.payment_methods (user_id) where is_active;

-- Analytics
create index if not exists idx_learning_user_date     on public.learning_analytics (user_id, created_at desc);
create index if not exists idx_learning_formation     on public.learning_analytics (formation_id, event_type);
create index if not exists idx_learning_event_date    on public.learning_analytics (event_type, created_at desc);
create index if not exists idx_analytics_daily_day    on public.analytics_daily (day desc);

-- Admin & audit
create index if not exists idx_admin_users_user       on public.admin_users (user_id) where is_active;
create index if not exists idx_audit_logs_entity      on public.audit_logs (entity_type, entity_id);
create index if not exists idx_audit_logs_user        on public.audit_logs (user_id, created_at desc);
create index if not exists idx_audit_logs_date        on public.audit_logs (created_at desc);


-- ============================================================================
--  MODULE 11 (suite) — VUES SQL UTILES
-- ============================================================================

-- Catalogue public enrichi
create or replace view public.v_formations_catalog as
select
  f.id, f.slug, f.title, f.short_description, f.price_ht, f.price_sur_devis,
  f.currency, f.duration_hours, f.duration_days, f.is_certifying,
  f.is_cpf_eligible, f.is_featured, f.rating, f.rating_count,
  f.students_count, f.modules_count, f.thumbnail_url,
  d.code as domain_code, d.name as domain_name, d.color as domain_color,
  l.code as level_code,  l.name as level_name,
  fo.code as format_code, fo.name as format_name,
  (select array_agg(t.name order by t.name)
     from public.formation_tools ft
     join public.tools t on t.id = ft.tool_id
    where ft.formation_id = f.id) as tools,
  (select array_agg(i.first_name || ' ' || i.last_name)
     from public.formation_instructors fi
     join public.instructors i on i.id = fi.instructor_id
    where fi.formation_id = f.id) as instructors
from public.formations f
left join public.domains d  on d.id  = f.domain_id
left join public.levels  l  on l.id  = f.level_id
left join public.formats fo on fo.id = f.format_id
where f.is_published;

-- Tableau de bord apprenant
create or replace view public.v_my_enrollments as
select
  e.id, e.user_id, e.status, e.progress_pct, e.enrolled_at, e.started_at,
  e.completed_at, e.certificate_code, e.payment_status,
  f.id as formation_id, f.slug, f.title, f.thumbnail_url, f.duration_hours,
  d.name as domain_name, d.color as domain_color,
  (select count(*) from public.modules m where m.formation_id = f.id) as total_modules,
  (select count(*) from public.enrollment_modules em
    where em.enrollment_id = e.id and em.is_completed) as completed_modules
from public.enrollments e
join public.formations f on f.id = e.formation_id
left join public.domains d on d.id = f.domain_id;

-- Statistiques quiz par quiz (admin / instructeur)
create or replace view public.v_quiz_statistics as
select
  q.id as quiz_id, q.title, q.formation_id, q.passing_score_pct,
  count(qa.id)                                   as total_attempts,
  count(qa.id) filter (where qa.passed)          as passed_attempts,
  count(distinct qa.user_id)                     as unique_users,
  count(distinct qa.user_id) filter (where qa.passed) as unique_passed,
  round(avg(qa.score_pct) filter (where qa.status = 'submitted'), 2) as avg_score_pct,
  round(
    100.0 * count(qa.id) filter (where qa.passed)
    / nullif(count(qa.id) filter (where qa.status = 'submitted'), 0), 2
  ) as pass_rate_pct
from public.quizzes q
left join public.quiz_attempts qa on qa.quiz_id = q.id
group by q.id, q.title, q.formation_id, q.passing_score_pct;

-- Revenus mensuels (admin finance)
create or replace view public.v_revenue_monthly as
select
  date_trunc('month', p.paid_at)::date as month,
  p.currency,
  pp.code as provider_code,
  count(*)                 as payments_count,
  sum(p.amount)            as gross_revenue,
  sum(p.fee_amount)        as total_fees,
  sum(p.discount_amount)   as total_discounts,
  coalesce(sum(r.refunded), 0) as refunded_amount,
  sum(p.amount) - coalesce(sum(r.refunded), 0) as net_revenue
from public.payments p
join public.payment_providers pp on pp.id = p.provider_id
left join lateral (
  select sum(amount) as refunded
  from public.refunds where payment_id = p.id and status = 'succeeded'
) r on true
where p.status in ('succeeded','partially_refunded','refunded')
group by 1, 2, 3
order by 1 desc;

-- Vue 360 d'un apprenant (admin support)
create or replace view public.v_student_overview as
select
  p.id, p.prenom, p.nom, p.email, p.role, p.subscription_plan,
  p.courses_enrolled, p.courses_completed, p.certificates_count,
  p.total_learning_minutes, p.quiz_passed_count,
  p.created_at as registered_at, p.last_seen_at,
  (select coalesce(sum(amount), 0) from public.payments
    where user_id = p.id and status = 'succeeded') as lifetime_value,
  (select count(*) from public.reviews where user_id = p.id) as reviews_count
from public.profiles p;

-- Vue matérialisée : statistiques formations (rafraîchir via cron)
drop materialized view if exists public.mv_formation_stats;
create materialized view public.mv_formation_stats as
select
  f.id as formation_id,
  f.title,
  f.is_published,
  count(distinct e.id)                                        as enrollments_total,
  count(distinct e.id) filter (where e.status = 'completed')  as enrollments_completed,
  round(
    100.0 * count(distinct e.id) filter (where e.status = 'completed')
    / nullif(count(distinct e.id), 0), 2
  )                                                           as completion_rate_pct,
  round(avg(e.progress_pct), 1)                               as avg_progress_pct,
  coalesce(sum(p.amount) filter (where p.status = 'succeeded'), 0) as total_revenue,
  count(distinct c.id)                                        as certificates_issued,
  f.rating, f.rating_count
from public.formations f
left join public.enrollments e on e.formation_id = f.id and e.status <> 'cancelled'
left join public.payments p    on p.formation_id = f.id
left join public.certificates c on c.formation_id = f.id and c.status = 'issued'
group by f.id, f.title, f.is_published, f.rating, f.rating_count;

create unique index if not exists uq_mv_formation_stats
  on public.mv_formation_stats (formation_id);

-- Rafraîchissement (planifier : select public.refresh_formation_stats();)
create or replace function public.refresh_formation_stats()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view concurrently public.mv_formation_stats;
end;
$$;


-- ============================================================================
--  MODULE 8 — STORAGE : BUCKETS & POLICIES
-- ============================================================================

-- Buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',       'avatars',       true,  5242880,    array['image/jpeg','image/png','image/webp','image/gif']),
  ('certificates',  'certificates',  false, 10485760,   array['application/pdf']),
  ('course-assets', 'course-assets', true,  52428800,   array['image/jpeg','image/png','image/webp','application/pdf','application/zip','text/plain']),
  ('lesson-videos', 'lesson-videos', false, 2147483648, array['video/mp4','video/webm','video/quicktime'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- avatars : lecture publique ; chacun gère son dossier {user_id}/...
-- ----------------------------------------------------------------------------
drop policy if exists "avatars_public_read"   on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_own_insert" on storage.objects;
create policy "avatars_own_insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_own_update" on storage.objects;
create policy "avatars_own_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_own_delete" on storage.objects;
create policy "avatars_own_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.fn_is_admin())
  );

-- ----------------------------------------------------------------------------
-- certificates : lecture par le propriétaire ({user_id}/...) et les admins ;
-- écriture réservée au backend (service_role) et aux admins
-- ----------------------------------------------------------------------------
drop policy if exists "certificates_own_read" on storage.objects;
create policy "certificates_own_read" on storage.objects
  for select using (
    bucket_id = 'certificates'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.fn_is_admin())
  );

drop policy if exists "certificates_admin_write" on storage.objects;
create policy "certificates_admin_write" on storage.objects
  for insert with check (
    bucket_id = 'certificates' and public.fn_is_admin()
  );

drop policy if exists "certificates_admin_delete" on storage.objects;
create policy "certificates_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'certificates' and public.fn_is_super_admin()
  );

-- ----------------------------------------------------------------------------
-- course-assets : lecture publique ; écriture instructeurs + admins
-- ----------------------------------------------------------------------------
drop policy if exists "course_assets_public_read" on storage.objects;
create policy "course_assets_public_read" on storage.objects
  for select using (bucket_id = 'course-assets');

drop policy if exists "course_assets_staff_insert" on storage.objects;
create policy "course_assets_staff_insert" on storage.objects
  for insert with check (
    bucket_id = 'course-assets' and public.fn_is_instructor()
  );

drop policy if exists "course_assets_staff_update" on storage.objects;
create policy "course_assets_staff_update" on storage.objects
  for update using (
    bucket_id = 'course-assets' and public.fn_is_instructor()
  );

drop policy if exists "course_assets_staff_delete" on storage.objects;
create policy "course_assets_staff_delete" on storage.objects
  for delete using (
    bucket_id = 'course-assets' and public.fn_is_admin()
  );

-- ----------------------------------------------------------------------------
-- lesson-videos : lecture réservée aux inscrits de la formation
-- (chemin attendu : {formation_id}/{lesson_id}.mp4) ; écriture staff
-- ----------------------------------------------------------------------------
drop policy if exists "lesson_videos_enrolled_read" on storage.objects;
create policy "lesson_videos_enrolled_read" on storage.objects
  for select using (
    bucket_id = 'lesson-videos'
    and (
      public.fn_is_instructor()
      or exists (
        select 1 from public.enrollments e
        where e.user_id = auth.uid()
          and e.status <> 'cancelled'
          and e.formation_id::text = (storage.foldername(name))[1]
      )
    )
  );

drop policy if exists "lesson_videos_staff_insert" on storage.objects;
create policy "lesson_videos_staff_insert" on storage.objects
  for insert with check (
    bucket_id = 'lesson-videos' and public.fn_is_instructor()
  );

drop policy if exists "lesson_videos_staff_update" on storage.objects;
create policy "lesson_videos_staff_update" on storage.objects
  for update using (
    bucket_id = 'lesson-videos' and public.fn_is_instructor()
  );

drop policy if exists "lesson_videos_staff_delete" on storage.objects;
create policy "lesson_videos_staff_delete" on storage.objects
  for delete using (
    bucket_id = 'lesson-videos' and public.fn_is_admin()
  );


-- ============================================================================
--  MODULE 9 — SÉCURITÉ : ROW LEVEL SECURITY
-- ============================================================================

-- Activation RLS sur TOUTES les tables
alter table public.domains               enable row level security;
alter table public.levels                enable row level security;
alter table public.formats               enable row level security;
alter table public.tools                 enable row level security;
alter table public.financing_options     enable row level security;
alter table public.instructors           enable row level security;
alter table public.profiles              enable row level security;
alter table public.formations            enable row level security;
alter table public.formation_tools       enable row level security;
alter table public.formation_financing   enable row level security;
alter table public.formation_instructors enable row level security;
alter table public.modules               enable row level security;
alter table public.lessons               enable row level security;
alter table public.sessions              enable row level security;
alter table public.enrollments           enable row level security;
alter table public.enrollment_modules    enable row level security;
alter table public.lesson_progress       enable row level security;
alter table public.parcours              enable row level security;
alter table public.parcours_formations   enable row level security;
alter table public.reviews               enable row level security;
alter table public.faqs                  enable row level security;
alter table public.contacts              enable row level security;
alter table public.partners              enable row level security;
alter table public.notifications         enable row level security;
alter table public.quizzes               enable row level security;
alter table public.questions             enable row level security;
alter table public.question_answers      enable row level security;
alter table public.quiz_attempts         enable row level security;
alter table public.quiz_responses        enable row level security;
alter table public.certificate_templates enable row level security;
alter table public.certificates          enable row level security;
alter table public.certificate_events    enable row level security;
alter table public.payment_providers     enable row level security;
alter table public.payment_methods       enable row level security;
alter table public.payments              enable row level security;
alter table public.payment_status_history enable row level security;
alter table public.refunds               enable row level security;
alter table public.subscriptions         enable row level security;
alter table public.invoices              enable row level security;
alter table public.promo_codes           enable row level security;
alter table public.promo_code_redemptions enable row level security;
alter table public.payment_webhooks      enable row level security;
alter table public.learning_analytics    enable row level security;
alter table public.analytics_daily       enable row level security;
alter table public.admin_roles           enable row level security;
alter table public.admin_permissions     enable row level security;
alter table public.role_permissions      enable row level security;
alter table public.admin_users           enable row level security;
alter table public.audit_logs            enable row level security;

-- ----------------------------------------------------------------------------
-- 9.1 Référentiels publics : lecture pour tous, écriture admin
-- ----------------------------------------------------------------------------
drop policy if exists "domains_read"        on public.domains;
create policy "domains_read" on public.domains for select using (true);
drop policy if exists "domains_admin_write" on public.domains;
create policy "domains_admin_write" on public.domains for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());

drop policy if exists "levels_read"         on public.levels;
create policy "levels_read" on public.levels for select using (true);
drop policy if exists "levels_admin_write"  on public.levels;
create policy "levels_admin_write" on public.levels for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());

drop policy if exists "formats_read"        on public.formats;
create policy "formats_read" on public.formats for select using (true);
drop policy if exists "formats_admin_write" on public.formats;
create policy "formats_admin_write" on public.formats for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());

drop policy if exists "tools_read"          on public.tools;
create policy "tools_read" on public.tools for select using (true);
drop policy if exists "tools_admin_write"   on public.tools;
create policy "tools_admin_write" on public.tools for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());

drop policy if exists "financing_read"      on public.financing_options;
create policy "financing_read" on public.financing_options for select using (true);
drop policy if exists "financing_admin"     on public.financing_options;
create policy "financing_admin" on public.financing_options for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());

drop policy if exists "instructors_read"    on public.instructors;
create policy "instructors_read" on public.instructors for select using (is_active or public.fn_is_admin());
drop policy if exists "instructors_admin"   on public.instructors;
create policy "instructors_admin" on public.instructors for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());

drop policy if exists "partners_read"       on public.partners;
create policy "partners_read" on public.partners for select using (is_active or public.fn_is_admin());
drop policy if exists "partners_admin"      on public.partners;
create policy "partners_admin" on public.partners for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());

drop policy if exists "faqs_read"           on public.faqs;
create policy "faqs_read" on public.faqs for select using (is_visible or public.fn_is_admin());
drop policy if exists "faqs_admin"          on public.faqs;
create policy "faqs_admin" on public.faqs for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());

-- ----------------------------------------------------------------------------
-- 9.2 Profils
-- ----------------------------------------------------------------------------
drop policy if exists "profiles_own_read"   on public.profiles;
create policy "profiles_own_read" on public.profiles for select
  using (auth.uid() = id or public.fn_is_admin());

drop policy if exists "profiles_own_insert" on public.profiles;
create policy "profiles_own_insert" on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_own_update" on public.profiles;
create policy "profiles_own_update" on public.profiles for update
  using (auth.uid() = id or public.fn_is_admin())
  with check (
    -- Un utilisateur ne peut pas s'auto-promouvoir : seul un admin change role/plan
    (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()))
    or public.fn_is_admin()
  );

drop policy if exists "profiles_admin_delete" on public.profiles;
create policy "profiles_admin_delete" on public.profiles for delete
  using (public.fn_is_super_admin());

-- ----------------------------------------------------------------------------
-- 9.3 Catalogue : formations publiées visibles par tous, le reste staff
-- ----------------------------------------------------------------------------
drop policy if exists "formations_public_read" on public.formations;
create policy "formations_public_read" on public.formations for select
  using (is_published or public.fn_is_instructor());

drop policy if exists "formations_staff_write" on public.formations;
create policy "formations_staff_write" on public.formations for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());

drop policy if exists "formation_tools_read" on public.formation_tools;
create policy "formation_tools_read" on public.formation_tools for select using (true);
drop policy if exists "formation_tools_admin" on public.formation_tools;
create policy "formation_tools_admin" on public.formation_tools for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());

drop policy if exists "formation_financing_read" on public.formation_financing;
create policy "formation_financing_read" on public.formation_financing for select using (true);
drop policy if exists "formation_financing_admin" on public.formation_financing;
create policy "formation_financing_admin" on public.formation_financing for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());

drop policy if exists "formation_instructors_read" on public.formation_instructors;
create policy "formation_instructors_read" on public.formation_instructors for select using (true);
drop policy if exists "formation_instructors_admin" on public.formation_instructors;
create policy "formation_instructors_admin" on public.formation_instructors for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());

drop policy if exists "modules_read" on public.modules;
create policy "modules_read" on public.modules for select
  using (
    public.fn_is_instructor()
    or exists (select 1 from public.formations f where f.id = formation_id and f.is_published)
  );
drop policy if exists "modules_admin" on public.modules;
create policy "modules_admin" on public.modules for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());

-- Leçons : preview public ; contenu complet réservé aux inscrits
drop policy if exists "lessons_read" on public.lessons;
create policy "lessons_read" on public.lessons for select
  using (
    is_preview
    or public.fn_is_instructor()
    or exists (
      select 1
      from public.enrollments e
      join public.modules m on m.id = lessons.module_id
      where e.user_id = auth.uid()
        and e.formation_id = m.formation_id
        and e.status <> 'cancelled'
    )
  );
drop policy if exists "lessons_admin" on public.lessons;
create policy "lessons_admin" on public.lessons for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());

drop policy if exists "sessions_read" on public.sessions;
create policy "sessions_read" on public.sessions for select using (true);
drop policy if exists "sessions_admin" on public.sessions;
create policy "sessions_admin" on public.sessions for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());

drop policy if exists "parcours_read" on public.parcours;
create policy "parcours_read" on public.parcours for select
  using (is_published or public.fn_is_admin());
drop policy if exists "parcours_admin" on public.parcours;
create policy "parcours_admin" on public.parcours for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());

drop policy if exists "parcours_formations_read" on public.parcours_formations;
create policy "parcours_formations_read" on public.parcours_formations for select using (true);
drop policy if exists "parcours_formations_admin" on public.parcours_formations;
create policy "parcours_formations_admin" on public.parcours_formations for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());

-- ----------------------------------------------------------------------------
-- 9.4 Inscriptions & progression : chacun les siennes
-- ----------------------------------------------------------------------------
drop policy if exists "enrollments_own" on public.enrollments;
create policy "enrollments_own" on public.enrollments for select
  using (auth.uid() = user_id or public.fn_is_admin());

drop policy if exists "enrollments_own_insert" on public.enrollments;
create policy "enrollments_own_insert" on public.enrollments for insert
  with check (auth.uid() = user_id or public.fn_is_admin());

drop policy if exists "enrollments_admin_update" on public.enrollments;
create policy "enrollments_admin_update" on public.enrollments for update
  using (auth.uid() = user_id or public.fn_is_admin());

drop policy if exists "enrollments_admin_delete" on public.enrollments;
create policy "enrollments_admin_delete" on public.enrollments for delete
  using (public.fn_is_admin());

drop policy if exists "enrollment_modules_own" on public.enrollment_modules;
create policy "enrollment_modules_own" on public.enrollment_modules for all
  using (
    public.fn_is_admin() or exists (
      select 1 from public.enrollments e
      where e.id = enrollment_id and e.user_id = auth.uid()
    )
  )
  with check (
    public.fn_is_admin() or exists (
      select 1 from public.enrollments e
      where e.id = enrollment_id and e.user_id = auth.uid()
    )
  );

drop policy if exists "lesson_progress_own" on public.lesson_progress;
create policy "lesson_progress_own" on public.lesson_progress for all
  using (
    public.fn_is_admin() or exists (
      select 1 from public.enrollments e
      where e.id = enrollment_id and e.user_id = auth.uid()
    )
  )
  with check (
    public.fn_is_admin() or exists (
      select 1 from public.enrollments e
      where e.id = enrollment_id and e.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 9.5 Avis
-- ----------------------------------------------------------------------------
drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews for select
  using (status = 'published' or auth.uid() = user_id or public.fn_is_admin());

drop policy if exists "reviews_own_insert" on public.reviews;
create policy "reviews_own_insert" on public.reviews for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.enrollments e
      where e.user_id = auth.uid() and e.formation_id = reviews.formation_id
        and e.status <> 'cancelled'
    )
  );

drop policy if exists "reviews_own_update" on public.reviews;
create policy "reviews_own_update" on public.reviews for update
  using (auth.uid() = user_id or public.fn_is_admin());

drop policy if exists "reviews_admin_delete" on public.reviews;
create policy "reviews_admin_delete" on public.reviews for delete
  using (auth.uid() = user_id or public.fn_is_admin());

-- ----------------------------------------------------------------------------
-- 9.6 Contacts & notifications
-- ----------------------------------------------------------------------------
drop policy if exists "contacts_public_insert" on public.contacts;
create policy "contacts_public_insert" on public.contacts for insert with check (true);
drop policy if exists "contacts_admin_read" on public.contacts;
create policy "contacts_admin_read" on public.contacts for select using (public.fn_is_admin());
drop policy if exists "contacts_admin_update" on public.contacts;
create policy "contacts_admin_update" on public.contacts for update using (public.fn_is_admin());
drop policy if exists "contacts_admin_delete" on public.contacts;
create policy "contacts_admin_delete" on public.contacts for delete using (public.fn_is_super_admin());

drop policy if exists "notif_own_read" on public.notifications;
create policy "notif_own_read" on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "notif_own_update" on public.notifications;
create policy "notif_own_update" on public.notifications for update using (auth.uid() = user_id);
drop policy if exists "notif_admin_insert" on public.notifications;
create policy "notif_admin_insert" on public.notifications for insert
  with check (public.fn_is_admin() or auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 9.7 Quizzes : étudiants voient quiz publiés ; réponses correctes cachées
-- ----------------------------------------------------------------------------
drop policy if exists "quizzes_read" on public.quizzes;
create policy "quizzes_read" on public.quizzes for select
  using (is_published or public.fn_is_instructor());
drop policy if exists "quizzes_admin" on public.quizzes;
create policy "quizzes_admin" on public.quizzes for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());

drop policy if exists "questions_read" on public.questions;
create policy "questions_read" on public.questions for select
  using (
    public.fn_is_instructor()
    or exists (select 1 from public.quizzes q where q.id = quiz_id and q.is_published)
  );
drop policy if exists "questions_admin" on public.questions;
create policy "questions_admin" on public.questions for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());

-- NB : is_correct est exposé ici pour permettre la correction côté client APRÈS
-- soumission. Pour un mode examen strict, servir les réponses via une fonction
-- SECURITY DEFINER qui masque is_correct tant que la tentative est en cours.
drop policy if exists "question_answers_read" on public.question_answers;
create policy "question_answers_read" on public.question_answers for select
  using (
    public.fn_is_instructor()
    or exists (
      select 1 from public.questions qq
      join public.quizzes q on q.id = qq.quiz_id
      where qq.id = question_id and q.is_published
    )
  );
drop policy if exists "question_answers_admin" on public.question_answers;
create policy "question_answers_admin" on public.question_answers for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());

drop policy if exists "quiz_attempts_own" on public.quiz_attempts;
create policy "quiz_attempts_own" on public.quiz_attempts for select
  using (auth.uid() = user_id or public.fn_is_instructor());
drop policy if exists "quiz_attempts_own_insert" on public.quiz_attempts;
create policy "quiz_attempts_own_insert" on public.quiz_attempts for insert
  with check (auth.uid() = user_id);
drop policy if exists "quiz_attempts_own_update" on public.quiz_attempts;
create policy "quiz_attempts_own_update" on public.quiz_attempts for update
  using (auth.uid() = user_id and status = 'in_progress');

drop policy if exists "quiz_responses_own" on public.quiz_responses;
create policy "quiz_responses_own" on public.quiz_responses for select
  using (
    public.fn_is_instructor() or exists (
      select 1 from public.quiz_attempts qa
      where qa.id = attempt_id and qa.user_id = auth.uid()
    )
  );
drop policy if exists "quiz_responses_own_write" on public.quiz_responses;
create policy "quiz_responses_own_write" on public.quiz_responses for insert
  with check (
    exists (
      select 1 from public.quiz_attempts qa
      where qa.id = attempt_id and qa.user_id = auth.uid()
        and qa.status = 'in_progress'
    )
  );
drop policy if exists "quiz_responses_own_update" on public.quiz_responses;
create policy "quiz_responses_own_update" on public.quiz_responses for update
  using (
    exists (
      select 1 from public.quiz_attempts qa
      where qa.id = attempt_id and qa.user_id = auth.uid()
        and qa.status = 'in_progress'
    )
  );

-- ----------------------------------------------------------------------------
-- 9.8 Certificats
-- ----------------------------------------------------------------------------
drop policy if exists "cert_templates_admin" on public.certificate_templates;
create policy "cert_templates_admin" on public.certificate_templates for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());
drop policy if exists "cert_templates_read" on public.certificate_templates;
create policy "cert_templates_read" on public.certificate_templates for select
  using (is_active or public.fn_is_admin());

drop policy if exists "certificates_own_read" on public.certificates;
create policy "certificates_own_read" on public.certificates for select
  using (auth.uid() = user_id or public.fn_is_admin());
-- Écriture uniquement via fonctions SECURITY DEFINER / service_role
drop policy if exists "certificates_admin_write" on public.certificates;
create policy "certificates_admin_write" on public.certificates for update
  using (public.fn_is_admin());
drop policy if exists "certificates_admin_delete" on public.certificates;
create policy "certificates_admin_delete" on public.certificates for delete
  using (public.fn_is_super_admin());

drop policy if exists "cert_events_read" on public.certificate_events;
create policy "cert_events_read" on public.certificate_events for select
  using (
    public.fn_is_admin() or exists (
      select 1 from public.certificates c
      where c.id = certificate_id and c.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 9.9 Paiements : lecture par le propriétaire, gestion admin finance
-- ----------------------------------------------------------------------------
drop policy if exists "providers_public_read" on public.payment_providers;
create policy "providers_public_read" on public.payment_providers for select
  using (is_active or public.fn_is_admin());
drop policy if exists "providers_admin" on public.payment_providers;
create policy "providers_admin" on public.payment_providers
  for all using (public.fn_has_admin_permission('payments.manage_providers'))
  with check (public.fn_has_admin_permission('payments.manage_providers'));

drop policy if exists "payment_methods_own" on public.payment_methods;
create policy "payment_methods_own" on public.payment_methods for all
  using (auth.uid() = user_id or public.fn_is_admin())
  with check (auth.uid() = user_id or public.fn_is_admin());

drop policy if exists "payments_own_read" on public.payments;
create policy "payments_own_read" on public.payments for select
  using (auth.uid() = user_id or public.fn_has_admin_permission('payments.read') or public.fn_is_admin());
drop policy if exists "payments_own_insert" on public.payments;
create policy "payments_own_insert" on public.payments for insert
  with check (auth.uid() = user_id or public.fn_is_admin());
-- Mise à jour des statuts : backend (service_role bypass RLS) ou admin
drop policy if exists "payments_admin_update" on public.payments;
create policy "payments_admin_update" on public.payments for update
  using (public.fn_is_admin());

drop policy if exists "payment_history_read" on public.payment_status_history;
create policy "payment_history_read" on public.payment_status_history for select
  using (
    public.fn_is_admin() or exists (
      select 1 from public.payments p
      where p.id = payment_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "refunds_own_read" on public.refunds;
create policy "refunds_own_read" on public.refunds for select
  using (
    public.fn_is_admin() or exists (
      select 1 from public.payments p
      where p.id = payment_id and p.user_id = auth.uid()
    )
  );
drop policy if exists "refunds_admin_write" on public.refunds;
create policy "refunds_admin_write" on public.refunds for insert
  with check (public.fn_has_admin_permission('payments.refund') or public.fn_is_super_admin());
drop policy if exists "refunds_admin_update" on public.refunds;
create policy "refunds_admin_update" on public.refunds for update
  using (public.fn_has_admin_permission('payments.refund') or public.fn_is_super_admin());

drop policy if exists "subscriptions_own" on public.subscriptions;
create policy "subscriptions_own" on public.subscriptions for select
  using (auth.uid() = user_id or public.fn_is_admin());
drop policy if exists "subscriptions_admin" on public.subscriptions;
create policy "subscriptions_admin" on public.subscriptions for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());

drop policy if exists "invoices_own_read" on public.invoices;
create policy "invoices_own_read" on public.invoices for select
  using (auth.uid() = user_id or public.fn_has_admin_permission('payments.read') or public.fn_is_admin());
drop policy if exists "invoices_admin" on public.invoices;
create policy "invoices_admin" on public.invoices for update
  using (public.fn_is_admin());

drop policy if exists "promo_codes_admin" on public.promo_codes;
create policy "promo_codes_admin" on public.promo_codes for all
  using (public.fn_is_admin()) with check (public.fn_is_admin());
-- Pas de SELECT public : validation via fonction validate_promo_code()

drop policy if exists "promo_redemptions_own" on public.promo_code_redemptions;
create policy "promo_redemptions_own" on public.promo_code_redemptions for select
  using (auth.uid() = user_id or public.fn_is_admin());

-- Webhooks : service_role uniquement (bypass RLS) — aucun accès client
drop policy if exists "webhooks_admin_read" on public.payment_webhooks;
create policy "webhooks_admin_read" on public.payment_webhooks for select
  using (public.fn_is_admin());

-- ----------------------------------------------------------------------------
-- 9.10 Analytics
-- ----------------------------------------------------------------------------
drop policy if exists "learning_own" on public.learning_analytics;
create policy "learning_own" on public.learning_analytics for select
  using (auth.uid() = user_id or public.fn_has_admin_permission('analytics.read') or public.fn_is_admin());
drop policy if exists "learning_own_insert" on public.learning_analytics;
create policy "learning_own_insert" on public.learning_analytics for insert
  with check (auth.uid() = user_id);

drop policy if exists "analytics_daily_admin" on public.analytics_daily;
create policy "analytics_daily_admin" on public.analytics_daily for select
  using (public.fn_has_admin_permission('analytics.read') or public.fn_is_admin());

-- ----------------------------------------------------------------------------
-- 9.11 Administration & audit
-- ----------------------------------------------------------------------------
drop policy if exists "admin_roles_read" on public.admin_roles;
create policy "admin_roles_read" on public.admin_roles for select using (public.fn_is_admin());
drop policy if exists "admin_roles_super" on public.admin_roles;
create policy "admin_roles_super" on public.admin_roles for all
  using (public.fn_is_super_admin()) with check (public.fn_is_super_admin());

drop policy if exists "admin_permissions_read" on public.admin_permissions;
create policy "admin_permissions_read" on public.admin_permissions for select using (public.fn_is_admin());
drop policy if exists "admin_permissions_super" on public.admin_permissions;
create policy "admin_permissions_super" on public.admin_permissions for all
  using (public.fn_is_super_admin()) with check (public.fn_is_super_admin());

drop policy if exists "role_permissions_read" on public.role_permissions;
create policy "role_permissions_read" on public.role_permissions for select using (public.fn_is_admin());
drop policy if exists "role_permissions_super" on public.role_permissions;
create policy "role_permissions_super" on public.role_permissions for all
  using (public.fn_is_super_admin()) with check (public.fn_is_super_admin());

drop policy if exists "admin_users_read" on public.admin_users;
create policy "admin_users_read" on public.admin_users for select using (public.fn_is_admin());
drop policy if exists "admin_users_super" on public.admin_users;
create policy "admin_users_super" on public.admin_users for all
  using (public.fn_is_super_admin()) with check (public.fn_is_super_admin());

drop policy if exists "audit_logs_admin_read" on public.audit_logs;
create policy "audit_logs_admin_read" on public.audit_logs for select
  using (public.fn_has_admin_permission('audit.read') or public.fn_is_super_admin());
-- Aucune policy INSERT/UPDATE/DELETE : écriture uniquement via triggers SECURITY DEFINER


-- ============================================================================
--  SEED DATA
-- ============================================================================

-- Domaines
insert into public.domains (code, name, description, icon, color, order_rank) values
  ('ai',    'Intelligence Artificielle', 'Machine Learning, LLMs, RAG, MLOps',        '🤖', '#009BF9', 1),
  ('data',  'Data Engineering',          'Pipelines, Fabric, Spark, dbt, Lakehouse',  '⚙️', '#00D68F', 2),
  ('cloud', 'Cloud & No-Code',           'Azure, AWS, Power Platform, automatisation','☁️', '#FFAA00', 3),
  ('bi',    'Business Intelligence',     'Power BI, DAX, modélisation, reporting',    '📊', '#B464FF', 4)
on conflict (code) do nothing;

-- Niveaux
insert into public.levels (code, name, order_rank) values
  ('debutant',      'Débutant',      1),
  ('intermediaire', 'Intermédiaire', 2),
  ('avance',        'Avancé',        3),
  ('expert',        'Expert',        4)
on conflict (code) do nothing;

-- Formats
insert into public.formats (code, name, description) values
  ('distanciel', 'Distanciel', 'Formation 100% en ligne, sessions live + replay'),
  ('presentiel', 'Présentiel', 'Formation en salle, Paris ou Douala'),
  ('hybride',    'Hybride',    'Mix présentiel et distanciel')
on conflict (code) do nothing;

-- Financement
insert into public.financing_options (code, name, description, code_rs) values
  ('cpf',            'CPF',               'Compte Personnel de Formation', '6789'),
  ('opco',           'OPCO',              'Financement via votre OPCO', null),
  ('plan_formation', 'Plan de formation', 'Prise en charge employeur', null),
  ('individuel',     'Individuel',        'Paiement personnel en 1 à 3 fois', null)
on conflict (code) do nothing;

-- Outils
insert into public.tools (name, category) values
  ('LangChain', 'Framework IA'), ('OpenAI API', 'LLM'), ('Python', 'Langage'),
  ('Docker', 'DevOps'), ('Kubernetes', 'DevOps'), ('Azure', 'Cloud'),
  ('AWS', 'Cloud'), ('Power BI', 'BI'), ('DAX', 'BI'), ('Power Query', 'BI'),
  ('Apache Spark', 'Data Engineering'), ('dbt', 'Data Engineering'),
  ('Microsoft Fabric', 'Data Engineering'), ('Git', 'DevOps'), ('SQL', 'Base de données'),
  ('PostgreSQL', 'Base de données'), ('Pinecone', 'Vector DB'), ('Chroma', 'Vector DB'),
  ('Hugging Face', 'Framework IA'), ('FastAPI', 'Framework Web'),
  ('Airflow', 'Orchestration'), ('MLflow', 'MLOps')
on conflict (name) do nothing;

-- Providers de paiement (Stripe, Orange Money, MTN MoMo actifs ; autres préconfigurés)
insert into public.payment_providers
  (code, name, provider_type, supported_currencies, supported_countries, fee_pct, fee_fixed, webhook_path, is_active, order_rank)
values
  ('stripe',       'Stripe',            'card',         array['EUR','USD','XAF'], array['FR','BE','CH','CA','US'], 1.40, 0.25, '/api/webhooks/stripe',       true,  1),
  ('orange_money', 'Orange Money',      'mobile_money', array['XAF','XOF'],       array['CM','CI','SN','ML','BF'], 1.50, 0.00, '/api/webhooks/orange-money', true,  2),
  ('mtn_momo',     'MTN Mobile Money',  'mobile_money', array['XAF','XOF','GHS'], array['CM','CI','GH','UG','RW'], 1.50, 0.00, '/api/webhooks/mtn-momo',     true,  3),
  ('wave',         'Wave',              'mobile_money', array['XOF'],             array['SN','CI'],                1.00, 0.00, '/api/webhooks/wave',         false, 4),
  ('paypal',       'PayPal',            'wallet',       array['EUR','USD'],       array['FR','BE','CH','CA','US'], 2.90, 0.35, '/api/webhooks/paypal',       false, 5),
  ('flutterwave',  'Flutterwave',       'aggregator',   array['XAF','XOF','NGN','USD'], array['CM','CI','SN','NG','GH'], 2.80, 0.00, '/api/webhooks/flutterwave', false, 6),
  ('cinetpay',     'CinetPay',          'aggregator',   array['XAF','XOF'],       array['CM','CI','SN','BF','ML'], 2.50, 0.00, '/api/webhooks/cinetpay',     false, 7)
on conflict (code) do nothing;

-- Rôles admin
insert into public.admin_roles (code, name, description, is_system) values
  ('SUPER_ADMIN',   'Super Administrateur', 'Accès total à la plateforme',                    true),
  ('ACADEMY_ADMIN', 'Admin Académie',       'Gestion des formations, sessions et apprenants', true),
  ('FINANCE_ADMIN', 'Admin Finance',        'Paiements, factures, remboursements',            true),
  ('CONTENT_ADMIN', 'Admin Contenu',        'Formations, modules, leçons, quiz',              true),
  ('SUPPORT_ADMIN', 'Admin Support',        'Contacts, avis, notifications',                  true)
on conflict (code) do nothing;

-- Permissions
insert into public.admin_permissions (code, name, category) values
  ('formations.read',           'Lire les formations',           'content'),
  ('formations.write',          'Créer/modifier les formations', 'content'),
  ('formations.publish',        'Publier les formations',        'content'),
  ('quizzes.write',             'Gérer les quiz',                'content'),
  ('certificates.issue',        'Émettre des certificats',       'academy'),
  ('certificates.revoke',       'Révoquer des certificats',      'academy'),
  ('enrollments.manage',        'Gérer les inscriptions',        'academy'),
  ('sessions.manage',           'Gérer les sessions',            'academy'),
  ('users.read',                'Lire les utilisateurs',         'users'),
  ('users.manage',              'Gérer les utilisateurs',        'users'),
  ('payments.read',             'Lire les paiements',            'finance'),
  ('payments.refund',           'Effectuer des remboursements',  'finance'),
  ('payments.manage_providers', 'Gérer les providers',           'finance'),
  ('invoices.manage',           'Gérer les factures',            'finance'),
  ('promo.manage',              'Gérer les codes promo',         'finance'),
  ('analytics.read',            'Consulter les analytics',       'analytics'),
  ('support.contacts',          'Gérer les contacts',            'support'),
  ('support.reviews',           'Modérer les avis',              'support'),
  ('audit.read',                'Consulter les logs d''audit',   'system')
on conflict (code) do nothing;

-- Attribution des permissions par rôle
-- SUPER_ADMIN : tout
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.admin_roles r cross join public.admin_permissions p
where r.code = 'SUPER_ADMIN'
on conflict do nothing;

-- ACADEMY_ADMIN
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.admin_roles r join public.admin_permissions p
  on p.code in ('formations.read','formations.write','formations.publish',
                'quizzes.write','certificates.issue','enrollments.manage',
                'sessions.manage','users.read','analytics.read')
where r.code = 'ACADEMY_ADMIN'
on conflict do nothing;

-- FINANCE_ADMIN
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.admin_roles r join public.admin_permissions p
  on p.code in ('payments.read','payments.refund','payments.manage_providers',
                'invoices.manage','promo.manage','analytics.read','users.read')
where r.code = 'FINANCE_ADMIN'
on conflict do nothing;

-- CONTENT_ADMIN
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.admin_roles r join public.admin_permissions p
  on p.code in ('formations.read','formations.write','quizzes.write')
where r.code = 'CONTENT_ADMIN'
on conflict do nothing;

-- SUPPORT_ADMIN
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.admin_roles r join public.admin_permissions p
  on p.code in ('support.contacts','support.reviews','users.read','formations.read')
where r.code = 'SUPPORT_ADMIN'
on conflict do nothing;

-- Template de certificat par défaut
insert into public.certificate_templates
  (code, name, description, signature_name, signature_title, body_template, is_default, is_active)
values (
  'default-2024',
  'Certificat PIDA Standard',
  'Template officiel Power Inside Data Academy',
  'Michel Bertrand MAMA',
  'Directeur Pédagogique',
  '{{student_name}} a complété avec succès la formation « {{formation_title}} » le {{issued_date}}. Code de vérification : {{certificate_code}}',
  true,
  true
)
on conflict (code) do nothing;

-- FAQ générales
insert into public.faqs (question, answer, category, order_rank) values
  ('Vos formations sont-elles éligibles au CPF ?',
   'Oui, plusieurs formations sont éligibles au CPF via notre partenaire certifié Qualiopi. Contactez-nous pour vérifier l''éligibilité de la formation souhaitée.',
   'financement', 1),
  ('Proposez-vous des formations en présentiel ?',
   'Nos formations sont principalement en distanciel mais nous proposons aussi des sessions en présentiel à Paris et Douala pour certains programmes.',
   'format', 2),
  ('Quelle est la durée d''accès aux supports ?',
   'Vous avez un accès à vie aux vidéos, supports et ressources pour toutes les formations achetées.',
   'contenu', 3),
  ('Y a-t-il un accompagnement personnalisé ?',
   'Chaque apprenant bénéficie de sessions live avec les formateurs, d''un Discord dédié et de corrections de projets personnalisées.',
   'format', 4),
  ('Puis-je obtenir une attestation de formation ?',
   'Oui, à la fin de chaque formation vous recevez une attestation + certification reconnue par nos entreprises partenaires selon le parcours.',
   'certification', 5),
  ('Quels moyens de paiement acceptez-vous ?',
   'Carte bancaire (Stripe), Orange Money et MTN Mobile Money. Paiement en 3 fois sans frais disponible, ainsi que le financement OPCO/CPF.',
   'financement', 6)
on conflict do nothing;

-- ============================================================================
--  FIN DU MASTER SQL — POWER INSIDE DATA ACADEMY
--
--  Post-installation recommandée :
--  1. Créer le premier super admin :
--     update public.profiles set role = 'super_admin' where email = 'VOTRE_EMAIL';
--     insert into public.admin_users (user_id, role_id)
--     select p.id, r.id from public.profiles p, public.admin_roles r
--     where p.email = 'VOTRE_EMAIL' and r.code = 'SUPER_ADMIN';
--
--  2. Planifier les tâches récurrentes (Dashboard → Database → Cron) :
--     select cron.schedule('expire-certificates', '0 3 * * *',
--       $$select public.fn_expire_certificates()$$);
--     select cron.schedule('refresh-formation-stats', '*/30 * * * *',
--       $$select public.refresh_formation_stats()$$);
--
--  3. Les webhooks de paiement écrivent dans payment_webhooks puis mettent à
--     jour payments.status via la clé service_role (bypass RLS).
-- ============================================================================
