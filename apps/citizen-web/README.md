# citizen-web — Portail Citoyen

Portail public et espace personnel des citoyens gabonais. Déployé sur **[consulat.ga](https://consulat.ga)**.

## Fonctionnalités

### Pages publiques (accès libre)
- **Accueil** (`/`) — Landing page avec carte mondiale des représentations, services populaires, profils
- **Services** (`/services`, `/services/$slug`) — Catalogue des services consulaires
- **Réseau mondial** (`/orgs`) — Ambassades et consulats avec carte interactive (Mapbox)
- **Actualités** (`/news`, `/news/$slug`) — Communications officielles
- **Académie** (`/academy`, `/academy/$slug`) — Guides et tutoriels vidéo
- **Information** (`/information`) — Informations pratiques
- **Communauté** (`/community`, `/community/$slug`) — Événements communautaires
- **FAQ** (`/faq`) — Questions fréquentes

### Espace citoyen protégé (`/my-space/*`)
- **Dashboard** (`/my-space`) — Vue d'ensemble (demandes en cours, carte consulaire, RDV)
- **iProfil** (`/my-space/profile`) — Profil personnel
- **iCV** (`/my-space/cv`) — CV consulaire numérique
- **Coffre-fort** (`/my-space/vault`) — Documents sécurisés
- **iBoîte** (`/my-space/iboite`) — Messagerie
- **Catalogue** (`/my-space/catalogue`) — Démarches disponibles
- **Mes demandes** (`/my-space/requests/*`) — Suivi des demandes avec prise de RDV
- **Rendez-vous** (`/my-space/appointments/*`) — Gestion des rendez-vous (FullCalendar)
- **Entreprises** (`/my-space/companies`) — Registre des entreprises
- **Associations** (`/my-space/associations`) — Associations
- **Support** (`/my-space/support`) — Aide et support
- **Paramètres** (`/my-space/settings`) — Préférences

### Auth
- Connexion (`/sign-in`) — OTP email/SMS, mot de passe, OAuth IDN
- Inscription (`/sign-up`, `/register`) — Création de compte + profil citoyen

## Stack

- **TanStack Start** — SSR + file-based routing
- **Convex** — Backend temps-réel
- **Better Auth** — Authentification multi-domaine
- **Stripe** — Paiements en ligne
- **LiveKit** — Appels vidéo avec les agents
- **Mapbox GL** — Carte mondiale des représentations
- **FullCalendar** — Calendrier de rendez-vous
- **motion** — Animations
- **PostHog** — Analytics

## Développement

```bash
# Depuis la racine du monorepo
cd apps/citizen-web

# Lancer en dev
bun run dev  # → http://localhost:3000

# Build
bun run build

# Lint
bun run lint

# Typecheck
bun run typecheck
```

### Variables d'environnement (`apps/citizen-web/.env.local`)

```env
VITE_CONVEX_URL=https://acrobatic-mole-132.eu-west-1.convex.cloud
VITE_CONVEX_SITE_URL=https://acrobatic-mole-132.eu-west-1.convex.site
VITE_SITE_URL=http://consulat.local:3000
VITE_POSTHOG_KEY=phc_xxx
VITE_POSTHOG_HOST=https://eu.i.posthog.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_LIVEKIT_WS_URL=wss://livekit.consulat.ga
VITE_MAPBOX_TOKEN=pk.xxx
VITE_DEV_ACCOUNTS='[...]'   # Comptes de test (dev uniquement)
```

## Structure

```
src/
├── routes/
│   ├── __root.tsx              # Layout racine (providers, shell)
│   ├── index.tsx               # Page d'accueil
│   ├── sign-in.tsx / sign-up.tsx
│   ├── my-space.tsx            # Layout protégé (auth guard)
│   ├── my-space/               # Routes protégées
│   ├── academy/ news/ orgs/    # Routes publiques
│   └── services/
├── components/
│   ├── home/                   # Sections landing page
│   ├── my-space/               # Sidebar, mobile nav
│   ├── ai/                     # Assistant IA, chat
│   ├── meetings/               # Appels vidéo LiveKit
│   ├── auth/                   # Formulaires auth
│   ├── registration/           # Inscription citoyen (multi-étapes)
│   ├── documents/              # Gestion documents
│   ├── cv/                     # CV consulaire
│   └── ui/                     # Composants UI locaux (non partagés)
├── hooks/                      # Hooks custom
├── integrations/
│   ├── convex/                 # Bridge hooks Convex
│   └── posthog/                # Provider + pageview tracker
├── lib/                        # Auth client/server, utils
├── config/                     # Config Mapbox
└── assets/                     # Images, icônes
```

## Déploiement

Automatique via GitHub Actions (`deploy-citizen.yml`) au push sur `main`.

- **Service Cloud Run** : `citizen-web`
- **Région** : `europe-west1`
- **Domaine** : `consulat.ga`
- **Dockerfile** : `apps/citizen-web/Dockerfile` (multi-stage Bun)
- **Port** : 8080 (production)

### Deploy manuel

```bash
gh workflow run deploy-citizen.yml
```
