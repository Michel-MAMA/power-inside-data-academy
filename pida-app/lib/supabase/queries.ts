/**
 * Requêtes Supabase réutilisables — Server Side
 * Utilise createClient() depuis lib/supabase/server.ts
 */
import { createClient } from "./server";

// ── Formations ─────────────────────────────────────────────────────────────

export async function getFormations(opts?: {
  domain?: string;
  level?: string;
  featured?: boolean;
  limit?: number;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("formations")
    .select(`*, domain:domains(*), level:levels(*), format:formats(*)`)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (opts?.domain)   query = query.eq("domains.code", opts.domain);
  if (opts?.featured) query = query.eq("is_featured", true);
  if (opts?.limit)    query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getFormationBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("formations")
    .select(`
      *,
      domain:domains(*),
      level:levels(*),
      format:formats(*),
      modules(*, lessons(*)),
      reviews(*, profile:profiles(prenom, nom, avatar_url))
    `)
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) throw error;
  return data;
}

// ── Domaines ───────────────────────────────────────────────────────────────

export async function getDomains() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("domains")
    .select("*")
    .order("order_rank");
  if (error) throw error;
  return data;
}

// ── Parcours ───────────────────────────────────────────────────────────────

export async function getParcours() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parcours")
    .select(`*, level:levels(*), domain:domains(*)`)
    .eq("is_published", true)
    .order("created_at");
  if (error) throw error;
  return data;
}

// ── Partenaires ────────────────────────────────────────────────────────────

export async function getPartners() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .eq("is_active", true)
    .order("order_rank");
  if (error) throw error;
  return data;
}

// ── FAQ ────────────────────────────────────────────────────────────────────

export async function getFAQs(formationId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("faqs")
    .select("*")
    .eq("is_visible", true)
    .order("order_rank");

  if (formationId) {
    query = query.or(`formation_id.eq.${formationId},formation_id.is.null`);
  } else {
    query = query.is("formation_id", null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ── Témoignages ────────────────────────────────────────────────────────────

export async function getFeaturedReviews() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(`*, profile:profiles(prenom, nom, avatar_url), formation:formations(title)`)
    .eq("is_featured", true)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(6);
  if (error) throw error;
  return data;
}

// ── Profil utilisateur ─────────────────────────────────────────────────────

export async function getProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

// ── Inscriptions ───────────────────────────────────────────────────────────

export async function getUserEnrollments(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select(`*, formation:formations(title, slug, thumbnail_url, domain:domains(*))`)
    .eq("user_id", userId)
    .order("enrolled_at", { ascending: false });
  if (error) throw error;
  return data;
}

// ── Envoyer un message contact ─────────────────────────────────────────────

export async function insertContact(payload: {
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  sujet?: string;
  message: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").insert(payload);
  if (error) throw error;
}
