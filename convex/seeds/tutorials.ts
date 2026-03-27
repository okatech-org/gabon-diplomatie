/**
 * Seed des tutoriels et événements communautaires
 * Données extraites de consulat.ga-core (Tutorials.tsx, Community.tsx, EventGallery.tsx)
 *
 * Utilisation:
 * npx convex run seeds/tutorials:seedTutorials
 * npx convex run seeds/tutorials:seedCommunityEvents
 */
import { mutation } from "../_generated/server";
import { PostStatus, TutorialCategory, TutorialType } from "../lib/constants";

// ── Tutorial seed data ──────────────────────────────────────────────

const tutorialsSeed = [
  {
    title: "Comment renouveler son passeport ?",
    slug: "renouveler-passeport",
    excerpt:
      "Guide complet pour le renouvellement de votre passeport gabonais depuis l'étranger.",
    content: `<h2>Étape 1 : Rassembler les documents</h2>
<p>Avant de commencer, préparez les documents suivants :</p>
<ul>
<li>Ancien passeport (original + copie)</li>
<li>2 photos d'identité récentes (format 35x45mm)</li>
<li>Justificatif de domicile de moins de 3 mois</li>
<li>Formulaire de demande rempli</li>
</ul>
<h2>Étape 2 : Prendre rendez-vous</h2>
<p>Connectez-vous à votre espace citoyen sur Consulat.ga et prenez rendez-vous au consulat le plus proche.</p>
<h2>Étape 3 : Se rendre au consulat</h2>
<p>Le jour du rendez-vous, présentez-vous avec l'ensemble des documents originaux. La prise d'empreintes sera effectuée sur place.</p>
<h2>Étape 4 : Retrait</h2>
<p>Votre passeport sera prêt sous 4 à 6 semaines. Vous recevrez un SMS de notification.</p>`,
    category: TutorialCategory.Administrative,
    type: TutorialType.Video,
    duration: "5 min",
  },
  {
    title: "Créer son entreprise au Gabon depuis l'étranger",
    slug: "creer-entreprise-gabon-etranger",
    excerpt:
      "Toutes les étapes pour immatriculer votre société gabonaise à distance.",
    content: `<h2>Pourquoi créer au Gabon ?</h2>
<p>Le Gabon offre un cadre juridique favorable aux investisseurs de la diaspora avec le CEPCI et l'ANPI.</p>
<h2>Les formes juridiques</h2>
<ul>
<li><strong>SARL</strong> : idéale pour les PME, capital minimum de 1 000 000 FCFA</li>
<li><strong>SA</strong> : pour les projets d'envergure, capital minimum de 10 000 000 FCFA</li>
<li><strong>SAS</strong> : flexibilité de gestion, capital libre</li>
</ul>
<h2>Procédure à distance</h2>
<p>Grâce au guichet unique de l'ANPI, vous pouvez effectuer l'ensemble des démarches en ligne :</p>
<ol>
<li>Rédaction des statuts</li>
<li>Dépôt du capital social</li>
<li>Immatriculation au RCCM</li>
<li>Obtention du NIF</li>
</ol>
<h2>Accompagnement consulaire</h2>
<p>Le consulat peut certifier vos documents et faciliter les démarches via notre service d'assistance entrepreneuriale.</p>`,
    category: TutorialCategory.Entrepreneurship,
    type: TutorialType.Article,
    duration: "10 min read",
  },
  {
    title: "Demander un e-Visa : Guide étape par étape",
    slug: "demander-evisa-guide",
    excerpt:
      "Procédure simplifiée pour obtenir votre visa électronique pour le Gabon.",
    content: `<h2>Qu'est-ce que le e-Visa ?</h2>
<p>Le e-Visa est un visa électronique qui vous permet d'entrer au Gabon sans passer par le consulat. Il est valable pour les séjours touristiques et d'affaires de courte durée.</p>
<h2>Conditions d'éligibilité</h2>
<ul>
<li>Passeport valide 6 mois après la date de retour</li>
<li>Billet d'avion aller-retour</li>
<li>Réservation d'hôtel ou lettre d'invitation</li>
<li>Preuve de moyens financiers</li>
</ul>
<h2>Procédure en ligne</h2>
<ol>
<li>Rendez-vous sur le portail e-Visa du Gabon</li>
<li>Remplissez le formulaire en ligne</li>
<li>Téléchargez vos documents (photo, passeport)</li>
<li>Payez les frais (50 000 FCFA environ)</li>
<li>Recevez votre e-Visa par email sous 72h</li>
</ol>`,
    category: TutorialCategory.Travel,
    type: TutorialType.Video,
    duration: "3 min",
  },
  {
    title: "S'inscrire au registre consulaire en ligne",
    slug: "inscription-registre-consulaire",
    excerpt:
      "Comment créer votre compte citoyen et vous inscrire au registre consulaire.",
    content: `<h2>Pourquoi s'inscrire ?</h2>
<p>L'inscription consulaire est essentielle pour :</p>
<ul>
<li>Obtenir une carte consulaire</li>
<li>Voter aux élections depuis l'étranger</li>
<li>Bénéficier de la protection consulaire</li>
<li>Accéder aux services en ligne</li>
</ul>
<h2>Comment s'inscrire sur Consulat.ga</h2>
<ol>
<li>Créez votre compte sur consulat.ga</li>
<li>Remplissez le formulaire de demande d'inscription</li>
<li>Téléchargez vos justificatifs</li>
<li>Soumettez votre demande</li>
<li>Recevez votre carte consulaire par courrier</li>
</ol>`,
    category: TutorialCategory.Administrative,
    type: TutorialType.Guide,
    duration: "8 min read",
  },
  {
    title: "Légalisation de documents : mode d'emploi",
    slug: "legalisation-documents",
    excerpt:
      "Tout savoir sur la légalisation et l'apostille de vos documents officiels.",
    content: `<h2>Qu'est-ce que la légalisation ?</h2>
<p>La légalisation est la procédure qui authentifie un document public pour qu'il soit reconnu à l'étranger.</p>
<h2>Documents concernés</h2>
<ul>
<li>Actes d'état civil (naissance, mariage, décès)</li>
<li>Diplômes et relevés de notes</li>
<li>Documents notariés</li>
<li>Certificats médicaux</li>
</ul>
<h2>Procédure</h2>
<ol>
<li>Prenez rendez-vous via Consulat.ga</li>
<li>Présentez l'original du document</li>
<li>Réglez les frais de légalisation</li>
<li>Retirez le document légalisé sous 48h</li>
</ol>`,
    category: TutorialCategory.Administrative,
    type: TutorialType.Article,
    duration: "6 min read",
  },
  {
    title: "Préparer son retour au Gabon",
    slug: "preparer-retour-gabon",
    excerpt:
      "Guide pratique pour organiser son retour définitif ou temporaire au Gabon.",
    content: `<h2>Avant le départ</h2>
<ul>
<li>Informez votre consulat de votre départ</li>
<li>Rassemblez vos documents administratifs</li>
<li>Organisez le transport de vos effets personnels</li>
</ul>
<h2>Démarches douanières</h2>
<p>Les Gabonais de retour bénéficient d'une franchise douanière pour leurs effets personnels sous conditions.</p>
<h2>Réinstallation</h2>
<p>Le consulat peut vous orienter vers les services d'aide à la réinstallation et les programmes de retour de la diaspora.</p>`,
    category: TutorialCategory.PracticalLife,
    type: TutorialType.Guide,
    duration: "12 min read",
  },
];

// ── Community Events seed data ──────────────────────────────────────

const communityEventsSeed = [
  {
    title: "Soirée de la Diaspora",
    slug: "soiree-diaspora-2023",
    description:
      "Grande soirée de rencontre et de networking entre membres de la diaspora gabonaise. Musique live, buffet et conférences.",
    date: new Date("2023-12-15").getTime(),
    location: "Paris, France",
    category: "celebration",
  },
  {
    title: "Festival Culturel Gabonais",
    slug: "festival-culturel-gabonais-2023",
    description:
      "Célébration de la richesse culturelle gabonaise : danses traditionnelles, expositions d'art et gastronomie.",
    date: new Date("2023-11-23").getTime(),
    location: "Lyon, France",
    category: "culture",
  },
  {
    title: "Réception Diplomatique",
    slug: "reception-diplomatique-2023",
    description:
      "Réception officielle à l'Ambassade du Gabon en Belgique pour renforcer les liens diplomatiques.",
    date: new Date("2023-10-10").getTime(),
    location: "Ambassade du Gabon, Bruxelles",
    category: "diplomacy",
  },
  {
    title: "Gala de Charité Annuel",
    slug: "gala-charite-2023",
    description:
      "Soirée caritative au profit des projets éducatifs au Gabon. Tombola, vente aux enchères et spectacle.",
    date: new Date("2023-09-05").getTime(),
    location: "Genève, Suisse",
    category: "charity",
  },
  {
    title: "Fête de l'Indépendance",
    slug: "fete-independance-2023",
    description:
      "Célébration du 63ème anniversaire de l'indépendance du Gabon au Consulat Général.",
    date: new Date("2023-08-17").getTime(),
    location: "Consulat Général, Marseille",
    category: "celebration",
  },
  {
    title: "Tournoi de Football Diaspora",
    slug: "tournoi-football-diaspora-2023",
    description:
      "Tournoi amical entre équipes de la diaspora gabonaise. 8 équipes, fair-play et convivialité.",
    date: new Date("2023-07-20").getTime(),
    location: "Bordeaux, France",
    category: "sport",
  },
  {
    title: "Forum Économique Diaspora",
    slug: "forum-economique-diaspora-2024",
    description:
      "Forum en ligne dédié aux opportunités d'investissement au Gabon pour les entrepreneurs de la diaspora.",
    date: new Date("2024-09-15").getTime(),
    location: "En ligne",
    category: "diplomacy",
  },
  {
    title: "Fête de l'Indépendance 2024",
    slug: "fete-independance-2024",
    description:
      "Célébration du 64ème anniversaire de l'indépendance du Gabon à l'Ambassade de Paris.",
    date: new Date("2024-08-17").getTime(),
    location: "Ambassade du Gabon, Paris",
    category: "celebration",
  },
];

// ── Seed mutations ──────────────────────────────────────────────────

export const seedTutorials = mutation({
  args: {},
  handler: async (ctx) => {
    const results = { created: 0, skipped: 0, errors: [] as string[] };

    // Get the first user to use as author
    const user = await ctx.db.query("users").first();
    if (!user) {
      return { ...results, error: "No users found. Create a user first." };
    }

    for (const tutorial of tutorialsSeed) {
      try {
        const existing = await ctx.db
          .query("tutorials")
          .withIndex("by_slug", (q) => q.eq("slug", tutorial.slug))
          .first();

        if (existing) {
          results.skipped++;
          continue;
        }

        const now = Date.now();
        await ctx.db.insert("tutorials", {
          title: tutorial.title,
          slug: tutorial.slug,
          excerpt: tutorial.excerpt,
          content: tutorial.content,
          category: tutorial.category,
          type: tutorial.type,
          duration: tutorial.duration,
          status: PostStatus.Published,
          publishedAt:
            now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
          createdAt: now,
          authorId: user._id,
        });
        results.created++;
      } catch (error) {
        results.errors.push(
          `${tutorial.slug}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return results;
  },
});

export const seedCommunityEvents = mutation({
  args: {},
  handler: async (ctx) => {
    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const event of communityEventsSeed) {
      try {
        const existing = await ctx.db
          .query("communityEvents")
          .withIndex("by_slug", (q) => q.eq("slug", event.slug))
          .first();

        if (existing) {
          results.skipped++;
          continue;
        }

        await ctx.db.insert("communityEvents", {
          title: event.title,
          slug: event.slug,
          description: event.description,
          date: event.date,
          location: event.location,
          category: event.category,
          status: PostStatus.Published,
          createdAt: Date.now(),
        });
        results.created++;
      } catch (error) {
        results.errors.push(
          `${event.slug}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return results;
  },
});
