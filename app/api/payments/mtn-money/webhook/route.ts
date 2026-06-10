import { NextRequest, NextResponse } from 'next/server';
import {
  markPaymentSucceeded,
  markPaymentFailed,
  logWebhook,
} from '@/lib/services/payments';
import { getRequestToPayStatus } from '@/lib/payments/mtn-money';

/**
 * PUT/POST /api/payments/mtn-money/webhook
 * Callback MTN MoMo (X-Callback-Url du RequestToPay). Payload typique :
 *   { externalId, status: 'SUCCESSFUL' | 'FAILED', financialTransactionId, ... }
 * Sécurité : on ne fait JAMAIS confiance au payload seul — le statut est
 * re-vérifié auprès de l'API MTN avant toute mise à jour.
 */
async function handleCallback(request: NextRequest) {
  let payload: {
    externalId?: string;
    status?: string;
    financialTransactionId?: string;
    referenceId?: string;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const reference = payload.externalId; // notre provider_reference
  const claimed = payload.status;

  await logWebhook({
    providerCode: 'mtn_momo',
    eventId: reference ? `momo-${reference}-${claimed}` : undefined,
    eventType: `momo.${(claimed ?? 'unknown').toLowerCase()}`,
    payload,
    status: 'received',
  });

  if (!reference) {
    return NextResponse.json({ error: 'Missing externalId' }, { status: 400 });
  }

  // Re-vérification du statut auprès de MTN (anti-spoofing) via le paiement
  const { createAdminClient } = await import('@/lib/supabase/server');
  const admin = createAdminClient();
  const { data: payment } = await admin
    .from('payments')
    .select('id, provider_payment_id, status')
    .eq('provider_reference', reference)
    .maybeSingle();

  if (!payment?.provider_payment_id) {
    return NextResponse.json({ received: true, matched: false });
  }

  let verified: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  try {
    verified = await getRequestToPayStatus(payment.provider_payment_id);
  } catch {
    // API MTN injoignable : on garde le webhook en log, le polling GET fera foi
    return NextResponse.json({ received: true, verified: false });
  }

  if (verified === 'SUCCESSFUL') {
    await markPaymentSucceeded({
      providerCode: 'mtn_momo',
      providerReference: reference,
      providerPaymentId: payload.financialTransactionId ?? payment.provider_payment_id,
    });
  } else if (verified === 'FAILED') {
    await markPaymentFailed({
      providerReference: reference,
      failureCode: 'momo_failed',
      failureMessage: 'Paiement MTN MoMo refusé.',
    });
  }

  return NextResponse.json({ received: true });
}

export async function POST(request: NextRequest) {
  return handleCallback(request);
}

export async function PUT(request: NextRequest) {
  return handleCallback(request);
}
