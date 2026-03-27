/**
 * Seed des associations gabonaises de France (129 associations CGF)
 * Source: consulat-core/src/data/mock-associations-cgf.ts
 *
 * Utilisation:
 * npx convex run seeds/associations:seedAssociations
 */
import { mutation } from "../_generated/server";
import { AssociationType } from "../lib/constants";

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY MAPPING
// ═══════════════════════════════════════════════════════════════════════════

type CGFCategory =
  | "Communautaires"
  | "Socio-Culturelle"
  | "Social / Humanitaire"
  | "Education - Réseautage / Entrepreneurs"
  | "Sportive"
  | "Culturelle"
  | "D'opinion"
  | "Associatif"
  | "Juridiques / Droit";

const CATEGORY_MAP: Record<CGFCategory, AssociationType> = {
  Communautaires: AssociationType.Other,
  "Socio-Culturelle": AssociationType.Cultural,
  "Social / Humanitaire": AssociationType.Solidarity,
  "Education - Réseautage / Entrepreneurs": AssociationType.Education,
  Sportive: AssociationType.Sports,
  Culturelle: AssociationType.Cultural,
  "D'opinion": AssociationType.Other,
  Associatif: AssociationType.Other,
  "Juridiques / Droit": AssociationType.Professional,
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════════

interface AssociationEntry {
  name: string;
  category: CGFCategory;
  city: string;
  description?: string;
  phone?: string;
  website?: string;
}

const ASSOCIATIONS: AssociationEntry[] = [
  // ═══════════════════════════════ PAGE 1 ═══════════════════════════════
  {
    name: "Association des Gabonais d'Amiens (AGA)",
    category: "Communautaires",
    city: "Amiens",
    description:
      "Education formation / établissement de formation professionnelle, formation continue amicales, groupements affinitaires, groupements d'entraide.",
  },
  {
    name: "Association des Gabonais de Metz (Bana Ba Gabon)",
    category: "Communautaires",
    city: "Metz",
    description:
      "Créer et entretenir un lien social entre les Gabonais des villes de Metz, Thionville, et les environs.",
  },
  {
    name: "Association Solidaire des Gabonais de Moselle et Alentours (ASGABOMA)",
    category: "Communautaires",
    city: "Metz",
    description:
      "Créer un cadre de rencontres et d'échanges entre les ressortissants gabonais résidant dans la ville de Metz et ses environs.",
  },
  {
    name: "Cercle des Gabonais de Strasbourg",
    category: "Communautaires",
    city: "Strasbourg",
    description:
      "Regrouper au travers d'activités solidaires, sociales, culturelles et sportives les gabonais résidant à Strasbourg et dans le Bas-Rhin.",
  },
  {
    name: "Union des Gabonais de Nancy",
    category: "Communautaires",
    city: "Nancy",
    description:
      "Regrouper les Gabonais résidant dans le département de Meurthe-et-Moselle autour des activités solidaires.",
  },
  {
    name: "Association OTIMA",
    category: "Social / Humanitaire",
    city: "Paris",
    description:
      "Organisation caritative à but non lucratif s'engageant dans des actions de solidarité internationale.",
  },
  {
    name: "OREMA du Gabon",
    category: "Social / Humanitaire",
    city: "Paris",
    description:
      "Favoriser l'émergence des associations gabonaises, organiser des événements de dialogue communautaire et de solidarité entre associations gabonaises.",
  },
  {
    name: "Association des Gabonais de la Bourgogne (AGAB)",
    category: "Communautaires",
    city: "Dijon",
    description:
      "Regrouper les ressortissants gabonais résidant en Bourgogne autour d'activités socio-culturelles et solidaires.",
  },
  {
    name: "Association Gabonaise des Étudiants de Franche-Comté (AGEFC)",
    category: "Communautaires",
    city: "Besançon",
    description:
      "Regrouper et accompagner les étudiants gabonais de la région Franche-Comté.",
  },
  {
    name: "Espace Gabon-Nord",
    category: "Communautaires",
    city: "Lille",
    description:
      "Regrouper les gabonais résidant dans la métropole lilloise et la région des Hauts-de-France.",
  },

  // ═══════════════════════════════ PAGE 2 ═══════════════════════════════
  {
    name: "ROZ COM",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Favoriser le développement communautaire au Gabon.",
  },
  {
    name: "La Diversité 88",
    category: "Socio-Culturelle",
    city: "Épinal",
    description:
      "Promouvoir la culture gabonaise et la diversité culturelle dans les Vosges.",
  },
  {
    name: "Cadres Dynamiques",
    category: "Education - Réseautage / Entrepreneurs",
    city: "Paris",
    description:
      "Promouvoir et faciliter l'entrepreneuriat au sein de la diaspora gabonaise.",
  },
  {
    name: "Association des Mbayistes de France (AFM)",
    category: "Culturelle",
    city: "Paris",
    description:
      "Promouvoir la culture et les traditions Mbay du Gabon en France.",
  },
  {
    name: "Association AGIR Gabon",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Actions de solidarité internationale en faveur du Gabon.",
  },
  {
    name: "Entraide Échange et Solidarité entre Particulier France/Gabon (AEESEP-CD241)",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Entraide et échange solidaire entre le France et le Gabon.",
  },
  {
    name: "Le Gabon en Partage",
    category: "Socio-Culturelle",
    city: "Paris",
    description:
      "Promouvoir les échanges culturels entre la France et le Gabon.",
  },
  {
    name: "Diaspora Invest Gabon",
    category: "Education - Réseautage / Entrepreneurs",
    city: "Paris",
    description:
      "Faciliter l'investissement de la diaspora gabonaise dans le développement du Gabon.",
  },
  {
    name: "Association Gabon Prévention pour Tous (AGPPT)",
    category: "Social / Humanitaire",
    city: "Paris",
    description:
      "Actions de prévention et de sensibilisation en matière de santé publique.",
  },
  {
    name: "MOGNU",
    category: "Socio-Culturelle",
    city: "Paris",
    description:
      "Promouvoir la culture gabonaise et favoriser les échanges interculturels.",
  },

  // ═══════════════════════════════ PAGE 3 ═══════════════════════════════
  {
    name: "O de Vie",
    category: "Social / Humanitaire",
    city: "Paris",
    description:
      "Œuvrer pour l'amélioration des conditions de vie des populations vulnérables au Gabon.",
  },
  {
    name: "ODIKA 49",
    category: "Socio-Culturelle",
    city: "Angers",
    description: "Promouvoir la culture gabonaise dans le Maine-et-Loire.",
  },
  {
    name: "MBOLO 49",
    category: "Communautaires",
    city: "Angers",
    description:
      "Regrouper les gabonais d'Angers et du département du Maine-et-Loire.",
  },
  {
    name: "Association des Gabonais de Rennes",
    category: "Communautaires",
    city: "Rennes",
    description: "Regrouper les gabonais résidant à Rennes et ses environs.",
  },
  {
    name: "Association Laboratoire de Femmes",
    category: "Social / Humanitaire",
    city: "Paris",
    description:
      "Promouvoir l'autonomisation des femmes gabonaises en France et au Gabon.",
  },
  {
    name: "Association Kielé Les Enfants",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Apporter une aide aux enfants défavorisés au Gabon.",
  },
  {
    name: "Association Brandon Abayi",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Soutenir les personnes en situation de précarité.",
  },
  {
    name: "ONG Cœur",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Actions humanitaires et solidaires en direction du Gabon.",
  },
  {
    name: "Association Le Rebond",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Accompagner les gabonais en difficulté vers la réinsertion.",
  },
  {
    name: "Retour au Pays",
    category: "Social / Humanitaire",
    city: "Paris",
    description:
      "Aider les gabonais de la diaspora dans leur projet de retour au Gabon.",
  },

  // ═══════════════════════════════ PAGE 4 ═══════════════════════════════
  {
    name: "L'Enfant Prodige",
    category: "Social / Humanitaire",
    city: "Paris",
    description:
      "Apporter une assistance humanitaire aux personnes en difficulté.",
  },
  {
    name: "Solidarité Gabonaise en France",
    category: "Social / Humanitaire",
    city: "Paris",
    description:
      "Assister les compatriotes en difficulté, préparer le retour au pays des diplômés.",
  },
  {
    name: "Association des Gabonais de Saint-Etienne (A.G.S.E)",
    category: "Communautaires",
    city: "Saint-Étienne",
    description: "Interventions sociales, aide aux réfugiés et aux immigrés.",
  },
  {
    name: "Asso des Gabonais de Lyon et des Environs (AGLE)",
    category: "Communautaires",
    city: "Lyon",
    description:
      "Intégration des membres résidant à Lyon et ses environs, des primo-arrivants tant sur le plan social qu'administratif.",
  },
  {
    name: "Amicale des Gabonais de Clermont-Ferrand",
    category: "Communautaires",
    city: "Clermont-Ferrand",
    description:
      "Promouvoir les échanges socio-culturels et améliorer les conditions de vie des membres.",
  },
  {
    name: "Association Solidarité Gabon",
    category: "Communautaires",
    city: "Marseille",
    description:
      "Assurer l'intégration des gabonais dans le département des Bouches du Rhône.",
  },
  {
    name: "Association des Gabonais de Montpellier (AGM34)",
    category: "Communautaires",
    city: "Montpellier",
    description:
      "Créer et maintenir un lien de solidarité et de camaraderie entre les gabonais de Montpellier.",
  },
  {
    name: "Association des Gabonais de l'Isère (A.G.I)",
    category: "Communautaires",
    city: "Grenoble",
    description:
      "Promouvoir la culture gabonaise à travers l'organisation d'événements socio-culturels et festifs.",
  },
  {
    name: "Asso Sportive des Gabonais de Grenoble",
    category: "Sportive",
    city: "Grenoble",
    description:
      "Promouvoir la pratique et le développement du sport en général et du football en particulier.",
  },
  {
    name: "Association sportive des Panthères de Provence",
    category: "Sportive",
    city: "Marseille",
    description:
      "Promouvoir la cohésion et la fraternité gabonaise au travers le football.",
  },

  // ═══════════════════════════════ PAGE 5 ═══════════════════════════════
  {
    name: "Association des Panthères du Rhône",
    category: "Sportive",
    city: "Lyon",
    description: "Promouvoir le sport gabonais dans la région lyonnaise.",
  },
  {
    name: "Association des Promoteurs Gabonais (APROGAB)",
    category: "Education - Réseautage / Entrepreneurs",
    city: "Paris",
    description: "Promouvoir l'entrepreneuriat gabonais en France.",
  },
  {
    name: "Association des Gabonais de Loire-Atlantique et Alentours (AGLAA)",
    category: "Communautaires",
    city: "Nantes",
    description: "Regrouper les gabonais de Loire-Atlantique.",
  },
  {
    name: "Asso AGL Tout Couleurs",
    category: "Socio-Culturelle",
    city: "Paris",
    description: "Promouvoir la diversité culturelle et le vivre ensemble.",
  },
  {
    name: "MBOLO 45",
    category: "Communautaires",
    city: "Orléans",
    description: "Regrouper les gabonais du Loiret.",
  },
  {
    name: "Asso des Étudiants Gabonais du Mans (AEGM)",
    category: "Communautaires",
    city: "Le Mans",
    description: "Regrouper et accompagner les étudiants gabonais du Mans.",
  },
  {
    name: "Association des Gabonais de Rouen",
    category: "Communautaires",
    city: "Rouen",
    description: "Regrouper les gabonais de Rouen et ses environs.",
  },
  {
    name: "Association des Gabonais du Havre et son Agglomération",
    category: "Communautaires",
    city: "Le Havre",
    description: "Regrouper les gabonais du Havre et de son agglomération.",
  },
  {
    name: "Association Sportive AKONG",
    category: "Sportive",
    city: "Paris",
    description:
      "Promouvoir la pratique sportive au sein de la communauté gabonaise.",
  },
  {
    name: "Cercle des Sportifs Gabonais de France (CESGAF)",
    category: "Sportive",
    city: "Paris",
    description: "Fédérer les sportifs gabonais de France.",
  },

  // ═══════════════════════════════ PAGE 6 ═══════════════════════════════
  {
    name: "Bibang Production",
    category: "Culturelle",
    city: "Paris",
    description: "Production culturelle et événementielle gabonaise.",
  },
  {
    name: "Nzala Bola Association Mayaya",
    category: "Socio-Culturelle",
    city: "Paris",
    description: "Promouvoir les traditions et la culture gabonaise.",
  },
  {
    name: "L'Arbre à Palabres",
    category: "Culturelle",
    city: "Paris",
    description: "Espace de dialogue et d'échanges culturels.",
  },
  {
    name: "Association C.E.C.A.D (Compétences Expertises & Consulting for African Development)",
    category: "Education - Réseautage / Entrepreneurs",
    city: "Paris",
    description:
      "Mettre les compétences de la diaspora au service du développement africain.",
  },
  {
    name: "Association La Francevilloise – Éducation pour Tous",
    category: "Social / Humanitaire",
    city: "Paris",
    description:
      "Promouvoir l'éducation pour tous au Gabon, en particulier à Franceville.",
  },
  {
    name: "Jeunes Leaders Gabonais de France (JLGF)",
    category: "Education - Réseautage / Entrepreneurs",
    city: "Paris",
    description: "Fédérer les jeunes gabonais dynamiques résidant en France.",
  },
  {
    name: "Association des Anciens du Lycée d'État de Lambaréné",
    category: "Communautaires",
    city: "Paris",
    description: "Regrouper les anciens élèves du Lycée d'État de Lambaréné.",
  },
  {
    name: "To Help Gabon",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Actions d'aide et de solidarité en faveur du Gabon.",
  },
  {
    name: "Association Les Enfants du Gabon",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Aider les enfants défavorisés au Gabon.",
  },
  {
    name: "Mouvement Civil Gabonais (MCG)",
    category: "D'opinion",
    city: "Paris",
    description: "Mouvement citoyen pour le développement du Gabon.",
  },

  // ═══════════════════════════════ PAGE 7 ═══════════════════════════════
  {
    name: "Association Trait d'Union (T.D.U)",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Créer des liens entre la diaspora gabonaise et le Gabon.",
  },
  {
    name: "Association GNAMO des Ogivins de France",
    category: "Communautaires",
    city: "Paris",
    description: "Regrouper les Ogivins résidant en France.",
  },
  {
    name: "Association Gabon Initiative Action et Solidarité (G.I.A.S)",
    category: "Social / Humanitaire",
    city: "Paris",
    description:
      "Initiative et solidarité en faveur du développement du Gabon.",
  },
  {
    name: "Femme Libre Courageuse Intelligente et Ambitieuse (FELICIA)",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Promouvoir l'autonomisation des femmes.",
  },
  {
    name: "MB Children's Solidarité",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Solidarité en faveur des enfants.",
  },
  {
    name: "Association C.G.C (Conseil Gabonais des Chargeurs)",
    category: "Education - Réseautage / Entrepreneurs",
    city: "Paris",
    description: "Conseil et accompagnement des chargeurs gabonais.",
  },
  {
    name: "Le Live",
    category: "Culturelle",
    city: "Paris",
    description: "Production et promotion de spectacles vivants gabonais.",
  },
  {
    name: "Business Management",
    category: "Education - Réseautage / Entrepreneurs",
    city: "Paris",
    description: "Accompagnement en gestion d'entreprise pour la diaspora.",
  },
  {
    name: "Nyamoro Production",
    category: "Culturelle",
    city: "Paris",
    description: "Production audiovisuelle et culturelle gabonaise.",
  },
  {
    name: "Office pour le Développement de Mounana (ODM)",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Œuvrer pour le développement de la ville de Mounana.",
  },

  // ═══════════════════════════════ PAGE 8 ═══════════════════════════════
  {
    name: "Association Mémoire Vérité Patrie",
    category: "D'opinion",
    city: "Paris",
    description: "Défendre les valeurs de mémoire, vérité et patriotisme.",
  },
  {
    name: "Gabon Ladies Business",
    category: "Education - Réseautage / Entrepreneurs",
    city: "Paris",
    description: "Réseau d'affaires pour les femmes gabonaises.",
  },
  {
    name: "Ozouaki",
    category: "Socio-Culturelle",
    city: "Paris",
    description: "Promotion socio-culturelle gabonaise.",
  },
  {
    name: "Le Bwenze",
    category: "Culturelle",
    city: "Paris",
    description: "Promotion de la culture et des traditions gabonaises.",
  },
  {
    name: "Reflet du Gabon",
    category: "Culturelle",
    city: "Paris",
    description: "Refléter et promouvoir l'image du Gabon en France.",
  },
  {
    name: "Les Panthères de France (LPF)",
    category: "Sportive",
    city: "Paris",
    description: "Promouvoir le sport gabonais en France.",
  },
  {
    name: "Le Réseau International des Avocats Gabonais (RIAG)",
    category: "Juridiques / Droit",
    city: "Paris",
    description: "Réseau professionnel des avocats gabonais à l'international.",
  },
  {
    name: "Jeunesse Africaine pour l'Environnement",
    category: "Social / Humanitaire",
    city: "Paris",
    description:
      "Sensibilisation des jeunes aux enjeux environnementaux en Afrique.",
  },
  {
    name: "Association NGADY",
    category: "Socio-Culturelle",
    city: "Paris",
    description: "Promouvoir la culture et les traditions gabonaises.",
  },
  {
    name: "Initiatives Solidaires au Développement Éducatif du Gabon (ISODEG)",
    category: "Education - Réseautage / Entrepreneurs",
    city: "Paris",
    description: "Favoriser le développement éducatif au Gabon.",
  },
  {
    name: "Association Communautaire des Gabonais de Paris (ACGP)",
    category: "Communautaires",
    city: "Paris",
    description: "Regrouper les gabonais résidant à Paris et en Île-de-France.",
  },

  // ═══════════════════════════════ PAGE 9 ═══════════════════════════════
  {
    name: "Réseau des Professionnels Gabonais de France (DIASPOACT)",
    category: "Education - Réseautage / Entrepreneurs",
    city: "Paris",
    description: "Réseau professionnel de la diaspora gabonaise en France.",
  },
  {
    name: "Fédération des Étudiants Gabonais de France (FEGAF)",
    category: "Communautaires",
    city: "Paris",
    description: "Fédérer les étudiants gabonais de France.",
  },
  {
    name: "Réseau International des Entrepreneurs Gabonais (RIEG)",
    category: "Education - Réseautage / Entrepreneurs",
    city: "Paris",
    description: "Réseau d'entrepreneurs gabonais à l'international.",
  },
  {
    name: "Convention de la Diaspora Gabonaise",
    category: "D'opinion",
    city: "Paris",
    description: "Plateforme de concertation de la diaspora gabonaise.",
  },
  {
    name: "Éveil",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Sensibilisation et éveil citoyen.",
  },
  {
    name: "Cohérence Démocrate",
    category: "D'opinion",
    city: "Paris",
    description: "Promouvoir la démocratie et la bonne gouvernance.",
  },
  {
    name: "Warisse",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Actions humanitaires et solidaires.",
  },
  {
    name: "Godwin",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Actions sociales et humanitaires.",
  },
  {
    name: "Association Gabonaise des Footballeurs de Pau",
    category: "Sportive",
    city: "Pau",
    description: "Promouvoir le football gabonais à Pau.",
  },
  {
    name: "Gabon DOM",
    category: "Communautaires",
    city: "Paris",
    description: "Regrouper les gabonais des DOM-TOM.",
  },

  // ═══════════════════════════════ PAGE 10 ══════════════════════════════
  {
    name: "Association Gab'Campus",
    category: "Communautaires",
    city: "Paris",
    description:
      "Accompagnement des étudiants gabonais sur les campus français.",
  },
  {
    name: "Bwiti Roots",
    category: "Culturelle",
    city: "Paris",
    description: "Promouvoir les racines culturelles du Bwiti.",
  },
  {
    name: "MEKE ME NKOMA Zone Europe",
    category: "Communautaires",
    city: "Paris",
    description: "Fédérer les membres de la communauté en Europe.",
  },
  {
    name: "Association ZALANG",
    category: "Socio-Culturelle",
    city: "Paris",
    description: "Promouvoir la culture et la solidarité gabonaise.",
  },
  {
    name: "L'Association de l'Entre Deux Terres (AEDT)",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Créer un pont entre la France et le Gabon.",
  },
  {
    name: "Association Mon Livre Mon Droit",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Promouvoir l'accès au droit et à la lecture.",
  },
  {
    name: "Diaspora Gabonaise de France",
    category: "Communautaires",
    city: "Paris",
    description: "Regrouper la diaspora gabonaise de France.",
  },
  {
    name: "Association Gabonaise du Périgord",
    category: "Communautaires",
    city: "Périgueux",
    description: "Regrouper les gabonais du Périgord.",
  },
  {
    name: "Association des Gabonais de la Gironde (MBOLO AGG)",
    category: "Communautaires",
    city: "Bordeaux",
    description: "Regrouper les gabonais de la Gironde.",
  },
  {
    name: "Association des Étudiants Gabonais du Limousin SAMBA'A",
    category: "Communautaires",
    city: "Limoges",
    description: "Regrouper les étudiants gabonais du Limousin.",
  },

  // ═══════════════════════════════ PAGE 11 ══════════════════════════════
  {
    name: "Association des Gabonais de Poitiers",
    category: "Communautaires",
    city: "Poitiers",
    description: "Regrouper les gabonais de Poitiers et ses environs.",
  },
  {
    name: "Association des Gabonais de Toulouse et des Environs",
    category: "Communautaires",
    city: "Toulouse",
    description: "Regrouper les gabonais de Toulouse et ses environs.",
  },
  {
    name: "Yamessa",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Actions humanitaires et de solidarité.",
  },
  {
    name: "Persée",
    category: "Education - Réseautage / Entrepreneurs",
    city: "Paris",
    description: "Promouvoir l'excellence et le réseautage professionnel.",
  },
  {
    name: "Association des Filles Mères du Gabon",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Soutenir les filles mères gabonaises.",
  },
  {
    name: "Association Couronne de NKOLBITYE",
    category: "Communautaires",
    city: "Paris",
    description: "Regrouper la communauté de Nkolbitye en France.",
  },
  {
    name: "Action de Solidarité Gabon (ASA)",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Actions de solidarité en faveur du Gabon.",
  },
  {
    name: "Association Elarmeyong (A.ELAR)",
    category: "Communautaires",
    city: "Paris",
    description: "Regrouper la communauté Elarmeyong en France.",
  },
  {
    name: "Diaspora Invest Gabon",
    category: "Education - Réseautage / Entrepreneurs",
    city: "Paris",
    description: "Promouvoir l'investissement de la diaspora au Gabon.",
  },
  {
    name: "What Slam",
    category: "Culturelle",
    city: "Paris",
    description: "Promouvoir le slam et la poésie gabonaise.",
  },

  // ═══════════════════════════════ PAGE 12 ══════════════════════════════
  {
    name: "Gabomafoot34",
    category: "Sportive",
    city: "Montpellier",
    description: "Promouvoir le football gabonais à Montpellier.",
  },
  {
    name: "Case Bateke",
    category: "Culturelle",
    city: "Paris",
    description: "Promouvoir la culture Bateke en France.",
  },
  {
    name: "Association Luciole a2i",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Actions humanitaires et d'insertion.",
  },
  {
    name: "BÂAN'A NCTHIÈ",
    category: "Culturelle",
    city: "Paris",
    description: "Promotion culturelle gabonaise.",
  },
  {
    name: "Relais Appui International à la Sécurité Sociale et à la Santé (RAISSA SANTÉ-FRANCE)",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Soutien en matière de sécurité sociale et santé.",
  },
  {
    name: "Clémentine",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Actions sociales et humanitaires.",
  },
  {
    name: "Nos Enfants Extra-Capables",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Soutenir les enfants en situation de handicap.",
  },
  {
    name: "Femmes Gabonaises et Diaspora pour la Transition",
    category: "D'opinion",
    city: "Paris",
    description: "Mobilisation des femmes gabonaises pour la transition.",
  },
  {
    name: "SAMBA'A (Association des Gabonais de Tours)",
    category: "Communautaires",
    city: "Tours",
    description: "Regrouper les gabonais de Tours.",
  },
  {
    name: "Del Yâm (Mon Village)",
    category: "Communautaires",
    city: "Paris",
    description: "Promouvoir le lien avec le village d'origine.",
  },

  // ═══════════════════════════════ PAGE 13 ══════════════════════════════
  {
    name: "Communauté Gabonaise de Bordeaux",
    category: "Communautaires",
    city: "Bordeaux",
    description: "Regrouper les gabonais de Bordeaux.",
  },
  {
    name: "Association AKEWANI",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Actions sociales et humanitaires.",
  },
  {
    name: "EDUSANTÉ",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Éducation et santé au service des communautés.",
  },
  {
    name: "Association Jeunesse Constructive",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Accompagner la jeunesse gabonaise dans ses projets.",
  },
  {
    name: "OGARSEAI (Observatoire Gabonais sur la Responsabilité Sociétale des Entreprises, des Administrations et des Industries)",
    category: "Education - Réseautage / Entrepreneurs",
    city: "Paris",
    description: "Promouvoir la responsabilité sociétale au Gabon.",
  },
  {
    name: "Panthères de Paris (L2P)",
    category: "Sportive",
    city: "Paris",
    description: "Équipe sportive gabonaise de Paris.",
  },
  {
    name: "Le Gabon en Partage",
    category: "Social / Humanitaire",
    city: "Paris",
    description: "Partager et promouvoir le Gabon.",
  },
  {
    name: "ATOUBA 60",
    category: "Communautaires",
    city: "Beauvais",
    description: "Regrouper les gabonais de l'Oise.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// SEED FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */
export const seedAssociations = mutation({
  args: {},
  handler: async (ctx) => {
    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const assoc of ASSOCIATIONS) {
      const slug = `cgf-${slugify(assoc.name)}`;

      try {
        // Check if association already exists by slug
        const existing = await ctx.db
          .query("associations")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .first();

        if (existing) {
          results.skipped++;
          continue;
        }

        const associationType =
          CATEGORY_MAP[assoc.category] ?? AssociationType.Other;

        await ctx.db.insert("associations", {
          slug,
          name: assoc.name,
          associationType,
          country: "FR",
          address: {
            street: "",
            city: assoc.city,
            postalCode: "",
            country: "FR",
          },
          ...(assoc.description && { description: assoc.description }),
          ...(assoc.phone && { phone: assoc.phone }),
          ...(assoc.website && { website: assoc.website }),
          isActive: true,
        } as any);

        results.created++;
      } catch (error) {
        results.errors.push(
          `${slug}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return results;
  },
});
