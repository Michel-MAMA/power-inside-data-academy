import InfoShell from '@/components/landing/InfoShell';

export const metadata = { title: "Conditions générales d'utilisation" };

const SECTIONS = [
  {
    title: '1. Objet',
    body: "Les présentes CGU encadrent l'utilisation de la plateforme Power Inside Data Academy : consultation du catalogue, création de compte, achat et suivi de formations, passage de quiz et obtention de certificats.",
  },
  {
    title: '2. Compte utilisateur',
    body: "L'inscription requiert un email valide. Vous êtes responsable de la confidentialité de vos identifiants et de toute activité effectuée depuis votre compte. Tout compte peut être suspendu en cas d'usage frauduleux.",
  },
  {
    title: '3. Achats et accès aux formations',
    body: "Sauf mention contraire, l'achat d'une formation donne un accès à vie aux contenus. Les paiements sont traités par des prestataires certifiés (Stripe, Orange Money, MTN Mobile Money) ; aucune donnée bancaire n'est stockée sur nos serveurs.",
  },
  {
    title: '4. Rétractation et remboursement',
    body: "Conformément au droit applicable, vous disposez de 14 jours pour exercer votre droit de rétractation, sauf si vous avez expressément commencé la formation. Les demandes s'effectuent via la page contact.",
  },
  {
    title: '5. Propriété intellectuelle',
    body: "Les contenus pédagogiques sont licenciés pour un usage personnel et non transférable. Le partage de comptes, la revente ou la rediffusion des contenus sont strictement interdits.",
  },
  {
    title: '6. Certificats',
    body: "Les certificats sont délivrés après complétion des conditions pédagogiques (progression, quiz). Ils sont vérifiables publiquement par leur code unique et peuvent être révoqués en cas de fraude.",
  },
];

export default function CguPage() {
  return (
    <InfoShell eyebrow="Légal" title="Conditions générales d'utilisation.">
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
