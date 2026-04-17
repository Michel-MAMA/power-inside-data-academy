// Types générés depuis le schéma Supabase
// Reflète exactement les tables de supabase/schema.sql

export type Domain = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order_rank: number;
  created_at: string;
};

export type Level = {
  id: string;
  code: string;
  name: string;
  order_rank: number;
};

export type Format = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

export type Tool = {
  id: string;
  name: string;
  category: string | null;
  icon_url: string | null;
  description: string | null;
  created_at: string;
};

export type FinancingOption = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  code_rs: string | null;
  is_active: boolean;
  created_at: string;
};

export type Instructor = {
  id: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  expertise_areas: string[] | null;
  company: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  rating: number;
  rating_count: number;
  students_count: number;
  formations_count: number;
  is_active: boolean;
  created_at: string;
};

export type Formation = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  description: string | null;
  domain_id: string | null;
  level_id: string | null;
  format_id: string | null;
  duration_hours: number | null;
  duration_days: number | null;
  price_ht: number | null;
  price_sur_devis: boolean;
  currency: string;
  certification_code: string | null;
  is_certifying: boolean;
  is_cpf_eligible: boolean;
  is_opco_eligible: boolean;
  is_featured: boolean;
  is_published: boolean;
  modules_count: number;
  projects_count: number;
  students_count: number;
  rating: number;
  rating_count: number;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  // Relations jointes
  domain?: Domain;
  level?: Level;
  format?: Format;
};

export type Module = {
  id: string;
  formation_id: string;
  title: string;
  description: string | null;
  order_index: number;
  duration_hours: number | null;
  is_practical: boolean;
  created_at: string;
};

export type Lesson = {
  id: string;
  module_id: string;
  title: string;
  order_index: number;
  lesson_type: "video" | "workshop" | "quiz" | "project" | "certification";
  duration_min: number | null;
  is_preview: boolean;
  video_url: string | null;
  content_url: string | null;
  created_at: string;
};

export type Session = {
  id: string;
  formation_id: string;
  instructor_id: string | null;
  date_start: string;
  date_end: string | null;
  time_start: string | null;
  time_end: string | null;
  format_id: string | null;
  location: string | null;
  max_participants: number;
  enrolled_count: number;
  status: "available" | "few_spots" | "full" | "closed" | "cancelled";
  is_intra: boolean;
  notes: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  prenom: string | null;
  nom: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  avatar_url: string | null;
  bio: string | null;
  linkedin: string | null;
  role: "student" | "instructor" | "admin";
  created_at: string;
  updated_at: string;
};

export type Enrollment = {
  id: string;
  user_id: string;
  formation_id: string;
  session_id: string | null;
  status: "enrolled" | "in_progress" | "completed" | "cancelled";
  progress_pct: number;
  enrolled_at: string;
  started_at: string | null;
  completed_at: string | null;
  certificate_code: string | null;
  certificate_url: string | null;
  payment_status: "pending" | "paid" | "refunded" | "cpf" | "opco";
  amount_paid: number | null;
  financing_id: string | null;
  notes: string | null;
};

export type Parcours = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  level_id: string | null;
  domain_id: string | null;
  duration_weeks: number | null;
  formations_count: number;
  is_certifying: boolean;
  is_published: boolean;
  thumbnail_url: string | null;
  created_at: string;
};

export type Review = {
  id: string;
  formation_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  is_verified: boolean;
  is_featured: boolean;
  helpful_count: number;
  status: "published" | "pending" | "rejected";
  created_at: string;
};

export type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  formation_id: string | null;
  order_rank: number;
  is_visible: boolean;
  created_at: string;
};

export type Contact = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  sujet: string | null;
  message: string;
  status: "new" | "in_progress" | "replied" | "closed";
  assigned_to: string | null;
  replied_at: string | null;
  source: string;
  created_at: string;
};

export type Partner = {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  category: string | null;
  description: string | null;
  order_rank: number;
  is_active: boolean;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: "info" | "success" | "reminder" | "certificate";
  link: string | null;
  is_read: boolean;
  created_at: string;
};
