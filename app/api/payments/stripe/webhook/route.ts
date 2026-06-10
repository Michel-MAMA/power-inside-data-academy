import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  markPaymentSucceeded,
  markPaymentFailed,
  logWebhook,
} from '@/lib/services/payments';

/**
 * POST /api/payments/stripe/webhook
 * Configurer dans le dashboard Stripe :
 *   URL    : https://votre-domaine.com/api/payments/stripe/webhook
 *   Events : checkout.session.completed, checkout.session.expired,
 *            payment_intent.payment_failed
 * La mise à jour payments.status = succeeded déclenche côté SQL :
 * enrollment (paid) + facture + notification (trigger fn_on_payment_succeeded).
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    event = stripe.webhooks.constructEvent(
      body,
      signature ?? '',
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    await logWebhook({
      providerCode: 'stripe',
      eventType: 'signature_verification_failed',
      payload: { error: String(err) },
      signatureValid: false,
      status: 'error',
      errorMessage: 'Signature invalide',
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotence : event.id unique en base
  const { duplicate } = await logWebhook({
    providerCode: 'stripe',
    eventId: event.id,
    eventType: event.type,
    payload: event.data.object,
    signatureValid: true,
    status: 'processed',
  });
  if (duplicate) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === 'paid') {
          await markPaymentSucceeded({
            providerCode: 'stripe',
            sessionId: session.id,
            providerPaymentId:
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : session.payment_intent?.id,
          });
        }
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await markPaymentFailed({
          sessionId: session.id,
          failureCode: 'session_expired',
          failureMessage: 'Session de paiement expirée.',
        });
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        await markPaymentFailed({
          providerReference: intent.metadata?.provider_reference,
          failureCode: intent.last_payment_error?.code ?? 'payment_failed',
          failureMessage: intent.last_payment_error?.message ?? 'Paiement refusé.',
        });
        break;
      }
      default:
        break; // événement non géré : déjà journalisé
    }
  } catch (err) {
    console.error('[stripe webhook] processing error:', err);
    // 500 → Stripe réessaiera (le log d'idempotence empêche le double traitement réussi)
    return NextResponse.json({ error: 'Processing error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
