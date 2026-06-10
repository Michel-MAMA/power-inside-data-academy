import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Payment } from '@/types/database';

export const metadata = { title: 'Paiements | Admin PIDA' };

const PROVIDER_BADGES: Record<string, { label: string; cls: string }> = {
  stripe: { label: '💳 Stripe', cls: 'bg-indigo-50 text-indigo-700' },
  orange_money: { label: '🟠 Orange Money', cls: 'bg-orange-50 text-orange-700' },
  mtn_momo: { label: '🟡 MTN MoMo', cls: 'bg-yellow-50 text-yellow-700' },
};

const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  succeeded: { label: 'Réussi', cls: 'bg-emerald-50 text-emerald-700' },
  pending: { label: 'En attente', cls: 'bg-slate-100 text-slate-600' },
  processing: { label: 'En cours', cls: 'bg-blue-50 text-blue-700' },
  requires_action: { label: 'Action requise', cls: 'bg-amber-50 text-amber-700' },
  failed: { label: 'Échoué', cls: 'bg-red-50 text-red-700' },
  cancelled: { label: 'Annulé', cls: 'bg-slate-100 text-slate-500' },
  refunded: { label: 'Remboursé', cls: 'bg-purple-50 text-purple-700' },
  partially_refunded: { label: 'Remb. partiel', cls: 'bg-purple-50 text-purple-600' },
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string; status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Garde-fou (le middleware vérifie déjà le rôle ; RLS protège les données)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let query = supabase
    .from('payments')
    .select(
      `id, amount, amount_gross, discount_amount, currency, status,
       provider_reference, provider_payment_id, phone_number,
       failure_message, paid_at, created_at,
       profiles ( prenom, nom, email ),
       formations ( title, slug ),
       payment_providers ( code, name )`
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (params.status) query = query.eq('status', params.status);

  const { data, error } = await query;
  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Erreur de chargement : {error.message} — vérifiez vos permissions admin.
        </p>
      </main>
    );
  }

  let payments = (data ?? []) as unknown as Payment[];
  if (params.provider) {
    payments = payments.filter(
      (p) => p.payment_providers?.code === params.provider
    );
  }

  const totalSucceeded = payments
    .filter((p) => p.status === 'succeeded')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const fmt = (n: number, cur = 'EUR') =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur }).format(n);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Paiements</h1>
          <p className="mt-1 text-sm text-slate-500">
            {payments.length} transactions affichées · Revenus :{' '}
            <strong className="text-slate-900">{fmt(totalSucceeded)}</strong>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterLink href="/admin/payments" active={!params.provider && !params.status}>
            Tous
          </FilterLink>
          <FilterLink href="/admin/payments?provider=stripe" active={params.provider === 'stripe'}>
            💳 Stripe
          </FilterLink>
          <FilterLink href="/admin/payments?provider=orange_money" active={params.provider === 'orange_money'}>
            🟠 Orange
          </FilterLink>
          <FilterLink href="/admin/payments?provider=mtn_momo" active={params.provider === 'mtn_momo'}>
            🟡 MTN
          </FilterLink>
          <FilterLink href="/admin/payments?status=succeeded" active={params.status === 'succeeded'}>
            Réussis
          </FilterLink>
          <FilterLink href="/admin/payments?status=failed" active={params.status === 'failed'}>
            Échoués
          </FilterLink>
        </div>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
              <th className="px-5 py-3.5 font-bold">Date</th>
              <th className="px-5 py-3.5 font-bold">Utilisateur</th>
              <th className="px-5 py-3.5 font-bold">Formation</th>
              <th className="px-5 py-3.5 font-bold">Provider</th>
              <th className="px-5 py-3.5 text-right font-bold">Montant</th>
              <th className="px-5 py-3.5 font-bold">Statut</th>
              <th className="px-5 py-3.5 font-bold">Référence</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                  Aucun paiement pour ces filtres.
                </td>
              </tr>
            )}
            {payments.map((p) => {
              const provider =
                PROVIDER_BADGES[p.payment_providers?.code ?? ''] ?? {
                  label: p.payment_providers?.name ?? '—',
                  cls: 'bg-slate-100 text-slate-600',
                };
              const status =
                STATUS_BADGES[p.status] ?? {
                  label: p.status,
                  cls: 'bg-slate-100 text-slate-600',
                };
              return (
                <tr
                  key={p.id}
                  className="border-b border-slate-50 transition hover:bg-slate-50/60"
                >
                  <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                    {new Date(p.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-900">
                      {[p.profiles?.prenom, p.profiles?.nom].filter(Boolean).join(' ') || '—'}
                    </p>
                    <p className="text-xs text-slate-400">{p.profiles?.email}</p>
                  </td>
                  <td className="max-w-[220px] truncate px-5 py-3.5 text-slate-700">
                    {p.formations?.title ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${provider.cls}`}>
                      {provider.label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right">
                    <span className="font-bold text-slate-900">
                      {fmt(Number(p.amount), p.currency)}
                    </span>
                    {Number(p.discount_amount) > 0 && (
                      <p className="text-xs text-emerald-600">
                        −{fmt(Number(p.discount_amount), p.currency)} promo
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.cls}`}>
                      {status.label}
                    </span>
                    {p.failure_message && (
                      <p className="mt-1 max-w-[180px] truncate text-xs text-red-400" title={p.failure_message}>
                        {p.failure_message}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-400">
                    {p.provider_reference}
                    {p.phone_number && (
                      <p className="text-slate-400">{p.phone_number}</p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Affichage limité aux 100 derniers paiements. Les statuts sont mis à jour
        en temps réel par les webhooks providers (voir table payment_webhooks).
      </p>
    </main>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
        active
          ? 'border-slate-900 bg-slate-900 text-white'
          : 'border-slate-200 text-slate-600 hover:border-slate-400'
      }`}
    >
      {children}
    </Link>
  );
}
