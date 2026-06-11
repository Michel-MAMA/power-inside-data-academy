import InfoShell from '@/components/landing/InfoShell';

export const metadata = { title: 'Mentions légales' };

export default function MentionsLegalesPage() {
  return (
    <InfoShell eyebrow="Légal" title="Mentions légales.">
      <div className="space-y-8 text-sm leading-relaxed text-slate-600">
        <section>
          <h2 className="mb-2 font-[family-name:var(--font-jakarta)] text-base font-bold text-slate-900">Éditeur du site</h2>
          <p>
            Power Inside Data Group — Power Inside Data Academy<br />
            Email : academy@powerinsidedata.com<br />
            Téléphone : +33 7 67 93 64 61 · +237 6 73 26 24 85<br />
            Directeur de la publication : Dr. Michel MAMA TOULOU
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-[family-name:var(--font-jakarta)] text-base font-bold text-slate-900">Hébergement</h2>
          <p>
            Application : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.<br />
            Données : Supabase Inc. (PostgreSQL managé, région Europe).
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-[family-name:var(--font-jakarta)] text-base font-bold text-slate-900">Propriété intellectuelle</h2>
          <p>
            L&apos;ensemble des contenus (textes, vidéos, supports de formation, logos,
            marques) est protégé par le droit de la propriété intellectuelle et reste
            la propriété exclusive de Power Inside Data Group. Toute reproduction non
            autorisée est interdite.
          </p>
        </section>
      </div>
    </InfoShell>
  );
}
