import { z } from 'zod';

// ── Contact (existant) ──────────────────────────────────────────────────────

export const contactSchema = z.object({
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères.'),
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères.'),
  email: z.string().email('Adresse email invalide.'),
  sujet: z.string().min(4, 'Le sujet doit contenir au moins 4 caractères.'),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères.'),
});

export type ContactFormValues = z.infer<typeof contactSchema>;

// ── Auth ────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  prenom: z.string().min(2, 'Prénom trop court').max(60),
  nom: z.string().min(2, 'Nom trop court').max(60),
  email: z.string().email('Email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Au moins une majuscule requise')
    .regex(/[0-9]/, 'Au moins un chiffre requis'),
});

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
});

export const updateProfileSchema = z.object({
  prenom: z.string().min(2).max(60),
  nom: z.string().min(2).max(60),
  phone: z.string().max(20).optional().or(z.literal('')),
  company: z.string().max(120).optional().or(z.literal('')),
  job_title: z.string().max(120).optional().or(z.literal('')),
  bio: z.string().max(600).optional().or(z.literal('')),
  linkedin: z.string().url('URL LinkedIn invalide').optional().or(z.literal('')),
  country: z.string().max(60).optional().or(z.literal('')),
  city: z.string().max(60).optional().or(z.literal('')),
});

// ── Paiements ───────────────────────────────────────────────────────────────

export const stripeCheckoutSchema = z.object({
  formationId: z.string().uuid('Identifiant formation invalide'),
  promoCode: z.string().max(40).optional(),
});

export const mobileMoneySchema = z.object({
  formationId: z.string().uuid('Identifiant formation invalide'),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9]{8,15}$/, 'Numéro de téléphone invalide (ex: +2376XXXXXXXX)'),
  promoCode: z.string().max(40).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type StripeCheckoutInput = z.infer<typeof stripeCheckoutSchema>;
export type MobileMoneyInput = z.infer<typeof mobileMoneySchema>;
