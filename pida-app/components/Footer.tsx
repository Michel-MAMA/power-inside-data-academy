import Link from "next/link";

const formations = [
  { label: "IA & Machine Learning", href: "/#formations" },
  { label: "Data Engineering", href: "/#formations" },
  { label: "Cloud & No-Code", href: "/#formations" },
  { label: "Business Intelligence", href: "/#formations" },
  { label: "LLMs en Production", href: "/langchain-llms-production" },
];

const parcours = [
  { label: "Data Analyst", href: "/#parcours" },
  { label: "Data Engineer", href: "/#parcours" },
  { label: "ML Engineer", href: "/#parcours" },
  { label: "BI Developer", href: "/#parcours" },
];

const resources = [
  { label: "Blog", href: "/blog" },
  { label: "Catalogue", href: "/catalogue" },
  { label: "Contact", href: "/contact" },
  { label: "Charte graphique", href: "/charte-graphique" },
];

export default function Footer() {
  return (
    <footer className="bg-void border-t border-border mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
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
              <span className="font-display font-extrabold text-sm text-white">
                Power Inside Data
                <span className="block text-[10px] font-normal text-white-35 tracking-widest uppercase">
                  Academy
                </span>
              </span>
            </div>
            <p className="text-sm text-white-60 leading-relaxed max-w-xs">
              Formez-vous aux métiers de la Data, l&apos;IA et le Cloud avec des experts terrain. Certifications reconnues, accompagnement personnalisé.
            </p>
            <div className="flex gap-2 mt-5 flex-wrap">
              <span className="text-[11px] px-2 py-1 rounded bg-white-6 text-white-35 border border-border">
                Power Inside Data Group
              </span>
              <span className="text-[11px] px-2 py-1 rounded bg-blue-dim text-blue border border-blue-border">
                Academy
              </span>
              <span className="text-[11px] px-2 py-1 rounded bg-white-6 text-white-35 border border-border">
                Consulting
              </span>
            </div>
          </div>

          {/* Formations */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white-35 mb-4">
              Formations
            </h3>
            <ul className="space-y-3">
              {formations.map((f) => (
                <li key={f.label}>
                  <Link href={f.href} className="text-sm text-white-60 hover:text-white transition-colors">
                    {f.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Parcours */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white-35 mb-4">
              Parcours
            </h3>
            <ul className="space-y-3">
              {parcours.map((p) => (
                <li key={p.label}>
                  <Link href={p.href} className="text-sm text-white-60 hover:text-white transition-colors">
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white-35 mb-4">
              Ressources
            </h3>
            <ul className="space-y-3">
              {resources.map((r) => (
                <li key={r.label}>
                  <Link href={r.href} className="text-sm text-white-60 hover:text-white transition-colors">
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white-35">
            © {new Date().getFullYear()} Power Inside Data Academy. Tous droits réservés.
          </p>
          <div className="flex gap-4">
            <Link href="/mentions-legales" className="text-xs text-white-35 hover:text-white transition-colors">
              Mentions légales
            </Link>
            <Link href="/politique-confidentialite" className="text-xs text-white-35 hover:text-white transition-colors">
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
