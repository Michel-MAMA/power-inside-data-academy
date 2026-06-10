'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Client Supabase pour les Client Components.
 * Gère les cookies de session automatiquement (compatible middleware SSR).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/** Export rétro-compatible pour le code existant (AuthContext, etc.). */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'anon'
);
