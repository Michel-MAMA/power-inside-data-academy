import { Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Sarah K.',
    role: 'Data Analyst → Data Engineer',
    company: 'Secteur bancaire',
    quote:
      "La formation Data Engineering m'a permis de passer d'analyste à ingénieure data en 6 mois. Les projets corrigés par les formateurs font toute la différence.",
  },
  {
    name: 'Olivier M.',
    role: 'Responsable BI',
    company: 'Grande distribution',
    quote:
      "Nous avons formé toute l'équipe sur Power BI et Fabric. Pédagogie remarquable, cas d'usage directement applicables — le ROI a été immédiat.",
  },
  {
    name: 'Aïcha D.',
    role: 'ML Engineer',
    company: 'Scale-up tech',
    quote:
      'Le parcours MLOps est le plus complet que j\'ai suivi : du déploiement Kubernetes au monitoring de modèles. Certification obtenue, poste décroché.',
  },
];

export default function TestimonialsSection() {
  return (
    <section id="temoignages" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 md:py-28">
      <div className="mb-12 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-600">
          Témoignages
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-jakarta)] text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          Ils ont transformé leur carrière.
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <figure
            key={t.name}
            className="relative flex flex-col rounded-2xl p-7 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/15"
            style={{
              background:
                'linear-gradient(135deg, #0d1b2a 0%, #1a1f35 50%, #0f1419 100%)',
            }}
          >
            <Quote size={22} className="text-blue-400/60" />
            <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-white/70">
              « {t.quote} »
            </blockquote>
            <figcaption className="mt-6 border-t border-white/10 pt-5">
              <p className="font-[family-name:var(--font-jakarta)] text-sm font-bold text-white">
                {t.name}
              </p>
              <p className="mt-0.5 text-xs text-blue-300">{t.role}</p>
              <p className="text-[11px] text-white/35">{t.company}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
