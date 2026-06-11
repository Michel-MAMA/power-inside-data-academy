import InfoShell from '@/components/landing/InfoShell';

export const metadata = { title: 'Politique de confidentialité (RGPD)' };

const SECTIONS = [
  {
    title: 'Données collectées',
    body: "Compte : prénom, nom, email, téléphone (optionnel). Apprentissage : progression, résultats de quiz, certificats. Paiement : montants et références de transaction (les données bancaires sont traitées exclusivement par Stripe, Orange Money ou MTN — jamais stockées chez nous). Contact : messages envoyés via le formulaire.",
  },
  {
    title: 'Finalités et bases légales',
    body: "Exécution du contrat (accès aux formations, certificats, facturation), obligations légales (comptabilité), intérêt légitime (amélioration de la plateforme, statistiques agrégées) et consentement (communications marketing, révocable à tout moment).",
  },
  {
    title: 'Durées de conservation',
    body: "Données de compte : durée de vie du compte + 3 ans. Factures : 10 ans (obligation légale). Messages de contact : 3 ans. Vous pouvez demander la suppression de votre compte à tout moment.",
  },
  {
    title: 'Sous-traitants',
    body: "Supabase (hébergement des données, UE), Vercel (hébergement applicatif), Stripe / Orange Money / MTN (paiements). Chaque sous-traitant présente des garanties RGPD adaptées.",
  },
  {
    title: 'Vos droits',
    body: "Accès, rectification, effacement, portabilité, limitation et opposition : écrivez à academy@powerinsidedata.com. Vous disposez également du droit d'introduire une réclamation auprès de la CNIL.",
  },
  {
    title: 'Sécurité',
    body: "Chiffrement TLS, politiques d'accès par rôle (Row Level Security), journalisation des opérations sensibles et webhooks de paiement signés et vérifiés.",
  },
];

export default function RgpdPage() {
  return (
    <InfoShell
      eyebrow="Légal"
      title="Protection de vos données."
      intro="Notre politique de confidentialité, conforme au Règlement général sur la protection des données (RGPD)."
    >
      <div className="space-y-7 text-sm leading-relaxed text-slate-600">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="mb-2 font-[family-name:var(--font-jakarta)] text-base font-bold text-slate-900">
              {s.title}
            </h2>
            <p>{s.body}</p>
          </section>
        ))}
      </div>
    </InfoShell>
  );
}
