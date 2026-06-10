/**
 * Provider Service — Orange Money Web Payment (OM Cameroun / CI / Sénégal).
 * Documentation : https://developer.orange.com/apis/om-webpay
 *
 * Flux :
 *  1. getAccessToken()  — OAuth2 client_credentials
 *  2. initPayment()     — crée la transaction, retourne payment_url + pay_token
 *  3. L'utilisateur paie sur la page Orange (ou valide le push USSD)
 *  4. Orange notifie notre webhook (notif_url) → markPaymentSucceeded()
 */

const OM_BASE_URL =
  process.env.ORANGE_MONEY_BASE_URL ?? 'https://api.orange.com';

interface OrangeTokenResponse {
  access_token: string;
  expires_in: number;
}

export interface OrangeInitResult {
  paymentUrl: string;
  payToken: string;
  notifToken: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getOrangeAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const auth = Buffer.from(
    `${process.env.ORANGE_MONEY_CLIENT_ID}:${process.env.ORANGE_MONEY_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${OM_BASE_URL}/oauth/v3/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Orange OAuth: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as OrangeTokenResponse;
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return json.access_token;
}

/** Initialise un paiement Orange Money Web Pay. */
export async function initOrangePayment(params: {
  amount: number;
  currency: string; // 'XAF' | 'XOF'
  reference: string; // provider_reference interne (order_id)
  returnUrl: string;
  cancelUrl: string;
  notifUrl: string;
  lang?: string;
}): Promise<OrangeInitResult> {
  const token = await getOrangeAccessToken();
  const notifToken = crypto.randomUUID();

  const res = await fetch(`${OM_BASE_URL}/orange-money-webpay/cm/v1/webpayment`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      merchant_key: process.env.ORANGE_MONEY_MERCHANT_KEY,
      currency: params.currency,
      order_id: params.reference,
      amount: Math.round(params.amount),
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl,
      notif_url: params.notifUrl,
      notif_token: notifToken,
      lang: params.lang ?? 'fr',
      reference: 'Power Inside Data Academy',
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Orange init: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as {
    payment_url: string;
    pay_token: string;
    notif_token: string;
  };
  return {
    paymentUrl: json.payment_url,
    payToken: json.pay_token,
    notifToken,
  };
}

/** Vérifie le statut d'une transaction (réconciliation / polling de secours). */
export async function checkOrangeTransactionStatus(params: {
  reference: string;
  amount: number;
  payToken: string;
}): Promise<'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED'> {
  const token = await getOrangeAccessToken();

  const res = await fetch(
    `${OM_BASE_URL}/orange-money-webpay/cm/v1/transactionstatus`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: params.reference,
        amount: Math.round(params.amount),
        pay_token: params.payToken,
      }),
      cache: 'no-store',
    }
  );

  if (!res.ok) throw new Error(`Orange status: ${res.status}`);
  const json = (await res.json()) as { status: string };
  return json.status as 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
}

/** Le provider est-il configuré (env complètes) ? */
export function isOrangeConfigured(): boolean {
  return Boolean(
    process.env.ORANGE_MONEY_CLIENT_ID &&
      process.env.ORANGE_MONEY_CLIENT_SECRET &&
      process.env.ORANGE_MONEY_MERCHANT_KEY
  );
}
