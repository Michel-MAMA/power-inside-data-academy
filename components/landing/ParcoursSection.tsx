import Link from 'next/link';
import { ArrowRight, Award } from 'lucide-react';
import { createPublicClient } from '@/lib/supabase/public';

interface ParcoursCard {
  slug: string;
  title: string;
  description: string;
  formations_count: number;
  duration_weeks: number | null;
}

/** Fallback si la table parcours est vide (mêmes parcours que le site statique). */
const FALLBACK: ParcoursCard[] = [
  { slug: 'data-engineer', title: 'Data Engineer', description: 'Pipelines, Fabric, Spark, Lakehouse — l’ingénierie data de bout en bout.', formations_count: 4, duration_weeks: 16 },
  { slug: 'data-analyst', title: 'Data Analyst', description: 'SQL, Power BI, DAX, storytelling — de la donnée brute à la décision.', formations_count: 3, duration_weeks: 12 },
  { slug: 'ml-engineer', title: 'ML Engineer', description: 'Python, ML, MLOps, déploiement — des modèles jusqu’à la production.', formations_count: 5, duration_weeks: 20 },
  { slug: 'bi-developer', title: 'BI Developer', description: 'Modélisation, Power Query, gouvernance — des rapports de niveau entreprise.', formations_count: 3, duration_weeks: 12 },
];

export default async function ParcoursSection() {
  let parcours: ParcoursCard[] = FALLBACK;
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('parcours')
      .select('slug, title, description, formations_count, duration_weeks')
      .eq('is_published', true)
      .order('created_at')
      .limit(4);
    if (data && data.length > 0) parcours = data as ParcoursCard[];
  } catch {
    /* fallback statique */
  }

  return (
    <section id="parcours" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 md:py-28">
      <div className="mb-12 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-600">
          Parcours certifiants
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-jakarta)] text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          Un objectif métier, un parcours complet.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-slate-500">
          Des cursus structurés qui enchaînent les bonnes formations dans le bon
          ordre, jusqu&apos;à la certification.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {parcours.map((p) => (
          <Link
            key={p.slug}
            href="/formations"
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1.5 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-600/5"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Award size={21} strokeWidth={1.8} />
            </span>
            <h3 className="mt-4 font-[family-name:var(--font-jakarta)] text-base font-bold text-slate-900 group-hover:text-blue-700">
              Parcours {p.title}
            </h3>
            <p className="mt-2 flex-1 text-[13px] leading-relaxed text-slate-500">
              {p.description}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
              <span>
                {p.formations_count} formations
                {p.duration_weeks ? ` · ${p.duration_weeks} sem.` : ''}
              </span>
              <ArrowRight size={14} className="text-blue-600 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
