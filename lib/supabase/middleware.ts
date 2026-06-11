import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Rafraîchit la session Supabase à chaque requête et protège les routes
 * privées. Appelé par le middleware racine (middleware.ts).
 *
 * Fail-safe : une erreur ici ne doit JAMAIS rendre le site indisponible
 * (MIDDLEWARE_INVOCATION_FAILED). En cas de configuration manquante ou
 * d'erreur réseau Supabase, on laisse passer la requête — les pages
 * protégées re-vérifient l'auth côté serveur et RLS protège les données.
 */
export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Env Vercel non configurée : site public utilisable, auth désactivée.
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[middleware] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY manquantes — configurez-les dans Vercel.'
    );
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // IMPORTANT : getUser() (et non getSession()) — validation côté serveur Auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;
    const isProtected =
      path.startsWith('/dashboard') || path.startsWith('/admin');
    const isAuthPage =
      path.startsWith('/login') ||
      path.startsWith('/register') ||
      path.startsWith('/forgot-password');

    if (isProtected && !user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', path);
      return NextResponse.redirect(url);
    }

    if (isAuthPage && user) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.search = '';
      return NextResponse.redirect(url);
    }

    // /admin : vérification du rôle (RLS protège aussi côté données)
    if (path.startsWith('/admin') && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        url.search = '';
        return NextResponse.redirect(url);
      }
    }

    return response;
  } catch (error) {
    // Erreur inattendue (réseau Supabase, etc.) : on logge et on laisse
    // passer plutôt que de servir un 500 global.
    console.error('[middleware] erreur non bloquante :', error);
    return NextResponse.next({ request });
  }
}
