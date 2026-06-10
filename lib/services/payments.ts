import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { PaymentProviderCode, PromoValidation } from '@/types/database';

/**
 * Crée une ligne `payments` en statut pending et retourne son id + montants.
 * Appelé par chaque API de paiement AVANT de contacter le provider.
 * Le prix est TOUJOURS relu en base — jamais fourni par le client.
 */
export async function createPendingPayment(params: {
  userId: string;
  formationId: string;
  providerCode: PaymentProviderCode;
  promoCode?: string;
  phoneNumber?: string;
}) {
  const supabase = await createClient();

  // 1. Formation + prix réel (anti-manipulation côté client)
  const { data: formation, error: fErr } = await supabase
    .from('formations')
    .select('id, title, slug, price_ht, price_sur_devis, currency, is_published')
    .eq('id', params.formationId)
    .single();

  if (fErr || !formation) throw new PaymentError('FORMATION_NOT_FOUND', 'Formation introuvable.');
  if (!formation.is_published) throw new PaymentError('NOT_PUBLISHED', 'Formation non disponible.');
  if (formation.price_sur_devis || formation.price_ht == null) {
    throw new PaymentError('QUOTE_ONLY', 'Cette formation est sur devis. Contactez-nous.');
  }

  // 2. Déjà inscrit + payé ?
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id, payment_status')
    .eq('user_id', params.userId)
    .eq('formation_id', params.formationId)
    .maybeSingle();
  if (existing && ['paid', 'cpf', 'opco', 'free'].includes(existing.payment_status)) {
    throw new PaymentError('ALREADY_ENROLLED', 'Vous êtes déjà inscrit à cette formation.');
  }

  // 3. Provider actif
  const { data: provider } = await supabase
    .from('payment_providers')
    .select('id, code, is_active')
    .eq('code', params.providerCode)
    .single();
  if (!provider?.is_active) {
    throw new PaymentError('PROVIDER_INACTIVE', 'Ce moyen de paiement est indisponible.');
  }

  // 4. Code promo (validé en base via la fonction SQL)
  const gross = Number(formation.price_ht);
  let discount = 0;
  let promoId: string | null = null;

  if (params.promoCode) {
    const { data } = await supabase.rpc('validate_promo_code', {
      p_code: params.promoCode,
      p_user_id: params.userId,
      p_formation_id: params.formationId,
      p_amount: gross,
    });
    const promo = (data?.[0] ?? null) as PromoValidation | null;
    if (!promo?.valid) {
      throw new PaymentError('INVALID_PROMO', codePromoMessage(promo?.error_code));
    }
    promoId = promo.promo_id;
    discount =
      promo.discount_type === 'percentage'
        ? Math.round(gross * (Number(promo.discount_value) / 100) * 100) / 100
        : Math.min(Number(promo.discount_value), gross);
  }

  const amount = Math.round((gross - discount) * 100) / 100;
  const reference = `PIDA-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  // 5. Insertion (RLS : payments_own_insert)
  const { data: payment, error: pErr } = await supabase
    .from('payments')
    .insert({
      user_id: params.userId,
      formation_id: params.formationId,
      provider_id: provider.id,
      promo_code_id: promoId,
      amount_gross: gross,
      discount_amount: discount,
      amount,
      currency: formation.currency ?? 'EUR',
      status: 'pending',
      provider_reference: reference,
      phone_number: params.phoneNumber ?? null,
    })
    .select('id, provider_reference')
    .single();

  if (pErr) throw new PaymentError('DB_ERROR', pErr.message);

  return { payment, formation, amount, gross, discount, reference };
}

/**
 * Marque un paiement comme abouti (appelé par les WEBHOOKS uniquement).
 * Utilise le client service_role : le trigger SQL fn_on_payment_succeeded
 * crée alors l'enrollment (payment_status = paid), la facture et la notification.
 */
export async function markPaymentSucceeded(opts: {
  providerCode: PaymentProviderCode;
  providerPaymentId?: string;
  providerReference?: string;
  sessionId?: string;
}) {
  const admin = createAdminClient();

  let query = admin.from('payments').update({
    status: 'succeeded',
    ...(opts.providerPaymentId && { provider_payment_id: opts.providerPaymentId }),
  });

  if (opts.providerReference) {
    query = query.eq('provider_reference', opts.providerReference);
  } else if (opts.sessionId) {
    query = query.eq('provider_session_id', opts.sessionId);
  } else {
    throw new Error('markPaymentSucceeded: référence manquante');
  }

  const { data, error } = await query
    .in('status', ['pending', 'processing', 'requires_action'])
    .select('id, user_id, formation_id')
    .maybeSingle();

  if (error) throw new Error(`markPaymentSucceeded: ${error.message}`);
  return data; // null = déjà traité (idempotence)
}

export async function markPaymentFailed(opts: {
  providerReference?: string;
  sessionId?: string;
  failureCode?: string;
  failureMessage?: string;
}) {
  const admin = createAdminClient();
  let query = admin.from('payments').update({
    status: 'failed',
    failure_code: opts.failureCode ?? null,
    failure_message: opts.failureMessage ?? null,
  });
  if (opts.providerReference) query = query.eq('provider_reference', opts.providerReference);
  else if (opts.sessionId) query = query.eq('provider_session_id', opts.sessionId);
  else return;
  await query.in('status', ['pending', 'processing', 'requires_action']);
}

/** Journalise un webhook entrant (idempotence + traçabilité). */
export async function logWebhook(opts: {
  providerCode: PaymentProviderCode;
  eventId?: string;
  eventType: string;
  payload: unknown;
  signatureValid?: boolean;
  status?: 'received' | 'processed' | 'ignored' | 'error';
  errorMessage?: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from('payment_webhooks').insert({
    provider_code: opts.providerCode,
    event_id: opts.eventId ?? null,
    event_type: opts.eventType,
    payload: opts.payload as Record<string, unknown>,
    signature_valid: opts.signatureValid ?? null,
    status: opts.status ?? 'received',
    error_message: opts.errorMessage ?? null,
    processed_at: opts.status === 'processed' ? new Date().toISOString() : null,
  });
  // Violation d'unicité (provider_code, event_id) = événement déjà reçu
  if (error?.code === '23505') return { duplicate: true };
  return { duplicate: false };
}

// ── Erreur métier paiement ──────────────────────────────────────────────────

export class PaymentError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

function codePromoMessage(code?: string | null): string {
  const messages: Record<string, string> = {
    NOT_FOUND: 'Code promo invalide.',
    EXPIRED: 'Ce code promo a expiré.',
    NOT_STARTED: "Ce code promo n'est pas encore actif.",
    MAX_REDEMPTIONS: 'Ce code promo a atteint sa limite d’utilisation.',
    WRONG_FORMATION: 'Ce code ne s’applique pas à cette formation.',
    MIN_AMOUNT: 'Montant minimum non atteint pour ce code.',
    ALREADY_USED: 'Vous avez déjà utilisé ce code promo.',
  };
  return messages[code ?? ''] ?? 'Code promo invalide.';
}
