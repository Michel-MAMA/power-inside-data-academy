import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { stripeCheckoutSchema } from '@/lib/validations';
import { createPendingPayment, PaymentError } from '@/lib/services/payments';

/**
 * POST /api/payments/stripe
 * Crée une Stripe Checkout Session et retourne l'URL de redirection.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return fail('UNAUTHORIZED', 'Connectez-vous pour acheter une formation.', 401);
    }

    const parsed = stripeCheckoutSchema.safeParse(await request.json());
    if (!parsed.success) {
      return fail('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Données invalides.', 400);
    }

    const { payment, formation, amount } = await createPendingPayment({
      userId: user.id,
      formationId: parsed.data.formationId,
      providerCode: 'stripe',
      promoCode: parsed.data.promoCode,
    });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: (formation.currency ?? 'EUR').toLowerCase(),
            product_data: {
              name: formation.title,
              description: `Formation Power Inside Data Academy`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        payment_id: payment.id,
        provider_reference: payment.provider_reference,
        formation_id: formation.id,
        user_id: user.id,
      },
      success_url: `${siteUrl}/formations/${formation.slug}?payment=success`,
      cancel_url: `${siteUrl}/formations/${formation.slug}?payment=cancelled`,
    });

    // Lier la session Stripe au paiement
    await supabase
      .from('payments')
      .update({ provider_session_id: session.id, status: 'processing' })
      .eq('id', payment.id);

    return NextResponse.json({ success: true, data: { url: session.url } });
  } catch (err) {
    if (err instanceof PaymentError) return fail(err.code, err.message, 400);
    console.error('[stripe] checkout error:', err);
    return fail('INTERNAL_ERROR', 'Erreur lors de la création du paiement.', 500);
  }
}

function fail(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}
