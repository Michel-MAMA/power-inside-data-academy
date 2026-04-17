import ContactForm from "@/components/ContactForm";
import ContactCard from "@/components/ContactCard";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const cards = [
    {
        title: "Durée",
        value: "5 jours intensifs",
        icon: "⏱️",
    },
    {
        title: "Niveau",
        value: "Avancé & opérationnel",
        icon: "🎯",
    },
    {
        title: "Certificat",
        value: "PID-LLM-01",
        icon: "🏅",
    },
];

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-slate-950 text-slate-100">
            <Navbar />
            <section className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-12">
                <div className="space-y-6 text-center">
                    <p className="inline-flex rounded-full bg-sky-500/15 px-4 py-2 text-xs uppercase tracking-[0.24em] text-sky-200">
                        LangChain & LLMs en production
                    </p>
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                        Transformez votre landing en application moderne scalable
                    </h1>
                    <p className="mx-auto max-w-3xl text-base leading-8 text-slate-400 sm:text-lg">
                        Une architecture React + TypeScript pensée pour le marketing, le lead gen et les formations IA. Formulaire connecté, design propre et API prête pour un premier envoi d'email.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 pb-20 sm:px-8 lg:px-12">
                <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-glow backdrop-blur-xl sm:p-10">
                        <h2 className="text-2xl font-semibold text-white">Contactez-nous</h2>
                        <p className="text-slate-400">Remplissez le formulaire et recevez une réponse rapide de l'équipe Power Inside Data Academy.</p>
                        <ContactForm />
                    </div>

                    <div className="space-y-6">
                        {cards.map((card) => (
                            <ContactCard key={card.title} title={card.title} value={card.value} icon={card.icon} />
                        ))}

                        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-slate-300 shadow-glow">
                            <h3 className="text-lg font-semibold text-white">Pourquoi nous choisir ?</h3>
                            <ul className="mt-5 space-y-4 text-sm leading-6">
                                <li>✔️ Parcours centré sur la mise en production de LLMs.</li>
                                <li>✔️ Approche RAG, pipelines, prompts et tooling.</li>
                                <li>✔️ Design axé conversion et performance.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 pb-20 sm:px-8 lg:px-12">
                <FAQ />
            </section>

            <Footer />
        </main>
    );
}
