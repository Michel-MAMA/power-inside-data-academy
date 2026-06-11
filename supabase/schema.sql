-- ============================================================
--  PIDA MARKETPLACE — Schéma Supabase complet
--  Colle ce fichier dans Supabase → SQL Editor → Run
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
--  Tables principales
-- ============================================================
create table if not exists domains (
  id          uuid primary key default uuid_generate_v4(),
  code        text not null unique,           -- 'ai', 'data', 'cloud', 'bi'
  name        text not null,
  description text,
  icon        text,                           -- emoji ou nom d'icône
  color       text,                           -- '#009BF9'
  order_rank  int  default 0,
  created_at  timestamptz default now()
);

-- ============================================================
--  2. NIVEAUX
-- ============================================================
create table if not exists levels (
  id         uuid primary key default uuid_generate_v4(),
  code       text not null unique,            -- 'debutant', 'intermediaire', 'avance', 'expert'
  name       text not null,
  order_rank int  default 0
);

-- ============================================================
--  3. FORMATS DE FORMATION
-- ============================================================
create table if not exists formats (
  id          uuid primary key default uuid_generate_v4(),
  code        text not null unique,           -- 'distanciel', 'presentiel', 'hybride'
  name        text not null,
  description text
);

-- ============================================================
--  4. OUTILS / TECHNOLOGIES
-- ============================================================
create table if not exists tools (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  category    text,                           -- 'Framework', 'Cloud', 'BI', 'Database'...
  icon_url    text,
  description text,
  created_at  timestamptz default now()
);

-- ============================================================
--  5. OPTIONS DE FINANCEMENT
-- ============================================================
create table if not exists financing_options (
  id          uuid primary key default uuid_generate_v4(),
  code        text not null unique,           -- 'cpf', 'opco', 'plan_formation', 'individuel'
  name        text not null,
  description text,
  code_rs     text,                           -- code CPF (ex: 6789)
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- ============================================================
--  6. FORMATEURS / INSTRUCTEURS
-- ============================================================
create table if not exists instructors (
  id                    uuid primary key default uuid_generate_v4(),
  first_name            text not null,
  last_name             text not null,
  bio                   text,
  expertise_areas       text[],              -- ['ML Engineer', 'Data Scientist']
  company               text,
  avatar_url            text,
  linkedin_url          text,
  rating                numeric(3,2) default 0,
  rating_count          int default 0,
  students_count        int default 0,
  formations_count      int default 0,
  is_active             boolean default true,
  created_at            timestamptz default now()
);

-- ============================================================
--  7. FORMATIONS
-- ============================================================
create table if not exists formations (
  id                   uuid primary key default uuid_generate_v4(),
  slug                 text not null unique,
  title                text not null,
  short_description    text,
  description          text,
  domain_id            uuid references domains(id) on delete set null,
  level_id             uuid references levels(id)  on delete set null,
  format_id            uuid references formats(id) on delete set null,
  duration_hours       int,                 -- 42
  duration_days        int,                 -- 5
  price_ht             numeric(10,2),
  price_sur_devis      boolean default false,
  currency             text default 'EUR',
  certification_code   text,               -- 'PID-LLM-01'
  is_certifying        boolean default false,
  is_cpf_eligible      boolean default false,
  is_opco_eligible     boolean default false,
  is_featured          boolean default false,
  is_published         boolean default false,
  modules_count        int default 0,
  projects_count       int default 0,
  students_count       int default 0,
  rating               numeric(3,2) default 0,
  rating_count         int default 0,
  thumbnail_url        text,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- ============================================================
--  8. FORMATION ↔ OUTILS (M2M)
-- ============================================================
create table if not exists formation_tools (
  formation_id uuid references formations(id) on delete cascade,
  tool_id      uuid references tools(id)      on delete cascade,
  primary key (formation_id, tool_id)
);

-- ============================================================
--  9. FORMATION ↔ FINANCEMENT (M2M)
-- ============================================================
create table if not exists formation_financing (
  formation_id      uuid references formations(id)       on delete cascade,
  financing_id      uuid references financing_options(id) on delete cascade,
  primary key (formation_id, financing_id)
);

-- ============================================================
--  10. FORMATION ↔ INSTRUCTEURS (M2M)
-- ============================================================
create table if not exists formation_instructors (
  formation_id   uuid references formations(id)  on delete cascade,
  instructor_id  uuid references instructors(id) on delete cascade,
  is_lead        boolean default false,
  primary key (formation_id, instructor_id)
);

-- ============================================================
--  11. MODULES (chapitres d'une formation)
-- ============================================================
create table if not exists modules (
  id             uuid primary key default uuid_generate_v4(),
  formation_id   uuid not null references formations(id) on delete cascade,
  title          text not null,
  description    text,
  order_index    int  not null default 0,
  duration_hours numeric(4,1),
  is_practical   boolean default false,
  created_at     timestamptz default now()
);

-- ============================================================
--  12. LEÇONS (contenu d'un module)
-- ============================================================
create table if not exists lessons (
  id           uuid primary key default uuid_generate_v4(),
  module_id    uuid not null references modules(id) on delete cascade,
  title        text not null,
  order_index  int  not null default 0,
  lesson_type  text default 'video',        -- 'video', 'workshop', 'quiz', 'project', 'certification'
  duration_min int,
  is_preview   boolean default false,       -- visible sans inscription
  video_url    text,
  content_url  text,
  created_at   timestamptz default now()
);

-- ============================================================
--  13. SESSIONS PLANIFIÉES
-- ============================================================
create table if not exists sessions (
  id                uuid primary key default uuid_generate_v4(),
  formation_id      uuid not null references formations(id) on delete cascade,
  instructor_id     uuid references instructors(id) on delete set null,
  date_start        date not null,
  date_end          date,
  time_start        time,
  time_end          time,
  format_id         uuid references formats(id) on delete set null,
  location          text,                   -- ville ou lien visio
  max_participants  int default 12,
  enrolled_count    int default 0,
  status            text default 'available', -- 'available', 'few_spots', 'full', 'closed', 'cancelled'
  is_intra          boolean default false,  -- formation intra-entreprise
  notes             text,
  created_at        timestamptz default now()
);

-- ============================================================
--  14. PROFILS UTILISATEURS (étend auth.users)
-- ============================================================
create table if not exists profiles (
  id         uuid primary key references auth.users on delete cascade,
  prenom     text,
  nom        text,
  email      text,
  phone      text,
  company    text,
  job_title  text,
  avatar_url text,
  bio        text,
  linkedin   text,
  role                    text default 'student',   -- 'student', 'instructor', 'admin'
  subscription_plan       text default 'free',      -- 'free', 'pro', 'annual'
  subscription_updated_at timestamptz,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- ============================================================
--  15. INSCRIPTIONS
-- ============================================================
create table if not exists enrollments (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references profiles(id) on delete cascade,
  formation_id       uuid not null references formations(id) on delete cascade,
  session_id         uuid references sessions(id) on delete set null,
  status             text default 'enrolled',  -- 'enrolled', 'in_progress', 'completed', 'cancelled'
  progress_pct       int  default 0,           -- 0-100
  enrolled_at        timestamptz default now(),
  started_at         timestamptz,
  completed_at       timestamptz,
  certificate_code   text unique,
  certificate_url    text,
  payment_status     text default 'pending',   -- 'pending', 'paid', 'refunded', 'cpf', 'opco'
  amount_paid        numeric(10,2),
  financing_id       uuid references financing_options(id),
  notes              text,
  unique(user_id, formation_id)
);

-- ============================================================
--  16. PROGRESSION PAR MODULE
-- ============================================================
create table if not exists enrollment_modules (
  id            uuid primary key default uuid_generate_v4(),
  enrollment_id uuid not null references enrollments(id)  on delete cascade,
  module_id     uuid not null references modules(id)       on delete cascade,
  is_completed  boolean default false,
  completed_at  timestamptz,
  unique(enrollment_id, module_id)
);

-- ============================================================
--  17. PARCOURS CERTIFIANTS
-- ============================================================
create table if not exists parcours (
  id              uuid primary key default uuid_generate_v4(),
  slug            text not null unique,
  title           text not null,
  description     text,
  level_id        uuid references levels(id),
  domain_id       uuid references domains(id),
  duration_weeks  int,
  formations_count int default 0,
  is_certifying   boolean default true,
  is_published    boolean default false,
  thumbnail_url   text,
  created_at      timestamptz default now()
);

-- ============================================================
--  18. PARCOURS ↔ FORMATIONS (M2M)
-- ============================================================
create table if not exists parcours_formations (
  parcours_id   uuid references parcours(id)    on delete cascade,
  formation_id  uuid references formations(id)  on delete cascade,
  order_index   int default 0,
  is_required   boolean default true,
  primary key (parcours_id, formation_id)
);

-- ============================================================
--  19. AVIS / TÉMOIGNAGES
-- ============================================================
create table if not exists reviews (
  id            uuid primary key default uuid_generate_v4(),
  formation_id  uuid not null references formations(id) on delete cascade,
  user_id       uuid not null references profiles(id)   on delete cascade,
  rating        int  not null check (rating between 1 and 5),
  title         text,
  content       text,
  is_verified   boolean default false,      -- vrai apprenant inscrit
  is_featured   boolean default false,      -- affiché sur la landing
  helpful_count int default 0,
  status        text default 'pending',     -- 'published', 'pending', 'rejected'
  created_at    timestamptz default now(),
  unique(user_id, formation_id)
);

-- ============================================================
--  20. FAQ
-- ============================================================
create table if not exists faqs (
  id          uuid primary key default uuid_generate_v4(),
  question    text not null,
  answer      text not null,
  category    text,                         -- 'financement', 'format', 'contenu', 'certification'
  formation_id uuid references formations(id) on delete cascade, -- null = FAQ générale
  order_rank  int  default 0,
  is_visible  boolean default true,
  created_at  timestamptz default now()
);

-- ============================================================
--  21. CONTACTS / LEADS
-- ============================================================
create table if not exists contacts (
  id           uuid primary key default uuid_generate_v4(),
  prenom       text not null,
  nom          text not null,
  email        text not null,
  telephone    text,
  sujet        text,                        -- 'devis', 'inscription', 'financement', etc.
  message      text not null,
  status       text default 'new',          -- 'new', 'in_progress', 'replied', 'closed'
  assigned_to  uuid references profiles(id) on delete set null,
  replied_at   timestamptz,
  source       text default 'website',      -- 'website', 'linkedin', 'referral'
  created_at   timestamptz default now()
);

-- ============================================================
--  22. PARTENAIRES
-- ============================================================
create table if not exists partners (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  logo_url    text,
  website     text,
  category    text,                         -- 'cloud', 'tool', 'institution', 'entreprise'
  description text,
  order_rank  int  default 0,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- ============================================================
--  23. NOTIFICATIONS UTILISATEURS
-- ============================================================
create table if not exists notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  title      text not null,
  body       text,
  type       text default 'info',           -- 'info', 'success', 'reminder', 'certificate'
  link       text,
  is_read    boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
--  ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table profiles          enable row level security;
alter table enrollments        enable row level security;
alter table enrollment_modules enable row level security;
alter table reviews            enable row level security;
alter table notifications      enable row level security;
alter table contacts           enable row level security;

-- Drop existing policies if they exist
drop policy if exists "profil_select" on profiles;
drop policy if exists "profil_insert" on profiles;
drop policy if exists "profil_update" on profiles;
drop policy if exists "enroll_select" on enrollments;
drop policy if exists "enroll_insert" on enrollments;
drop policy if exists "modules_progress" on enrollment_modules;
drop policy if exists "reviews_public_read" on reviews;
drop policy if exists "reviews_own_write" on reviews;
drop policy if exists "reviews_own_update" on reviews;
drop policy if exists "notif_select" on notifications;
drop policy if exists "notif_update" on notifications;
drop policy if exists "contact_insert" on contacts;

-- Profiles : chaque user voit/modifie uniquement son profil
create policy "profil_select" on profiles for select using (auth.uid() = id);
create policy "profil_insert" on profiles for insert with check (auth.uid() = id);
create policy "profil_update" on profiles for update using (auth.uid() = id);

-- Enrollments : chaque user voit ses inscriptions
create policy "enroll_select" on enrollments for select using (auth.uid() = user_id);
create policy "enroll_insert" on enrollments for insert with check (auth.uid() = user_id);

-- Progression modules
create policy "modules_progress" on enrollment_modules for all
  using (
    exists (
      select 1 from enrollments e
      where e.id = enrollment_id and e.user_id = auth.uid()
    )
  );

-- Avis : lecture publique, écriture par le propriétaire
create policy "reviews_public_read"  on reviews for select using (status = 'published');
create policy "reviews_own_write"    on reviews for insert with check (auth.uid() = user_id);
create policy "reviews_own_update"   on reviews for update using (auth.uid() = user_id);

-- Notifications : user voit les siennes
create policy "notif_select" on notifications for select using (auth.uid() = user_id);
create policy "notif_update" on notifications for update using (auth.uid() = user_id);

-- Contacts : insertion publique (formulaire de contact), lecture admin seulement
create policy "contact_insert" on contacts for insert with check (true);

-- ============================================================
--  DONNÉES INITIALES (SEED)
-- ============================================================

-- Domaines
insert into domains (code, name, description, icon, color, order_rank) values
  ('ai',    'Intelligence Artificielle', 'Machine Learning, LLMs, RAG, MLOps', '🤖', '#009BF9', 1),
  ('data',  'Data Engineering',         'Pipelines, Fabric, Spark, dbt, Lakehouse', '⚙️', '#00D68F', 2),
  ('cloud', 'Cloud & No-Code',          'Azure, AWS, Power Platform, automatisation', '☁️', '#FFAA00', 3),
  ('bi',    'Business Intelligence',    'Power BI, DAX, modélisation, reporting', '📊', '#B464FF', 4)
on conflict (code) do nothing;

-- Niveaux
insert into levels (code, name, order_rank) values
  ('debutant',      'Débutant',      1),
  ('intermediaire', 'Intermédiaire', 2),
  ('avance',        'Avancé',        3),
  ('expert',        'Expert',        4)
on conflict (code) do nothing;

-- Formats
insert into formats (code, name, description) values
  ('distanciel', 'Distanciel', 'Formation 100% en ligne, sessions live + replay'),
  ('presentiel', 'Présentiel', 'Formation en salle, Paris ou Douala'),
  ('hybride',    'Hybride',    'Mix présentiel et distanciel')
on conflict (code) do nothing;

-- Financement
insert into financing_options (code, name, description, code_rs) values
  ('cpf',           'CPF',               'Compte Personnel de Formation — éligible si RS enregistré', '6789'),
  ('opco',          'OPCO',              'Financement via votre OPCO (Adesatt, Atlas, Constructys...)', null),
  ('plan_formation','Plan de formation', 'Prise en charge employeur via plan de développement des compétences', null),
  ('individuel',    'Individuel',        'Paiement personnel en 1 à 3 fois', null)
on conflict (code) do nothing;

-- Outils
insert into tools (name, category) values
  ('LangChain',      'Framework IA'),
  ('OpenAI API',     'LLM'),
  ('Python',         'Langage'),
  ('Docker',         'DevOps'),
  ('Kubernetes',     'DevOps'),
  ('Azure',          'Cloud'),
  ('AWS',            'Cloud'),
  ('Power BI',       'BI'),
  ('DAX',            'BI'),
  ('Power Query',    'BI'),
  ('Apache Spark',   'Data Engineering'),
  ('dbt',            'Data Engineering'),
  ('Microsoft Fabric','Data Engineering'),
  ('Git',            'DevOps'),
  ('SQL',            'Base de données'),
  ('PostgreSQL',     'Base de données'),
  ('Pinecone',       'Vector DB'),
  ('Chroma',         'Vector DB'),
  ('Hugging Face',   'Framework IA'),
  ('FastAPI',        'Framework Web'),
  ('Airflow',        'Orchestration'),
  ('MLflow',         'MLOps')
on conflict (name) do nothing;

-- FAQ générales
insert into faqs (question, answer, category, order_rank) values
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
  ('Comment se déroule le paiement ?',
   'Nous acceptons carte bancaire, virement SEPA, et financement via OPCO ou CPF. Paiement en 3 fois sans frais disponible.',
   'financement', 6)
on conflict do nothing;

-- ============================================================
--  STORAGE — Bucket avatars (photos de profil)
-- ============================================================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Drop existing storage policies if they exist
drop policy if exists "avatar_upload" on storage.objects;
drop policy if exists "avatar_read" on storage.objects;
drop policy if exists "avatar_update" on storage.objects;
drop policy if exists "avatar_delete" on storage.objects;

-- Politique : tout utilisateur connecté peut uploader son avatar
create policy "avatar_upload" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Politique : tout le monde peut lire les avatars (public)
create policy "avatar_read" on storage.objects
  for select using (bucket_id = 'avatars');

-- Politique : chaque user peut mettre à jour / supprimer son avatar
create policy "avatar_update" on storage.objects
  for update using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatar_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Partenaires (logos marquee)
insert into partners (name, category, order_rank, is_active) values
  ('Microsoft Azure', 'cloud', 1, true),
  ('AWS',             'cloud', 2, true),
  ('Databricks',      'data',  3, true),
  ('dbt Labs',        'data',  4, true),
  ('OpenAI',          'ia',    5, true),
  ('Hugging Face',    'ia',    6, true),
  ('Power BI',        'bi',    7, true),
  ('Snowflake',       'data',  8, true),
  ('Airbyte',         'data',  9, true),
  ('LangChain',       'ia',   10, true),
  ('Docker',          'devops',11, true),
  ('GitHub',          'devops',12, true)
on conflict do nothing;

-- ============================================================
--  24. INTERACTIVE CODING LAB — Laboratoires interactifs
-- ============================================================

-- 24a. CODING LABS (Métadonnées des laboratoires)
create table if not exists coding_labs (
  id                uuid primary key default uuid_generate_v4(),
  lesson_id         uuid not null references lessons(id) on delete cascade,
  title             text not null,
  description       text,
  language          text not null,           -- 'python', 'sql', 'pyspark', 'scala', 'javascript', 'bash'
  difficulty        text default 'beginner', -- 'beginner', 'intermediate', 'advanced'
  estimated_time_min int,                    -- Temps estimé en minutes
  sandbox_type      text default 'local',    -- 'local' (Pyodide), 'docker' (sandbox), 'spark' (cluster)
  is_published      boolean default false,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- 24b. LAB DATASETS (Jeux de données pédagogiques)
create table if not exists lab_datasets (
  id            uuid primary key default uuid_generate_v4(),
  coding_lab_id uuid not null references coding_labs(id) on delete cascade,
  name          text not null,              -- 'customers', 'sales', 'products'
  data_type     text not null,              -- 'csv', 'json', 'parquet', 'sql_table'
  data_url      text,                       -- URL publique ou chemin stockage
  data_content  jsonb,                      -- Pour petits datasets JSON
  schema_info   jsonb,                      -- {columns: [{name, type, example}, ...]}
  row_count     int,
  created_at    timestamptz default now()
);

-- 24c. CODE SNIPPETS (Fragments de code initial/solution)
create table if not exists lab_code_snippets (
  id            uuid primary key default uuid_generate_v4(),
  coding_lab_id uuid not null references coding_labs(id) on delete cascade,
  snippet_type  text not null,              -- 'starter', 'solution', 'hint'
  code          text not null,
  explanation   text,                       -- Explication pour hints/solutions
  order_index   int default 0,
  created_at    timestamptz default now()
);

-- 24d. TEST CASES (Cas de test pour validation automatique)
create table if not exists lab_test_cases (
  id            uuid primary key default uuid_generate_v4(),
  coding_lab_id uuid not null references coding_labs(id) on delete cascade,
  test_name     text not null,              -- 'test_output_shape', 'test_null_handling'
  test_code     text not null,              -- Code de test en même langage
  expected_output text,                     -- Sortie attendue (JSON ou text)
  test_type     text default 'assertion',   -- 'assertion', 'output_comparison', 'performance'
  timeout_sec   int default 30,
  weight        int default 1,              -- Poids pour la note (1-10)
  error_message text,                       -- Message d'erreur personnalisé
  hint          text,                       -- Indice si test échoue
  order_index   int default 0,
  created_at    timestamptz default now()
);

-- 24e. LAB EXERCISES (Énoncés des exercices)
create table if not exists lab_exercises (
  id              uuid primary key default uuid_generate_v4(),
  coding_lab_id   uuid not null references coding_labs(id) on delete cascade,
  title           text not null,
  description     text not null,            -- Énoncé structuré
  problem         text not null,            -- Problème à résoudre
  instructions    text,                     -- Instructions étape par étape
  expected_result text,                     -- Format attendu (description)
  output_format   text default 'dataframe', -- 'dataframe', 'table', 'value', 'plot'
  created_at      timestamptz default now()
);

-- 24f. LAB SUBMISSIONS (Soumissions des apprenants)
create table if not exists lab_submissions (
  id               uuid primary key default uuid_generate_v4(),
  coding_lab_id    uuid not null references coding_labs(id) on delete cascade,
  user_id          uuid not null references profiles(id) on delete cascade,
  code             text not null,
  language         text not null,
  submission_count int default 1,
  status           text default 'pending',  -- 'pending', 'running', 'success', 'error', 'timeout'
  started_at       timestamptz,
  completed_at     timestamptz,
  execution_time_ms int,
  created_at       timestamptz default now(),
  unique(coding_lab_id, user_id)
);

-- 24g. LAB RESULTS (Résultats d'exécution et tests)
create table if not exists lab_results (
  id                    uuid primary key default uuid_generate_v4(),
  submission_id         uuid not null references lab_submissions(id) on delete cascade,
  test_case_id          uuid references lab_test_cases(id) on delete cascade,
  status                text not null,      -- 'passed', 'failed', 'error', 'timeout'
  actual_output         text,               -- Sortie réelle
  expected_output       text,               -- Sortie attendue
  error_message         text,               -- Message d'erreur technique
  error_type            text,               -- 'syntax_error', 'runtime_error', 'assertion_error'
  stderr                text,               -- Logs d'erreur
  stdout                text,               -- Logs de sortie
  execution_time_ms     int,
  passed_tests_count    int default 0,
  total_tests_count     int default 0,
  success_rate_pct      int default 0,      -- 0-100
  score                 int default 0,      -- 0-100
  feedback              text,               -- Feedback pédagogique
  created_at            timestamptz default now()
);

-- 24h. LAB FEEDBACK (Historique feedback pour apprenant)
create table if not exists lab_feedback (
  id              uuid primary key default uuid_generate_v4(),
  submission_id   uuid not null references lab_submissions(id) on delete cascade,
  feedback_type   text not null,            -- 'error_help', 'suggestion', 'hint', 'praise'
  message         text not null,
  is_ai_generated boolean default false,
  created_at      timestamptz default now()
);

-- ============================================================
--  RLS — Interactive Coding Lab
-- ============================================================

alter table coding_labs        enable row level security;
alter table lab_datasets       enable row level security;
alter table lab_code_snippets  enable row level security;
alter table lab_test_cases     enable row level security;
alter table lab_exercises      enable row level security;
alter table lab_submissions    enable row level security;
alter table lab_results        enable row level security;
alter table lab_feedback       enable row level security;

-- Drop existing lab policies
drop policy if exists "labs_read" on coding_labs;
drop policy if exists "datasets_read" on lab_datasets;
drop policy if exists "snippets_read" on lab_code_snippets;
drop policy if exists "tests_read" on lab_test_cases;
drop policy if exists "exercises_read" on lab_exercises;
drop policy if exists "submissions_own" on lab_submissions;
drop policy if exists "results_own" on lab_results;
drop policy if exists "feedback_own" on lab_feedback;

-- Coding Labs: lecture publique
create policy "labs_read" on coding_labs for select using (is_published = true);

-- Datasets: lecture publique (associés aux labs publiés)
create policy "datasets_read" on lab_datasets for select using (
  exists (select 1 from coding_labs where id = coding_lab_id and is_published = true)
);

-- Code Snippets: starter visible, solution/hint cachés sauf après submission
create policy "snippets_read" on lab_code_snippets for select using (
  snippet_type = 'starter' or (
    exists (
      select 1 from coding_labs cl
      join lab_submissions ls on ls.coding_lab_id = cl.id
      where cl.id = coding_lab_id and ls.user_id = auth.uid() and ls.status = 'success'
    )
  )
);

-- Test Cases: lecture interdite (cached côté backend)
-- Aucune politique = personne ne peut lire directement

-- Exercises: lecture publique
create policy "exercises_read" on lab_exercises for select using (
  exists (select 1 from coding_labs where id = coding_lab_id and is_published = true)
);

-- Submissions: chaque user voit/crée ses propres submissions
create policy "submissions_own" on lab_submissions for all using (auth.uid() = user_id);

-- Results: chaque user voit ses résultats
create policy "results_own" on lab_results for select using (
  exists (
    select 1 from lab_submissions
    where id = submission_id and user_id = auth.uid()
  )
);

-- Feedback: chaque user voit ses feedbacks
create policy "feedback_own" on lab_feedback for select using (
  exists (
    select 1 from lab_submissions
    where id = submission_id and user_id = auth.uid()
  )
);

-- ============================================================
--  SEED DATA — Example Coding Labs
-- ============================================================

-- ============================================================
--  SEED DATA — Example Coding Labs with Tests
-- ============================================================

-- Python Lab 1: Variables & Types (Local Execution)
insert into coding_labs (lesson_id, title, description, language, difficulty, sandbox_type, is_published) 
values 
  (null, 'Python Basics - Variables & Types', 'Apprenez les variables et types de données en Python', 'python', 'beginner', 'local', true);

-- SQL Lab 1: SELECT & WHERE (Docker SQLite)
insert into coding_labs (lesson_id, title, description, language, difficulty, sandbox_type, is_published)
values
  (null, 'SQL Queries - SELECT & WHERE', 'Maîtrisez les requêtes SELECT et les clauses WHERE', 'sql', 'beginner', 'docker', true);

-- PySpark Lab 1: DataFrames (Spark Cluster)
insert into coding_labs (lesson_id, title, description, language, difficulty, sandbox_type, is_published)
values
  (null, 'PySpark DataFrames - groupBy & agg', 'Traitez les données distribuées avec PySpark', 'pyspark', 'intermediate', 'spark', true);

-- Scala Lab 1: Collections (Docker)
insert into coding_labs (lesson_id, title, description, language, difficulty, sandbox_type, is_published)
values
  (null, 'Scala Collections - Map & Filter', 'Explorez les collections fonctionnelles Scala', 'scala', 'intermediate', 'docker', true);

-- ============================================================
--  SEED: Python Lab Code Snippets
-- ============================================================

insert into lab_code_snippets (coding_lab_id, snippet_type, code, explanation) 
select 
  id, 'starter', 
  E'nom = "Alice"\nage = 30\nsalaire = 45000.50\nactif = True\n\nprint(f"Nom: {nom}")\nprint(f"Age: {age}")\nprint(f"Type d''age: {type(age)}")',
  'Déclarez des variables et utilisez f-strings pour afficher les résultats'
from coding_labs where language = 'python' and title like '%Variables%' limit 1;

insert into lab_code_snippets (coding_lab_id, snippet_type, code, explanation)
select
  id, 'solution',
  E'nom = "Alice"\nage = 30\nsalaire = 45000.50\nactif = True\n\nprint(f"Nom: {nom}")\nprint(f"Age: {age}")\nprint(f"Type d''age: {type(age)}")\nprint(f"Salaire: {salaire}")\nprint(f"Actif: {actif}")\n\nnombres = [1, 2, 3, 4, 5]\nprint(f"Nombres: {nombres}")\nprint(f"Premier: {nombres[0]}")\n\npersonne = {"nom": "Bob", "age": 25, "ville": "Paris"}\nprint(f"Personne: {personne}")\nprint(f"Ville: {personne[''ville'']}")',
  'Solution complète avec listes et dictionnaires'
from coding_labs where language = 'python' and title like '%Variables%' limit 1;

-- ============================================================
--  SEED: Python Lab Test Cases
-- ============================================================

insert into lab_test_cases (coding_lab_id, test_name, test_code, expected_output, error_message, weight, order_index)
select
  id, 'test_variable_nom',
  E'assert nom == "Alice", "nom devrait être Alice"',
  'pass',
  'La variable nom doit être assignée à "Alice"',
  2, 1
from coding_labs where language = 'python' and title like '%Variables%' limit 1;

insert into lab_test_cases (coding_lab_id, test_name, test_code, expected_output, error_message, weight, order_index)
select
  id, 'test_age_type',
  E'assert isinstance(age, int), "age doit être un entier"',
  'pass',
  'age doit être de type int, pas float',
  2, 2
from coding_labs where language = 'python' and title like '%Variables%' limit 1;

insert into lab_test_cases (coding_lab_id, test_name, test_code, expected_output, error_message, weight, order_index)
select
  id, 'test_liste_length',
  E'assert len(nombres) == 5, "la liste doit avoir 5 éléments"',
  'pass',
  'Créez une liste nombres avec 5 éléments',
  1, 3
from coding_labs where language = 'python' and title like '%Variables%' limit 1;

insert into lab_test_cases (coding_lab_id, test_name, test_code, expected_output, error_message, weight, order_index)
select
  id, 'test_dict_access',
  E'assert personne["ville"] == "Paris", "la clé ville doit retourner Paris"',
  'pass',
  'Utilisez les clés correctes pour accéder au dictionnaire',
  1, 4
from coding_labs where language = 'python' and title like '%Variables%' limit 1;

-- ============================================================
--  SEED: SQL Lab Code Snippets
-- ============================================================

insert into lab_code_snippets (coding_lab_id, snippet_type, code, explanation)
select
  id, 'starter',
  E'SELECT * FROM employes;',
  'Récupérez toutes les colonnes de la table employes'
from coding_labs where language = 'sql' and title like '%SELECT%' limit 1;

insert into lab_code_snippets (coding_lab_id, snippet_type, code, explanation)
select
  id, 'solution',
  E'SELECT nom, salaire, departement\nFROM employes\nWHERE salaire > 40000\nORDER BY salaire DESC;',
  'Filtrez et triez les employés par salaire'
from coding_labs where language = 'sql' and title like '%SELECT%' limit 1;

-- ============================================================
--  SEED: SQL Lab Test Cases
-- ============================================================

insert into lab_test_cases (coding_lab_id, test_name, test_code, expected_output, error_message, weight, order_index)
select
  id, 'test_select_all',
  E'SELECT COUNT(*) as cnt FROM employes;',
  '8',
  'Votre requête doit retourner 8 employés',
  2, 1
from coding_labs where language = 'sql' and title like '%SELECT%' limit 1;

insert into lab_test_cases (coding_lab_id, test_name, test_code, expected_output, error_message, weight, order_index)
select
  id, 'test_where_clause',
  E'SELECT COUNT(*) as cnt FROM employes WHERE salaire > 40000;',
  '4',
  'Il y a 4 employés avec salaire > 40000',
  2, 2
from coding_labs where language = 'sql' and title like '%SELECT%' limit 1;

-- ============================================================
--  SEED: PySpark Lab Code Snippets
-- ============================================================

insert into lab_code_snippets (coding_lab_id, snippet_type, code, explanation)
select
  id, 'starter',
  E'from pyspark.sql import SparkSession\n\nspark = SparkSession.builder \\\n    .appName("MyApp") \\\n    .getOrCreate()\n\ndata = [("Alice", 25), ("Bob", 30)]\ncolumns = ["nom", "age"]\ndf = spark.createDataFrame(data, columns)\n\ndf.printSchema()\ndf.show()',
  'Créez une session Spark et un DataFrame simple'
from coding_labs where language = 'pyspark' and title like '%groupBy%' limit 1;

insert into lab_code_snippets (coding_lab_id, snippet_type, code, explanation)
select
  id, 'solution',
  E'from pyspark.sql import SparkSession\nfrom pyspark.sql.functions import col, avg, count\n\nspark = SparkSession.builder \\\n    .appName("GroupByExample") \\\n    .getOrCreate()\n\ndata = [\n    ("Alice", "IT", 60000),\n    ("Bob", "IT", 55000),\n    ("Charlie", "HR", 50000),\n]\ndf = spark.createDataFrame(data, ["nom", "dept", "salaire"])\n\ndf.groupBy("dept").agg(\n    count("*").alias("count"),\n    avg("salaire").alias("avg_salary")\n).show()',
  'Groupez par département et calculez statistiques'
from coding_labs where language = 'pyspark' and title like '%groupBy%' limit 1;

-- ============================================================
--  SEED: PySpark Lab Test Cases
-- ============================================================

insert into lab_test_cases (coding_lab_id, test_name, test_code, expected_output, error_message, weight, order_index)
select
  id, 'test_dataframe_created',
  E'assert df is not None\nassert df.count() > 0',
  'pass',
  'Vous devez créer un DataFrame non vide',
  2, 1
from coding_labs where language = 'pyspark' and title like '%groupBy%' limit 1;

insert into lab_test_cases (coding_lab_id, test_name, test_code, expected_output, error_message, weight, order_index)
select
  id, 'test_groupby_result',
  E'result = df.groupBy("dept").count()\nassert result.count() == 2, "Devrait avoir 2 groupes"',
  'pass',
  'Le groupBy doit retourner 2 départements',
  3, 2
from coding_labs where language = 'pyspark' and title like '%groupBy%' limit 1;

-- ============================================================
--  SEED: Lab Exercises (Énoncés)
-- ============================================================

insert into lab_exercises (coding_lab_id, title, description, problem, expected_result, output_format)
select
  id, 
  'Variables Python',
  'Pratiquez la création et l''utilisation de variables',
  E'Créez une variable nom = "Alice", age = 30, salaire = 45000.50.\nAffichezles avec des f-strings.\nCréez une liste nombres = [1,2,3,4,5] et un dictionnaire.',
  'Le code affiche correctement toutes les variables',
  'value'
from coding_labs where language = 'python' and title like '%Variables%' limit 1;

insert into lab_exercises (coding_lab_id, title, description, problem, expected_result, output_format)
select
  id,
  'SELECT WHERE',
  'Récupérez les employés selon critères',
  'Écrivez une requête SQL qui sélectionne les employés avec salaire > 40000 et les trie par salaire DESC.',
  'Retourne 4 lignes triées correctement',
  'table'
from coding_labs where language = 'sql' and title like '%SELECT%' limit 1;

insert into lab_exercises (coding_lab_id, title, description, problem, expected_result, output_format)
select
  id,
  'GroupBy & Agregation',
  'Groupez les données et calculez des statistiques',
  E'Créez un DataFrame avec (nom, dept, salaire).\nGroupez par dept et calculez le count et avg(salaire).',
  'Retourne 2 lignes (2 départements) avec statistiques',
  'dataframe'
from coding_labs where language = 'pyspark' and title like '%groupBy%' limit 1;
