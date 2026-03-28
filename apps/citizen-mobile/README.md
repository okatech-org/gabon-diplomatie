# Applications Mobiles — Consulat.ga & Diplomate.ga

Ce document couvre les deux applications mobiles de l'ecosysteme :
- **citizen-mobile** (`apps/citizen-mobile/`) — App citoyen (consulat.ga)
- **agent-mobile** (`apps/agent-mobile/`) — App agent consulaire (diplomate.ga)

Les deux apps sont construites avec **React Native + Expo** et partagent les packages du monorepo.

> **Note :** Il n'y a **pas d'application mobile pour le backoffice** (`admin.consulat.ga`). L'acces au backoffice reste exclusivement web par mesure de securite.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | [React Native](https://reactnative.dev/) via [Expo](https://expo.dev/) SDK 52+ |
| Routing | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based, coherent avec TanStack) |
| UI | [NativeWind](https://www.nativewind.dev/) v5 (Tailwind CSS pour React Native) |
| Backend | [Convex](https://convex.dev/) (meme deploiement que les apps web) |
| Auth | [Better Auth](https://better-auth.com/) + biometrie (Expo SecureStore + LocalAuthentication) |
| Notifications push | [Expo Notifications](https://docs.expo.dev/push-notifications/overview/) (FCM / APNs) |
| Camera / Scanner | [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/) + OCR |
| Geolocalisation | [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/) |
| Stockage securise | [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) |
| Biometrie | [Expo LocalAuthentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/) |
| Video | [LiveKit React Native](https://docs.livekit.io/reference/react-native/) |
| Analytics | [PostHog React Native](https://posthog.com/docs/libraries/react-native) |
| i18n | react-i18next (FR/EN, extensible ES/PT/AR/ZH) |
| Build | [EAS Build](https://docs.expo.dev/build/introduction/) |
| Mises a jour OTA | [Expo Updates](https://docs.expo.dev/versions/latest/sdk/updates/) |
| Distribution | Google Play Store + Apple App Store + EAS Submit |

---

## Architecture du monorepo

```
apps/
├── citizen-mobile/                 # App citoyen (consulat.ga)
│   ├── app/                        # Routes Expo Router (file-based)
│   │   ├── _layout.tsx             # Layout racine (providers, navigation)
│   │   ├── index.tsx               # Ecran d'accueil / redirection
│   │   ├── (auth)/                 # Groupe auth (non authentifie)
│   │   │   ├── sign-in.tsx         # Connexion (OTP, password, OAuth IDN)
│   │   │   └── sign-up.tsx         # Inscription
│   │   ├── (tabs)/                 # Navigation par onglets (authentifie)
│   │   │   ├── _layout.tsx         # Tab navigator
│   │   │   ├── index.tsx           # Dashboard citoyen
│   │   │   ├── requests.tsx        # Mes demandes
│   │   │   ├── appointments.tsx    # Mes rendez-vous
│   │   │   ├── vault.tsx           # Coffre-fort documents
│   │   │   └── profile.tsx         # Mon profil
│   │   ├── requests/
│   │   │   └── [reference].tsx     # Detail d'une demande
│   │   ├── services/
│   │   │   ├── index.tsx           # Catalogue de services
│   │   │   └── [slug].tsx          # Detail d'un service + depot de demande
│   │   ├── appointments/
│   │   │   ├── new.tsx             # Prendre un RDV
│   │   │   └── [id].tsx            # Detail d'un RDV
│   │   ├── news/
│   │   │   ├── index.tsx           # Actualites
│   │   │   └── [slug].tsx          # Article
│   │   ├── orgs/
│   │   │   ├── index.tsx           # Annuaire des representations (carte)
│   │   │   └── [slug].tsx          # Detail d'une representation
│   │   ├── scanner.tsx             # Scanner de documents (camera -> OCR)
│   │   ├── notifications.tsx       # Centre de notifications
│   │   ├── settings.tsx            # Parametres
│   │   └── call.tsx                # Appel video LiveKit
│   ├── components/                 # Composants React Native
│   ├── hooks/                      # Hooks custom
│   ├── lib/                        # Utils, auth client, analytics
│   ├── assets/                     # Images, fonts
│   ├── app.json                    # Config Expo
│   ├── eas.json                    # Config EAS Build
│   ├── package.json
│   └── tsconfig.json
│
├── agent-mobile/                   # App agent (diplomate.ga)
│   ├── app/                        # Routes Expo Router
│   │   ├── _layout.tsx             # Layout racine (providers, biometrie gate)
│   │   ├── index.tsx               # Redirection
│   │   ├── (auth)/
│   │   │   └── sign-in.tsx         # Connexion + MFA obligatoire
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx         # Tab navigator agent
│   │   │   ├── index.tsx           # Dashboard operationnel
│   │   │   ├── requests.tsx        # Demandes a traiter
│   │   │   ├── appointments.tsx    # Planning / RDV
│   │   │   ├── messages.tsx        # Messagerie inter-postes
│   │   │   └── more.tsx            # Plus (equipe, stats, settings)
│   │   ├── requests/
│   │   │   └── [reference].tsx     # Detail + traitement d'une demande
│   │   ├── registry/
│   │   │   └── index.tsx           # Registre consulaire
│   │   ├── scanner.tsx             # Scanner de documents
│   │   ├── call.tsx                # Appel video LiveKit
│   │   └── notifications.tsx       # Notifications
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── assets/
│   ├── app.json
│   ├── eas.json
│   ├── package.json
│   └── tsconfig.json
```

---

## citizen-mobile — App Citoyen

### Fonctionnalites

#### Pages publiques (sans authentification)
- **Catalogue de services** — Liste et detail des services consulaires
- **Annuaire des representations** — Carte interactive + geolocalisation pour trouver la plus proche
- **Actualites** — Communications officielles
- **FAQ** — Questions frequentes

#### Espace citoyen (authentifie)
- **Dashboard** — Resume : demandes en cours, prochains RDV, notifications non lues
- **Mes demandes** — Liste avec filtres (statut, service, date) + detail avec timeline workflow
- **Depot de demande** — Formulaire dynamique + upload documents (camera ou galerie)
- **Rendez-vous** — Calendrier, reservation en ligne, visioconference LiveKit
- **Coffre-fort** — Documents securises (upload, telechargement, partage)
- **Profil** — Informations personnelles, preferences, langue
- **Notifications** — Centre de notifications push + in-app
- **Support** — Tickets avec chat temps reel

#### Fonctionnalites natives mobiles
- **Scanner de documents** — Camera -> cadrage automatique -> OCR -> piece jointe
- **Notifications push** — Nouvelles demandes traitees, rappels RDV, messages
- **Geolocalisation** — Trouver la representation la plus proche
- **Appels video** — LiveKit en mode mobile (citoyen <-> agent)
- **Deep linking** — Liens directs vers demandes et RDV depuis les notifications/emails
- **Mode offline** — Consultation des demandes et documents en cache
- **Biometrie optionnelle** — Face ID / empreinte pour acces rapide

#### Paiements
- Stripe Checkout integre (Apple Pay, Google Pay supportes nativement)
- Historique des paiements
- Recus PDF

---

## agent-mobile — App Agent

### Fonctionnalites

#### Dashboard operationnel
- Stats rapides (demandes en attente, en traitement, terminees)
- Alertes et notifications prioritaires
- Actions rapides (prendre la prochaine demande)

#### Traitement des demandes
- Liste des demandes avec filtres (statut, service, priorite, agent assigne)
- Detail : timeline workflow, documents joints, formulaire rempli, historique
- Actions : changer statut, demander infos complementaires, approuver/rejeter
- Notifications SMS/WhatsApp/Email au citoyen a chaque changement

#### Registre consulaire
- Consultation des inscriptions
- Validation des documents (avec scanner integre)
- Recherche de profils citoyens

#### Messagerie inter-postes
- Messages securises entre representations
- Classification : standard, confidentiel, officiel, urgent
- Pieces jointes
- Notifications push temps reel

#### Planning
- RDV du jour / de la semaine
- Gestion des creneaux
- Rappels automatiques

#### Appels video
- LiveKit mobile (agent <-> citoyen)
- Notification d'appel entrant
- Mode picture-in-picture

#### Scanner de documents
- Camera -> cadrage -> OCR
- Ajout direct comme piece jointe a une demande
- Verification IA des documents (Google Gemini)

### Securite specifique agent-mobile
| Mesure | Detail |
|--------|--------|
| MFA obligatoire | TOTP ou cle FIDO2 a chaque connexion |
| Biometrie obligatoire | Face ID / empreinte pour deverrouiller l'app |
| Timeout court | 15 min d'inactivite -> deverrouillage biometrique |
| Wipe a distance | L'admin peut effacer les donnees locales a distance |
| Sessions auditees | Chaque session mobile enregistree dans le journal d'audit |
| Pas de screenshots | Flag `FLAG_SECURE` (Android) / screenshot prevention (iOS) |

---

## Configuration Expo

### app.json (citizen-mobile)

```json
{
  "expo": {
    "name": "Consulat.ga",
    "slug": "consulat-ga",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "consulat",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#009639"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "ga.consulat.app",
      "infoPlist": {
        "NSCameraUsageDescription": "Scanner des documents pour vos demandes consulaires",
        "NSLocationWhenInUseUsageDescription": "Trouver la representation consulaire la plus proche",
        "NSFaceIDUsageDescription": "Connexion rapide avec Face ID"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#009639"
      },
      "package": "ga.consulat.app",
      "permissions": ["CAMERA", "ACCESS_FINE_LOCATION", "USE_BIOMETRIC"]
    },
    "plugins": [
      "expo-router",
      "expo-camera",
      "expo-location",
      "expo-secure-store",
      "expo-local-authentication",
      "expo-notifications"
    ]
  }
}
```

### app.json (agent-mobile)

```json
{
  "expo": {
    "name": "Diplomate.ga",
    "slug": "diplomate-ga",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "diplomate",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#009639"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "ga.diplomate.app",
      "infoPlist": {
        "NSCameraUsageDescription": "Scanner des documents pour le traitement des demandes",
        "NSFaceIDUsageDescription": "Authentification biometrique obligatoire"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#009639"
      },
      "package": "ga.diplomate.app",
      "permissions": ["CAMERA", "USE_BIOMETRIC", "VIBRATE"]
    },
    "plugins": [
      "expo-router",
      "expo-camera",
      "expo-secure-store",
      "expo-local-authentication",
      "expo-notifications"
    ]
  }
}
```

---

## Packages partages avec les apps web

Les apps mobiles reutilisent les packages du monorepo :

| Package | Usage mobile |
|---------|-------------|
| `@workspace/shared` | Types, constantes, utilitaires (100% reutilisable) |
| `@workspace/i18n` | Traductions FR/EN (reutilisable avec react-i18next) |
| `@workspace/api` | Hooks Convex, provider (a adapter pour React Native) |
| `@workspace/ui` | **Non reutilisable directement** — les composants shadcn/ui sont web-only. Les apps mobiles utilisent NativeWind + composants natifs |

### Partage de logique metier

La logique metier (types, validators, constantes, helpers) est partagee via `@workspace/shared`. Les hooks Convex (`useQuery`, `useMutation`) fonctionnent avec le client Convex React Native. Seule la couche UI est reecrite en composants natifs.

---

## Build & Distribution

```bash
# Setup initial
cd apps/citizen-mobile  # ou apps/agent-mobile
bun install

# Dev (avec Expo Go ou dev client)
bunx expo start

# Build avec EAS
bunx eas build --platform ios
bunx eas build --platform android

# Build local (dev client)
bunx eas build --profile development --platform ios

# Soumission aux stores
bunx eas submit --platform ios
bunx eas submit --platform android

# Mise a jour OTA (sans passer par les stores)
bunx eas update --branch production --message "Fix: correction du scanner"
```

### eas.json

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "dev@okatech.ga", "ascAppId": "xxx" },
      "android": { "serviceAccountKeyPath": "./google-play-key.json" }
    }
  }
}
```

---

## CI/CD (GitHub Actions)

```yaml
name: Build Mobile Apps
on:
  push:
    branches: [main]
    paths:
      - "apps/citizen-mobile/**"
      - "apps/agent-mobile/**"
      - "packages/**"
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [citizen-mobile, agent-mobile]
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: "1.2.17"
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: bun install --frozen-lockfile
      - run: cd apps/${{ matrix.app }} && eas build --platform all --non-interactive --no-wait
```

---

## Variables d'environnement

### citizen-mobile

```env
EXPO_PUBLIC_CONVEX_URL=           # URL Convex
EXPO_PUBLIC_SITE_URL=             # https://consulat.ga
EXPO_PUBLIC_POSTHOG_KEY=          # Cle PostHog
EXPO_PUBLIC_POSTHOG_HOST=         # Host PostHog
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # Cle publique Stripe
EXPO_PUBLIC_LIVEKIT_WS_URL=       # URL WebSocket LiveKit
```

### agent-mobile

```env
EXPO_PUBLIC_CONVEX_URL=           # URL Convex
EXPO_PUBLIC_SITE_URL=             # https://diplomate.ga
EXPO_PUBLIC_POSTHOG_KEY=          # Cle PostHog
EXPO_PUBLIC_POSTHOG_HOST=         # Host PostHog
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # Cle publique Stripe
EXPO_PUBLIC_LIVEKIT_WS_URL=       # URL WebSocket LiveKit
```

> **Note :** Expo utilise le prefixe `EXPO_PUBLIC_` au lieu de `VITE_` pour les variables publiques.

---

## Metriques de succes

| Metrique | Objectif |
|----------|----------|
| Taille de l'app | < 50 MB (citizen), < 40 MB (agent) |
| Temps de demarrage | < 3 secondes |
| Score Play Store | > 4.5 / 5 |
| Score App Store | > 4.5 / 5 |
| Taux de crash | < 0.5% |
| Notifications delivrees | > 95% |
| Temps de scan document | < 5 secondes (cadrage + OCR) |
| Adoption citizen | > 50% des citoyens inscrits installent l'app |
| Adoption agent | > 80% des agents utilisent l'app mobile |

---

## Plan d'implementation

### Phase 1 — Setup Expo + navigation de base

#### citizen-mobile
- [ ] Initialiser le projet Expo dans le monorepo
- [ ] Configurer Expo Router (file-based routing)
- [ ] Configurer NativeWind v5 (Tailwind pour React Native)
- [ ] Integrer le client Convex React Native
- [ ] Ecrans de base : splash, sign-in, tabs layout
- [ ] Configurer EAS Build (dev client)

#### agent-mobile
- [ ] Initialiser le projet Expo
- [ ] Configurer Expo Router + NativeWind
- [ ] Integrer Convex
- [ ] Ecrans de base : splash, sign-in (avec MFA), tabs layout
- [ ] Gate biometrique au demarrage

### Phase 2 — Authentification

#### citizen-mobile
- [ ] Connexion OTP email/SMS
- [ ] Connexion mot de passe
- [ ] OAuth IDN
- [ ] Biometrie optionnelle (Face ID / empreinte) via Expo SecureStore
- [ ] Gestion de session (token stocke dans SecureStore)

#### agent-mobile
- [ ] Connexion avec MFA obligatoire (TOTP)
- [ ] Biometrie obligatoire apres connexion
- [ ] Timeout de session 15 min
- [ ] Flag FLAG_SECURE (pas de screenshots)

### Phase 3 — Fonctionnalites citoyen (citizen-mobile)
- [ ] Dashboard citoyen (demandes en cours, RDV, notifications)
- [ ] Catalogue de services + depot de demande
- [ ] Mes demandes (liste + detail avec timeline)
- [ ] Rendez-vous (liste + prise de RDV)
- [ ] Coffre-fort documents
- [ ] Profil + parametres
- [ ] Notifications push (Expo Notifications + FCM/APNs)
- [ ] Deep linking depuis emails et notifications

### Phase 4 — Fonctionnalites agent (agent-mobile)
- [ ] Dashboard operationnel (stats, alertes, actions rapides)
- [ ] Liste des demandes a traiter + detail + actions
- [ ] Planning des RDV
- [ ] Registre consulaire (consultation)
- [ ] Messagerie inter-postes
- [ ] Notifications push prioritaires

### Phase 5 — Fonctionnalites natives partagees
- [ ] Scanner de documents (camera -> cadrage auto -> OCR)
- [ ] Appels video LiveKit (mode mobile)
- [ ] Geolocalisation (citizen : trouver la representation la plus proche)
- [ ] Mode offline (cache local + consultation hors ligne)
- [ ] Paiements (citizen : Stripe + Apple Pay / Google Pay)

### Phase 6 — Publication
- [ ] Tests sur appareils reels (Samsung, iPhone, Huawei, Pixel)
- [ ] Tests d'accessibilite mobile
- [ ] Assets stores (screenshots, descriptions, fiches)
- [ ] Soumission Google Play Store (citizen + agent)
- [ ] Soumission Apple App Store (citizen + agent)
- [ ] Configuration des mises a jour OTA (Expo Updates)
- [ ] Monitoring crash (Sentry ou equivalent)

### Phase 7 — Optimisation
- [ ] Performance (temps de demarrage, animations, listes longues)
- [ ] Taille de l'app (tree shaking, lazy loading)
- [ ] i18n complet (FR/EN + ES/PT si necessaire)
- [ ] Widget rapide (Android : resume demandes, iOS : widget)
- [ ] Apple Watch / Wear OS (notifications uniquement, optionnel)
