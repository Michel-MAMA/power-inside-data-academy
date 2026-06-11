import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase PUBLIC (anon, sans cookies ni session).
 * À utiliser dans les pages statiques / ISR pour les données publiques
 * (catalogue, domaines…) : contrairement au client serveur basé sur
 * cookies(), il ne force pas le rendu dynamique.
 * RLS s'applique : seules les données publiques sont lisibles.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
