'use client';

import { useActionState } from 'react';
import { updateProfileAction, type ActionState } from '@/app/actions/auth';
import { Field, SubmitButton, FormError, FormSuccess } from '@/components/auth/AuthUI';
import type { Profile } from '@/types/database';

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    updateProfileAction,
    {}
  );

  return (
    <form
      action={action}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
    >
      <FormError state={state} />
      <FormSuccess state={state} />

      <div className="mb-2 flex items-center gap-4 border-b border-slate-100 pb-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
          {(profile.prenom?.[0] ?? '') + (profile.nom?.[0] ?? '') || '?'}
        </div>
        <div>
          <p className="font-bold text-slate-900">{profile.email}</p>
          <p className="text-xs uppercase tracking-wider text-slate-400">
            Compte {profile.role} · Plan {profile.subscription_plan}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DefaultedField label="Prénom" name="prenom" defaultValue={profile.prenom} errors={state.fieldErrors?.prenom} />
        <DefaultedField label="Nom" name="nom" defaultValue={profile.nom} errors={state.fieldErrors?.nom} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <DefaultedField label="Téléphone" name="phone" defaultValue={profile.phone} errors={state.fieldErrors?.phone} />
        <DefaultedField label="Entreprise" name="company" defaultValue={profile.company} errors={state.fieldErrors?.company} />
      </div>
      <DefaultedField label="Poste" name="job_title" defaultValue={profile.job_title} errors={state.fieldErrors?.job_title} />
      <div className="grid grid-cols-2 gap-3">
        <DefaultedField label="Pays" name="country" defaultValue={profile.country} errors={state.fieldErrors?.country} />
        <DefaultedField label="Ville" name="city" defaultValue={profile.city} errors={state.fieldErrors?.city} />
      </div>
      <DefaultedField label="LinkedIn" name="linkedin" defaultValue={profile.linkedin} errors={state.fieldErrors?.linkedin} />

      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
          Bio
        </label>
        <textarea
          name="bio"
          rows={3}
          defaultValue={profile.bio ?? ''}
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        {state.fieldErrors?.bio?.[0] && (
          <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.bio[0]}</p>
        )}
      </div>

      <SubmitButton pending={pending}>Enregistrer</SubmitButton>
    </form>
  );
}

function DefaultedField({
  label,
  name,
  defaultValue,
  errors,
}: {
  label: string;
  name: string;
  defaultValue: string | null;
  errors?: string[];
}) {
  // Wrapper de Field avec valeur initiale (Field n'est pas contrôlé)
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue ?? ''}
        className={`h-11 w-full rounded-lg border px-3 text-sm text-slate-900 transition focus:outline-none focus:ring-2 ${
          errors?.length
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
            : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
        }`}
      />
      {errors?.[0] && <p className="mt-1.5 text-xs text-red-600">{errors[0]}</p>}
    </div>
  );
}
