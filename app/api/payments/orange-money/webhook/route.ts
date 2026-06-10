import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  markPaymentSucceeded,
  markPaymentFailed,
  logWebhook,
} from '@/lib/services/payments';

/**
 * POST /api/payments/orange-money/webhook
 * Notification Orange Money (notif_url). Payload typique :
 *   { status: 'SUCCESS' | 'FAILED', notif_token: string, txnid: string }
 * Sécurité : le notif_token (généré par nous à l'init, stocké dans
 * payments.metadata) sert de secret partagé — on retrouve LE paiement
 * correspondant, impossible à forger sans connaître le token.
 */
export async function POST(request: NextRequest) {
  let payload: { status?: string; notif_token?: string; txnid?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { status, notif_token, txnid } = payload;

  await logWebhook({
    providerCode: 'orange_money',
    eventId: txnid ? `om-${txnid}-${status}` : undefined,
    eventType: `om.${(status ?? 'unknown').toLowerCase()}`,
    payload,
    status: 'received',
  });

  if (!notif_token) {
    return NextResponse.json({ error: 'Missing notif_token' }, { status: 400 });
  }

  // Retrouver le paiement par son notif_token (secret partagé)
  const admin = createAdminClient();
  const { data: payment } = await admin
    .from('payments')
    .select('id, provider_reference, status')
    .eq('metadata->>notif_token', notif_token)
    .maybeSingle();

  if (!payment) {
    await logWebhook({
      providerCode: 'orange_money',
      eventType: 'om.unmatched',
      payload,
      status: 'ignored',
      errorMessage: 'notif_token inconnu',
    });
    return NextResponse.json({ received: true, matched: false });
  }

  if (status === 'SUCCESS') {
    await markPaymentSucceeded({
      providerCode: 'orange_money',
      providerReference: payment.provider_reference,
      providerPaymentId: txnid,
    });
  } else if (status === 'FAILED') {
    await markPaymentFailed({
      providerReference: payment.provider_reference,
      failureCode: 'om_failed',
      failureMessage: 'Paiement Orange Money refusé ou annulé.',
    });
  }

  return NextResponse.json({ received: true });
}
