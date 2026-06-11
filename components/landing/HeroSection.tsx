import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

const STATS = [
  { value: '+500', label: 'Apprenants formés' },
  { value: '+30', label: 'Formations expertes' },
  { value: '95%', label: 'Taux de satisfaction' },
  { value: '+50', label: 'Entreprises accompagnées' },
];

export default function HeroSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, #0d1b2a 0%, #1a1f35 50%, #0f1419 100%)',
      }}
    >
      {/* Glows */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[760px] -translate-x-1/2"
        style={{
          background:
            'radial-gradient(ellipse, rgba(21,97,255,0.25), transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-48 -right-24 h-[400px] w-[400px]"
        style={{
          background:
            'radial-gradient(circle, rgba(21,97,255,0.12), transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-24 text-center md:pb-28 md:pt-32">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-300 backdrop-blur">
          <Sparkles size={13} />
          Data · IA · Cloud · BI
        </span>

        <h1 className="mx-auto mt-7 max-w-3xl font-[family-name:var(--font-jakarta)] text-4xl font-bold leading-[1.08] tracking-tight text-white md:text-6xl">
          Former les leaders de la{' '}
          <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            Data et de l&apos;IA
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base font-light leading-relaxed text-white/55 md:text-lg">
          Des formations certifiantes conçues par des experts terrain. Machine
          Learning, Data Engineering, Power BI, Cloud — du fondamental à
          l&apos;expertise.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/formations"
            className="group inline-flex items-center gap-2.5 rounded-xl bg-blue-600 px-7 py-4 text-xs font-bold uppercase tracking-[0.1em] text-white shadow-xl shadow-blue-600/30 transition hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-600/50"
          >
            Découvrir les formations
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-7 py-4 text-xs font-bold uppercase tracking-[0.1em] text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10"
          >
            Parler à un expert
          </Link>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-5 backdrop-blur transition hover:border-blue-400/30 hover:bg-blue-500/5"
            >
              <p className="font-[family-name:var(--font-jakarta)] text-2xl font-extrabold text-white md:text-3xl">
                {s.value}
              </p>
              <p className="mt-1 text-[11px] text-white/45">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
