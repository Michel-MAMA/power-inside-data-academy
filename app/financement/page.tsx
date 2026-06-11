import Link from 'next/link';
import InfoShell from '@/components/landing/InfoShell';

export const metadata = { title: 'Financement CPF & OPCO' };

const OPTIONS = [
  {
    title: 'CPF — Compte Personnel de Formation',
    body: 'Plusieurs formations sont éligibles au CPF via notre partenaire certifié Qualiopi. Vous mobilisez vos droits directement, sans avance de frais.',
  },
  {
    title: 'OPCO — Opérateurs de compétences',
    body: "Salarié ou employeur : votre OPCO peut prendre en charge tout ou partie de la formation. Nous fournissons devis, programme détaillé et convention sous 48 h.",
  },
  {
    title: 'Plan de développement des compétences',
    body: "Votre entreprise finance la formation dans le cadre de son plan annuel. Cohortes dédiées et programmes sur mesure possibles.",
  },
  {
    title: 'Paiement individuel en 3 fois',
    body: 'Carte bancaire (Stripe), Orange Money ou MTN Mobile Money — en une fois ou en 3 fois sans frais.',
  },
];

export default function FinancementPage() {
  return (
    <InfoShell
      eyebrow="Financement"
      title="Financer votre formation."
      intro="Quatre dispositifs pour ne pas laisser le budget freiner votre montée en compétences."
    >
      <div className="space-y-4">
        {OPTIONS.map((o) => (
          <div key={o.title} className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-[family-name:var(--font-jakarta)] text-base font-bold text-slate-900">
              {o.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{o.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-2xl bg-blue-50 p-6 text-center">
        <p className="font-semibold text-slate-800">
          Besoin d&apos;aide pour monter votre dossier ?
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-block rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold uppercase tracking-[0.08em] text-white transition hover:bg-blue-700"
        >
          Parler à un conseiller →
        </Link>
      </div>
    </InfoShell>
  );
}
