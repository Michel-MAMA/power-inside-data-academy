'use client';

import type { ActionState } from '@/app/actions/auth';

/** Composants UI partagés des pages d'authentification. */

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-900/5">
        <div className="mb-7">
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">
            Power Inside Data Academy
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  name,
  type = 'text',
  placeholder,
  autoComplete,
  errors,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  errors?: string[];
}) {
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
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`h-11 w-full rounded-lg border px-3 text-sm text-slate-900 transition focus:outline-none focus:ring-2 ${
          errors?.length
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
            : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
        }`}
        aria-invalid={Boolean(errors?.length)}
      />
      {errors?.[0] && <p className="mt-1.5 text-xs text-red-600">{errors[0]}</p>}
    </div>
  );
}

export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        children
      )}
    </button>
  );
}

export function FormError({ state }: { state: ActionState }) {
  if (!state.error) return null;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {state.error}
    </div>
  );
}

export function FormSuccess({ state }: { state: ActionState }) {
  if (!state.success) return null;
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
      {state.success}
    </div>
  );
}
