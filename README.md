# PIDA Marketplace - Plateforme de Formation Moderne

Une **marketplace de formation avancée** construite avec Next.js 14, TypeScript, Tailwind CSS, Supabase et Stripe. Conception moderne avec authentification complète, gestion des cours et paiements intégrés.

## 🎯 Caractéristiques Principales

### 🎨 **Landing Page Moderne**
- Hero section avec animations Framer Motion
- Présentation des features et statistiques
- Call-to-action optimisés
- Design responsive et accessible

### 🔐 **Authentification Avancée**
- Inscription et connexion par email
- Réinitialisation de mot de passe
- Gestion de session avec Supabase Auth
- Context React pour l'état utilisateur

### 📚 **Marketplace de Cours**
- Catalogue de cours avec filtres avancés
- Cartes de cours animées
- Recherche en temps réel
- Classifications par niveau et catégorie
- Détails complets des cours

### 💳 **Paiement Stripe**
- Intégration checkout Stripe
- Gestion des paiements
- Historique des transactions

### 📊 **Tableau de Bord Utilisateur**
- Statistiques d'apprentissage
- Courses en cours
- Progrès et certificats
- Paramètres utilisateur

## 📁 Structure du Projet

```
app/
├── (auth)/                    # Groupe de pages d'authentification
│   ├── login/
│   ├── signup/
│   └── forgot-password/
├── (marketplace)/             # Groupe de pages publiques
│   ├── page.tsx              # Landing page
│   └── courses/
├── (dashboard)/              # Groupe des pages du dashboard
│   ├── layout.tsx
│   ├── page.tsx
│   ├── courses/
│   ├── progress/
│   └── settings/
├── api/
│   ├── auth/
│   │   ├── signup/
│   │   └── signin/
│   ├── courses/
│   └── stripe/
│       └── checkout/
└── layout.tsx

components/
├── ui/                        # Composants atomiques
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   └── Toast.tsx
├── dashboard/
│   └── Sidebar.tsx
├── marketplace/
│   ├── Navbar.tsx
│   ├── CourseCard.tsx
│   └── CourseFilters.tsx
├── SignInForm.tsx
├── SignUpForm.tsx
├── LandingPage.tsx
├── Navbar.tsx
├── Footer.tsx
└── ...

lib/
├── supabase/
│   └── client.ts
├── auth/
│   └── auth.ts
├── api/
└── utils.ts

context/
└── AuthContext.tsx

hooks/
└── (custom hooks)

types/
└── index.ts

styles/
└── globals.css
```

## 🚀 Installation & Configuration

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Supabase
- Clés Stripe

### Étapes d'installation

```bash
# Cloner le projet
git clone <repo>
cd pida-app

# Installer les dépendances
npm install

# Créer le fichier .env.local
cp .env.example .env.local

# Remplir les variables d'environnement
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - STRIPE_SECRET_KEY
# - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Lancer le serveur de développement
npm run dev
```

L'application sera disponible à `http://localhost:3000`

## 🔧 Configuration Supabase

### 1. Créer une organisation et un projet
- Allez sur [Supabase](https://supabase.com)
- Créez un nouveau projet

### 2. Exécuter le schéma SQL
```bash
# Copiez le contenu de supabase/schema.sql
# Dans Supabase → SQL Editor → Create New
# Exécutez le script
```

### 3. Récupérer les credentials
- Settings → API
- Copiez `Project URL` et `anon key`
- Ajoutez-les à `.env.local`

## 💳 Configuration Stripe

### 1. Créer un compte Stripe
- Allez sur [Stripe Dashboard](https://dashboard.stripe.com)
- Récupérez vos clés API (test mode d'abord)

### 2. Ajouter les clés
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 📧 Configuration Email

### Option 1: Resend
```env
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@pida.com
```

### Option 2: SMTP (Gmail, Outlook, etc.)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre@email.com
SMTP_PASS=votre_password_app
EMAIL_FROM=noreply@pida.com
```

## 🎨 Composants Disponibles

### UI Components
- **Button** - Variantes: primary, secondary, outline, ghost
- **Input** - Avec validation et messages d'erreur
- **Card** - Conteneur avec hover effect
- **Toast** - Notifications

### Marketplace Components
- **CourseCard** - Carte de cours avec animations
- **CourseFilters** - Filtrage par niveau et catégorie
- **Navbar** - Navigation principale

### Auth Components
- **SignUpForm** - Formulaire d'inscription
- **SignInForm** - Formulaire de connexion

## 🔒 Authentification & Security

- Auth géré par Supabase
- Row Level Security (RLS) activé
- Context React pour l'état utilisateur
- Protection des routes sensibles

## 📊 API Routes

### Authentication
- `POST /api/auth/signup` - Inscription
- `POST /api/auth/signin` - Connexion

### Courses
- `GET /api/courses` - Lister les cours
- `POST /api/courses` - Créer un cours (admin)

### Stripe
- `POST /api/stripe/checkout` - Créer une session checkout

## 🎯 Prochaines Étapes

- [ ] Implémenter les détails des cours
- [ ] Intégrer le lecteur vidéo
- [ ] Ajouter le système de commentaires
- [ ] Certification utilisateur
- [ ] Admin panel complet
- [ ] Recherche full-text
- [ ] Recommandations IA

## 📚 Technologies Utilisées

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Payment**: Stripe
- **Forms**: React Hook Form + Zod
- **State**: Zustand, React Context
- **Notifications**: React Hot Toast

## 📝 Scripts

```bash
npm run dev          # Développement
npm run build        # Build production
npm run start        # Démarrer production
npm run lint         # Linter
npm run type-check   # Vérifier les types
```

## 🤝 Contributing

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir des issues ou pull requests.

## 📄 License

MIT

---

**Besoin d'aide ?** Consultez la [documentation Next.js](https://nextjs.org/docs) ou [Supabase](https://supabase.com/docs)
