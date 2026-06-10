import { createClient } from '@/lib/supabase/server';
import type {
  Certificate,
  Enrollment,
  Profile,
  QuizAttempt,
} from '@/types/database';

export interface DashboardData {
  profile: Profile;
  enrollments: Enrollment[];
  certificates: Certificate[];
  passedQuizzes: QuizAttempt[];
}

/**
 * Données complètes du dashboard étudiant.
 * 4 requêtes lancées en parallèle (RLS : chaque user ne voit que ses lignes).
 */
export async function getDashboardData(): Promise<DashboardData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, enrollmentsRes, certificatesRes, quizzesRes] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),

      supabase
        .from('enrollments')
        .select(
          `id, status, progress_pct, enrolled_at, started_at, completed_at,
           certificate_code, payment_status, amount_paid,
           formations ( id, slug, title, thumbnail_url, duration_hours,
                        modules_count, is_certifying,
                        domains ( name, color ) )`
        )
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
        .order('enrolled_at', { ascending: false }),

      supabase
        .from('certificates')
        .select(
          'id, certificate_code, formation_title, final_score_pct, pdf_url, issued_at, expires_at, status'
        )
        .eq('user_id', user.id)
        .eq('status', 'issued')
        .order('issued_at', { ascending: false }),

      supabase
        .from('quiz_attempts')
        .select('id, score_pct, passed, submitted_at, quizzes ( title, formation_id )')
        .eq('user_id', user.id)
        .eq('passed', true)
        .order('submitted_at', { ascending: false })
        .limit(10),
    ]);

  if (profileRes.error) throw new Error(`profile: ${profileRes.error.message}`);

  return {
    profile: profileRes.data as Profile,
    enrollments: (enrollmentsRes.data ?? []) as unknown as Enrollment[],
    certificates: (certificatesRes.data ?? []) as Certificate[],
    passedQuizzes: (quizzesRes.data ?? []) as unknown as QuizAttempt[],
  };
}

/** Profil seul (page /dashboard/profile). */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  return data as Profile | null;
}
