import { z } from "zod";

export const contactSchema = z.object({
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  telephone: z.string().optional(),
  sujet: z.enum(
    ["devis", "inscription", "financement", "partenariat", "information", "support", "autre"],
    { required_error: "Veuillez sélectionner un sujet" }
  ),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
});

export type ContactSchema = z.infer<typeof contactSchema>;
