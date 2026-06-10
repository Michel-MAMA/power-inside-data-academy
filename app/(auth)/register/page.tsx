'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registerAction, type ActionState } from '@/app/actions/auth';
import {
  AuthCard,
  Field,
  SubmitButton,
  FormError,
  FormSuccess,
} from '@/components/auth/AuthUI';

export default function RegisterPage() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    registerAction,
    {}
  );

  return (
    <AuthCard
      title="Créer un compte"
      subtitle="Rejoignez les apprenants Power Inside Data Academy."
    >
      <form action={action} className="space-y-4">
        <FormError state={state} />
        <FormSuccess state={state} />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Prénom"
            name="prenom"
            placeholder="Marie"
            autoComplete="given-name"
            errors={state.fieldErrors?.prenom}
          />
          <Field
            label="Nom"
            name="nom"
            placeholder="Dupont"
            autoComplete="family-name"
            errors={state.fieldErrors?.nom}
          />
        </div>
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
          placeholder="8 caractères min. — 1 majuscule, 1 chiffre"
          autoComplete="new-password"
          errors={state.fieldErrors?.password}
        />
        <SubmitButton pending={pending}>Créer mon compte</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Déjà inscrit ?{' '}
        <Link href="/login" className="font-semibold text-blue-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </AuthCard>
  );
}
