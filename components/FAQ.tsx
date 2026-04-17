const faqs = [
    {
        question: "Comment fonctionne le formulaire ?",
        answer: "Le formulaire envoie les données via une API Next.js puis déclenche un email via Resend ou via SMTP selon la configuration.",
    },
    {
        question: "Quelle validation est appliquée ?",
        answer: "Zod vérifie l'email, le prénom, le nom et le message avant l'envoi pour réduire les erreurs côté serveur.",
    },
    {
        question: "Est-ce responsive ?",
        answer: "Oui, le design est optimisé pour mobile, tablette et desktop avec Tailwind.",
    },
];

export default function FAQ() {
    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-glow">
            <h2 className="text-2xl font-semibold text-white">FAQ</h2>
            <div className="mt-8 space-y-6">
                {faqs.map((faq) => (
                    <div key={faq.question} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                        <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
                        <p className="mt-3 text-slate-400">{faq.answer}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
