// ─── Formulaire Contact ────────────────────────────────────────────────────

export interface ContactFormData {
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  sujet: ContactSubject;
  message: string;
}

export type ContactSubject =
  | "devis"
  | "inscription"
  | "financement"
  | "partenariat"
  | "information"
  | "support"
  | "autre";

// ─── Formations ────────────────────────────────────────────────────────────

export type FormationLevel = "Débutant" | "Intermédiaire" | "Avancé";
export type FormationFormat = "En ligne" | "Présentiel" | "Hybride";
export type FormationDomain = "ai" | "data" | "cloud" | "bi";

export interface Formation {
  id: string;
  title: string;
  description: string;
  domain: FormationDomain;
  level: FormationLevel;
  format: FormationFormat;
  duration: string;
  price: string;
  badge?: string;
  progress?: number;
}

// ─── Témoignages ───────────────────────────────────────────────────────────

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company?: string;
  rating: number;
  avatar?: string;
}

// ─── FAQ ───────────────────────────────────────────────────────────────────

export interface FAQItem {
  question: string;
  answer: string;
}

// ─── Navigation ────────────────────────────────────────────────────────────

export interface NavLink {
  label: string;
  href: string;
}

// ─── API Response ──────────────────────────────────────────────────────────

export interface ApiResponse<T = null> {
  success: boolean;
  message?: string;
  data?: T;
}
