/**
 * Routes Manifest for AI Assistant
 *
 * This file is auto-generated from src/routeTree.gen.ts
 * It provides the AI with knowledge of all available routes in the application.
 *
 * To regenerate: Run `bun run generate:routes-manifest` (or manually update after route changes)
 */

// User-facing routes (accessible to all citizens)
export const PUBLIC_ROUTES: Record<string, string> = {
  "/": "Page d'accueil du portail consulaire",
  "/services": "Liste de tous les services consulaires",
  "/services/$slug":
    "Détail d'un service spécifique (remplacer $slug par le slug du service)",
  "/news": "Actualités et annonces du consulat",
  "/news/$slug": "Article d'actualité spécifique",
  "/orgs": "Liste des représentations diplomatiques",
  "/orgs/$slug": "Détail d'une représentation diplomatique",
  "/faq": "Questions fréquentes",
  "/tarifs": "Tarifs des services consulaires",
  "/formulaires": "Formulaires téléchargeables",
  "/accessibilite": "Déclaration d'accessibilité",
  "/confidentialite": "Politique de confidentialité",
  "/mentions-legales": "Mentions légales",
};

// My Space routes (authenticated users - citizens)
export const MY_SPACE_ROUTES: Record<string, string> = {
  "/my-space": "Tableau de bord de l'espace personnel",
  "/my-space/profile": "Mon profil consulaire",
  "/my-space/profile/edit": "Modifier mon profil",
  "/my-space/services": "Liste des services consulaires (Démarches)",
  "/my-space/register": "Inscription/Immatriculation consulaire",
  "/my-space/requests": "Liste de mes demandes de services (Suivi TimeLine)",
  "/my-space/requests/$requestId":
    "Détail d'une demande (remplacer $requestId par l'ID)",
  "/my-space/requests/$requestId/appointment": "Prendre RDV pour une demande",
  "/my-space/appointments": "Mes rendez-vous",
  "/my-space/appointments/new": "Prendre un nouveau rendez-vous",
  "/my-space/appointments/book": "Réserver un créneau de rendez-vous",
  "/my-space/notifications": "Mes notifications",
  "/my-space/iboite":
    "iBoîte — Messagerie interne consulaire (envoyer/recevoir des messages)",
  "/my-space/vault": "Mon coffre-fort numérique ou mes documents (iDocuments)",
  "/my-space/children": "Mes enfants mineurs",
  "/my-space/associations": "Mes associations",
  "/my-space/associations/$id":
    "Détail d'une association (remplacer $id par l'identifiant de l'association)",
  "/my-space/companies": "Mes entreprises",
  "/my-space/companies/$id":
    "Détail d'une entreprise (remplacer $id par l'identifiant de l'entreprise)",
  "/my-space/cv": "Mon CV consulaire (iVC)",
  "/my-space/settings": "Paramètres du compte",
  "/my-space/services/$slug/new": "Nouvelle demande pour un service",
};

// Admin routes (consular staff)
export const ADMIN_ROUTES: Record<string, string> = {
  "/admin": "Tableau de bord administration consulaire",
  "/admin/requests": "Gestion des demandes des citoyens",
  "/admin/requests/$reference": "Traiter une demande spécifique (par référence)",
  "/admin/citizens": "Registre des citoyens immatriculés",
  "/admin/consular-registry": "Registre consulaire",
  "/admin/consular-registry/print-queue":
    "File d'impression des cartes consulaires",
  "/admin/profiles/$profileId": "Profil détaillé d'un citoyen",
  "/admin/appointments": "Gestion des rendez-vous",
  "/admin/appointments/$appointmentId": "Détail d'un rendez-vous",
  "/admin/appointments/settings": "Configuration des créneaux de RDV",
  "/admin/appointments/agent-schedules": "Plannings des agents",
  "/admin/calendar": "Calendrier des rendez-vous",
  "/admin/calls": "Appels téléphoniques / visio",
  "/admin/meetings": "Réunions et visioconférences",
  "/admin/services": "Services proposés par le consulat",
  "/admin/services/$serviceId/edit": "Modifier un service",
  "/admin/posts": "Gestion des actualités",
  "/admin/posts/new": "Créer une nouvelle actualité",
  "/admin/posts/$postId/edit": "Modifier une actualité",
  "/admin/team": "Équipe consulaire",
  "/admin/payments": "Paiements et transactions",
  "/admin/statistics": "Statistiques et rapports",
  "/admin/settings": "Paramètres du consulat",
};

// Dashboard routes (super admin / ministry level)
export const DASHBOARD_ROUTES: Record<string, string> = {
  "/dashboard": "Tableau de bord ministériel (super admin)",
  "/dashboard/orgs": "Gestion des représentations diplomatiques",
  "/dashboard/orgs/new": "Créer une nouvelle représentation",
  "/dashboard/orgs/$orgId": "Détail d'une représentation",
  "/dashboard/orgs/$orgId/edit": "Modifier une représentation",
  "/dashboard/services": "Catalogue global des services",
  "/dashboard/services/new": "Créer un nouveau service",
  "/dashboard/services/$serviceId/edit": "Modifier un service",
  "/dashboard/services/$serviceId/form-builder": "Constructeur de formulaire",
  "/dashboard/users": "Gestion des utilisateurs système",
  "/dashboard/users/$userId": "Détail d'un utilisateur",
  "/dashboard/posts": "Actualités globales",
  "/dashboard/posts/new": "Créer une actualité",
  "/dashboard/posts/$postId/edit": "Modifier une actualité",
  "/dashboard/settings": "Paramètres globaux",
  "/dashboard/audit-logs": "Logs d'audit",
};

// All routes combined
export const ALL_ROUTES = {
  ...PUBLIC_ROUTES,
  ...MY_SPACE_ROUTES,
  ...ADMIN_ROUTES,
  ...DASHBOARD_ROUTES,
} as const;

// Generate routes section for system prompt
export function generateRoutesPromptSection(
  userRole: "citizen" | "staff" | "admin" | "super_admin" = "citizen",
): string {
  let routes: Record<string, string> = { ...PUBLIC_ROUTES };

  // Add routes based on user role
  routes = { ...routes, ...MY_SPACE_ROUTES };

  if (
    userRole === "staff" ||
    userRole === "admin" ||
    userRole === "super_admin"
  ) {
    routes = { ...routes, ...ADMIN_ROUTES };
  }

  if (userRole === "super_admin") {
    routes = { ...routes, ...DASHBOARD_ROUTES };
  }

  const routesList = Object.entries(routes)
    .map(([path, desc]) => `- ${path}: ${desc}`)
    .join("\n");

  return `
ROUTES DISPONIBLES:
Tu peux naviguer l'utilisateur vers ces pages avec la fonction navigateTo:

${routesList}

Pour les routes avec paramètres ($slug, $requestId, etc.), remplace par la vraie valeur.
Exemple: navigateTo({ path: "/my-space/requests/abc123" }) pour voir une demande spécifique.`;
}

// Export route list for tool validation
export const VALID_ROUTE_PATTERNS = Object.keys(ALL_ROUTES);
