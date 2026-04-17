import type { Metadata } from "next";
import { Mail, Phone, Globe, Clock } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import ContactCard from "@/components/ContactCard";
import FAQ from "@/components/FAQ";
import type { FAQItem } from "@/types";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez Power Inside Data Academy pour toute demande de formation, devis, financement ou partenariat.",
};

const faqItems: FAQItem[] = [
  {
    question: "Vos formations sont-elles éligibles au CPF ?",
    answer: "Oui, plusieurs de nos formations sont éligibles au CPF via notre partenaire certifié Qualiopi. Contactez-nous pour vérifier l'éligibilité de la formation souhaitée.",
  },
  {
    question: "Proposez-vous des formations en présentiel ?",
    answer: "Nos formations sont principalement en ligne mais nous proposons également des sessions en présentiel sur Paris et Douala pour certains programmes. Consultez-nous pour plus de détails.",
  },
  {
    question: "Quelle est la durée d'accès aux supports de formation ?",
    answer: "Vous avez un accès à vie aux supports de cours, vidéos et ressources complémentaires pour toutes les formations achetées.",
  },
  {
    question: "Y a-t-il un accompagnement personnalisé ?",
    answer: "Oui, chaque apprenant bénéficie de sessions live avec les formateurs, d'un channel Discord dédié et de corrections de projets personnalisées.",
  },
  {
    question: "Puis-je obtenir une attestation de formation ?",
    answer: "Absolument. À la fin de chaque formation, vous recevez une attestation de suivi et, selon les parcours, une certification reconnue par les entreprises partenaires.",
  },
  {
    question: "Comment se déroule le paiement ?",
    answer: "Nous acceptons le paiement par carte bancaire, virement SEPA et financement via OPCO ou CPF. Un paiement en 3 fois sans frais est disponible pour toutes les formations.",
  },
];

export default function ContactPage() {
  return (
    <div className="pt-[72px] min-h-screen">
      {/* Header */}
      <div className="bg-carbon border-b border-border py-14 px-6 text-center">
        <p className="text-xs uppercase tracking-widest text-blue font-semibold mb-3">Contactez-nous</p>
        <h1 className="font-display font-extrabold text-4xl md:text-5xl text-white mb-4">
          On répond en <span className="text-blue">24h</span>
        </h1>
        <p className="text-white-60 max-w-md mx-auto text-base">
          Une question sur nos formations ? Un projet de financement ? Un partenariat ? Écrivez-nous.
        </p>
      </div>

      {/* Main grid */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10">

          {/* Info panel */}
          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl text-white mb-6">Informations de contact</h2>

            <ContactCard
              icon={<Mail size={18} />}
              title="Email"
              value="contact@powerinsidedata.com"
              sub="Réponse sous 24h ouvrées"
              variant="blue"
              href="mailto:contact@powerinsidedata.com"
            />
            <ContactCard
              icon={<Phone size={18} />}
              title="Téléphone — France"
              value="+33 1 00 00 00 00"
              sub="Lun–Ven, 9h–18h"
              variant="emerald"
              href="tel:+33100000000"
            />
            <ContactCard
              icon={<Phone size={18} />}
              title="Téléphone — Cameroun"
              value="+237 6 00 00 00 00"
              sub="Lun–Ven, 8h–17h (WAT)"
              variant="amber"
              href="tel:+237600000000"
            />
            <ContactCard
              icon={<Globe size={18} />}
              title="Site web"
              value="powerinsidedata.com"
              variant="purple"
              href="https://powerinsidedata.com"
            />

            {/* Team card */}
            <div className="relative bg-graphite border border-border rounded-xl p-5 mt-2 overflow-hidden">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue/5 rounded-full blur-2xl" />
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue to-purple flex items-center justify-center text-white font-bold flex-shrink-0">
                  M
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">Michel Bertrand</div>
                  <div className="text-xs text-blue mb-2">Directeur Pédagogique</div>
                  <div className="text-xs text-white-60 leading-relaxed">
                    Expert Data & IA avec 10+ ans d&apos;expérience en entreprise. Il accompagne chaque apprenant vers la maîtrise des outils data modernes.
                  </div>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="bg-graphite border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-white-35" />
                <h3 className="text-sm font-semibold text-white">Disponibilités</h3>
                <span className="ml-auto flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald animate-glow-pulse" />
                  <span className="text-xs text-emerald">Disponible</span>
                </span>
              </div>
              <div className="space-y-2 text-sm">
                {[
                  { day: "Lun – Ven", time: "9h00 – 18h00", muted: false },
                  { day: "Samedi", time: "10h00 – 13h00", muted: false },
                  { day: "Dimanche", time: "Fermé", muted: true },
                ].map((row) => (
                  <div key={row.day} className="flex justify-between">
                    <span className={row.muted ? "text-white-35" : "text-white-60"}>{row.day}</span>
                    <span className={row.muted ? "text-white-35" : "text-white"}>{row.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form panel */}
          <div className="relative bg-graphite border border-border rounded-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue via-purple to-blue" />
            <div className="p-8">
              <h2 className="font-display font-bold text-xl text-white mb-6">Envoyer un message</h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <section className="bg-carbon border-t border-border py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-blue font-semibold mb-3">FAQ</p>
            <h2 className="font-display font-extrabold text-3xl text-white">Questions fréquentes</h2>
          </div>
          <FAQ items={faqItems} />
        </div>
      </section>
    </div>
  );
}
