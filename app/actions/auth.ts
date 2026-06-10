'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  updateProfileSchema,
} from '@/lib/validations';

export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: string;
}

// ── Inscription ─────────────────────────────────────────────────────────────
export async function registerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { prenom, nom, email, password } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { prenom, nom, full_name: `${prenom} ${nom}` },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Un compte existe déjà avec cet email.' };
    }
    return { error: error.message };
  }

  // Le profil est créé automatiquement par le trigger trg_on_auth_user_created
  return {
    success:
      'Compte créé ! Vérifiez votre boîte mail pour confirmer votre inscription.',
  };
}

// ── Connexion ───────────────────────────────────────────────────────────────
export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      error: error.message.includes('Invalid')
        ? 'Email ou mot de passe incorrect.'
        : error.message,
    };
  }

  revalidatePath('/', 'layout');
  const redirectTo = (formData.get('redirect') as string) || '/dashboard';
  redirect(redirectTo.startsWith('/') ? redirectTo : '/dashboard');
}

// ── Déconnexion ─────────────────────────────────────────────────────────────
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

// ── Mot de passe oublié ─────────────────────────────────────────────────────
export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });

  if (error) return { error: error.message };
  return { success: 'Email envoyé ! Vérifiez votre boîte mail.' };
}

// ── Mise à jour du profil ───────────────────────────────────────────────────
export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = updateProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié.' };

  const clean = Object.fromEntries(
    Object.entries(parsed.data).map(([k, v]) => [k, v === '' ? null : v])
  );

  const { error } = await supabase
    .from('profiles')
    .update(clean)
    .eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/dashboard/profile');
  return { success: 'Profil mis à jour.' };
}
