import { z } from "zod";

export const contactSchema = z.object({
    prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères."),
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
    email: z.string().email("Adresse email invalide."),
    sujet: z.string().min(4, "Le sujet doit contenir au moins 4 caractères."),
    message: z.string().min(10, "Le message doit contenir au moins 10 caractères."),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
