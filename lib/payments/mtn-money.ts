/**
 * Provider Service — MTN Mobile Money (MoMo API Collections).
 * Documentation : https://momodeveloper.mtn.com (produit "Collection")
 *
 * Flux :
 *  1. getMtnAccessToken()   — token OAuth (API user + API key)
 *  2. requestToPay()        — push de paiement sur le téléphone du client
 *  3. Le client valide sur son téléphone (code PIN MoMo)
 *  4. MTN notifie notre webhook (X-Callback-Url) → markPaymentSucceeded()
 *     (+ polling getRequestToPayStatus en secours)
 */

const MTN_BASE_URL =
  process.env.MTN_MOMO_BASE_URL ?? 'https://sandbox.momodeveloper.mtn.com';
const MTN_ENV = process.env.MTN_MOMO_ENVIRONMENT ?? 'sandbox';

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getMtnAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const auth = Buffer.from(
    `${process.env.MTN_MOMO_API_USER}:${process.env.MTN_MOMO_API_KEY}`
  ).toString('base64');

  const res = await fetch(`${MTN_BASE_URL}/collection/token/`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY!,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`MTN OAuth: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return json.access_token;
}

/**
 * Déclenche un RequestToPay : le client reçoit une demande de validation
 * sur son téléphone. referenceId (UUID) = identifiant de la transaction MTN.
 */
export async function requestToPay(params: {
  amount: number;
  currency: string; // 'XAF' — en sandbox MTN impose 'EUR'
  reference: string; // provider_reference interne (externalId)
  phoneNumber: string; // MSISDN sans '+' ex: 2376XXXXXXXX
  message: string;
  callbackUrl?: string;
}): Promise<{ referenceId: string }> {
  const token = await getMtnAccessToken();
  const referenceId = crypto.randomUUID();
  const currency = MTN_ENV === 'sandbox' ? 'EUR' : params.currency;

  const res = await fetch(`${MTN_BASE_URL}/collection/v1_0/requesttopay`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Reference-Id': referenceId,
      'X-Target-Environment': MTN_ENV,
      'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY!,
      'Content-Type': 'application/json',
      ...(params.callbackUrl && { 'X-Callback-Url': params.callbackUrl }),
    },
    body: JSON.stringify({
      amount: String(Math.round(params.amount)),
      currency,
      externalId: params.reference,
      payer: {
        partyIdType: 'MSISDN',
        partyId: params.phoneNumber.replace(/^\+/, ''),
      },
      payerMessage: params.message,
      payeeNote: 'Power Inside Data Academy',
    }),
    cache: 'no-store',
  });

  // MTN répond 202 Accepted si la demande est acceptée
  if (res.status !== 202) {
    throw new Error(`MTN requestToPay: ${res.status} ${await res.text()}`);
  }
  return { referenceId };
}

/** Statut d'un RequestToPay (polling de secours si pas de callback). */
export async function getRequestToPayStatus(
  referenceId: string
): Promise<'PENDING' | 'SUCCESSFUL' | 'FAILED'> {
  const token = await getMtnAccessToken();

  const res = await fetch(
    `${MTN_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Target-Environment': MTN_ENV,
        'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY!,
      },
      cache: 'no-store',
    }
  );

  if (!res.ok) throw new Error(`MTN status: ${res.status}`);
  const json = (await res.json()) as { status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' };
  return json.status;
}

export function isMtnConfigured(): boolean {
  return Boolean(
    process.env.MTN_MOMO_API_USER &&
      process.env.MTN_MOMO_API_KEY &&
      process.env.MTN_MOMO_SUBSCRIPTION_KEY
  );
}
