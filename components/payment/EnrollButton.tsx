'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import PaymentModal from '@/components/payment/PaymentModal';

interface Props {
  formation: {
    id: string;
    title: string;
    price: number;
    currency: string;
    priceOnQuote: boolean;
  };
  enrollment: {
    id: string;
    status: string;
    payment_status: string;
    progress_pct: number;
  } | null;
}

/**
 * Bouton « S'inscrire à la formation ».
 * - Déjà inscrit (payé) → lien dashboard
 * - Sur devis → lien contact
 * - Sinon → ouvre le PaymentModal
 */
export default function EnrollButton({ formation, enrollment }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentFlag = searchParams.get('payment');

  const isPaid =
    enrollment && ['paid', 'cpf', 'opco', 'free'].includes(enrollment.payment_status);

  if (isPaid) {
    return (
      <Link
        href="/dashboard"
        className="flex h-12 w-full items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-emerald-700"
      >
        ✓ Inscrit — Continuer ({enrollment.progress_pct}%)
      </Link>
    );
  }

  if (formation.priceOnQuote) {
    return (
      <Link
        href="/contact"
        className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-blue-700"
      >
        Demander un devis →
      </Link>
    );
  }

  return (
    <>
      {paymentFlag === 'success' && (
        <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          ✓ Paiement reçu ! Votre accès est en cours d&apos;activation —
          actualisez dans quelques secondes.
        </div>
      )}
      {paymentFlag === 'cancelled' && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          Paiement annulé. Vous pouvez réessayer quand vous voulez.
        </div>
      )}
      <button
        onClick={() => setOpen(true)}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 hover:shadow-blue-600/40"
      >
        S&apos;inscrire à la formation
      </button>
      <PaymentModal
        open={open}
        onClose={() => {
          setOpen(false);
          router.refresh(); // re-vérifie l'inscription au cas où
        }}
        formation={{
          id: formation.id,
          title: formation.title,
          price: formation.price,
          currency: formation.currency,
        }}
      />
    </>
  );
}
