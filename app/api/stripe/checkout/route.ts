import { NextResponse } from 'next/server';

/**
 * DÉPRÉCIÉ — utiliser POST /api/payments/stripe.
 * Conservé pour ne pas casser d'anciens clients.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'ENDPOINT_MOVED',
        message: 'Utilisez POST /api/payments/stripe',
      },
    },
    { status: 410 }
  );
}
