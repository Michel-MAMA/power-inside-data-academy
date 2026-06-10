# 🔌 Intégration Frontend ↔ Supabase + Paiements
**Power Inside Data Academy** — Livraison Missions 1 à 9

---

## MISSION 1 — RAPPORT D'AUDIT

### État AVANT cette intégration

| Élément | État | Détail |
|---|---|---|
| `lib/supabase/client.ts` | 🔴 Non connecté | `createClient` basique, pas de gestion SSR/cookies |
| `lib/supabase/server.ts` | 🔴 Absent | Aucun client serveur |
| `middleware.ts` | 🔴 Absent | Aucune protection de routes, sessions non rafraîchies |
| Pages auth (login/signup/forgot) | 🟡 Partiel | UI existante, appels client-side sans session SSR |
| `/api/stripe/checkout` | 🔴 Stub | `TODO: Create Stripe checkout session` |
| `/api/courses` | 🟡 Partiel | Requête Supabase mais schéma obsolète (`courses` ≠ `formations`) |
| Catalogue formations | 🔴 Mocké | Données en dur dans les composants |
| Dashboard étudiant | 🔴 Mocké | Stats en dur, aucun appel `enrollments` |
| Admin | 🔴 Absent | Aucune page admin |
| Types TypeScript | 🔴 Obsolètes | `Course`, `Payment` ne correspondent pas au schéma SQL |
| Conflits de routes | 🔴 Bloquant | `app/page.tsx` + `(marketplace)/page.tsx` + `(dashboard)/page.tsx` → 3 pages sur `/` → **build impossible** |

### État APRÈS (cette livraison)

| Élément | État |
|---|---|
| Clients Supabase (browser / server / admin / middleware) | ✅ Connecté — pattern officiel `@supabase/ssr` |
| Auth complète (register, login, logout, forgot, profil) | ✅ Server Actions + Zod + `profiles` |
| Catalogue `/formations` + détail `/formations/[slug]` | ✅ 100 % Supabase (formations, modules, lessons, sessions) |
| Dashboard `/dashboard` | ✅ enrollments, progression, certificats, quiz réussis |
| Profil `/dashboard/profile` | ✅ Lecture/écriture `profiles` |
| PaymentModal (CB / Orange Money / MTN MoMo) | ✅ Créé |
| API Stripe + webhook | ✅ Checkout Session + signature vérifiée |
| API Orange Money + webhook | ✅ Service provider + notif_token |
| API MTN MoMo + webhook + polling | ✅ RequestToPay + re-vérification anti-spoofing |
| Admin `/admin/payments` | ✅ Tous providers, filtres, montants, statuts |
| Routes en conflit / données mockées | ✅ Supprimées |

---

## ARCHITECTURE LIVRÉE

```
middleware.ts                          → refresh session + protection /dashboard /admin
lib/
├── supabase/
│   ├── client.ts                      → createBrowserClient (Client Components)
│   ├── server.ts                      → createServerClient (RSC/Actions) + createAdminClient (service_role)
│   └── middleware.ts                  → updateSession (auth + garde admin)
├── services/
│   ├── formations.ts                  → catalogue, détail (modules+lessons+sessions), inscription user
│   ├── dashboard.ts                   → 4 requêtes parallèles (profil, enrollments, certificats, quiz)
│   └── payments.ts                    → createPendingPayment (prix relu en DB), markPaymentSucceeded/Failed, logWebhook
├── payments/
│   ├── orange-money.ts                → OAuth2 + WebPayment + transactionstatus
│   └── mtn-money.ts                   → OAuth + RequestToPay + statut
└── validations.ts                     → schémas Zod (auth, profil, paiements)

app/
├── actions/auth.ts                    → Server Actions (register, login, logout, forgot, profile)
├── (auth)/login | register | forgot-password | signup→redirect
├── formations/ + [slug]/ + loading.tsx (skeletons)
├── dashboard/ + profile/ + loading.tsx
├── admin/payments/
└── api/payments/
    ├── stripe/        + stripe/webhook/
    ├── orange-money/  + orange-money/webhook/
    └── mtn-money/     + mtn-money/webhook/   (+ GET = polling statut)

components/
├── payment/PaymentModal.tsx           → modal premium 3 méthodes, promo, états (waiting/success/error)
├── payment/EnrollButton.tsx           → CTA intelligent (inscrit ✓ / devis / payer)
├── auth/AuthUI.tsx                    → AuthCard, Field, SubmitButton, FormError/Success
└── dashboard/ProfileForm.tsx
```

## FLUX DE PAIEMENT

```
EnrollButton → PaymentModal
   │
   ├─ 💳 Stripe        POST /api/payments/stripe
   │     1. auth + Zod  2. createPendingPayment (prix DB, promo via validate_promo_code SQL)
   │     3. Checkout Session  4. redirection Stripe
   │     Webhook signé → status=succeeded → TRIGGER SQL fn_on_payment_succeeded :
   │       enrollment(paid) + facture + notification  ← AUCUN code applicatif nécessaire
   │
   ├─ 🟠 Orange Money  POST /api/payments/orange-money
   │     init OAuth2 → payment_url → redirection page Orange
   │     Webhook : notif_token (secret partagé stocké dans payments.metadata)
   │
   └─ 🟡 MTN MoMo      POST /api/payments/mtn-money
         RequestToPay → push téléphone → modal "Validez sur votre téléphone"
         Polling GET toutes les 4s + webhook (statut RE-VÉRIFIÉ auprès de MTN)
```

**Sécurité clé** : le prix n'est **jamais** envoyé par le client — il est relu
en base dans `createPendingPayment()`. Les webhooks sont idempotents
(contrainte unique `provider_code + event_id` dans `payment_webhooks`).

## DÉPLOIEMENT VERCEL

1. `npm install` (deps mises à jour : Next 15, React 19, @supabase/ssr, stripe)
2. Exécuter `supabase/MASTER_SQL_POWER_INSIDE_ACADEMY.sql` dans Supabase (déjà fait)
3. Configurer les variables de `.env.example` dans Vercel
4. Créer le webhook Stripe → `https://domaine.com/api/payments/stripe/webhook`
5. `npm run build` puis déployer

### Notes
- `next-auth` et `react-query` retirés du package.json : non utilisés et
  incompatibles React 19 (l'auth est 100 % Supabase ; le cache est géré par
  RSC + `revalidate`).
- Orange Money / MTN MoMo : tant que les clés ne sont pas renseignées, les
  APIs répondent `503 PROVIDER_NOT_CONFIGURED` avec un message utilisateur
  propre — l'UI reste fonctionnelle avec Stripe seul.
- Test Stripe local : `stripe listen --forward-to localhost:3000/api/payments/stripe/webhook`
