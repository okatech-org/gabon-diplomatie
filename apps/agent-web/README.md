# agent-web — Portail Agent Consulaire

Interface de travail des agents consulaires (consuls, secrétaires, assistants). Déployé sur **[diplomate.ga](https://diplomate.ga)**.

## Fonctionnalités

- **Dashboard** — Vue d'ensemble des demandes, rendez-vous, statistiques
- **Demandes** — Traitement des demandes consulaires (instruction, validation, rejet)
- **Registre consulaire** — Gestion des profils citoyens inscrits
- **Rendez-vous** — Planning et gestion des créneaux
- **Services** — Configuration des services de l'organisation
- **Paiements** — Suivi des paiements Stripe
- **Publications** — Rédaction d'actualités et tutoriels
- **Statistiques** — Tableaux de bord analytiques
- **Administration** — Gestion de l'organisation (membres, rôles, paramètres)
- **Appels vidéo** — Communication LiveKit avec les citoyens

### Gestion multi-organisation

Les agents peuvent être membres de plusieurs organisations (consulats, ambassades). Un `OrgSwitcher` permet de changer d'organisation active.

## Stack

- **TanStack Start** — SSR + file-based routing
- **Convex** — Backend temps-réel
- **Better Auth** — Authentification multi-domaine
- **Stripe** — Suivi des paiements
- **LiveKit** — Appels vidéo avec les citoyens
- **PostHog** — Analytics

## Développement

```bash
cd apps/agent-web

# Lancer en dev
bun run dev  # → http://localhost:3003

# Build
bun run build

# Lint / Typecheck
bun run lint
bun run typecheck
```

### Variables d'environnement (`apps/agent-web/.env.local`)

```env
VITE_CONVEX_URL=https://acrobatic-mole-132.eu-west-1.convex.cloud
VITE_CONVEX_SITE_URL=https://acrobatic-mole-132.eu-west-1.convex.site
VITE_SITE_URL=http://localhost:3003
VITE_POSTHOG_KEY=phc_xxx
VITE_POSTHOG_HOST=https://eu.i.posthog.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_LIVEKIT_WS_URL=wss://livekit.consulat.ga
VITE_MAPBOX_TOKEN=pk.xxx
VITE_DEV_ACCOUNTS='[...]'
```

## Structure

```
src/
├── routes/
│   ├── __root.tsx           # Layout racine
│   ├── _app.tsx             # Layout protégé (auth + org guard)
│   └── _app/                # Routes protégées
│       ├── index.tsx        # Dashboard
│       ├── requests/        # Demandes
│       ├── consular-registry/
│       ├── appointments/
│       ├── services/
│       ├── payments/
│       ├── posts/
│       ├── stats/
│       └── admin/           # Administration org
├── components/
│   ├── org/                 # Sidebar org, switcher
│   ├── dashboard/           # Vues dashboard
│   ├── meetings/            # Appels vidéo
│   └── ui/                  # Composants locaux
├── hooks/
├── integrations/
├── lib/
└── stores/                  # Zustand stores (meetings)
```

## Déploiement

Automatique via GitHub Actions (`deploy-agent.yml`) au push sur `main`.

- **Service Cloud Run** : `agent-web`
- **Région** : `europe-west1`
- **Domaine** : `diplomate.ga` (+ `www.diplomate.ga` → redirect 301)
- **Dockerfile** : `apps/agent-web/Dockerfile`
- **Port** : 8080

### Deploy manuel

```bash
gh workflow run deploy-agent.yml
```
