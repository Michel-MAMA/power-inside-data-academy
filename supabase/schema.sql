-- ============================================================
--  POWER INSIDE DATA ACADEMY — Schéma Supabase complet
--  Colle ce fichier dans Supabase → SQL Editor → Run
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
--  1. DOMAINES
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
  role       text default 'student',        -- 'student', 'instructor', 'admin'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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
