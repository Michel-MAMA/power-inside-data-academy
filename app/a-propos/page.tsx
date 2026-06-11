import Link from 'next/link';
import InfoShell from '@/components/landing/InfoShell';

export const metadata = { title: 'À propos' };

export default function AProposPage() {
  return (
    <InfoShell
      eyebrow="À propos"
      title="Power Inside Data Academy."
      intro="Former les leaders de la Data, de l'IA et du Cloud — des fondamentaux à l'expertise en production."
    >
      <div className="space-y-6 leading-relaxed text-slate-600">
        <p>
          Power Inside Data est à la fois une <strong>académie technologique</strong> et
          un <strong>cabinet de conseil Data &amp; IA</strong>. Cette double identité est
          notre force : tout ce que nous enseignons est éprouvé sur de vrais
          projets en production, chez nos clients.
        </p>
        <p>
          Fondée par <strong>Dr. Michel MAMA TOULOU</strong>, l&apos;académie a déjà formé
          plus de 500 professionnels et accompagné plus de 50 entreprises en
          Europe et en Afrique sur quatre piliers : Intelligence Artificielle,
          Data Engineering, Cloud &amp; DevOps et Business Intelligence.
        </p>
        <p>
          Notre conviction : la donnée et l&apos;IA doivent être accessibles à tous —
          des novices aux experts. C&apos;est pourquoi nos formations combinent 80 %
          de pratique, des formateurs en poste, des certifications vérifiables en
          ligne et un accompagnement jusqu&apos;à l&apos;objectif de chacun.
        </p>
      </div>
      <div className="mt-10 flex flex-wrap gap-3.5">
        <Link
          href="/formations"
          className="rounded-xl bg-blue-600 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.08em] text-white transition hover:bg-blue-700"
        >
          Découvrir les formations
        </Link>
        <Link
          href="/contact"
          className="rounded-xl border border-slate-300 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.08em] text-slate-700 transition hover:border-blue-400 hover:text-blue-700"
        >
          Nous contacter
        </Link>
      </div>
    </InfoShell>
  );
}
