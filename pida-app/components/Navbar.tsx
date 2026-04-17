"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Formations", href: "/#formations" },
  { label: "Parcours", href: "/#parcours" },
  { label: "Domaines", href: "/#domaines" },
  { label: "Témoignages", href: "/#temoignages" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center px-6 transition-all duration-300",
          scrolled
            ? "bg-void/80 backdrop-blur-md border-b border-border"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-blue flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="4" r="2" fill="white" />
                <circle cx="4" cy="14" r="2" fill="white" />
                <circle cx="16" cy="14" r="2" fill="white" />
                <line x1="10" y1="6" x2="4" y2="12" stroke="white" strokeWidth="1.5" />
                <line x1="10" y1="6" x2="16" y2="12" stroke="white" strokeWidth="1.5" />
                <line x1="6" y1="14" x2="14" y2="14" stroke="white" strokeWidth="1.5" />
              </svg>
            </div>
            <span className="font-display font-extrabold text-sm tracking-tight text-white group-hover:text-blue transition-colors">
              Power Inside Data
              <span className="block text-[10px] font-normal text-white-35 tracking-widest uppercase">
                Academy
              </span>
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm text-white-60 hover:text-white transition-colors rounded-lg hover:bg-white-6"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/contact"
              className="px-4 py-2 text-sm border border-border rounded-lg text-white-60 hover:text-white hover:border-blue-border transition-all"
            >
              Contact
            </Link>
            <Link
              href="/#formations"
              className="px-4 py-2 text-sm bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors font-medium"
            >
              Formations →
            </Link>
          </div>

          {/* Burger mobile */}
          <button
            className="md:hidden text-white-60 hover:text-white transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-void flex flex-col pt-[72px] md:hidden">
          <nav className="flex flex-col p-6 gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-lg text-white-60 hover:text-white py-3 border-b border-border transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/#formations"
              onClick={() => setMenuOpen(false)}
              className="mt-6 text-center py-3 bg-blue text-white rounded-xl font-medium text-lg"
            >
              Voir les formations →
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
