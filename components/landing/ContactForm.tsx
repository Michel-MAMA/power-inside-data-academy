'use client';

import { useState } from 'react';

type Status = 'idle' | 'sending' | 'success' | 'error';

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setError(null);

    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.errors
            ? 'Vérifiez les champs du formulaire.'
            : json.error ?? 'Erreur lors de l’envoi.'
        );
      }
      form.reset();
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-2xl">✓</p>
        <h2 className="mt-2 font-[family-name:var(--font-jakarta)] text-lg font-bold text-slate-900">
          Message envoyé !
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Notre équipe vous répond sous 24 h ouvrées.
        </p>
      </div>
    );
  }

  const input =
    'h-11 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
  const label =
    'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600';

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 md:p-8"
    >
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="prenom" className={label}>Prénom</label>
          <input id="prenom" name="prenom" required minLength={2} placeholder="Marie" className={input} />
        </div>
        <div>
          <label htmlFor="nom" className={label}>Nom</label>
          <input id="nom" name="nom" required minLength={2} placeholder="Dupont" className={input} />
        </div>
      </div>
      <div>
        <label htmlFor="email" className={label}>Email</label>
        <input id="email" name="email" type="email" required placeholder="vous@exemple.com" className={input} />
      </div>
      <div>
        <label htmlFor="sujet" className={label}>Sujet</label>
        <input id="sujet" name="sujet" required minLength={4} placeholder="Financement CPF, formation sur mesure…" className={input} />
      </div>
      <div>
        <label htmlFor="message" className={label}>Message</label>
        <textarea
          id="message"
          name="message"
          required
          minLength={10}
          rows={5}
          placeholder="Décrivez votre besoin…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
      <button
        type="submit"
        disabled={status === 'sending'}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-xs font-bold uppercase tracking-[0.1em] text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-60"
      >
        {status === 'sending' ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          'Envoyer le message'
        )}
      </button>
    </form>
  );
}
