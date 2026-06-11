import Link from 'next/link';
import { ArrowRight, Clock, GraduationCap, Star } from 'lucide-react';
import { createPublicClient } from '@/lib/supabase/public';
import type { Formation } from '@/types/database';

/**
 * Formations phares — données 100 % Supabase.
 * Utilise le client public (sans cookies) pour rester compatible ISR.
 * Si la base est vide ou indisponible, fallback propre au lieu de casser.
 */
export default async function FormationsSection() {
  let formations: Formation[] = [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('formations')
      .select(
        `id, slug, title, short_description, price_ht, price_sur_devis, currency,
         duration_hours, is_certifying, rating, rating_count,
         domains ( name, color ), levels ( name )`
      )
      .eq('is_published', true)
      .order('is_featured', { ascending: false })
      .order('students_count', { ascending: false })
      .limit(6);
    formations = (data ?? []) as unknown as Formation[];
  } catch {
    formations = [];
  }

  return (
    <section className="border-y border-slate-100 bg-slate-50/60">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-600">
              Formations phares
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-jakarta)] text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Les plus demandées.
            </h2>
          </div>
          <Link
            href="/formations"
            className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.1em] text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            Voir tout le catalogue
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {formations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <p className="font-semibold text-slate-700">
              Le catalogue arrive très bientôt.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              <Link href="/contact" className="text-blue-600 underline">
                Contactez-nous
              </Link>{' '}
              pour un programme sur mesure dès aujourd&apos;hui.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {formations.map((f) => (
              <Link
                key={f.id}
                href={`/formations/${f.slug}`}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-600/5"
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
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                      <GraduationCap size={12} /> Certifiante
                    </span>
                  )}
                </div>

                <h3 className="font-[family-name:var(--font-jakarta)] text-lg font-bold leading-snug text-slate-900 group-hover:text-blue-700">
                  {f.title}
                </h3>
                <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500">
                  {f.short_description}
                </p>

                <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                  {f.levels?.name && <span>{f.levels.name}</span>}
                  {f.duration_hours && (
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} /> {f.duration_hours}h
                    </span>
                  )}
                  {Number(f.rating) > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      {Number(f.rating).toFixed(1)}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="font-[family-name:var(--font-jakarta)] text-lg font-bold text-slate-900">
                    {f.price_sur_devis
                      ? 'Sur devis'
                      : new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: f.currency || 'EUR',
                          maximumFractionDigits: 0,
                        }).format(Number(f.price_ht))}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition-all group-hover:gap-2.5">
                    Découvrir <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
