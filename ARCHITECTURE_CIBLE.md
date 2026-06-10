# 🏗️ ARCHITECTURE CIBLE PROFESSIONNELLE
## Power Inside Data Academy - Réfactorisation & Modernisation

---

## 📐 ARCHITECTURE LAYERS

### Layer 1: Presentation (UI)
```
Next.js Pages
  ├── (auth)         → Sign in / Sign up / Forgot Password
  ├── (marketplace)  → Landing / Courses / Course Details
  ├── (dashboard)    → User Dashboard / Progress / Settings
  ├── (admin)        → Admin Dashboard / Management
  └── (public)       → Pricing / FAQ / Contact

React Components
  ├── Pages/         → Page-level components
  ├── Features/      → Feature-specific components
  ├── Common/        → Shared components (Navbar, Footer)
  └── UI/            → Atomic components (Button, Input, Card)

State Management
  ├── React Context  → Auth state
  ├── React Query    → Server state
  └── Zustand        → Client state (optional)
```

### Layer 2: Business Logic
```
lib/
├── api/            → API client & interceptors
├── auth/           → Authentication logic
├── courses/        → Course business logic
├── payments/       → Payment processing
├── emails/         → Email templates & sending
├── validators/     → Zod schemas
└── utils/          → Utility functions

hooks/
├── useAuth()       → Auth context
├── useUser()       → Current user
├── useCourse()     → Course data
└── usePayment()    → Payment logic
```

### Layer 3: Data Access
```
Database Access
├── Supabase Client → Direct DB queries
├── Types           → Database types (auto-generated)
└── Queries         → SQL queries

External Services
├── Stripe API      → Payments
├── SendGrid API    → Emails
└── Other APIs      → Third-party integrations
```

### Layer 4: Infrastructure
```
Database
├── PostgreSQL      → Data storage
├── Redis           → Caching
└── S3/CDN          → Media storage

Monitoring
├── Sentry          → Error tracking
├── Vercel Analytics → Performance
└── Custom Logging  → Application logs

Deployment
├── Vercel          → Frontend/API hosting
├── Supabase Cloud  → Database
└── GitHub          → Version control
```

---

## 🔄 API STANDARDIZATION

### Current State (Inconsistent)
```typescript
// Different endpoints return different formats
GET /api/courses
→ { courses: Array }

GET /api/auth/signin
→ { user: User }

POST /api/stripe/checkout
→ { sessionId: string }
```

### Target State (Consistent)
```typescript
// Standard response wrapper
interface APIResponse<T> {
  success: boolean
  data?: T
  error?: APIError
  meta: {
    timestamp: string
    requestId: string
  }
}

interface APIError {
  code: string       // 'VALIDATION_ERROR', 'UNAUTHORIZED', etc.
  message: string
  details?: Record<string, any>
  hint?: string
}

// Usage
GET /api/courses
→ {
    "success": true,
    "data": { courses: Array },
    "meta": { timestamp: "2024-01-01T00:00:00Z", requestId: "uuid" }
  }

POST /api/stripe/webhook
→ {
    "success": false,
    "error": {
      "code": "INVALID_SIGNATURE",
      "message": "Webhook signature invalid",
      "hint": "Check your signing secret"
    }
  }
```

### Implementation Pattern
```typescript
// lib/api/handlers.ts
export const handleSuccess = <T>(data: T, statusCode = 200) => {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: randomUUID(),
      },
    },
    { status: statusCode }
  );
};

export const handleError = (error: AppError) => {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    },
    { status: error.statusCode }
  );
};

// route.ts usage
try {
  const courses = await db.query(/*...*/);
  return handleSuccess(courses);
} catch (error) {
  if (error instanceof AppError) {
    return handleError(error);
  }
  return handleError(new AppError('INTERNAL_ERROR', 'Something went wrong', 500));
}
```

---

## 🔐 AUTHENTICATION FLOW - RECOMMENDED

### Current Issues
```
❌ No refresh token management visible
❌ No session timeout
❌ No 2FA support
❌ No OAuth providers
```

### Target Architecture
```
┌─────────────────────┐
│  User Registration  │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────┐
│  Email Verification      │
│  (Optional Magic Link)   │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  Create User in Auth     │
│  Create Profile Record   │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  Generate Tokens         │
│  Access Token (15 min)   │
│  Refresh Token (30 days) │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  Store in Secure Cookie  │
│  HttpOnly + Secure       │
└──────────────────────────┘
```

### Implementation
```typescript
// lib/auth/tokens.ts
interface TokenPayload {
  sub: string       // user ID
  iat: number       // issued at
  exp: number       // expiration
  role: string      // user role
}

export const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { sub: userId, role: 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { sub: userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};

// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;

  if (!token) {
    // Try refresh token
    const refreshToken = request.cookies.get('refreshToken')?.value;
    if (refreshToken) {
      // Generate new access token
      // Update cookies
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/(.*)', '/dashboard(.*)'],
};
```

---

## 📊 DATABASE IMPROVEMENTS

### Missing Tables
```sql
-- Payments (Critical)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  formation_id UUID REFERENCES formations(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'pending', -- pending, completed, failed
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) NOT NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  pdf_url TEXT,
  issued_at DATE,
  due_at DATE,
  status TEXT DEFAULT 'issued', -- issued, paid, overdue
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions (Future)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  plan TEXT NOT NULL, -- 'free', 'pro', 'annual'
  status TEXT DEFAULT 'active', -- active, cancelled, expired
  stripe_subscription_id TEXT UNIQUE,
  billing_cycle_start DATE,
  billing_cycle_end DATE,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  canceled_at TIMESTAMPTZ
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  entity_type TEXT NOT NULL, -- 'formation', 'user', etc.
  entity_id UUID,
  changes JSONB, -- before/after
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_enrollments_formation_id ON enrollments(formation_id);
CREATE INDEX idx_reviews_formation_id ON reviews(formation_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

### RLS Policies Enhancement
```sql
-- Admin-only access
CREATE POLICY "admin_full_access"
  ON formations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Instructor can only edit own formations
CREATE POLICY "instructor_own_formations"
  ON formations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM formation_instructors fi
      JOIN profiles p ON p.id = auth.uid()
      WHERE fi.formation_id = formations.id
      AND p.role = 'instructor'
    )
  );

-- Rate limiting (via function)
CREATE OR REPLACE FUNCTION check_rate_limit()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user exceeded API calls
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🛡️ ERROR HANDLING ARCHITECTURE

### Current (Inconsistent)
```typescript
try {
  const data = await fetch('/api/courses');
  const json = await data.json();
  setError(json.message);
} catch (err) {
  setError(err.message);
}
```

### Target (Centralized)
```typescript
// lib/errors/AppError.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>,
    public hint?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// lib/errors/errorHandler.ts
export function handleAPIError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new AppError(
      'VALIDATION_ERROR',
      'Validation failed',
      400,
      error.flatten().fieldErrors
    );
  }

  if (error instanceof Error) {
    console.error('Unhandled error:', error);
    return new AppError('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }

  return new AppError('UNKNOWN_ERROR', 'Unknown error', 500);
}

// Middleware usage
export async function errorHandler(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      const appError = handleAPIError(error);
      logger.error({
        code: appError.code,
        message: appError.message,
        path: req.nextUrl.pathname,
      });
      return handleError(appError);
    }
  };
}
```

---

## 🚀 PERFORMANCE OPTIMIZATION

### Caching Strategy
```typescript
// lib/cache/strategy.ts
enum CacheDuration {
  SHORT = 5 * 60,      // 5 minutes
  MEDIUM = 30 * 60,    // 30 minutes
  LONG = 24 * 60 * 60, // 24 hours
}

// React Query configuration
export const queryConfig = {
  courses: {
    staleTime: CacheDuration.MEDIUM,
    cacheTime: CacheDuration.LONG,
    refetchOnWindowFocus: false,
  },
  user: {
    staleTime: CacheDuration.SHORT,
    cacheTime: CacheDuration.MEDIUM,
    refetchInterval: CacheDuration.SHORT,
  },
  reviews: {
    staleTime: CacheDuration.LONG,
    cacheTime: CacheDuration.LONG,
  },
};

// Redis invalidation
export async function invalidateCache(keys: string[]) {
  await redis.del(...keys);
}

// On POST (create/update)
try {
  const result = await createCourse(data);
  await invalidateCache(['courses', 'courses-list']);
  return handleSuccess(result, 201);
} catch (error) {
  // ...
}
```

### Image Optimization
```typescript
// components/OptimizedImage.tsx
import Image from 'next/image';

export function OptimizedImage({ src, alt, ...props }) {
  return (
    <Image
      src={src}
      alt={alt}
      quality={80}
      placeholder="blur"
      blurDataURL={generateBlurHash(src)}
      {...props}
    />
  );
}
```

### Code Splitting
```typescript
// app/layout.tsx
import dynamic from 'next/dynamic';

const AdminPanel = dynamic(() => import('@/components/AdminPanel'), {
  loading: () => <div>Loading...</div>,
  ssr: false,
});

// Only loaded when needed
```

---

## 📧 EMAIL NOTIFICATIONS

### Architecture
```typescript
// lib/emails/templates.ts
export const emailTemplates = {
  welcome: (user: User) => ({
    subject: `Bienvenue ${user.prenom}!`,
    html: `...`,
  }),
  confirmPayment: (payment: Payment) => ({
    subject: 'Confirmation de paiement',
    html: `...`,
  }),
  certificate: (enrollment: Enrollment) => ({
    subject: 'Certificat de formation',
    html: `...`,
  }),
};

// lib/emails/send.ts
import { Resend } from 'resend'; // or SendGrid

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  template,
  variables,
}: {
  to: string;
  template: keyof typeof emailTemplates;
  variables: any;
}) {
  const emailContent = emailTemplates[template](variables);

  return resend.emails.send({
    from: 'noreply@pida.com',
    to,
    ...emailContent,
  });
}

// Usage in API
POST /api/auth/signup
  → await sendEmail({ to: email, template: 'welcome', variables: user })
```

### Event-Driven Emails
```typescript
// lib/events/emitter.ts
export const emailEvents = {
  'user.registered': async (user: User) => {
    await sendEmail({ to: user.email, template: 'welcome', variables: user });
  },
  'payment.completed': async (payment: Payment) => {
    await sendEmail({
      to: payment.user.email,
      template: 'confirmPayment',
      variables: payment,
    });
  },
  'enrollment.completed': async (enrollment: Enrollment) => {
    await sendEmail({
      to: enrollment.user.email,
      template: 'certificate',
      variables: enrollment,
    });
  },
};

// Trigger
emitter.emit('user.registered', newUser);
```

---

## 🧪 TESTING STRATEGY

### Unit Tests (Jest)
```typescript
// __tests__/lib/auth/tokens.test.ts
describe('generateTokens', () => {
  it('should generate valid JWT tokens', () => {
    const tokens = generateTokens('user-123');
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
  });

  it('should have correct expiration times', () => {
    const tokens = generateTokens('user-123');
    const decoded = jwt.decode(tokens.accessToken);
    expect(decoded.exp - decoded.iat).toBe(15 * 60); // 15 minutes
  });
});
```

### Integration Tests (Supertest)
```typescript
// __tests__/api/auth.test.ts
describe('POST /api/auth/signup', () => {
  it('should create user and return tokens', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'SecurePassword123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('test@example.com');
  });

  it('should validate email format', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'invalid-email',
        password: 'Password123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

### E2E Tests (Playwright)
```typescript
// e2e/auth.spec.ts
test.describe('Authentication Flow', () => {
  test('should sign up and log in user', async ({ page }) => {
    // Sign up
    await page.goto('/auth/signup');
    await page.fill('input[name=email]', 'test@example.com');
    await page.fill('input[name=password]', 'SecurePassword123!');
    await page.click('button[type=submit]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });
});
```

---

## 📊 MONITORING & OBSERVABILITY

### Logging
```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

// Usage
logger.info({ userId: '123' }, 'User logged in');
logger.error({ error }, 'Failed to process payment');
```

### Error Tracking (Sentry)
```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Automatic error capture
// Manual capture
Sentry.captureException(error);
Sentry.captureMessage('Something interesting happened', 'info');
```

### Performance Monitoring
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

## 🔄 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All tests passing (80% coverage)
- [ ] No console errors in production build
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting activated
- [ ] Backups configured

### Deployment
- [ ] Deploy to staging first
- [ ] Smoke tests on staging
- [ ] Run security scan
- [ ] Performance testing
- [ ] Deploy to production
- [ ] Monitor error rates
- [ ] Check all critical flows

### Post-Deployment
- [ ] Verify all features working
- [ ] Check error tracking (Sentry)
- [ ] Review logs
- [ ] Monitor performance metrics
- [ ] Collect user feedback

---

**Version:** 1.0  
**Last Updated:** June 2024  
**Status:** Recommended Implementation
