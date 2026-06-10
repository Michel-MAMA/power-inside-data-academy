'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { forgotPasswordAction, type ActionState } from '@/app/actions/auth';
import {
  AuthCard,
  Field,
  SubmitButton,
  FormError,
  FormSuccess,
} from '@/components/auth/AuthUI';

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    forgotPasswordAction,
    {}
  );

  return (
    <AuthCard
      title="Réinitialisation"
      subtitle="Entrez votre email pour recevoir un lien de réinitialisation."
    >
      <form action={action} className="space-y-4">
        <FormError state={state} />
        <FormSuccess state={state} />
        <Field
          label="Email"
          name="email"
          type="email"
          placeholder="vous@exemple.com"
          autoComplete="email"
          errors={state.fieldErrors?.email}
        />
        <SubmitButton pending={pending}>Envoyer le lien</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/login" className="font-semibold text-blue-600 hover:underline">
          ← Retour à la connexion
        </Link>
      </p>
    </AuthCard>
  );
}
