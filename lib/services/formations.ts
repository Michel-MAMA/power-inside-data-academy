import { createClient } from '@/lib/supabase/server';
import type { Formation, Session } from '@/types/database';

/**
 * Liste des formations publiées (catalogue).
 * Une seule requête avec jointures domaine + niveau.
 */
export async function getPublishedFormations(opts?: {
  domainCode?: string;
  levelCode?: string;
  search?: string;
}): Promise<Formation[]> {
  const supabase = await createClient();

  let query = supabase
    .from('formations')
    .select(
      `id, slug, title, short_description, price_ht, price_sur_devis, currency,
       duration_hours, duration_days, is_certifying, is_cpf_eligible, is_featured,
       rating, rating_count, students_count, modules_count, thumbnail_url,
       domains ( id, code, name, color, icon ),
       levels  ( id, code, name )`
    )
    .eq('is_published', true)
    .order('is_featured', { ascending: false })
    .order('students_count', { ascending: false });

  if (opts?.search) {
    query = query.ilike('title', `%${opts.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`getPublishedFormations: ${error.message}`);

  let rows = (data ?? []) as unknown as Formation[];
  if (opts?.domainCode) rows = rows.filter((f) => f.domains?.code === opts.domainCode);
  if (opts?.levelCode) rows = rows.filter((f) => f.levels?.code === opts.levelCode);
  return rows;
}

/** Détail complet d'une formation : modules + leçons + sessions à venir. */
export async function getFormationBySlug(slug: string): Promise<{
  formation: Formation | null;
  sessions: Session[];
}> {
  const supabase = await createClient();

  const { data: formation, error } = await supabase
    .from('formations')
    .select(
      `*,
       domains ( id, code, name, color, icon ),
       levels  ( id, code, name ),
       modules (
         id, title, description, order_index, duration_hours, is_practical,
         lessons ( id, title, order_index, lesson_type, duration_min, is_preview )
       )`
    )
    .eq('slug', slug)
    .eq('is_published', true)
    .order('order_index', { referencedTable: 'modules', ascending: true })
    .maybeSingle();

  if (error) throw new Error(`getFormationBySlug: ${error.message}`);
  if (!formation) return { formation: null, sessions: [] };

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, formation_id, date_start, date_end, location, max_participants, enrolled_count, status')
    .eq('formation_id', formation.id)
    .gte('date_start', new Date().toISOString().slice(0, 10))
    .in('status', ['available', 'few_spots'])
    .order('date_start', { ascending: true })
    .limit(5);

  return {
    formation: formation as unknown as Formation,
    sessions: (sessions ?? []) as Session[],
  };
}

/** L'utilisateur courant est-il déjà inscrit à cette formation ? */
export async function getUserEnrollmentForFormation(formationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('enrollments')
    .select('id, status, payment_status, progress_pct')
    .eq('user_id', user.id)
    .eq('formation_id', formationId)
    .neq('status', 'cancelled')
    .maybeSingle();

  return data;
}

/** Référentiels pour les filtres du catalogue. */
export async function getCatalogFilters() {
  const supabase = await createClient();
  const [{ data: domains }, { data: levels }] = await Promise.all([
    supabase.from('domains').select('id, code, name, color, icon').order('order_rank'),
    supabase.from('levels').select('id, code, name').order('order_rank'),
  ]);
  return { domains: domains ?? [], levels: levels ?? [] };
}
