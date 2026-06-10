import { notFound } from 'next/navigation';
import {
  getFormationBySlug,
  getUserEnrollmentForFormation,
} from '@/lib/services/formations';
import EnrollButton from '@/components/payment/EnrollButton';

export const revalidate = 0; // toujours frais (statut d'inscription utilisateur)

export default async function FormationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { formation, sessions } = await getFormationBySlug(slug);
  if (!formation) notFound();

  const enrollment = await getUserEnrollmentForFormation(formation.id);
  const modules = (formation.modules ?? []).sort(
    (a, b) => a.order_index - b.order_index
  );
  const totalLessons = modules.reduce((n, m) => n + (m.lessons?.length ?? 0), 0);

  const fmtPrice = formation.price_sur_devis
    ? 'Sur devis'
    : new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: formation.currency || 'EUR',
        maximumFractionDigits: 0,
      }).format(Number(formation.price_ht));

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-10 lg:grid-cols-[1fr,380px]">
        {/* ── Colonne principale ── */}
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{
                color: formation.domains?.color ?? '#1561FF',
                background: `${formation.domains?.color ?? '#1561FF'}14`,
              }}
            >
              {formation.domains?.name}
            </span>
            {formation.levels?.name && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                {formation.levels.name}
              </span>
            )}
            {formation.is_certifying && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                🎓 Certifiante
              </span>
            )}
            {formation.is_cpf_eligible && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                Éligible CPF
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold leading-tight text-slate-900">
            {formation.title}
          </h1>
          <p className="mt-3 text-lg text-slate-500">{formation.short_description}</p>

          <div className="mt-5 flex flex-wrap gap-5 text-sm text-slate-500">
            {formation.duration_hours && <span>⏱ {formation.duration_hours} heures</span>}
            {formation.duration_days && <span>📅 {formation.duration_days} jours</span>}
            <span>📚 {modules.length} modules · {totalLessons} leçons</span>
            {formation.students_count > 0 && (
              <span>👥 {formation.students_count} apprenants</span>
            )}
            {Number(formation.rating) > 0 && (
              <span>★ {Number(formation.rating).toFixed(1)} ({formation.rating_count} avis)</span>
            )}
          </div>

          {formation.description && (
            <section className="mt-10">
              <h2 className="mb-3 text-xl font-bold text-slate-900">À propos</h2>
              <p className="whitespace-pre-line leading-relaxed text-slate-600">
                {formation.description}
              </p>
            </section>
          )}

          {/* Programme */}
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-bold text-slate-900">Programme</h2>
            {modules.length === 0 ? (
              <p className="text-sm text-slate-500">Programme détaillé sur demande.</p>
            ) : (
              <div className="space-y-3">
                {modules.map((m, i) => (
                  <details
                    key={m.id}
                    className="group rounded-xl border border-slate-200 bg-white"
                    open={i === 0}
                  >
                    <summary className="flex cursor-pointer items-center gap-4 px-5 py-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-600">
                        {i + 1}
                      </span>
                      <span className="flex-1">
                        <span className="block font-semibold text-slate-900">
                          {m.title}
                        </span>
                        <span className="text-xs text-slate-400">
                          {m.lessons?.length ?? 0} leçons
                          {m.duration_hours ? ` · ${m.duration_hours}h` : ''}
                          {m.is_practical ? ' · 🛠 Pratique' : ''}
                        </span>
                      </span>
                      <span className="text-slate-400 transition group-open:rotate-180">▾</span>
                    </summary>
                    {(m.lessons?.length ?? 0) > 0 && (
                      <ul className="border-t border-slate-100 px-5 py-3">
                        {m.lessons!
                          .sort((a, b) => a.order_index - b.order_index)
                          .map((l) => (
                            <li
                              key={l.id}
                              className="flex items-center gap-3 py-2 text-sm text-slate-600"
                            >
                              <span className="text-xs">
                                {l.lesson_type === 'video' ? '▶️'
                                  : l.lesson_type === 'quiz' ? '❓'
                                  : l.lesson_type === 'project' ? '🛠'
                                  : '📄'}
                              </span>
                              <span className="flex-1">{l.title}</span>
                              {l.is_preview && (
                                <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-600">
                                  Aperçu gratuit
                                </span>
                              )}
                              {l.duration_min && (
                                <span className="text-xs text-slate-400">
                                  {l.duration_min} min
                                </span>
                              )}
                            </li>
                          ))}
                      </ul>
                    )}
                  </details>
                ))}
              </div>
            )}
          </section>

          {/* Sessions */}
          {sessions.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Prochaines sessions
              </h2>
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-5 py-3 text-sm"
                  >
                    <span className="font-semibold text-slate-800">
                      {new Date(s.date_start).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                      {s.location ? ` · ${s.location}` : ' · Distanciel'}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                        s.status === 'few_spots'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {s.status === 'few_spots'
                        ? `Dernières places (${s.max_participants - s.enrolled_count})`
                        : 'Places disponibles'}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Carte d'achat (sticky) ── */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
            {formation.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={formation.thumbnail_url}
                alt=""
                className="mb-5 aspect-video w-full rounded-xl object-cover"
              />
            )}
            <p className="text-3xl font-bold text-slate-900">{fmtPrice}</p>
            {!formation.price_sur_devis && (
              <p className="mt-1 text-xs text-slate-400">
                HT · Financement CPF / OPCO possible
              </p>
            )}

            <div className="mt-5">
              <EnrollButton
                formation={{
                  id: formation.id,
                  title: formation.title,
                  price: Number(formation.price_ht ?? 0),
                  currency: formation.currency || 'EUR',
                  priceOnQuote: formation.price_sur_devis,
                }}
                enrollment={enrollment}
              />
            </div>

            <ul className="mt-6 space-y-2.5 border-t border-slate-100 pt-5 text-sm text-slate-600">
              <li>✓ Accès à vie aux supports</li>
              <li>✓ Sessions live + replays</li>
              <li>✓ Projets corrigés par un expert</li>
              {formation.is_certifying && <li>✓ Certificat vérifiable en ligne</li>}
              <li>✓ Paiement CB, Orange Money, MTN MoMo</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
