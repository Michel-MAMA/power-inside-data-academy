import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDashboardData } from '@/lib/services/dashboard';

export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) redirect('/login');

  const { profile, enrollments, certificates, passedQuizzes } = data;
  const inProgress = enrollments.filter((e) => e.status !== 'completed');
  const completed = enrollments.filter((e) => e.status === 'completed');

  const stats = [
    { label: 'Formations suivies', value: enrollments.length, icon: '📚' },
    { label: 'Terminées', value: completed.length, icon: '✅' },
    { label: 'Certificats', value: certificates.length, icon: '🎓' },
    { label: 'Quiz réussis', value: profile.quiz_passed_count, icon: '🏆' },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Bonjour {profile.prenom ?? 'Apprenant'} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {profile.total_learning_minutes > 0
            ? `${Math.round(profile.total_learning_minutes / 60)}h d'apprentissage cumulées — continuez !`
            : 'Prêt à démarrer votre apprentissage ?'}
        </p>
      </header>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <span className="text-2xl">{s.icon}</span>
            <p className="mt-2 text-3xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Formations en cours */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Mes formations</h2>
          <Link href="/formations" className="text-sm font-semibold text-blue-600 hover:underline">
            Explorer le catalogue →
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <p className="text-4xl">🚀</p>
            <p className="mt-3 font-semibold text-slate-700">
              Aucune formation pour le moment
            </p>
            <Link
              href="/formations"
              className="mt-4 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Découvrir les formations
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {[...inProgress, ...completed].map((e) => (
              <div
                key={e.id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: e.formations?.domains?.color ?? '#1561FF' }}
                    >
                      {e.formations?.domains?.name}
                    </p>
                    <h3 className="mt-0.5 truncate font-bold text-slate-900">
                      {e.formations?.title}
                    </h3>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                      e.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-600'
                        : e.status === 'in_progress'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {e.status === 'completed'
                      ? 'Terminée'
                      : e.status === 'in_progress'
                      ? 'En cours'
                      : 'Inscrit'}
                  </span>
                </div>

                {/* Barre de progression */}
                <div className="mb-1.5 flex justify-between text-xs text-slate-400">
                  <span>Progression</span>
                  <span className="font-semibold text-slate-600">{e.progress_pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      e.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${e.progress_pct}%` }}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Inscrit le{' '}
                    {new Date(e.enrolled_at).toLocaleDateString('fr-FR')}
                  </span>
                  <Link
                    href={`/formations/${e.formations?.slug}`}
                    className="text-sm font-semibold text-blue-600 hover:underline"
                  >
                    {e.status === 'completed' ? 'Revoir' : 'Continuer'} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Certificats */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-slate-900">Mes certificats</h2>
          {certificates.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500">
              Terminez une formation certifiante pour obtenir votre premier
              certificat. 🎓
            </p>
          ) : (
            <div className="space-y-3">
              {certificates.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-xl">
                    🎓
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">
                      {c.formation_title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {c.certificate_code} ·{' '}
                      {new Date(c.issued_at).toLocaleDateString('fr-FR')}
                      {c.final_score_pct ? ` · Score ${c.final_score_pct}%` : ''}
                    </p>
                  </div>
                  {c.pdf_url && (
                    <a
                      href={c.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                    >
                      PDF ↓
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quiz réussis */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-slate-900">Quiz réussis</h2>
          {passedQuizzes.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500">
              Vos quiz validés apparaîtront ici. 🏆
            </p>
          ) : (
            <div className="space-y-3">
              {passedQuizzes.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                    ✓
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">
                      {q.quizzes?.title ?? 'Quiz'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {q.submitted_at &&
                        new Date(q.submitted_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span className="shrink-0 text-lg font-bold text-emerald-600">
                    {Number(q.score_pct).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
