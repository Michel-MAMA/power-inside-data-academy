import { createClient } from "@/lib/supabase/server";

export interface ContactPayload {
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  sujet?: string;
  message: string;
}

/**
 * Logique métier contact — déplacée depuis lib/supabase/queries.ts.
 * lib/supabase/ ne contient plus que la configuration des clients.
 */
export async function insertContact(payload: ContactPayload): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").insert({
    ...payload,
    telephone: payload.telephone ?? null,
  });
  if (error) {
    throw new Error(`insertContact: ${error.message}`);
  }
}
