import { createClient } from '@/lib/supabase/server';
import type { ContactFormValues } from '@/lib/validations';

export interface ContactPayload extends ContactFormValues {
  telephone?: string;
}

/**
 * Enregistre un message de contact dans la table `contacts`.
 * (RLS : policy contacts_public_insert — insertion ouverte, lecture admin.)
 */
export async function insertContact(payload: ContactPayload): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('contacts').insert({
    prenom: payload.prenom,
    nom: payload.nom,
    email: payload.email,
    telephone: payload.telephone ?? null,
    sujet: payload.sujet,
    message: payload.message,
    source: 'website',
  });
  if (error) {
    throw new Error(`insertContact: ${error.message}`);
  }
}
