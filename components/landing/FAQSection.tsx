import { createPublicClient } from '@/lib/supabase/public';

interface FaqItem {
  question: string;
  answer: string;
}

/** Fallback identique aux seeds du MASTER SQL si la table est vide. */
const FALLBACK: FaqItem[] = [
  {
    question: 'Vos formations sont-elles éligibles au CPF ?',
    answer:
      'Oui, plusieurs formations sont éligibles au CPF via notre partenaire certifié Qualiopi. Contactez-nous pour vérifier l’éligibilité de la formation souhaitée.',
  },
  {
    question: 'Quelle est la durée d’accès aux supports ?',
    answer:
      'Vous avez un accès à vie aux vidéos, supports et ressources pour toutes les formations achetées.',
  },
  {
    question: 'Y a-t-il un accompagnement personnalisé ?',
    answer:
      'Chaque apprenant bénéficie de sessions live avec les formateurs, d’une communauté dédiée et de corrections de projets personnalisées.',
  },
  {
    question: 'Quels moyens de paiement acceptez-vous ?',
    answer:
      'Carte bancaire (Stripe), Orange Money et MTN Mobile Money. Paiement en 3 fois sans frais disponible, ainsi que le financement OPCO/CPF.',
  },
];

/** FAQ — données dynamiques depuis la table faqs (seedée par le MASTER SQL). */
export default async function FAQSection() {
  let faqs: FaqItem[] = FALLBACK;
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('faqs')
      .select('question, answer')
      .eq('is_visible', true)
      .is('formation_id', null)
      .order('order_rank')
      .limit(8);
    if (data && data.length > 0) faqs = data as FaqItem[];
  } catch {
    /* fallback statique */
  }

  return (
    <section id="faq" className="border-t border-slate-100 bg-slate-50/60">
      <div className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 md:py-28">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-600">
            FAQ
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-jakarta)] text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Questions fréquentes.
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <details
              key={f.question}
              className="group rounded-xl border border-slate-200 bg-white transition hover:border-slate-300"
              open={i === 0}
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
                {f.question}
                <span className="text-slate-400 transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-500">
                {f.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
