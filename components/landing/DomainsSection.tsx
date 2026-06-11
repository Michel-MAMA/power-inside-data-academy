import Link from 'next/link';
import { BrainCircuit, Database, Cloud, BarChart3, ArrowRight } from 'lucide-react';

const DOMAINS = [
  {
    code: 'ai',
    icon: BrainCircuit,
    name: 'Intelligence Artificielle',
    description: 'Machine Learning, LLMs, RAG, MLOps — concevez et déployez des systèmes IA en production.',
    accent: '#4D9FFF',
  },
  {
    code: 'data',
    icon: Database,
    name: 'Data Engineering',
    description: 'Pipelines, Microsoft Fabric, Spark, Lakehouse — construisez des architectures data robustes.',
    accent: '#00D68F',
  },
  {
    code: 'cloud',
    icon: Cloud,
    name: 'Cloud & DevOps',
    description: 'Azure, AWS, Power Platform — automatisez et industrialisez vos déploiements.',
    accent: '#FFAA00',
  },
  {
    code: 'bi',
    icon: BarChart3,
    name: 'Business Intelligence',
    description: 'Power BI, DAX, modélisation — transformez la donnée en décisions stratégiques.',
    accent: '#B464FF',
  },
];

export default function DomainsSection() {
  return (
    <section id="domaines" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 md:py-28">
      <div className="mb-12 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-600">
          Domaines d&apos;expertise
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-jakarta)] text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          Quatre piliers, une expertise.
        </h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {DOMAINS.map((d) => {
          const Icon = d.icon;
          return (
            <Link
              key={d.code}
              href={`/formations?domain=${d.code}`}
              className="group relative overflow-hidden rounded-2xl p-6 transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-900/20"
              style={{
                background:
                  'linear-gradient(135deg, #0d1b2a 0%, #1a1f35 50%, #0f1419 100%)',
              }}
            >
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `${d.accent}30` }}
              />
              <span
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: `${d.accent}1a`, color: d.accent }}
              >
                <Icon size={24} strokeWidth={1.8} />
              </span>
              <h3 className="mt-5 font-[family-name:var(--font-jakarta)] text-base font-bold text-white">
                {d.name}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-white/45">
                {d.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 transition-all group-hover:gap-2.5">
                Explorer <ArrowRight size={13} />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
