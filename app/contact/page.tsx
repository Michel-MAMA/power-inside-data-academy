import { Mail, Phone, MapPin } from 'lucide-react';
import InfoShell from '@/components/landing/InfoShell';
import ContactForm from '@/components/landing/ContactForm';

export const metadata = { title: 'Contact' };

const CONTACTS = [
  { icon: Mail, label: 'academy@powerinsidedata.com', href: 'mailto:academy@powerinsidedata.com' },
  { icon: Phone, label: '+33 7 67 93 64 61 · +237 6 73 26 24 85' },
  { icon: MapPin, label: 'Paris · Douala' },
];

export default function ContactPage() {
  return (
    <InfoShell
      eyebrow="Contact"
      title="Parlons de votre projet."
      intro="Formation individuelle, montée en compétence d'équipe, financement CPF/OPCO — notre équipe vous répond sous 24 h ouvrées."
    >
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {CONTACTS.map((c) => {
          const Icon = c.icon;
          const content = (
            <span className="flex items-center gap-2.5 text-[13px] text-slate-600">
              <Icon size={15} className="shrink-0 text-blue-600" />
              {c.label}
            </span>
          );
          return c.href ? (
            <a key={c.label} href={c.href} className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 transition hover:border-blue-300">
              {content}
            </a>
          ) : (
            <div key={c.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
              {content}
            </div>
          );
        })}
      </div>
      <ContactForm />
    </InfoShell>
  );
}
