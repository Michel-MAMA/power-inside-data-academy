import Link from 'next/link';
import { Check } from 'lucide-react';

const PLANS = [
  {
    name: 'Découverte',
    price: 'Gratuit',
    period: '',
    description: 'Pour explorer la plateforme et les aperçus de cours.',
    features: [
      'Leçons en aperçu gratuit',
      'Sandbox Python en ligne',
      'Accès à la communauté',
    ],
    cta: { label: 'Créer un compte', href: '/register' },
    featured: false,
  },
  {
    name: 'Formation à l’unité',
    price: 'dès 690 €',
    period: 'HT / formation',
    description: 'Accès à vie à une formation complète, projets corrigés inclus.',
    features: [
      'Accès à vie aux contenus',
      'Sessions live + replays',
      'Projets corrigés par un expert',
      'Certificat vérifiable en ligne',
      'Paiement CB, Orange Money, MTN MoMo',
    ],
    cta: { label: 'Voir le catalogue', href: '/formations' },
    featured: true,
  },
  {
    name: 'Entreprise',
    price: 'Sur devis',
    period: '',
    description: 'Formez vos équipes : cohortes dédiées, sur mesure, OPCO.',
    features: [
      'Programmes sur mesure',
      'Formateurs dédiés',
      'Suivi de progression équipe',
      'Financement OPCO / plan de formation',
    ],
    cta: { label: 'Parler à un expert', href: '/contact' },
    featured: false,
  },
];

export default function PricingSection() {
  return (
    <section id="tarifs" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 md:py-28">
      <div className="mb-12 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-600">
          Tarifs
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-jakarta)] text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          Simple et transparent.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-slate-500">
          Éligible CPF et OPCO selon les formations. Paiement en 3 fois sans frais.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col rounded-2xl p-7 transition duration-300 hover:-translate-y-1 ${
              plan.featured
                ? 'text-white shadow-2xl shadow-blue-900/25'
                : 'border border-slate-200 bg-white hover:shadow-xl hover:shadow-blue-600/5'
            }`}
            style={
              plan.featured
                ? {
                    background:
                      'linear-gradient(135deg, #0d1b2a 0%, #1a1f35 50%, #0f1419 100%)',
                  }
                : undefined
            }
          >
            {plan.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-lg shadow-blue-600/40">
                Le plus choisi
              </span>
            )}
            <p
              className={`font-[family-name:var(--font-jakarta)] text-[11px] font-bold uppercase tracking-[0.18em] ${
                plan.featured ? 'text-blue-300' : 'text-blue-600'
              }`}
            >
              {plan.name}
            </p>
            <p className="mt-3">
              <span
                className={`font-[family-name:var(--font-jakarta)] text-3xl font-extrabold ${
                  plan.featured ? 'text-white' : 'text-slate-900'
                }`}
              >
                {plan.price}
              </span>
              {plan.period && (
                <span className={`ml-1.5 text-xs ${plan.featured ? 'text-white/45' : 'text-slate-400'}`}>
                  {plan.period}
                </span>
              )}
            </p>
            <p className={`mt-2 text-sm ${plan.featured ? 'text-white/55' : 'text-slate-500'}`}>
              {plan.description}
            </p>

            <ul className="mt-6 flex-1 space-y-2.5">
              {plan.features.map((f) => (
                <li
                  key={f}
                  className={`flex items-start gap-2.5 text-[13px] ${
                    plan.featured ? 'text-white/70' : 'text-slate-600'
                  }`}
                >
                  <Check
                    size={15}
                    className={`mt-0.5 shrink-0 ${plan.featured ? 'text-blue-400' : 'text-emerald-500'}`}
                  />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href={plan.cta.href}
              className={`mt-7 rounded-xl py-3.5 text-center text-xs font-bold uppercase tracking-[0.08em] transition hover:-translate-y-0.5 ${
                plan.featured
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 hover:bg-blue-500'
                  : 'border border-slate-300 text-slate-700 hover:border-blue-400 hover:text-blue-700'
              }`}
            >
              {plan.cta.label}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
