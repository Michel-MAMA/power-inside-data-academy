"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Hero() {
    return (
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.16),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_30%)] py-24">
            <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
                <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <span className="inline-flex rounded-full bg-sky-500/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-sky-200">
                            Formation IA & LangChain
                        </span>
                        <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                            LangChain & LLMs en production, prêt pour le SaaS.
                        </h1>
                        <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                            Un design moderne, un backend contact connecté et une architecture TypeScript pour transformer votre landing en une application évolutive.
                        </p>
                        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                            <Link href="/contact" className="inline-flex items-center justify-center rounded-full bg-sky-500 px-7 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-sky-400">
                                Voir le contact
                            </Link>
                            <a href="#" className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/80 px-7 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white">
                                Découvrir le contenu
                            </a>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.65 }} className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-10 shadow-glow backdrop-blur-xl">
                        <div className="mb-6 rounded-3xl bg-slate-950/90 p-6 text-slate-100">
                            <p className="text-sm uppercase tracking-[0.24em] text-sky-300">Pourquoi ce projet</p>
                            <h2 className="mt-3 text-2xl font-semibold text-white">Stack pro pour une landing moderne</h2>
                            <p className="mt-4 text-slate-400">
                                App Router, React Hook Form, Zod, API route, Tailwind et Framer Motion. Le socle idéal pour une refonte propre et scalable.
                            </p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {[
                                { label: "SEO & perf", value: "Meta, SSR & responsive" },
                                { label: "Formulaire", value: "Validation et email" },
                                { label: "UI moderne", value: "Composants réutilisables" },
                                { label: "Animation", value: "Transitions subtiles" },
                            ].map((item) => (
                                <div key={item.label} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                                    <p className="mt-3 text-sm font-semibold text-slate-100">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
