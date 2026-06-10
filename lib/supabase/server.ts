import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminSupabase } from '@supabase/supabase-js';

/**
 * Client Supabase pour Server Components, Server Actions et Route Handlers.
 * Lit/écrit la session dans les cookies (pattern officiel @supabase/ssr).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appel depuis un Server Component : le middleware rafraîchit
            // les sessions, on peut ignorer l'écriture ici.
          }
        },
      },
    }
  );
}

/**
 * Client ADMIN (service_role) — bypass RLS.
 * À utiliser UNIQUEMENT côté serveur : webhooks de paiement, tâches admin.
 * Ne jamais importer dans un Client Component.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante (voir .env.example)');
  }
  return createAdminSupabase(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
