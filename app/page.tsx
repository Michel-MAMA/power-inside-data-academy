import Link from "next/link";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import ContactCard from "@/components/ContactCard";

const features = [
    {
        title: "Production-ready",
        value: "Architecture, sécurité, infra et monitoring pour LLMs.",
        icon: "🚀",
    },
    {
        title: "Design moderne",
        value: "UX optimisée, responsive et animations fluides.",
        icon: "✨",
    },
    {
        title: "Formulaire connecté",
        value: "Backend Next.js et envoi d'email via API.",
        icon: "📩",
    },
];

export default function HomePage() {
    return (
        <main className="min-h-screen bg-slate-950 text-slate-100">
            <Navbar />
            <Hero />

            <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-12">
                <div className="grid gap-8 lg:grid-cols-3">
                    {features.map((feature) => (
                        <ContactCard key={feature.title} title={feature.title} value={feature.value} icon={feature.icon} />
                    ))}
                </div>
            </section>

            <section className="border-t border-slate-800 bg-slate-900/80 px-6 py-16 sm:px-8 lg:px-12">
                <div className="mx-auto max-w-5xl text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55 }}
                        className="mb-6 text-3xl font-semibold text-white sm:text-4xl"
                    >
                        Passez de la page statique à une vraie app SaaS-ready
                    </motion.h2>
                    <p className="mx-auto max-w-2xl text-slate-400 sm:text-lg">
                        Une structure moderne basée sur Next.js App Router, TypeScript, Tailwind et une API contact prête à recevoir vos premières demandes.
                    </p>
                    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link href="/contact" className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-sky-400">
                            Nous contacter
                        </Link>
                        <a href="#" className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/80 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white">
                            Voir la formation
                        </a>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
