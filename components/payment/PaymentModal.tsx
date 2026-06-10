'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

// ─────────────────────────────────────────────────────────────────────────────
// PaymentModal — fenêtre de paiement premium (style Stripe / Coursera)
// Méthodes : Carte bancaire (Stripe) · Orange Money · MTN Mobile Money
// ─────────────────────────────────────────────────────────────────────────────

export interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  formation: {
    id: string;
    title: string;
    price: number;
    currency: string;
  };
}

type Method = 'stripe' | 'orange_money' | 'mtn_momo';
type Step = 'method' | 'phone' | 'waiting' | 'success' | 'error';

interface PromoState {
  code: string;
  applied: boolean;
  discount: number;
  error: string | null;
}

const METHODS: {
  id: Method;
  label: string;
  sublabel: string;
  icon: string;
  accent: string;
}[] = [
  {
    id: 'stripe',
    label: 'Carte bancaire',
    sublabel: 'Visa, Mastercard, CB — paiement sécurisé Stripe',
    icon: '💳',
    accent: '#635BFF',
  },
  {
    id: 'orange_money',
    label: 'Orange Money',
    sublabel: 'Paiement mobile — Cameroun, Côte d’Ivoire, Sénégal',
    icon: '🟠',
    accent: '#FF7900',
  },
  {
    id: 'mtn_momo',
    label: 'MTN Mobile Money',
    sublabel: 'Validation par code PIN sur votre téléphone',
    icon: '🟡',
    accent: '#FFCC00',
  },
];

export default function PaymentModal({ open, onClose, formation }: PaymentModalProps) {
  const [method, setMethod] = useState<Method>('stripe');
  const [step, setStep] = useState<Step>('method');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promo, setPromo] = useState<PromoState>({
    code: '',
    applied: false,
    discount: 0,
    error: null,
  });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Reset à l'ouverture + blocage du scroll
  useEffect(() => {
    if (open) {
      setStep('method');
      setError(null);
      setLoading(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => {
      document.body.style.overflow = '';
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open]);

  // Fermeture sur Échap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !loading && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, loading]);

  const finalAmount = Math.max(0, formation.price - promo.discount);
  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: formation.currency || 'EUR',
    }).format(n);

  // ── Paiement Stripe : redirection Checkout ────────────────────────────────
  const payWithStripe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formationId: formation.id,
          promoCode: promo.applied ? promo.code : undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? 'Erreur de paiement.');
      window.location.href = json.data.url; // → Stripe Checkout
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue.');
      setStep('error');
      setLoading(false);
    }
  }, [formation.id, promo]);

  // ── Orange Money : redirection page de paiement Orange ───────────────────
  const payWithOrange = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/orange-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formationId: formation.id,
          phoneNumber: phone,
          promoCode: promo.applied ? promo.code : undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? 'Erreur Orange Money.');
      window.location.href = json.data.url; // → page de paiement Orange
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue.');
      setStep('error');
      setLoading(false);
    }
  }, [formation.id, phone, promo]);

  // ── MTN MoMo : push téléphone + polling du statut ─────────────────────────
  const payWithMtn = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/mtn-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formationId: formation.id,
          phoneNumber: phone,
          promoCode: promo.applied ? promo.code : undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? 'Erreur MTN MoMo.');

      setStep('waiting');
      setLoading(false);

      // Polling du statut toutes les 4s (max ~2 min)
      const reference = json.data.reference as string;
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts += 1;
        try {
          const sRes = await fetch(
            `/api/payments/mtn-money?reference=${encodeURIComponent(reference)}`
          );
          const sJson = await sRes.json();
          const status = sJson?.data?.status;
          if (status === 'succeeded') {
            if (pollRef.current) clearInterval(pollRef.current);
            setStep('success');
          } else if (status === 'failed' || attempts > 30) {
            if (pollRef.current) clearInterval(pollRef.current);
            setError(
              status === 'failed'
                ? 'Paiement refusé ou annulé sur votre téléphone.'
                : 'Délai dépassé. Si vous avez validé, votre accès sera activé sous peu.'
            );
            setStep('error');
          }
        } catch {
          /* erreur réseau ponctuelle : on continue le polling */
        }
      }, 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue.');
      setStep('error');
      setLoading(false);
    }
  }, [formation.id, phone, promo]);

  const handleContinue = () => {
    if (method === 'stripe') return payWithStripe();
    if (step === 'method') return setStep('phone');
    if (method === 'orange_money') return payWithOrange();
    return payWithMtn();
  };

  if (!open || !mounted) return null;

  const needsPhone = method !== 'stripe' && step === 'phone';
  const phoneValid = /^\+?[0-9]{8,15}$/.test(phone);
  const selected = METHODS.find((m) => m.id === method)!;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Fenêtre de paiement"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={() => !loading && onClose()}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">
              Inscription formation
            </p>
            <h2 className="mt-1 text-lg font-bold leading-snug text-slate-900">
              {formation.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
            aria-label="Fermer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {/* ── Étape : choix de la méthode ── */}
          {step === 'method' && (
            <>
              <div className="space-y-2.5">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                      method === m.id
                        ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl"
                      style={{ background: `${m.accent}18` }}
                    >
                      {m.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">
                        {m.label}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {m.sublabel}
                      </span>
                    </span>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                        method === m.id ? 'border-blue-600' : 'border-slate-300'
                      }`}
                    >
                      {method === m.id && (
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                      )}
                    </span>
                  </button>
                ))}
              </div>

              {/* Code promo */}
              <div className="mt-5">
                <div className="flex gap-2">
                  <input
                    value={promo.code}
                    onChange={(e) =>
                      setPromo({ code: e.target.value.toUpperCase(), applied: false, discount: 0, error: null })
                    }
                    placeholder="Code promo (optionnel)"
                    className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm uppercase tracking-wide placeholder:normal-case placeholder:tracking-normal focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    onClick={() => {
                      // La validation réelle (et le calcul exact) se fait côté
                      // serveur à la création du paiement ; ici on marque le
                      // code comme "à appliquer".
                      if (promo.code.trim().length >= 3) {
                        setPromo((p) => ({ ...p, applied: true, error: null }));
                      } else {
                        setPromo((p) => ({ ...p, error: 'Code trop court.' }));
                      }
                    }}
                    className="h-10 rounded-lg bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-slate-700"
                  >
                    Appliquer
                  </button>
                </div>
                {promo.applied && (
                  <p className="mt-1.5 text-xs font-medium text-emerald-600">
                    ✓ Code « {promo.code} » appliqué — vérifié au paiement.
                  </p>
                )}
                {promo.error && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{promo.error}</p>
                )}
              </div>
            </>
          )}

          {/* ── Étape : numéro de téléphone (mobile money) ── */}
          {needsPhone && (
            <div>
              <button
                onClick={() => setStep('method')}
                className="mb-4 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
              >
                ← Changer de moyen de paiement
              </button>
              <div className="mb-4 flex items-center gap-3 rounded-xl p-4" style={{ background: `${selected.accent}12` }}>
                <span className="text-2xl">{selected.icon}</span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{selected.label}</p>
                  <p className="text-xs text-slate-500">
                    {method === 'mtn_momo'
                      ? 'Vous recevrez une demande de validation sur votre téléphone.'
                      : 'Vous serez redirigé vers la page de paiement Orange.'}
                  </p>
                </div>
              </div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ''))}
                placeholder="+237 6XX XXX XXX"
                autoFocus
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {phone.length > 3 && !phoneValid && (
                <p className="mt-1.5 text-xs text-red-600">
                  Format attendu : indicatif pays + numéro (8 à 15 chiffres).
                </p>
              )}
            </div>
          )}

          {/* ── Étape : attente validation MoMo ── */}
          {step === 'waiting' && (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-yellow-400" />
              <h3 className="text-base font-bold text-slate-900">
                Validez sur votre téléphone
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">
                Une demande de paiement de <strong>{fmt(finalAmount)}</strong> a été
                envoyée au <strong>{phone}</strong>. Composez votre code PIN MoMo
                pour confirmer.
              </p>
            </div>
          )}

          {/* ── Étape : succès ── */}
          {step === 'success' && (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
                ✓
              </div>
              <h3 className="text-base font-bold text-slate-900">Paiement confirmé !</h3>
              <p className="mt-2 text-sm text-slate-500">
                Votre inscription est active. Retrouvez la formation dans votre
                tableau de bord.
              </p>
              <a
                href="/dashboard"
                className="mt-5 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Accéder à mon dashboard →
              </a>
            </div>
          )}

          {/* ── Étape : erreur ── */}
          {step === 'error' && (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
                ✕
              </div>
              <h3 className="text-base font-bold text-slate-900">Paiement non abouti</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">{error}</p>
              <button
                onClick={() => {
                  setStep('method');
                  setError(null);
                }}
                className="mt-5 rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>

        {/* Footer : récapitulatif + CTA */}
        {(step === 'method' || needsPhone) && (
          <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-5">
            <div className="mb-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Prix de la formation</span>
                <span>{fmt(formation.price)}</span>
              </div>
              {promo.applied && (
                <div className="flex justify-between font-medium text-emerald-600">
                  <span>Réduction ({promo.code})</span>
                  <span>calculée au paiement</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                <span>Total</span>
                <span>{fmt(finalAmount)}</span>
              </div>
            </div>

            <button
              onClick={handleContinue}
              disabled={loading || (needsPhone && !phoneValid)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 hover:shadow-blue-600/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : step === 'method' && method === 'stripe' ? (
                <>Payer {fmt(finalAmount)} →</>
              ) : step === 'method' ? (
                <>Continuer →</>
              ) : (
                <>Payer {fmt(finalAmount)} →</>
              )}
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Paiement chiffré et sécurisé · Aucune donnée bancaire stockée
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
