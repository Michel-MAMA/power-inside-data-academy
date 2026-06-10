import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mobileMoneySchema } from '@/lib/validations';
import { createPendingPayment, PaymentError } from '@/lib/services/payments';
import { initOrangePayment, isOrangeConfigured } from '@/lib/payments/orange-money';

/**
 * POST /api/payments/orange-money
 * Initialise un paiement Orange Money et retourne l'URL de paiement.
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

    if (!isOrangeConfigured()) {
      return fail(
        'PROVIDER_NOT_CONFIGURED',
        'Orange Money sera bientôt disponible. Utilisez la carte bancaire en attendant.',
        503
      );
    }

    const parsed = mobileMoneySchema.safeParse(await request.json());
    if (!parsed.success) {
      return fail('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Données invalides.', 400);
    }

    const { payment, formation, amount, reference } = await createPendingPayment({
      userId: user.id,
      formationId: parsed.data.formationId,
      providerCode: 'orange_money',
      promoCode: parsed.data.promoCode,
      phoneNumber: parsed.data.phoneNumber,
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const result = await initOrangePayment({
      amount,
      currency: formation.currency === 'EUR' ? 'XAF' : formation.currency, // OM = FCFA
      reference,
      returnUrl: `${siteUrl}/formations/${formation.slug}?payment=success`,
      cancelUrl: `${siteUrl}/formations/${formation.slug}?payment=cancelled`,
      notifUrl: `${siteUrl}/api/payments/orange-money/webhook`,
    });

    // pay_token nécessaire pour vérifier le statut ; notif_token pour le webhook
    await supabase
      .from('payments')
      .update({
        status: 'processing',
        provider_session_id: result.payToken,
        metadata: { notif_token: result.notifToken },
      })
      .eq('id', payment.id);

    return NextResponse.json({
      success: true,
      data: { url: result.paymentUrl, reference },
    });
  } catch (err) {
    if (err instanceof PaymentError) return fail(err.code, err.message, 400);
    console.error('[orange-money] init error:', err);
    return fail('INTERNAL_ERROR', "Erreur lors de l'initialisation Orange Money.", 500);
  }
}

function fail(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}
