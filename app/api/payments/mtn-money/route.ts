import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mobileMoneySchema } from '@/lib/validations';
import { createPendingPayment, PaymentError } from '@/lib/services/payments';
import { requestToPay, isMtnConfigured } from '@/lib/payments/mtn-money';

/**
 * POST /api/payments/mtn-money
 * Déclenche un RequestToPay MTN MoMo : le client valide sur son téléphone.
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

    if (!isMtnConfigured()) {
      return fail(
        'PROVIDER_NOT_CONFIGURED',
        'MTN Mobile Money sera bientôt disponible. Utilisez la carte bancaire en attendant.',
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
      providerCode: 'mtn_momo',
      promoCode: parsed.data.promoCode,
      phoneNumber: parsed.data.phoneNumber,
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const { referenceId } = await requestToPay({
      amount,
      currency: formation.currency === 'EUR' ? 'XAF' : formation.currency,
      reference,
      phoneNumber: parsed.data.phoneNumber,
      message: `Formation : ${formation.title}`,
      callbackUrl: `${siteUrl}/api/payments/mtn-money/webhook`,
    });

    await supabase
      .from('payments')
      .update({ status: 'requires_action', provider_payment_id: referenceId })
      .eq('id', payment.id);

    return NextResponse.json({
      success: true,
      data: {
        referenceId,
        reference,
        message:
          'Demande envoyée ! Validez le paiement sur votre téléphone (code PIN MoMo).',
      },
    });
  } catch (err) {
    if (err instanceof PaymentError) return fail(err.code, err.message, 400);
    console.error('[mtn-money] init error:', err);
    return fail('INTERNAL_ERROR', "Erreur lors de l'initialisation MTN MoMo.", 500);
  }
}

/**
 * GET /api/payments/mtn-money?reference=PIDA-...
 * Polling de secours côté client : interroge MTN et synchronise le statut.
 */
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get('reference');
  if (!reference) return fail('VALIDATION_ERROR', 'Référence manquante.', 400);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail('UNAUTHORIZED', 'Non authentifié.', 401);

  const { data: payment } = await supabase
    .from('payments')
    .select('id, status, provider_payment_id, user_id')
    .eq('provider_reference', reference)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!payment) return fail('NOT_FOUND', 'Paiement introuvable.', 404);

  // Statut local déjà final
  if (['succeeded', 'failed', 'cancelled'].includes(payment.status)) {
    return NextResponse.json({ success: true, data: { status: payment.status } });
  }

  // Interroger MTN puis synchroniser
  try {
    const { getRequestToPayStatus } = await import('@/lib/payments/mtn-money');
    const { markPaymentSucceeded, markPaymentFailed } = await import(
      '@/lib/services/payments'
    );
    const mtnStatus = await getRequestToPayStatus(payment.provider_payment_id!);

    if (mtnStatus === 'SUCCESSFUL') {
      await markPaymentSucceeded({
        providerCode: 'mtn_momo',
        providerReference: reference,
      });
      return NextResponse.json({ success: true, data: { status: 'succeeded' } });
    }
    if (mtnStatus === 'FAILED') {
      await markPaymentFailed({
        providerReference: reference,
        failureCode: 'momo_failed',
        failureMessage: 'Paiement MTN MoMo refusé ou expiré.',
      });
      return NextResponse.json({ success: true, data: { status: 'failed' } });
    }
    return NextResponse.json({ success: true, data: { status: 'pending' } });
  } catch (err) {
    console.error('[mtn-money] status error:', err);
    return NextResponse.json({ success: true, data: { status: 'pending' } });
  }
}

function fail(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}
