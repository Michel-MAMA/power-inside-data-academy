import Link from 'next/link';
import { getPublishedFormations, getCatalogFilters } from '@/lib/services/formations';

export const metadata = {
  title: 'Catalogue des formations',
  description: 'Formations Data, IA, Cloud et BI — Power Inside Data Academy',
};

export const revalidate = 300; // ISR : cache 5 min

export default async function FormationsPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string; level?: string; q?: string }>;
}) {
  const params = await searchParams;
  const [formations, { domains }] = await Promise.all([
    getPublishedFormations({
      domainCode: params.domain,
      levelCode: params.level,
      search: params.q,
    }),
    getCatalogFilters(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-10">
        <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">
          Catalogue
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Nos formations
        </h1>
        <p className="mt-2 max-w-xl text-slate-500">
          Data Engineering, Intelligence Artificielle, Cloud et Business
          Intelligence — conçues par des experts terrain.
        </p>
      </header>

      {/* Filtres domaines */}
      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/formations"
          className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
            !params.domain
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-slate-200 text-slate-600 hover:border-slate-400'
          }`}
        >
          Toutes
        </Link>
        {domains.map((d) => (
          <Link
            key={d.id}
            href={`/formations?domain=${d.code}`}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              params.domain === d.code
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-200 text-slate-600 hover:border-slate-400'
            }`}
          >
            {d.icon} {d.name}
          </Link>
        ))}
      </div>

      {/* Grille */}
      {formations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-20 text-center">
          <p className="text-lg font-semibold text-slate-700">
            Aucune formation trouvée
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Essayez un autre filtre ou{' '}
            <Link href="/contact" className="text-blue-600 underline">
              contactez-nous
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {formations.map((f) => (
            <Link
              key={f.id}
              href={`/formations/${f.slug}`}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-600/5"
            >
              <div className="mb-4 flex items-center justify-between">
                <span
                  className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    color: f.domains?.color ?? '#1561FF',
                    background: `${f.domains?.color ?? '#1561FF'}14`,
                  }}
                >
                  {f.domains?.name ?? 'Formation'}
                </span>
                {f.is_certifying && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                    🎓 Certifiante
                  </span>
                )}
              </div>

              <h2 className="text-lg font-bold leading-snug text-slate-900 group-hover:text-blue-700">
                {f.title}
              </h2>
              <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-500">
                {f.short_description}
              </p>

              <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
                {f.levels?.name && <span>{f.levels.name}</span>}
                {f.duration_hours && <span>· {f.duration_hours}h</span>}
                {f.rating > 0 && (
                  <span>· ★ {Number(f.rating).toFixed(1)} ({f.rating_count})</span>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-lg font-bold text-slate-900">
                  {f.price_sur_devis
                    ? 'Sur devis'
                    : new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: f.currency || 'EUR',
                        maximumFractionDigits: 0,
                      }).format(Number(f.price_ht))}
                </span>
                <span className="text-sm font-semibold text-blue-600">
                  Découvrir →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
