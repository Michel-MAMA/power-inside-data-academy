import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Mail,
  MapPin,
  Phone,
  Star,
  Users,
} from 'lucide-react';
import { LogoMark } from '@/components/landing/Logo';
import {
  GithubIcon,
  LinkedinIcon,
  XTwitterIcon,
  YoutubeIcon,
} from '@/components/landing/BrandIcons';

const STATS = [
  { icon: Users, value: '+500', label: 'apprenants formés' },
  { icon: Briefcase, value: '+50', label: 'entreprises accompagnées' },
  { icon: BookOpen, value: '+30', label: 'formations expertes' },
  { icon: Star, value: '95%', label: 'de satisfaction' },
];

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Formations',
    links: [
      { label: 'Intelligence Artificielle', href: '/formations?domain=ai' },
      { label: 'Data Engineering', href: '/formations?domain=data' },
      { label: 'Business Intelligence', href: '/formations?domain=bi' },
      { label: 'Cloud & DevOps', href: '/formations?domain=cloud' },
      { label: 'Power Platform', href: '/formations?domain=cloud' },
      { label: 'Catalogue complet', href: '/formations' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { label: 'FAQ', href: '/#faq' },
      { label: 'Financement CPF', href: '/financement' },
      { label: 'Vérifier un certificat', href: '/verification-certificat' },
      { label: 'Mon espace apprenant', href: '/dashboard' },
      { label: 'Tarifs', href: '/#tarifs' },
    ],
  },
  {
    title: 'Entreprise',
    links: [
      { label: 'À propos', href: '/a-propos' },
      { label: 'Contact', href: '/contact' },
      { label: 'Mentions légales', href: '/mentions-legales' },
      { label: 'CGU', href: '/cgu' },
      { label: 'RGPD', href: '/rgpd' },
    ],
  },
];

const SOCIALS = [
  { icon: LinkedinIcon, label: 'LinkedIn', href: 'https://www.linkedin.com/company/power-inside-data' },
  { icon: GithubIcon, label: 'GitHub', href: 'https://github.com/Michel-MAMA' },
  { icon: YoutubeIcon, label: 'YouTube', href: 'https://www.youtube.com/@powerinsidedata' },
  { icon: XTwitterIcon, label: 'X / Twitter', href: 'https://x.com/powerinsidedata' },
];

export default function PremiumFooter() {
  return (
    <>
      {/* ── Bandeau CTA ── */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, #0d1b2a 0%, #1a1f35 50%, #0f1419 100%)',
        }}
      >
        <div
          className="pointer-events-none absolute -top-28 left-1/2 h-80 w-[720px] -translate-x-1/2"
          style={{
            background:
              'radial-gradient(ellipse, rgba(21,97,255,0.22), transparent 70%)',
          }}
        />
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-10 px-4 py-16 md:py-20">
          <div>
            <h2 className="max-w-xl font-[family-name:var(--font-jakarta)] text-2xl font-bold leading-tight text-white md:text-4xl">
              Prêt à accélérer votre carrière en{' '}
              <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Data et IA
              </span>{' '}
              ?
            </h2>
            <p className="mt-3 text-sm text-white/55">
              Rejoignez les centaines de professionnels déjà formés par nos experts.
            </p>
          </div>
          <div className="flex flex-wrap gap-3.5">
            <Link
              href="/formations"
              className="group inline-flex items-center gap-2.5 rounded-xl bg-blue-600 px-7 py-4 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-xl shadow-blue-600/35 transition hover:-translate-y-0.5 hover:shadow-blue-600/50"
            >
              Découvrir les formations
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-7 py-4 text-xs font-bold uppercase tracking-[0.08em] text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10"
            >
              Parler à un expert
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative overflow-hidden border-t border-white/5 bg-gradient-to-b from-[#0f1419] to-[#0a0e14]">
        <div
          className="pointer-events-none absolute -bottom-48 -left-24 h-[480px] w-[480px]"
          style={{
            background:
              'radial-gradient(circle, rgba(21,97,255,0.07), transparent 70%)',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4">
          {/* Preuve sociale */}
          <div className="grid grid-cols-2 gap-4 pt-14 lg:grid-cols-4">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="group rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-blue-500/35 hover:bg-blue-500/5 hover:shadow-2xl hover:shadow-black/40"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition group-hover:bg-blue-500/20 group-hover:text-blue-300">
                    <Icon size={19} strokeWidth={1.9} />
                  </span>
                  <p className="mt-4 font-[family-name:var(--font-jakarta)] text-2xl font-extrabold text-white">
                    {s.value}
                  </p>
                  <p className="mt-1 text-xs text-white/45">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* Grille principale */}
          <div className="grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-[2.2fr,1fr,1fr,1fr]">
            {/* Marque */}
            <div>
              <div className="flex items-center gap-3.5">
                <LogoMark size={44} />
                <span className="font-[family-name:var(--font-jakarta)] text-base font-extrabold uppercase tracking-[0.14em] leading-tight text-white">
                  Power Inside
                  <br />
                  <span className="text-blue-400">Data Academy</span>
                </span>
              </div>
              <p className="mt-5 font-[family-name:var(--font-jakarta)] text-[13px] font-semibold text-white/70">
                Former les leaders de la Data, de l&apos;IA et du Cloud.
              </p>
              <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-white/40">
                Académie technologique et cabinet de conseil — nous rendons la
                donnée et l&apos;IA accessibles, des fondamentaux à
                l&apos;expertise en production.
              </p>

              <div className="mt-6 space-y-2.5">
                <a
                  href="mailto:academy@powerinsidedata.com"
                  className="group flex items-center gap-2.5 text-[12.5px] text-white/50 transition hover:text-white"
                >
                  <Mail size={14} className="text-blue-400/70 transition group-hover:scale-110 group-hover:text-blue-400" />
                  academy@powerinsidedata.com
                </a>
                <span className="flex items-center gap-2.5 text-[12.5px] text-white/50">
                  <Phone size={14} className="text-blue-400/70" />
                  +33 7 67 93 64 61 · +237 6 73 26 24 85
                </span>
                <span className="flex items-center gap-2.5 text-[12.5px] text-white/50">
                  <MapPin size={14} className="text-blue-400/70" />
                  Paris · Douala
                </span>
              </div>

              {/* Socials */}
              <div className="mt-7 flex gap-2.5">
                {SOCIALS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/55 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-blue-500/50 hover:bg-blue-500/15 hover:text-white hover:shadow-lg hover:shadow-blue-600/25"
                    >
                      <Icon size={17} />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Colonnes */}
            {COLUMNS.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <p className="mb-5 font-[family-name:var(--font-jakarta)] text-[11px] font-bold uppercase tracking-[0.18em] text-white/85">
                  {col.title}
                </p>
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="group relative inline-block text-[13.5px] text-white/45 transition duration-200 hover:translate-x-0.5 hover:text-white"
                      >
                        {l.label}
                        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gradient-to-r from-blue-400 to-transparent transition-all duration-300 group-hover:w-full" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          {/* Bas de page */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/5 py-7">
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} Power Inside Data. Tous droits réservés.
            </p>
            <div className="flex gap-2.5">
              <span className="rounded-full border border-blue-500/45 bg-blue-500/10 px-3 py-1 font-[family-name:var(--font-jakarta)] text-[11px] font-semibold text-blue-400">
                Academy
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 font-[family-name:var(--font-jakarta)] text-[11px] font-semibold text-white/40 transition hover:border-white/25 hover:text-white/70">
                Consulting
              </span>
            </div>
            <p className="font-[family-name:var(--font-jakarta)] text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">
              Power Inside Data Group
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
