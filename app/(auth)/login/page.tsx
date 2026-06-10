'use client';

import { Suspense, useActionState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loginAction, type ActionState } from '@/app/actions/auth';
import { AuthCard, Field, SubmitButton, FormError } from '@/components/auth/AuthUI';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/dashboard';
  const [state, action, pending] = useActionState<ActionState, FormData>(
    loginAction,
    {}
  );

  return (
    <AuthCard
      title="Bon retour 👋"
      subtitle="Connectez-vous à votre espace apprenant."
    >
      <form action={action} className="space-y-4">
        <input type="hidden" name="redirect" value={redirect} />
        <FormError state={state} />
        <Field
          label="Email"
          name="email"
          type="email"
          placeholder="vous@exemple.com"
          autoComplete="email"
          errors={state.fieldErrors?.email}
        />
        <Field
          label="Mot de passe"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          errors={state.fieldErrors?.password}
        />
        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <SubmitButton pending={pending}>Se connecter</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Pas encore de compte ?{' '}
        <Link href="/register" className="font-semibold text-blue-600 hover:underline">
          Créer un compte
        </Link>
      </p>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
