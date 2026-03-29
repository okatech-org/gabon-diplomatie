# Agent Desktop — Specifications & Plan de Developpement

> Application desktop Electron pour les agents consulaires du Gabon.
> Portail agent complet + Card Designer + Impression Evolis Primacy 2.

---

## 1. Vue d'ensemble

### 1.1 Objectif

Une application desktop cross-platform (macOS, Windows, Linux) qui regroupe :

- Le **portail agent** complet (traitement des demandes, registre consulaire, RDV, equipe, stats)
- Un **card designer** visuel pour creer des templates de cartes consulaires (CR80)
- L'**impression** de cartes via imprimante Evolis Primacy 2 (SDK C natif)
- Le **mode offline** avec cache local et synchronisation
- Les **notifications natives**, la gestion de **licences** et l'**auto-update**

### 1.2 Stack technique

| Composant | Technologie |
|---|---|
| Framework desktop | Electron |
| Build tool | electron-vite |
| Packaging | electron-builder |
| Renderer | React 19 + Vite + Tailwind v4 |
| Routing | TanStack Router (SPA) |
| Backend | Convex (temps reel) |
| Auth | Better Auth (OAuth via main process) |
| UI | @workspace/ui (shadcn/ui) |
| i18n | @workspace/i18n (FR/EN) |
| SDK imprimante | Evolis C SDK via node-addon-api (N-API) |
| DB locale | better-sqlite3 |
| State local | Zustand (card designer) |
| Auto-update | electron-updater |

### 1.3 Plateformes cibles

| OS | Format | Architecture |
|---|---|---|
| macOS | `.dmg` | arm64 + x86_64 (universal) |
| Windows | `.exe` (NSIS) | x86_64 |
| Linux | `.AppImage` + `.deb` | x86_64 |

---

## 2. Architecture

### 2.1 Processus Electron

```
┌─────────────────────────────────────────────────────────┐
│                    MAIN PROCESS (Node.js)                │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐ │
│  │ Printer  │  │ Offline  │  │ Services               │ │
│  │ Service  │  │ Service  │  │ - Auth (safeStorage)   │ │
│  │ (N-API)  │  │ (SQLite) │  │ - License              │ │
│  │          │  │          │  │ - Updater              │ │
│  │ evolis   │  │ better-  │  │ - Notifications        │ │
│  │ addon    │  │ sqlite3  │  │                        │ │
│  └────┬─────┘  └────┬─────┘  └────────────┬───────────┘ │
│       │             │                     │             │
│       └─────────────┼─────────────────────┘             │
│                     │  IPC (typed channels)             │
├─────────────────────┼───────────────────────────────────┤
│              PRELOAD │ (contextBridge)                   │
│              window.desktopApi                          │
├─────────────────────┼───────────────────────────────────┤
│              RENDERER (Chromium)                        │
│                     │                                   │
│  ┌──────────────────▼──────────────────────────────┐    │
│  │  React 19 + TanStack Router                     │    │
│  │                                                 │    │
│  │  ┌──────────────┐  ┌─────────────┐              │    │
│  │  │ Portail Agent │  │ Card        │              │    │
│  │  │ (agent-web   │  │ Designer    │              │    │
│  │  │  composants) │  │ (Canvas)    │              │    │
│  │  └──────────────┘  └─────────────┘              │    │
│  │  ┌──────────────┐  ┌─────────────┐              │    │
│  │  │ Print Queue  │  │ Offline     │              │    │
│  │  │              │  │ Indicator   │              │    │
│  │  └──────────────┘  └─────────────┘              │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Structure du projet

```
apps/agent-desktop/
├── package.json
├── electron.vite.config.ts
├── electron-builder.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── src/
│   ├── main/                           # Main process (Node.js)
│   │   ├── index.ts                    # Entry, BrowserWindow, menu
│   │   ├── ipc/
│   │   │   ├── printer.ipc.ts          # Handlers IPC imprimante
│   │   │   ├── license.ipc.ts          # Handlers IPC licence
│   │   │   ├── offline.ipc.ts          # Handlers IPC offline/sync
│   │   │   └── system.ipc.ts           # Notifications, update, systeme
│   │   ├── services/
│   │   │   ├── printer.service.ts      # Wrapper TS autour de l'addon N-API
│   │   │   ├── license.service.ts      # Verification JWT + machine ID
│   │   │   ├── offline.service.ts      # Sync Convex → SQLite
│   │   │   ├── updater.service.ts      # electron-updater
│   │   │   └── notification.service.ts # Notifications OS natives
│   │   └── native/
│   │       └── evolis-addon/           # Addon N-API pour SDK C Evolis
│   │           ├── binding.gyp
│   │           ├── src/
│   │           │   └── evolis_binding.cpp
│   │           └── index.ts            # Exports types du module natif
│   ├── preload/
│   │   ├── index.ts                    # contextBridge → window.desktopApi
│   │   └── api.d.ts                    # Types pour le renderer
│   └── renderer/
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── router.tsx              # TanStack Router config
│           ├── routes/
│           │   ├── __root.tsx          # Layout racine (providers)
│           │   ├── _app.tsx            # Layout authentifie (sidebar)
│           │   ├── _app/              # Pages portail agent
│           │   ├── card-designer/     # Pages card designer
│           │   └── print-queue/       # Pages file d'impression
│           ├── features/
│           │   ├── card-designer/     # Canvas, elements, layers, export
│           │   ├── print-queue/       # Queue, status, batch
│           │   └── offline/           # Indicateur, fallback hooks
│           └── hooks/
│               ├── usePrinter.ts
│               ├── useOffline.ts
│               └── useDesktopApi.ts
├── ressources/                         # SDK Evolis (deja present)
│   └── evolis-sdk/
│       ├── include/evolis/             # Headers C (10 fichiers)
│       ├── macos/lib/libevolis.dylib   # macOS universal
│       ├── windows-x86_64/lib/         # evolis.dll + evolis.lib
│       └── linux-x86_64/lib/           # libevolis.so
└── build/
    └── icons/                          # Icones app par plateforme

packages/desktop-shared/                # Nouveau package partage
├── package.json                        # @workspace/desktop-shared
└── src/
    ├── ipc-channels.ts                 # Noms de channels + payloads types
    ├── printer-types.ts                # PrintJob, PrinterStatus, etc.
    ├── card-types.ts                   # CardTemplate, CardElement
    └── offline-types.ts                # SyncState, CacheEntry, etc.
```

### 2.3 Partage de code avec agent-web

| Tier | Source | Methode |
|---|---|---|
| Packages workspace | `@workspace/ui`, `@workspace/api`, `@workspace/i18n`, `@workspace/shared` | Import direct (identique a agent-web) |
| Composants agent-web | Sidebar, pages, composants admin | Alias Vite `@agent-web` → `../agent-web/src` |
| Code desktop-only | Card designer, print queue, offline | Dans `apps/agent-desktop/src/renderer/src/features/` |

### 2.4 IPC Architecture

Tous les channels et payloads sont definis dans `@workspace/desktop-shared` pour un typage complet main ↔ renderer.

**Preload** : `contextBridge.exposeInMainWorld('desktopApi', { ... })` cree un objet `window.desktopApi` type.

**Channels** :

| Categorie | Channels | Direction |
|---|---|---|
| Imprimante | `printer:list-devices`, `printer:connect`, `printer:disconnect`, `printer:get-info`, `printer:get-ribbon`, `printer:get-status`, `printer:print`, `printer:print-duplex` | invoke (renderer → main) |
| Print Queue | `print-queue:add`, `print-queue:cancel`, `print-queue:progress` | invoke + subscription |
| Encodage | `mag:write`, `mag:read`, `nfc:write`, `nfc:read` | invoke |
| Offline | `offline:status`, `offline:sync`, `offline:query` | invoke + subscription |
| Licence | `license:verify`, `license:status` | invoke |
| Systeme | `system:notify`, `system:check-update`, `system:install-update` | invoke |
| Auth | `auth:login`, `auth:logout`, `auth:get-token` | invoke |

---

## 3. Integration SDK Evolis (N-API Addon)

### 3.1 Pourquoi node-addon-api et pas node-ffi-napi

| Critere | node-addon-api (N-API) | node-ffi-napi |
|---|---|---|
| Structs C complexes (`evolis_info_t`, `evolis_device_t`) | Extraction propre en C++ → JS objects | Definitions fragiles, error-prone |
| Buffers BMP (~2MB par image) | `Napi::Buffer` natif, zero-copy | Overhead libffi |
| Stabilite ABI | Stable entre versions Electron | Depend de libffi |
| Dependance | Aucune (N-API integre a Node) | libffi binaire supplementaire |

### 3.2 Fonctions a wrapper

**Enumeration & Connexion**

```cpp
// evolis_get_devices() → Array<EvolisDevice>
// evolis_free_devices()
// evolis_open(name) → printer handle
// evolis_open_with_mode(name, mode) → printer handle
// evolis_close(printer)
// evolis_reserve(printer, session, waitMs) → session_id
// evolis_release(printer)
```

**Information & Status**

```cpp
// evolis_get_info(printer) → EvolisInfo
// evolis_get_ribbon(printer) → EvolisRibbon
// evolis_status(printer) → EvolisStatus
// evolis_get_error_management(printer) → mode
// evolis_set_error_management(printer, mode)
// evolis_clear_mechanical_errors(printer)
// evolis_get_error_name(code) → string
```

**Impression**

```cpp
// evolis_print_init(printer)
// evolis_print_init_with_ribbon(printer, ribbon_type)
// evolis_print_init_from_driver_settings(printer)
// evolis_print_set_imagep(printer, face, path)        // depuis fichier
// evolis_print_set_imageb(printer, face, buffer, size) // depuis buffer
// evolis_print_set_blackb(printer, face, buffer, size)
// evolis_print_set_overlayb(printer, face, buffer, size)
// evolis_print_set_setting(printer, key, value)
// evolis_print_set_auto_eject(printer, bool)
// evolis_print_exec(printer) → return_code
```

**Carte & Trays**

```cpp
// evolis_insert(printer)
// evolis_eject(printer)
// evolis_reject(printer)
// evolis_set_card_pos(printer, position)
// evolis_set_input_tray(printer, tray)
// evolis_set_output_tray(printer, tray)
// evolis_set_error_tray(printer, tray)
```

**Encodage magnetique**

```cpp
// evolis_mag_init(printer)
// evolis_mag_set_track(printer, track, data)
// evolis_mag_write(printer) → return_code
// evolis_mag_read(printer, track) → data
```

### 3.3 Types TypeScript exposes

```typescript
interface EvolisDevice {
  id: string;
  name: string;
  displayName: string;
  uri: string;
  mark: string;
  model: string;
  isSupervised: boolean;
  isOnline: boolean;
  link: 'tcp' | 'usb' | 'file';
  driverVersion: string;
}

interface EvolisInfo {
  name: string;
  model: string;
  modelName: string;
  serialNumber: string;
  fwVersion: string;
  hasFlip: boolean;          // duplex
  hasMagEnc: boolean;        // encodage magnetique
  hasContactLessEnc: boolean; // NFC
  hasSmartEnc: boolean;       // carte a puce
  hasLaminator: boolean;
  hasScanner: boolean;
  hasLock: boolean;
}

interface EvolisRibbon {
  type: string;              // 'YMCKO', 'KO', 'KBLACK', etc.
  description: string;
  remaining: number;
  capacity: number;
}

interface EvolisStatus {
  config: number;            // bitmask flags
  information: number;
  warning: number;
  error: number;
}

type PrintFace = 'front' | 'back';
type RibbonType = 'YMCKO' | 'YMCKOK' | 'KO' | 'KBLACK' | /* ... */ ;
type DuplexType = 'DUPLEX_CC' | 'DUPLEX_CM' | 'DUPLEX_MC' | 'DUPLEX_MM';
type InputTray = 'feeder' | 'manual' | 'bezel' | 'auto';
type OutputTray = 'standard' | 'rear' | 'error' | 'bezel';
```

### 3.4 Image BMP — Format requis

| Parametre | Valeur |
|---|---|
| Format | BMP (Windows Bitmap) |
| Resolution | 300 DPI |
| Dimensions | 1016 x 648 pixels (carte CR80) |
| Profondeur | 24-bit BGR |
| Orientation | Bottom-up (biHeight positif) |

### 3.5 Bundling des libs natives

`electron-builder.config.ts` :

```typescript
extraResources: [
  {
    from: 'ressources/evolis-sdk/${os}/lib',
    to: 'evolis-sdk/lib',
    filter: ['*.dylib', '*.dll', '*.lib', '*.so']
  }
]
```

L'addon charge la lib depuis `process.resourcesPath` au runtime. `prebuildify` genere les prebuilds `.node` par plateforme en CI (pas besoin de toolchain C++ chez l'utilisateur final).

---

## 4. Card Designer

### 4.1 Specifications

| Parametre | Valeur |
|---|---|
| Format carte | CR80 (85.6 x 53.98 mm) |
| Resolution travail | 300 DPI → 1016 x 648 px |
| Rendu canvas | HTML5 Canvas, affiche en scale (ex: 508x324 a l'ecran) |
| Export | BMP 24-bit BGR bottom-up |
| Faces | Recto + Verso |

### 4.2 Elements supportes

| Element | Proprietes |
|---|---|
| **Texte** | Police, taille, couleur, gras/italique, alignement |
| **Image** | Source (fichier/URL), crop, fit, bordure |
| **QR Code** | Donnees, taille, correction erreur (via CoreImage ou qrcode lib) |
| **Formes** | Rectangle, cercle, ligne — couleur, bordure, opacite |
| **Champ dynamique** | Placeholder `{{fieldName}}` remplace par donnees reelles |

### 4.3 Fonctionnalites

- Drag & drop + resize des elements
- Gestion des layers (ordre Z, panel lateral)
- Undo/redo (command pattern via Zustand)
- Grille magnetique + alignement
- Preview avec donnees reelles (depuis Convex ou CSV)
- Sauvegarde templates (JSON vers Convex + local)

---

## 5. Mode Offline

### 5.1 Strategie

- `better-sqlite3` dans le main process (WAL mode)
- Le main process execute un `ConvexHttpClient` qui sync periodiquement les tables cles
- **Online** : le renderer utilise le client Convex WebSocket normal (temps reel)
- **Offline** : les hooks de donnees basculent sur des appels IPC lisant le cache SQLite
- Les ecritures offline sont mises en queue dans une table SQLite dediee
- **Reconnexion** : replay des mutations en queue, resolution last-write-wins

### 5.2 Tables cachees

| Table | Source Convex | Priorite |
|---|---|---|
| `profiles` | `profiles` | Haute (consultation offline) |
| `requests` | `requests` | Haute |
| `appointments` | `appointments` | Haute |
| `card_templates` | `cardTemplates` | Moyenne |
| `org_services` | `orgServices` | Moyenne |
| `mutation_queue` | — (local only) | — |

---

## 6. Auth dans Electron

### 6.1 Probleme

Le `auth-client` actuel utilise `window.location.origin` comme base URL Better Auth. En Electron, le renderer charge depuis `file://` en production → CORS et cookies ne fonctionnent pas.

### 6.2 Solution

L'auth est geree dans le **main process** :

1. Ouvre un `BrowserWindow` vers l'endpoint OAuth de production (ex: `diplomate.ga/auth`)
2. Capture le token du callback URL
3. Stocke le token via `safeStorage` (chiffrement natif OS)
4. Passe le token au renderer via IPC
5. Le client Convex du renderer utilise ce token pre-acquis
6. Refresh automatique gere par le main process

### 6.3 Persistance

- `safeStorage.encryptString()` pour stocker le refresh token sur disque
- Token en memoire dans le main process, passe au renderer a chaque demarrage
- Deconnexion : supprime les tokens locaux + invalide la session Convex

---

## 7. Distribution & Auto-update

### 7.1 Packaging

| OS | Installer | Signature |
|---|---|---|
| macOS | DMG + notarization Apple | Developer ID |
| Windows | NSIS installer | Code signing EV |
| Linux | AppImage + .deb | — |

### 7.2 Auto-update

- `electron-updater` verifie les mises a jour au demarrage et periodiquement
- Source : GitHub Releases (assets signes)
- Download en arriere-plan, installation au prochain redemarrage
- Notification native quand une mise a jour est prete

### 7.3 Licence

- JWT signe par le serveur, contenant : `orgId`, `machineId`, `expiresAt`
- Verification au demarrage (online) + grace period 30 jours (offline)
- Machine ID : hash du hardware (via `node-machine-id` ou Electron `systemPreferences`)
- Limite d'activation par machine

---

## 8. Plan de developpement

### Phase 1 : SDK Evolis + Impression (priorite)

> **Objectif** : Connecter l'imprimante Evolis, la detecter, lire son status et lancer une impression test.

**1.1 — Scaffold Electron minimal**
- Creer `apps/agent-desktop/package.json` avec Electron + electron-vite
- Configurer `electron.vite.config.ts` (main + preload + renderer)
- Main process minimal ouvrant un `BrowserWindow`
- Renderer minimal avec React + une page de test imprimante
- Ajouter au workspace Turborepo, verifier `bun install`
- `bun run dev` lance l'app avec HMR

**1.2 — Addon N-API Evolis**
- Creer `src/main/native/evolis-addon/`
- Ecrire `binding.gyp` avec chemins conditionnels par OS vers les libs SDK
- Implementer `evolis_binding.cpp` :
  - `listDevices()` → `evolis_get_devices()` → Array<EvolisDevice>
  - `open(name)` / `openWithMode(name, mode)` → handle
  - `close(handle)`
  - `reserve(handle)` / `release(handle)`
  - `getInfo(handle)` → EvolisInfo
  - `getRibbon(handle)` → EvolisRibbon
  - `getStatus(handle)` → EvolisStatus
  - `clearErrors(handle)`
  - `setInputTray(handle, tray)` / `setOutputTray(handle, tray)` / `setErrorTray(handle, tray)`
  - `printInit(handle)` / `printInitFromDriver(handle)`
  - `printSetImageBuffer(handle, face, buffer)`
  - `printSetImagePath(handle, face, path)`
  - `printSetSetting(handle, key, value)`
  - `printExec(handle)` → return code
  - `getErrorName(code)` → string
- Types TypeScript dans `index.ts`
- Build et test sur macOS avec `libevolis.dylib`

**1.3 — Printer Service + IPC**
- `printer.service.ts` : wrapper TypeScript haut niveau autour de l'addon
  - Gestion du cycle de vie (open → reserve → work → release → close)
  - Gestion d'erreurs avec messages lisibles
  - Status polling
- `printer.ipc.ts` : handlers `ipcMain.handle()` pour chaque channel
- Preload : exposer `window.desktopApi.printer.*`

**1.4 — UI de test impression**
- Page renderer avec :
  - Bouton "Scanner les imprimantes" → liste des devices detectes
  - Bouton "Connecter" → ouvre la connexion, affiche les infos (modele, serial, firmware)
  - Affichage status ruban (type, restant/capacite)
  - Affichage status erreurs
  - Upload d'une image BMP de test
  - Bouton "Imprimer" → envoie le BMP au SDK, affiche le resultat
  - Bouton "Imprimer recto/verso" (si `hasFlip`)
- Gestion des erreurs affichee dans l'UI (ruban vide, capot ouvert, bourrage, etc.)

**Verification Phase 1** :
- L'app Electron demarre
- L'imprimante Evolis connectee en USB est detectee dans la liste
- Les infos (modele Primacy 2, serial, firmware, capabilities) s'affichent
- Le status ruban (YMCKO, X restants / Y total) s'affiche
- Un BMP de test (1016x648, 24-bit BGR) est imprime avec succes
- Les erreurs SDK sont capturees et affichees proprement

---

### Phase 2 : Portail agent

> **Objectif** : Integrer le portail agent complet (reutilisation du code agent-web).

**2.1 — Providers & Layout**
- Creer `packages/desktop-shared/` avec les types IPC
- Configurer l'alias Vite `@agent-web` → `../agent-web/src`
- Renderer root layout : `I18nProvider` > `ConvexProvider` > `ThemeProvider`
- Layout authentifie : `OrgProvider` > `OrgSidebar` (importe depuis agent-web)

**2.2 — Auth main process**
- Implementer le flow OAuth dans le main process
- `safeStorage` pour persistance du token
- IPC `auth:login`, `auth:logout`, `auth:get-token`
- Integration avec le `ConvexProvider` du renderer

**2.3 — Routes agent**
- TanStack Router SPA avec routes wrappant les pages agent-web :
  - Dashboard
  - Demandes (requests)
  - Registre consulaire
  - Rendez-vous
  - Equipe
  - Services
  - Statistiques
  - Parametres
- Items sidebar desktop supplementaires : Card Designer, File d'impression

**Verification Phase 2** :
- Login fonctionne via popup OAuth
- Session persistee entre redemarrages
- Toutes les pages agent s'affichent et fonctionnent
- Navigation sidebar fluide
- Donnees Convex temps reel

---

### Phase 3 : Card Designer

> **Objectif** : Designer visuel de cartes consulaires avec export BMP.

**3.1 — Canvas engine**
- HTML5 Canvas a resolution 1016x648 (affiche en scale)
- System de coordonnees mm ↔ px (300 DPI)
- Zoom / pan
- Selection, drag, resize, rotation

**3.2 — Elements**
- Texte (police, taille, couleur, alignement)
- Image (drag & drop, crop, fit)
- QR Code (generation via lib JS)
- Formes (rectangle, cercle, ligne)
- Champs dynamiques `{{fieldName}}`

**3.3 — Gestion**
- Panel layers lateral (ordre Z, visibilite, verrouillage)
- Undo/redo (Zustand + command pattern)
- Recto/verso toggle
- Sauvegarde templates (Convex + local)
- Preview avec donnees reelles

**3.4 — Export BMP**
- Rendu canvas en pleine resolution (1016x648)
- Conversion en BMP 24-bit BGR bottom-up
- Pret pour envoi direct au SDK Evolis

**Verification Phase 3** :
- Creer un template avec photo, texte, QR code
- Recto/verso fonctionnel
- Undo/redo
- Export BMP valide (verifiable visuellement + par le SDK)

---

### Phase 4 : Workflow d'impression complet

> **Objectif** : Pipeline complet du card designer a l'impression physique.

**4.1 — Pipeline impression**
- Canvas → export BMP → IPC → main process → SDK Evolis → impression
- Support simplex et duplex
- Configuration trays (feeder, sortie, erreur)

**4.2 — File d'impression**
- Ajout de jobs (unitaire ou batch depuis donnees Convex/CSV)
- Remplacement des champs dynamiques par les donnees reelles
- Progress par job
- Cancel / retry
- Historique (SQLite)

**4.3 — Status temps reel**
- Polling status imprimante (ruban, erreurs, etat)
- UI d'alerte : ruban bas, capot ouvert, bourrage, plus de cartes
- Clear errors depuis l'UI

**4.4 — Encodage magnetique** (si imprimante equipee)
- Ecriture 3 pistes ISO
- Champs dynamiques dans les donnees magnetiques
- Verification apres ecriture

**Verification Phase 4** :
- Imprimer une carte complete (photo + texte + QR) depuis le designer
- Batch de 10 cartes avec donnees differentes
- Erreur simulee (retirer le ruban) → alerte UI → correction → retry ok
- Encodage magnetique (si hardware disponible)

---

### Phase 5 : Mode offline

> **Objectif** : L'application fonctionne sans connexion internet.

**5.1 — Cache SQLite**
- Schema SQLite (profiles, requests, appointments, templates, mutation_queue)
- Sync periodique Convex → SQLite via `ConvexHttpClient` dans le main process

**5.2 — Detection & fallback**
- Detection offline : `navigator.onLine` + heartbeat WebSocket Convex
- Hooks React de fallback : online = Convex, offline = IPC → SQLite
- Indicateur visuel dans la barre de titre / sidebar

**5.3 — Queue de mutations**
- Ecritures offline stockees dans `mutation_queue`
- Replay automatique a la reconnexion
- Conflits : last-write-wins avec timestamps
- Notification de sync terminee

**Verification Phase 5** :
- Couper le reseau → l'app affiche les donnees cachees
- Modifier une demande offline → mutation en queue
- Reconnecter → mutation replay, donnees synchronisees

---

### Phase 6 : Notifications, Licence & Distribution

> **Objectif** : Fonctionnalites enterprise et distribution.

**6.1 — Notifications natives**
- Nouvelle demande assignee
- Appel entrant (LiveKit)
- Rappel rendez-vous
- Mise a jour disponible

**6.2 — Licence**
- Verification JWT au demarrage
- Machine ID (hash hardware)
- Grace period 30 jours offline
- UI d'activation / expiration

**6.3 — Auto-update**
- `electron-updater` → GitHub Releases
- Download arriere-plan
- Notification "Mise a jour prete"
- Installation au redemarrage

**6.4 — Packaging & CI/CD**
- `electron-builder.config.ts` pour DMG, NSIS, AppImage
- Bundle SDK Evolis en `extraResources`
- Prebuilds addon N-API par plateforme
- GitHub Actions : build macOS + Windows + Linux
- Signature code (Apple notarization, Windows code signing)

**Verification Phase 6** :
- Installer via DMG/NSIS/AppImage
- Licence valide → app demarre
- Licence expiree → message + grace period
- Recevoir une notification native pour une nouvelle demande
- Auto-update : publier une release → l'app propose la mise a jour

---

## 9. Fichiers cles a consulter / modifier

| Fichier | Role |
|---|---|
| `apps/agent-web/src/routes/__root.tsx` | Layout root a repliquer dans le renderer |
| `apps/agent-web/src/routes/_app.tsx` | Layout auth avec OrgProvider + Sidebar |
| `packages/api/src/provider.tsx` | ConvexProvider (reutilise tel quel) |
| `packages/api/src/auth-client.ts` | Auth client a adapter pour Electron |
| `packages/ui/src/components/` | Composants shadcn/ui partages |
| `ressources/evolis-sdk/include/evolis/evolis.h` | Header C principal du SDK |
| `ressources/evolis-sdk/include/evolis/evo-printers.h` | Status flags et erreurs |
| `ressources/evolis-sdk/include/evolis/evosettings_keys.h` | Cles de config impression |
| `turbo.json` | Ajouter tasks `dev:electron`, `build:electron` |
| `package.json` (root) | Ajouter workspace `apps/agent-desktop` |

---

## 10. Dependances principales

```json
{
  "devDependencies": {
    "electron": "^35.x",
    "electron-vite": "^3.x",
    "electron-builder": "^26.x",
    "@electron/rebuild": "^3.x"
  },
  "dependencies": {
    "electron-updater": "^6.x",
    "better-sqlite3": "^11.x",
    "zustand": "^5.x",
    "node-addon-api": "^8.x",
    "prebuildify": "^6.x"
  }
}
```

Les packages workspace existants (`@workspace/api`, `@workspace/ui`, `@workspace/i18n`, `@workspace/shared`) sont importes directement sans duplication.
