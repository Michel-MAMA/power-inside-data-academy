import type { Metadata } from "next";
import Hero from "@/components/Hero";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Accueil — Formations Data, IA & Cloud",
};

// ─── Domain cards data ─────────────────────────────────────────────────────

const domains = [
  {
    id: "ai",
    title: "Intelligence Artificielle",
    description: "Machine Learning, Deep Learning, LLMs, RAG, MLOps et déploiement de modèles en production.",
    count: "12 formations",
    color: "blue" as const,
    icon: "🤖",
  },
  {
    id: "data",
    title: "Data Engineering",
    description: "Pipelines de données, Azure Fabric, Spark, dbt, architecture lakehouse et orchestration.",
    count: "10 formations",
    color: "emerald" as const,
    icon: "⚙️",
  },
  {
    id: "cloud",
    title: "Cloud & No-Code",
    description: "Azure, AWS, Power Platform, automatisation et outils no-code pour accélérer vos projets.",
    count: "8 formations",
    color: "amber" as const,
    icon: "☁️",
  },
  {
    id: "bi",
    title: "Business Intelligence",
    description: "Power BI, DAX, modélisation dimensionnelle, tableaux de bord et reporting avancé.",
    count: "9 formations",
    color: "purple" as const,
    icon: "📊",
  },
];

const domainColorMap = {
  blue: "border-blue-border bg-blue-dim group-hover:bg-blue/20",
  emerald: "border-emerald/30 bg-emerald-dim group-hover:bg-emerald/20",
  amber: "border-amber/30 bg-amber-dim group-hover:bg-amber/20",
  purple: "border-purple/30 bg-purple-dim group-hover:bg-purple/20",
};

const domainTextMap = {
  blue: "text-blue",
  emerald: "text-emerald",
  amber: "text-amber",
  purple: "text-purple",
};

// ─── Formations data ────────────────────────────────────────────────────────

const formations = [
  {
    id: "langchain",
    title: "LangChain & LLMs en Production",
    description: "Construisez des applications IA avec LangChain, RAG, agents autonomes et déploiement cloud.",
    domain: "IA",
    level: "Avancé",
    duration: "40h",
    format: "En ligne",
    price: "890€",
    badge: "Bestseller",
    color: "blue" as const,
  },
  {
    id: "fabric",
    title: "Data Engineering avec Microsoft Fabric",
    description: "Architecture lakehouse, pipelines, Spark et CI/CD avec la plateforme Microsoft Fabric.",
    domain: "Data",
    level: "Intermédiaire",
    duration: "35h",
    format: "En ligne",
    price: "790€",
    badge: "Nouveau",
    color: "emerald" as const,
  },
  {
    id: "powerbi",
    title: "Power BI Mastery",
    description: "De la connexion aux données au reporting avancé avec DAX, Power Query et modèles sémantiques.",
    domain: "BI",
    level: "Débutant",
    duration: "30h",
    format: "En ligne",
    price: "690€",
    color: "purple" as const,
  },
];

const formationColorMap = {
  blue: { bar: "bg-blue", badge: "bg-blue-dim text-blue border-blue-border" },
  emerald: { bar: "bg-emerald", badge: "bg-emerald-dim text-emerald border-emerald/30" },
  amber: { bar: "bg-amber", badge: "bg-amber-dim text-amber border-amber/30" },
  purple: { bar: "bg-purple", badge: "bg-purple-dim text-purple border-purple/30" },
};

// ─── Stats ──────────────────────────────────────────────────────────────────

const stats = [
  { value: "500+", label: "Apprenants formés", sub: "depuis 2022" },
  { value: "40+", label: "Formations disponibles", sub: "4 domaines" },
  { value: "95%", label: "Taux de satisfaction", sub: "certifié" },
  { value: "3", label: "Formateurs experts", sub: "terrain" },
];

// ─── Testimonials ────────────────────────────────────────────────────────────

const testimonials = [
  {
    id: "1",
    quote: "La formation LangChain m'a permis de passer de la théorie à la production en quelques semaines. Les exemples concrets sont redoutables.",
    author: "Aminata K.",
    role: "ML Engineer @ Startup FinTech",
    rating: 5,
  },
  {
    id: "2",
    quote: "Power BI Mastery est la meilleure formation BI que j'ai suivie. Le formateur maîtrise parfaitement le sujet et les exercices sont très pratiques.",
    author: "Thomas R.",
    role: "Data Analyst @ Groupe Retail",
    rating: 5,
  },
  {
    id: "3",
    quote: "Microsoft Fabric est complexe mais la formation le rend accessible. J'ai pu déployer mon premier lakehouse en entreprise dès la fin du parcours.",
    author: "Fatou D.",
    role: "Data Engineer @ ESN Paris",
    rating: 5,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Stats */}
      <section className="py-16 border-y border-border bg-carbon">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div
                key={stat.value}
                className="group relative overflow-hidden bg-graphite border border-border rounded-xl p-6 hover:border-blue-border transition-all duration-200"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                <div className="font-display font-extrabold text-3xl text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white-85">{stat.label}</div>
                <div className="text-xs text-white-35 mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Domains */}
      <section id="domaines" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-widest text-blue font-semibold mb-3">Domaines d&apos;expertise</p>
          <h2 className="font-display font-extrabold text-4xl text-white">4 domaines, 40+ formations</h2>
          <p className="text-white-60 mt-3 max-w-lg mx-auto">
            Chaque domaine est conçu avec des experts du terrain pour vous donner les compétences directement applicables en entreprise.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {domains.map((domain) => (
            <div
              key={domain.id}
              className={`group relative p-7 rounded-2xl border transition-all duration-200 hover:-translate-y-1 cursor-pointer ${domainColorMap[domain.color]}`}
            >
              <div className="text-3xl mb-4">{domain.icon}</div>
              <h3 className={`font-display font-bold text-xl mb-2 ${domainTextMap[domain.color]}`}>
                {domain.title}
              </h3>
              <p className="text-sm text-white-60 leading-relaxed mb-4">{domain.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white-35">{domain.count}</span>
                <span className={`text-sm font-semibold group-hover:translate-x-1 transition-transform ${domainTextMap[domain.color]}`}>
                  →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Formations */}
      <section id="formations" className="py-24 bg-carbon">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-blue font-semibold mb-3">Catalogue</p>
            <h2 className="font-display font-extrabold text-4xl text-white">Formations phares</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {formations.map((f) => {
              const colors = formationColorMap[f.color];
              return (
                <div
                  key={f.id}
                  className="group relative bg-graphite border border-border rounded-2xl overflow-hidden hover:-translate-y-1 hover:border-blue-border transition-all duration-200"
                >
                  <div className={`h-1 ${colors.bar}`} />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-widest text-blue font-semibold">{f.domain}</span>
                      {f.badge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${colors.badge}`}>
                          {f.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-lg text-white mb-2 leading-snug">{f.title}</h3>
                    <p className="text-sm text-white-60 leading-relaxed mb-5">{f.description}</p>

                    <div className="flex gap-4 text-xs text-white-35 mb-5">
                      <span>⏱ {f.duration}</span>
                      <span>📊 {f.level}</span>
                      <span>💻 {f.format}</span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="font-display font-bold text-xl text-white">{f.price}</span>
                      <Link
                        href="/contact"
                        className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${colors.bar} hover:opacity-90 transition-opacity`}
                      >
                        S&apos;inscrire →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="temoignages" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-widest text-blue font-semibold mb-3">Témoignages</p>
          <h2 className="font-display font-extrabold text-4xl text-white">Ce que disent nos apprenants</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="group bg-graphite border border-border rounded-2xl p-6 hover:-translate-y-1 hover:border-blue-border transition-all duration-200"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} className="text-amber text-sm">★</span>
                ))}
              </div>
              <p className="text-sm text-white-85 leading-relaxed italic mb-5">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue to-purple flex items-center justify-center text-white font-bold text-sm">
                  {t.author[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.author}</div>
                  <div className="text-xs text-white-35">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-blue/5 rounded-3xl blur-3xl" />
          <div className="relative bg-graphite border border-border rounded-3xl p-12">
            <h2 className="font-display font-extrabold text-4xl text-white mb-4">
              Prêt à transformer votre carrière ?
            </h2>
            <p className="text-white-60 mb-8 max-w-lg mx-auto">
              Rejoignez 500+ professionnels qui ont boosté leur carrière grâce à nos formations Data & IA.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/#formations" className="px-6 py-3 bg-blue text-white rounded-xl font-semibold hover:bg-blue/90 transition-colors">
                Voir les formations →
              </Link>
              <Link href="/contact" className="px-6 py-3 border border-border text-white-60 rounded-xl font-semibold hover:text-white hover:border-blue-border transition-all">
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
