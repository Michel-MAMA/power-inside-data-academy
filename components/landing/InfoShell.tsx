import LandingNavbar from '@/components/landing/LandingNavbar';
import PremiumFooter from '@/components/landing/PremiumFooter';

/** Gabarit commun des pages secondaires (contact, légal, à propos…). */
export default function InfoShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <LandingNavbar />
      <main className="mx-auto max-w-3xl px-4 py-16 md:py-20">
        <header className="mb-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-600">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-jakarta)] text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            {title}
          </h1>
          {intro && <p className="mt-4 leading-relaxed text-slate-500">{intro}</p>}
        </header>
        {children}
      </main>
      <PremiumFooter />
    </>
  );
}
