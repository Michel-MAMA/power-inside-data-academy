import { Code2, Users2, BadgeCheck, LifeBuoy } from 'lucide-react';

const PILLARS = [
  {
    icon: Code2,
    title: '80 % de pratique',
    description:
      'Labs guidés, projets réels corrigés par les formateurs, sandbox Python intégrée. On apprend en construisant.',
  },
  {
    icon: Users2,
    title: 'Experts terrain',
    description:
      'Des formateurs en poste sur des projets Data & IA en production — pas des slides recyclées.',
  },
  {
    icon: BadgeCheck,
    title: 'Certifications reconnues',
    description:
      'Certificats vérifiables en ligne par les recruteurs, alignés sur les certifications éditeurs (Microsoft, AWS).',
  },
  {
    icon: LifeBuoy,
    title: 'Accompagnement continu',
    description:
      'Sessions live, communauté privée, mentorat individuel jusqu’à votre objectif : poste, mission ou certification.',
  },
];

export default function MethodSection() {
  return (
    <section className="border-y border-slate-100 bg-slate-50/60">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="mb-12 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-600">
            Notre méthode
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-jakarta)] text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Pourquoi ça fonctionne.
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-600/5"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                  <Icon size={21} strokeWidth={1.8} />
                </span>
                <h3 className="mt-4 font-[family-name:var(--font-jakarta)] text-base font-bold text-slate-900">
                  {p.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                  {p.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
