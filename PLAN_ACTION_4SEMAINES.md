# 📋 PLAN D'ACTION 4 SEMAINES
## Power Inside Data Academy - Road to Production

**Objectif:** Prêt pour production commerciale  
**Durée:** 4 semaines  
**Date de départ:** 11 Juin 2024  
**Date cible:** 9 Juillet 2024  

---

## 📊 OVERVIEW - Tâches par Priorité

```
🔴 CRITIQUE (Semaine 1-2): 5 tâches - Bloquent la production
🟠 URGENT (Semaine 2-3): 8 tâches - Nécessaires pour launch
🟡 IMPORTANT (Semaine 3-4): 6 tâches - Bonnes pratiques
🟢 NICE-TO-HAVE (Après semaine 4): Améliorations continues
```

---

## ⏱️ SEMAINE 1 (11-15 Juin) - FONDATIONS CRITIQUES

### 🔴 [CRITIQUE] Task 1.1: Webhooks Stripe Implementation
**Estimé:** 8h | **Priorité:** P0 | **Assigné:** Backend Developer  
**Impact:** Sans ceci, zéro revenue possible

#### Checklist
- [ ] Créer table `payments` dans Supabase
  ```sql
  CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    formation_id UUID,
    amount DECIMAL(10,2),
    currency TEXT DEFAULT 'EUR',
    status TEXT DEFAULT 'pending',
    stripe_session_id TEXT,
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] Implémenter `POST /api/stripe/webhook`
  ```typescript
  // app/api/stripe/webhook/route.ts
  const signature = headers().get('stripe-signature');
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Update enrollment + create payment record
  }
  ```

- [ ] Tester avec Stripe CLI localement
- [ ] Configurer webhook URL en production (Vercel)
- [ ] Ajouter logging pour debug
- [ ] Tests intégration Stripe webhook

**Fichiers à modifier:**
- `supabase/schema.sql` - Ajouter table payments
- Nouveau: `app/api/stripe/webhook/route.ts`
- `app/api/stripe/checkout/route.ts` - Améliorer

**Documentation:** Ajouter dans README comment tester webhooks

---

### 🔴 [CRITIQUE] Task 1.2: Admin Dashboard MVP
**Estimé:** 10h | **Priorité:** P0 | **Assigné:** Full Stack Developer  
**Impact:** Gestion formations en production

#### Checklist
- [ ] Créer structure de routes
  ```
  app/admin/
  ├── layout.tsx (avec sidebar)
  ├── page.tsx (dashboard overview)
  ├── formations/
  │   ├── page.tsx (liste)
  │   ├── [id]/page.tsx (détails/edit)
  │   └── new/page.tsx (créer)
  └── users/
      └── page.tsx (gestion utilisateurs)
  ```

- [ ] Middleware protection: `/admin/*` → vérifier `role = 'admin'`
  ```typescript
  // middleware.ts
  if (pathname.startsWith('/admin')) {
    const user = await getUser(request);
    if (user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  ```

- [ ] UI Composants: Table, Form, Modal (réutiliser TailwindCSS)
- [ ] CRUD formations: List → Create → Edit → Delete
- [ ] CRUD utilisateurs: List → View details
- [ ] Search & filters
- [ ] Tests de permission RLS

**Fichiers à créer:**
- `app/admin/layout.tsx`
- `app/admin/page.tsx`
- `app/admin/formations/page.tsx`
- `app/admin/formations/[id]/page.tsx`
- `components/admin/FormationForm.tsx`
- `components/admin/AdminSidebar.tsx`

**API Routes:**
- `GET /api/admin/formations` (avec auth check)
- `POST /api/admin/formations`
- `PUT /api/admin/formations/[id]`
- `DELETE /api/admin/formations/[id]`

---

### 🔴 [CRITIQUE] Task 1.3: Standard API Response Format
**Estimé:** 6h | **Priorité:** P0 | **Assigné:** Backend Developer  
**Impact:** Stabilité et maintenabilité API

#### Checklist
- [ ] Créer `lib/api/handlers.ts`
  ```typescript
  export const handleSuccess = <T>(data: T, statusCode = 200) => {
    return NextResponse.json({
      success: true,
      data,
      meta: { timestamp: new Date().toISOString() }
    }, { status: statusCode });
  };

  export const handleError = (error: AppError) => {
    return NextResponse.json({
      success: false,
      error: { code: error.code, message: error.message }
    }, { status: error.statusCode });
  };
  ```

- [ ] Créer `lib/errors/AppError.ts`
- [ ] Créer `lib/api/middleware.ts` (error wrapper)
- [ ] Refactorer toutes les routes API (8 routes existantes)
- [ ] Documenter les codes d'erreur

**Routes à refactorer:**
- `/api/auth/signup`
- `/api/auth/signin`
- `/api/courses`
- `/api/stripe/checkout`
- Etc.

**Tests:**
- Tester que toutes les réponses sont au format standard
- Tester les codes d'erreur

---

### 🟠 [URGENT] Task 1.4: Error Handler Centralisé
**Estimé:** 4h | **Priorité:** P1  
**Impact:** Debugging et logging

#### Checklist
- [ ] Setup Sentry
  ```typescript
  // lib/sentry.ts
  import * as Sentry from '@sentry/nextjs';

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
  });
  ```

- [ ] Setup Pino logger
  ```typescript
  // lib/logger.ts
  import pino from 'pino';
  export const logger = pino();
  ```

- [ ] Error boundary React
- [ ] Global error.tsx (Next.js)

**Dépendances à ajouter:**
```json
{
  "@sentry/nextjs": "^7.0.0",
  "pino": "^8.0.0"
}
```

---

### 🟠 [URGENT] Task 1.5: Tests Setup
**Estimé:** 6h | **Priorité:** P1  
**Impact:** Qualité code & confiance

#### Checklist
- [ ] Configuration Jest + Testing Library
  ```json
  // jest.config.js
  module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  };
  ```

- [ ] Setup Supertest pour API
- [ ] Créer 5 tests critiques (auth, payments)
- [ ] Setup CI/CD (GitHub Actions)
  ```yaml
  # .github/workflows/test.yml
  on: [push, pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: actions/setup-node@v3
        - run: npm test
  ```

---

## ⏱️ SEMAINE 2 (18-22 Juin) - PAIEMENTS & NOTIFICATIONS

### 🔴 [CRITIQUE] Task 2.1: Payment Flow Complet
**Estimé:** 8h | **Priorité:** P0

#### Checklist
- [ ] Créer table `invoices` dans Supabase
- [ ] Implémenter `/api/payments` (list & details)
- [ ] Générer factures PDF (jsPDF)
- [ ] Email de confirmation paiement
- [ ] Gestion refunds (PUT `/api/payments/[id]/refund`)
- [ ] Tests payment flow end-to-end

**Fichiers:**
- `app/api/payments/route.ts`
- `app/api/payments/[id]/refund/route.ts`
- `lib/pdf/invoice.ts` (jsPDF)
- `lib/emails/templates/paymentConfirm.tsx`

---

### 🟠 [URGENT] Task 2.2: Notification System
**Estimé:** 6h | **Priorité:** P1

#### Checklist
- [ ] API `POST /api/notifications`
- [ ] Email templates (SendGrid or Resend)
  - Welcome email
  - Payment confirmation
  - Course completion
  - Certificate ready
- [ ] In-app notification UI component
- [ ] Event emitter pour trigger notifications

**Templates:**
- `lib/emails/templates/welcome.tsx`
- `lib/emails/templates/paymentConfirm.tsx`
- `lib/emails/templates/certificateReady.tsx`

**Dépendance:**
```json
{
  "@sendgrid/mail": "^8.0.0" // ou "resend": "^2.0.0"
}
```

---

### 🟠 [URGENT] Task 2.3: User Profile API
**Estimé:** 4h | **Priorité:** P1

#### Checklist
- [ ] `GET /api/user/profile` (Current user)
- [ ] `PUT /api/user/profile` (Update)
- [ ] Upload avatar (S3 ou Vercel Blob)
- [ ] RLS protection
- [ ] Tests

---

### 🟠 [URGENT] Task 2.4: Dashboard Statistics
**Estimé:** 5h | **Priorité:** P1

#### Checklist
- [ ] `/dashboard/page.tsx` améloré:
  - Total courses enrolled
  - In-progress courses
  - Completed courses
  - Hours learned
  - Certificates earned

- [ ] Graphiques (Chart.js ou Recharts)
- [ ] Cache avec React Query

---

### 🟡 [IMPORTANT] Task 2.5: React Query Integration
**Estimé:** 4h | **Priorité:** P2

#### Checklist
- [ ] Setup React Query client
- [ ] Hooks:
  ```typescript
  - useCourses()
  - useEnrollments()
  - useUser()
  - usePayments()
  ```
- [ ] Caching strategy par type de data
- [ ] Refetch on window focus

---

## ⏱️ SEMAINE 3 (25-29 Juin) - POLISH & PERFORMANCE

### 🟠 [URGENT] Task 3.1: Authentication Enhancement
**Estimé:** 6h | **Priorité:** P1

#### Checklist
- [ ] Magic link login
- [ ] OAuth Google (opcional)
- [ ] Password reset flow completed
- [ ] Session management
- [ ] Refresh tokens

---

### 🟡 [IMPORTANT] Task 3.2: Performance Optimization
**Estimé:** 8h | **Priorité:** P2

#### Checklist
- [ ] Image optimization (Next.js Image)
  ```typescript
  import Image from 'next/image';
  <Image
    src={url}
    alt={alt}
    quality={80}
    placeholder="blur"
  />
  ```

- [ ] Code splitting & lazy loading
- [ ] Database indexes création
  ```sql
  CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
  CREATE INDEX idx_formations_domain_id ON formations(domain_id);
  ```

- [ ] Bundle analysis (next/bundle-analyzer)
- [ ] Lighthouse score > 80

---

### 🟡 [IMPORTANT] Task 3.3: SEO & Metadata
**Estimé:** 4h | **Priorité:** P2

#### Checklist
- [ ] Open Graph meta tags
- [ ] Sitemap.xml
- [ ] robots.txt
- [ ] Schema.org markup (Course)
- [ ] Page titles & descriptions

---

### 🟡 [IMPORTANT] Task 3.4: Security Hardening
**Estimé:** 5h | **Priorité:** P2

#### Checklist
- [ ] Security headers (CORS, CSP, X-Frame)
- [ ] Rate limiting API
- [ ] Input validation (Zod everywhere)
- [ ] SQL injection prevention (check)
- [ ] XSS prevention (check)
- [ ] CSRF protection (check)

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // ...
];
```

---

### 🟡 [IMPORTANT] Task 3.5: Test Coverage
**Estimé:** 8h | **Priorité:** P2 | **Target:** 70% coverage

#### Checklist
- [ ] Auth tests (signup, signin, logout)
- [ ] Payment tests (webhook, checkout)
- [ ] Course tests (list, enroll)
- [ ] API middleware tests
- [ ] E2E tests (Playwright) × 3 flows

---

## ⏱️ SEMAINE 4 (2-6 Juillet) - LAUNCH PREP & DEPLOYMENT

### 🟠 [URGENT] Task 4.1: Pre-Launch Checklist
**Estimé:** 6h | **Priorité:** P0

#### Checklist
```
Database:
  ☐ All migrations run
  ☐ Seed data loaded
  ☐ Backups configured
  ☐ RLS policies verified

Environment:
  ☐ All .env variables set
  ☐ Secrets in GitHub (not in repo)
  ☐ Staging tested
  ☐ DNS configured

Payments:
  ☐ Stripe keys configured
  ☐ Webhooks verified
  ☐ Test payment successful
  ☐ Refund flow tested

Auth:
  ☐ Signup/login tested
  ☐ Email verification works
  ☐ Password reset works
  ☐ Session timeout configured

Performance:
  ☐ Lighthouse > 80
  ☐ API response time < 200ms
  ☐ Database queries optimized
  ☐ No console errors

Security:
  ☐ npm audit clean
  ☐ No secrets in code
  ☐ SSL certificate valid
  ☐ Headers configured
```

---

### 🟠 [URGENT] Task 4.2: Deployment to Vercel
**Estimé:** 4h | **Priorité:** P0

#### Checklist
- [ ] Vercel project setup
- [ ] Environment variables
- [ ] Database connection string
- [ ] Build test locally
- [ ] Deploy to staging
- [ ] Smoke tests on staging
- [ ] Deploy to production
- [ ] Monitor error rate

```bash
# Vercel deployment
vercel --prod
```

---

### 🟡 [IMPORTANT] Task 4.3: Monitoring & Observability
**Estimé:** 4h | **Priorité:** P2

#### Checklist
- [ ] Sentry project setup
- [ ] Vercel Analytics enabled
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Database monitoring (Supabase alerts)
- [ ] Email delivery tracking (SendGrid)
- [ ] Custom dashboards

---

### 🟡 [IMPORTANT] Task 4.4: Documentation
**Estimé:** 5h | **Priorité:** P2

#### Checklist
- [ ] API docs (OpenAPI/Swagger)
- [ ] Deployment guide
- [ ] Contributing guide
- [ ] Environment setup guide
- [ ] Troubleshooting guide

---

### 🟢 [NICE] Task 4.5: Post-Launch Improvements
**Estimé:** 3h | **Priorité:** P3

#### Checklist
- [ ] Gather user feedback
- [ ] Setup feature requests
- [ ] Analytics review
- [ ] Performance tuning
- [ ] Bug fixes from users

---

## 📅 TIMELINE - GANTT Overview

```
Semaine 1 (11-15 Juin):
  Task 1.1 ████████ [Stripe Webhooks - P0]
  Task 1.2 ██████████ [Admin Dashboard - P0]
  Task 1.3 ██████ [API Format - P0]
  Task 1.4 ████ [Error Handler - P1]
  Task 1.5 ██████ [Tests Setup - P1]

Semaine 2 (18-22 Juin):
  Task 2.1 ████████ [Payment Flow - P0]
  Task 2.2 ██████ [Notifications - P1]
  Task 2.3 ████ [User API - P1]
  Task 2.4 █████ [Dashboard Stats - P1]
  Task 2.5 ████ [React Query - P2]

Semaine 3 (25-29 Juin):
  Task 3.1 ██████ [Auth Enhancement - P1]
  Task 3.2 ████████ [Performance - P2]
  Task 3.3 ████ [SEO - P2]
  Task 3.4 █████ [Security - P2]
  Task 3.5 ████████ [Tests - P2]

Semaine 4 (2-6 Juillet):
  Task 4.1 ██████ [Pre-Launch - P0]
  Task 4.2 ████ [Deploy Vercel - P0]
  Task 4.3 ████ [Monitoring - P2]
  Task 4.4 █████ [Documentation - P2]
  Task 4.5 ███ [Post-Launch - P3]
```

---

## 🎯 DÉFINITION DE "DONE"

### Pour chaque task:
- ✅ Code review approved
- ✅ Tests passing (90%+ coverage)
- ✅ No console errors
- ✅ Performance OK
- ✅ Documentation updated
- ✅ Deployed to staging

### Pour le projet complet:
- ✅ All P0 tasks done
- ✅ P1 tasks done (except optional)
- ✅ Test coverage ≥ 70%
- ✅ Lighthouse ≥ 80
- ✅ 0 critical security issues
- ✅ Database backups working
- ✅ Monitoring configured
- ✅ Team trained

---

## 📊 BURN DOWN & METRICS

### Tracking Progress
```
Weekly velocity: ~25 hours
Total tasks: 25
Total hours: ~100 hours

Week 1: Target 25h → Actual __h → ___% complete
Week 2: Target 25h → Actual __h → ___% complete
Week 3: Target 25h → Actual __h → ___% complete
Week 4: Target 25h → Actual __h → ___% complete
```

### Success Metrics
- [ ] Code coverage ≥ 70%
- [ ] API response time < 200ms
- [ ] Stripe webhook reliability 99.9%
- [ ] Zero critical security vulnerabilities
- [ ] Lighthouse score ≥ 80
- [ ] Database uptime 99.99%

---

## 👥 RESSOURCES REQUISES

### Team
- 1 Full Stack Developer (40h/week)
- 1 DevOps/Infra (10h/week)
- 1 QA/Testing (8h/week)

### Outils
- GitHub (version control)
- Vercel (deployment)
- Supabase (database)
- Sentry (error tracking)
- SendGrid (emails)
- Stripe (payments)

### Budgets
- Vercel Pro: ~$20/month
- Supabase: ~$25/month
- SendGrid: ~$20/month
- Sentry Pro: ~$29/month
- **Total: ~$94/month**

---

## ⚠️ RISQUES & MITIGATION

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|-----------|
| Stripe API latency | High | Medium | Async processing, caching |
| Database performance | High | Low | Index optimization, monitoring |
| Security vulnerabilities | Critical | Low | Security audit, dependencies check |
| Team velocity lower | Medium | Medium | Daily standups, adjust scope |
| Scope creep | High | High | Strict P0/P1/P2 classification |

---

## 🎉 DÉFINITION DE SUCCESS

**Week 1:** ✅ Stripe webhooks working + Admin dashboard MVP  
**Week 2:** ✅ Full payment flow + Notifications system  
**Week 3:** ✅ Performance optimized + 70% test coverage  
**Week 4:** ✅ **LAUNCH TO PRODUCTION** 🚀

---

**Document created by:** Claude Haiku 4.5  
**Date:** 11 Juin 2024  
**Status:** Ready for Implementation
