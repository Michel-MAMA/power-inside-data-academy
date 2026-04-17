"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const stats = [
  { value: "500+", label: "Apprenants formés" },
  { value: "40+", label: "Formations disponibles" },
  { value: "95%", label: "Taux de satisfaction" },
];

const popularFormations = [
  { name: "LangChain & LLMs en Production", level: "Avancé", color: "blue" as const },
  { name: "Data Engineering avec Fabric", level: "Intermédiaire", color: "emerald" as const },
  { name: "Power BI Mastery", level: "Débutant", color: "purple" as const },
];

const colorMap = {
  blue: "bg-blue-dim text-blue border-blue-border",
  emerald: "bg-emerald-dim text-emerald border-emerald/30",
  purple: "bg-purple-dim text-purple border-purple/30",
};

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-[72px] overflow-hidden">
      {/* Orbs background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-blue/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple/8 blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 w-full py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-border bg-blue-dim text-blue text-xs font-semibold tracking-wide uppercase mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-blue animate-pulse" />
                Nouvelles formations disponibles
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-display font-extrabold text-5xl lg:text-6xl xl:text-7xl leading-[1.05] text-white mb-6"
            >
              Maîtrisez la{" "}
              <span className="text-blue">Data</span> &{" "}
              <span className="text-blue">l&apos;IA</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-white-60 leading-relaxed mb-8 max-w-lg"
            >
              Formations premium animées par des experts terrain. De la théorie à la production, développez les compétences qui font la différence.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-3 mb-12"
            >
              <Link
                href="/#formations"
                className="px-6 py-3 bg-blue text-white rounded-xl font-semibold hover:bg-blue/90 transition-colors"
              >
                Voir les formations →
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 border border-border text-white-60 rounded-xl font-semibold hover:text-white hover:border-blue-border transition-all"
              >
                Nous contacter
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex gap-8"
            >
              {stats.map((stat, i) => (
                <div key={stat.value} className={i > 0 ? "pl-8 border-l border-border" : ""}>
                  <div className="font-display font-extrabold text-2xl text-white">{stat.value}</div>
                  <div className="text-xs text-white-35 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Visual card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-graphite border border-border rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-white">Formations populaires</h3>
                <span className="text-[11px] px-2 py-1 bg-blue-dim text-blue border border-blue-border rounded-full">
                  Live
                </span>
              </div>

              <div className="space-y-3">
                {popularFormations.map((f) => (
                  <div
                    key={f.name}
                    className="flex items-center justify-between p-3 bg-slate rounded-xl border border-border hover:border-blue-border transition-colors cursor-pointer"
                  >
                    <span className="text-sm text-white-85 font-medium">{f.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${colorMap[f.color]}`}>
                      {f.level}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href="/#formations"
                className="mt-4 w-full block text-center py-2.5 bg-blue text-white rounded-xl text-sm font-medium hover:bg-blue/90 transition-colors"
              >
                Voir toutes les formations
              </Link>
            </div>

            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 bg-emerald-dim border border-emerald/30 text-emerald text-xs px-3 py-2 rounded-xl font-semibold"
            >
              ✓ Certifié expert
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-4 -left-4 bg-purple-dim border border-purple/30 text-purple text-xs px-3 py-2 rounded-xl font-semibold"
            >
              🎓 +500 diplômés
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
