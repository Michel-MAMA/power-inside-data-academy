'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { LogoMark, LogoText } from '@/components/landing/Logo';

const NAV_LINKS = [
  { href: '/formations', label: 'Formations' },
  { href: '/#domaines', label: 'Domaines' },
  { href: '/#temoignages', label: 'Témoignages' },
  { href: '/contact', label: 'Contact' },
];

export default function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'border-slate-200/80 bg-white/85 shadow-sm backdrop-blur-xl'
          : 'border-transparent bg-white'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Accueil">
          <LogoMark size={30} />
          <LogoText />
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2.5 md:flex">
          <Link
            href="/login"
            className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-blue-600/30"
          >
            S&apos;inscrire
          </Link>
        </div>

        {/* Burger mobile */}
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 md:hidden"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Menu mobile */}
      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col gap-1 bg-white px-6 py-8 md:hidden">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3.5 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-6">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-3.5 text-center text-sm font-bold text-slate-700"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-blue-600 px-4 py-3.5 text-center text-sm font-bold text-white"
            >
              S&apos;inscrire gratuitement
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
