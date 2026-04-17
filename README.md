# Power Inside Data Academy — Next.js Landing

Projet reformaté en Next.js App Router avec TypeScript, Tailwind, Framer Motion et un formulaire connecté.

## Structure

- `/app` : pages App Router
- `/components` : composants réutilisables
- `/lib` : logique email et validations
- `/styles` : CSS global
- `/types` : types partagés
- `/app/api/contact/route.ts` : API route pour l'envoi du formulaire

## Installation

```bash
npm install
npm run dev
```

## Configuration email

Ajoutez un fichier `.env.local` avec l'une des options suivantes :

### Resend

```env
RESEND_API_KEY=prod_xxx
EMAIL_FROM=hello@votredomaine.com
EMAIL_TO=contact@votredomaine.com
```

### SMTP

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=utilisateur@example.com
SMTP_PASS=motdepasse
EMAIL_FROM=hello@votredomaine.com
EMAIL_TO=contact@votredomaine.com
```

## Points clés

- React Hook Form + Zod
- API route Next.js
- Tailwind + animations Framer Motion
- Page contact dédiée
- SEO via `app/layout.tsx`
