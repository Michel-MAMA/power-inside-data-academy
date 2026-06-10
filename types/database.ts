// ============================================================================
// Types TypeScript alignés sur supabase/MASTER_SQL_POWER_INSIDE_ACADEMY.sql
// ============================================================================

export type UserRole = 'student' | 'instructor' | 'admin' | 'super_admin';
export type SubscriptionPlan = 'free' | 'pro' | 'annual' | 'enterprise';

export interface Profile {
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
  country: string | null;
  city: string | null;
  role: UserRole;
  subscription_plan: SubscriptionPlan;
  total_learning_minutes: number;
  courses_enrolled: number;
  courses_completed: number;
  certificates_count: number;
  quiz_passed_count: number;
  created_at: string;
  updated_at: string;
}

export interface Domain {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order_rank: number;
}

export interface Level {
  id: string;
  code: string;
  name: string;
  order_rank: number;
}

export interface Formation {
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
  is_certifying: boolean;
  is_cpf_eligible: boolean;
  is_featured: boolean;
  is_published: boolean;
  modules_count: number;
  students_count: number;
  rating: number;
  rating_count: number;
  thumbnail_url: string | null;
  created_at: string;
  // Relations (jointures)
  domains?: Domain | null;
  levels?: Level | null;
  modules?: Module[];
}

export interface Module {
  id: string;
  formation_id: string;
  title: string;
  description: string | null;
  order_index: number;
  duration_hours: number | null;
  is_practical: boolean;
  lessons?: Lesson[];
}

export type LessonType =
  | 'video' | 'workshop' | 'quiz' | 'project' | 'certification' | 'article' | 'live';

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  order_index: number;
  lesson_type: LessonType;
  duration_min: number | null;
  is_preview: boolean;
  video_url: string | null;
}

export interface Session {
  id: string;
  formation_id: string;
  date_start: string;
  date_end: string | null;
  location: string | null;
  max_participants: number;
  enrolled_count: number;
  status: 'available' | 'few_spots' | 'full' | 'closed' | 'cancelled';
}

export type EnrollmentStatus =
  | 'enrolled' | 'in_progress' | 'completed' | 'cancelled' | 'expired';
export type EnrollmentPaymentStatus =
  | 'pending' | 'paid' | 'refunded' | 'cpf' | 'opco' | 'free';

export interface Enrollment {
  id: string;
  user_id: string;
  formation_id: string;
  session_id: string | null;
  status: EnrollmentStatus;
  progress_pct: number;
  enrolled_at: string;
  started_at: string | null;
  completed_at: string | null;
  certificate_code: string | null;
  payment_status: EnrollmentPaymentStatus;
  amount_paid: number | null;
  formations?: Formation;
}

export interface Certificate {
  id: string;
  certificate_code: string;
  user_id: string;
  formation_id: string | null;
  student_name: string;
  formation_title: string;
  final_score_pct: number | null;
  pdf_url: string | null;
  issued_at: string;
  expires_at: string | null;
  status: 'issued' | 'revoked' | 'expired';
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  attempt_number: number;
  score_pct: number;
  passed: boolean;
  submitted_at: string | null;
  status: 'in_progress' | 'submitted' | 'expired' | 'abandoned';
  quizzes?: { title: string; formation_id: string | null };
}

// ── Paiements ──────────────────────────────────────────────────────────────

export type PaymentProviderCode =
  | 'stripe' | 'orange_money' | 'mtn_momo'
  | 'wave' | 'paypal' | 'flutterwave' | 'cinetpay';

export interface PaymentProvider {
  id: string;
  code: PaymentProviderCode;
  name: string;
  provider_type: 'card' | 'mobile_money' | 'wallet' | 'bank_transfer' | 'aggregator';
  supported_currencies: string[];
  is_active: boolean;
  order_rank: number;
}

export type PaymentStatus =
  | 'pending' | 'processing' | 'requires_action' | 'succeeded'
  | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';

export interface Payment {
  id: string;
  user_id: string;
  formation_id: string | null;
  enrollment_id: string | null;
  provider_id: string;
  promo_code_id: string | null;
  amount_gross: number;
  discount_amount: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider_payment_id: string | null;
  provider_session_id: string | null;
  provider_reference: string | null;
  phone_number: string | null;
  failure_message: string | null;
  paid_at: string | null;
  created_at: string;
  // Jointures
  profiles?: Pick<Profile, 'prenom' | 'nom' | 'email'>;
  formations?: Pick<Formation, 'title' | 'slug'>;
  payment_providers?: Pick<PaymentProvider, 'code' | 'name'>;
}

export interface PromoValidation {
  valid: boolean;
  promo_id: string | null;
  discount_type: 'percentage' | 'fixed_amount' | null;
  discount_value: number | null;
  error_code: string | null;
}

// ── Réponses API standardisées ─────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: { code: string; message: string };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
