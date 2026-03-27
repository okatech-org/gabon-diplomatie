/**
 * Seed des formSchemas pour les services consulaires
 *
 * Ajoute les formulaires dynamiques (sections + champs) aux services existants.
 * Les joinedDocuments sont déjà définis dans le seed initial, ce script
 * ajoute les sections de formulaire que le citoyen remplit lors de sa demande.
 *
 * Utilisation:
 * npx convex run seeds/serviceFormSchemas:seedFormSchemas
 */
import { mutation } from "../_generated/server";

// Helper to build a localized string
const l = (fr: string, en?: string) => ({ fr, en });

/**
 * FormSchema definitions keyed by service slug.
 * Each contains sections (form fields) + joinedDocuments.
 */
const FORM_SCHEMAS: Record<
  string,
  {
    sections: Array<{
      id: string;
      title: { fr: string; en?: string };
      description?: { fr: string; en?: string };
      fields: Array<{
        id: string;
        type: string;
        label: { fr: string; en?: string };
        placeholder?: { fr: string; en?: string };
        description?: { fr: string; en?: string };
        required: boolean;
        options?: Array<{ value: string; label: { fr: string; en?: string } }>;
      }>;
    }>;
    joinedDocuments: Array<{
      type: string;
      label: { fr: string; en?: string };
      required: boolean;
    }>;
    showRecap: boolean;
  }
> = {
  // ═══════════════════════════════════════════════════════════════════
  // VISA
  // ═══════════════════════════════════════════════════════════════════
  "demande-visa": {
    sections: [
      {
        id: "applicant",
        title: l("Informations du demandeur", "Applicant Information"),
        fields: [
          {
            id: "lastName",
            type: "text",
            label: l("Nom de famille", "Last name"),
            required: true,
            placeholder: l("Votre nom"),
          },
          {
            id: "firstName",
            type: "text",
            label: l("Prénom(s)", "First name(s)"),
            required: true,
            placeholder: l("Vos prénoms"),
          },
          {
            id: "birthDate",
            type: "date",
            label: l("Date de naissance", "Date of birth"),
            required: true,
          },
          {
            id: "nationality",
            type: "country",
            label: l("Nationalité", "Nationality"),
            required: true,
          },
          {
            id: "gender",
            type: "gender",
            label: l("Sexe", "Gender"),
            required: true,
          },
          {
            id: "passportNumber",
            type: "text",
            label: l("N° de passeport", "Passport number"),
            required: true,
          },
          {
            id: "passportExpiry",
            type: "date",
            label: l("Date d'expiration du passeport", "Passport expiry date"),
            required: true,
          },
          {
            id: "email",
            type: "email",
            label: l("Email", "Email"),
            required: true,
          },
          {
            id: "phone",
            type: "tel",
            label: l("Téléphone", "Phone"),
            required: true,
          },
          {
            id: "address",
            type: "address",
            label: l("Adresse actuelle", "Current address"),
            required: true,
          },
        ],
      },
      {
        id: "travel",
        title: l("Détails du voyage", "Travel Details"),
        fields: [
          {
            id: "visaType",
            type: "select",
            label: l("Type de visa", "Visa type"),
            required: true,
            options: [
              { value: "tourism", label: l("Tourisme", "Tourism") },
              { value: "business", label: l("Affaires", "Business") },
              { value: "family", label: l("Visite familiale", "Family visit") },
              { value: "transit", label: l("Transit", "Transit") },
              {
                value: "official",
                label: l("Officiel / Diplomatique", "Official / Diplomatic"),
              },
            ],
          },
          {
            id: "travelDate",
            type: "date",
            label: l("Date d'arrivée prévue", "Expected arrival date"),
            required: true,
          },
          {
            id: "returnDate",
            type: "date",
            label: l("Date de retour prévue", "Expected return date"),
            required: true,
          },
          {
            id: "purpose",
            type: "textarea",
            label: l("Motif du voyage", "Purpose of travel"),
            required: true,
          },
          {
            id: "hostName",
            type: "text",
            label: l("Nom de l'hébergeant au Gabon", "Host name in Gabon"),
            required: false,
          },
          {
            id: "hostAddress",
            type: "text",
            label: l("Adresse au Gabon", "Address in Gabon"),
            required: false,
          },
        ],
      },
    ],
    joinedDocuments: [
      {
        type: "passport",
        label: l("Passeport en cours de validité", "Valid passport"),
        required: true,
      },
      {
        type: "passport",
        label: l(
          "Copie de la page d'identité du passeport",
          "Copy of passport identity page",
        ),
        required: true,
      },
      {
        type: "online_form_printed",
        label: l("Formulaire de demande de visa", "Visa application form"),
        required: true,
      },
      {
        type: "other_official_document",
        label: l("Billet d'avion aller-retour", "Round-trip flight ticket"),
        required: true,
      },
      {
        type: "medical_certificate",
        label: l(
          "Certificat de vaccination fièvre jaune",
          "Yellow fever vaccination certificate",
        ),
        required: true,
      },
      {
        type: "identity_photo",
        label: l(
          "2 photos d'identité format passeport",
          "2 passport-size photos",
        ),
        required: true,
      },
    ],
    showRecap: true,
  },

  // ═══════════════════════════════════════════════════════════════════
  // CARTE CONSULAIRE
  // ═══════════════════════════════════════════════════════════════════
  "consular-card-registration": {
    sections: [
      {
        id: "identity",
        title: l("Identité", "Identity"),
        fields: [
          {
            id: "lastName",
            type: "text",
            label: l("Nom", "Last name"),
            required: true,
          },
          {
            id: "firstName",
            type: "text",
            label: l("Prénom(s)", "First name(s)"),
            required: true,
          },
          {
            id: "birthDate",
            type: "date",
            label: l("Date de naissance", "Date of birth"),
            required: true,
          },
          {
            id: "birthPlace",
            type: "text",
            label: l("Lieu de naissance", "Place of birth"),
            required: true,
          },
          {
            id: "gender",
            type: "gender",
            label: l("Sexe", "Gender"),
            required: true,
          },
          {
            id: "nationality",
            type: "country",
            label: l("Nationalité", "Nationality"),
            required: true,
          },
        ],
      },
      {
        id: "residence",
        title: l("Situation actuelle", "Current Situation"),
        fields: [
          {
            id: "address",
            type: "address",
            label: l("Adresse de résidence", "Residential address"),
            required: true,
          },
          {
            id: "phone",
            type: "tel",
            label: l("Téléphone", "Phone"),
            required: true,
          },
          {
            id: "email",
            type: "email",
            label: l("Email", "Email"),
            required: true,
          },
          {
            id: "profession",
            type: "text",
            label: l("Profession", "Profession"),
            required: false,
          },
          {
            id: "arrivalDate",
            type: "date",
            label: l(
              "Date d'arrivée dans le pays",
              "Date of arrival in the country",
            ),
            required: false,
          },
        ],
      },
    ],
    joinedDocuments: [
      {
        type: "handwritten_request",
        label: l("Lettre de demande", "Request letter"),
        required: true,
      },
      {
        type: "online_form_printed",
        label: l("Formulaire de demande", "Application form"),
        required: true,
      },
      {
        type: "birth_certificate",
        label: l("Acte de naissance gabonais", "Gabonese birth certificate"),
        required: true,
      },
      {
        type: "passport",
        label: l("Copie du passeport gabonais", "Copy of Gabonese passport"),
        required: true,
      },
      {
        type: "identity_photo",
        label: l("2 photos d'identité récentes", "2 recent passport photos"),
        required: true,
      },
    ],
    showRecap: true,
  },

  // ═══════════════════════════════════════════════════════════════════
  // ATTESTATION PERMIS DE CONDUIRE
  // ═══════════════════════════════════════════════════════════════════
  "attestation-permis-conduire": {
    sections: [
      {
        id: "applicant",
        title: l("Informations du demandeur", "Applicant Information"),
        fields: [
          {
            id: "lastName",
            type: "text",
            label: l("Nom", "Last name"),
            required: true,
          },
          {
            id: "firstName",
            type: "text",
            label: l("Prénom(s)", "First name(s)"),
            required: true,
          },
          {
            id: "licenseNumber",
            type: "text",
            label: l("N° du permis de conduire", "Driving license number"),
            required: true,
          },
          {
            id: "licenseCategory",
            type: "text",
            label: l("Catégorie(s) du permis", "License category(ies)"),
            required: true,
          },
          {
            id: "issueDate",
            type: "date",
            label: l("Date de délivrance du permis", "License issue date"),
            required: true,
          },
        ],
      },
    ],
    joinedDocuments: [
      {
        type: "handwritten_request",
        label: l("Lettre de demande", "Request letter"),
        required: true,
      },
      {
        type: "driver_license",
        label: l(
          "Original du permis de conduire gabonais",
          "Original Gabonese driving license",
        ),
        required: true,
      },
      {
        type: "national_id_card",
        label: l(
          "Copies passeport/CNI/acte de naissance",
          "Copies of passport/ID/birth certificate",
        ),
        required: true,
      },
    ],
    showRecap: true,
  },

  // ═══════════════════════════════════════════════════════════════════
  // ATTESTATION CAPACITÉ JURIDIQUE
  // ═══════════════════════════════════════════════════════════════════
  "attestation-capacite-juridique": {
    sections: [
      {
        id: "applicant",
        title: l("Informations du demandeur", "Applicant Information"),
        fields: [
          {
            id: "lastName",
            type: "text",
            label: l("Nom", "Last name"),
            required: true,
          },
          {
            id: "firstName",
            type: "text",
            label: l("Prénom(s)", "First name(s)"),
            required: true,
          },
          {
            id: "birthDate",
            type: "date",
            label: l("Date de naissance", "Date of birth"),
            required: true,
          },
          {
            id: "birthPlace",
            type: "text",
            label: l("Lieu de naissance", "Place of birth"),
            required: true,
          },
          {
            id: "purpose",
            type: "textarea",
            label: l("Motif de la demande", "Purpose of request"),
            required: true,
          },
        ],
      },
    ],
    joinedDocuments: [
      {
        type: "handwritten_request",
        label: l("Lettre de demande", "Request letter"),
        required: true,
      },
      {
        type: "criminal_record_b3",
        label: l(
          "Extrait de casier judiciaire (< 3 mois)",
          "Criminal record extract (< 3 months)",
        ),
        required: true,
      },
      {
        type: "national_id_card",
        label: l(
          "Copies passeport/CNI/acte de naissance",
          "Copies of passport/ID/birth certificate",
        ),
        required: true,
      },
    ],
    showRecap: true,
  },

  // ═══════════════════════════════════════════════════════════════════
  // CERTIFICAT DE VIE
  // ═══════════════════════════════════════════════════════════════════
  "certificat-vie": {
    sections: [
      {
        id: "retiree",
        title: l("Informations du retraité", "Retiree Information"),
        fields: [
          {
            id: "lastName",
            type: "text",
            label: l("Nom", "Last name"),
            required: true,
          },
          {
            id: "firstName",
            type: "text",
            label: l("Prénom(s)", "First name(s)"),
            required: true,
          },
          {
            id: "birthDate",
            type: "date",
            label: l("Date de naissance", "Date of birth"),
            required: true,
          },
          {
            id: "pensionOrg",
            type: "text",
            label: l("Organisme de pension", "Pension organization"),
            required: true,
          },
          {
            id: "pensionNumber",
            type: "text",
            label: l("N° de pension/matricule", "Pension/registration number"),
            required: true,
          },
        ],
      },
    ],
    joinedDocuments: [
      {
        type: "handwritten_request",
        label: l("Lettre de demande", "Request letter"),
        required: true,
      },
      {
        type: "passport",
        label: l("Copie du passeport", "Passport copy"),
        required: true,
      },
      {
        type: "other_official_document",
        label: l(
          "Titre de pension ou attestation de retraite",
          "Pension certificate or retirement attestation",
        ),
        required: true,
      },
    ],
    showRecap: true,
  },

  // ═══════════════════════════════════════════════════════════════════
  // CERTIFICAT D'EXPATRIATION
  // ═══════════════════════════════════════════════════════════════════
  "certificat-expatriation": {
    sections: [
      {
        id: "applicant",
        title: l("Informations du demandeur", "Applicant Information"),
        fields: [
          {
            id: "lastName",
            type: "text",
            label: l("Nom", "Last name"),
            required: true,
          },
          {
            id: "firstName",
            type: "text",
            label: l("Prénom(s)", "First name(s)"),
            required: true,
          },
          {
            id: "returnDate",
            type: "date",
            label: l(
              "Date de retour prévue au Gabon",
              "Expected return date to Gabon",
            ),
            required: true,
          },
          {
            id: "freightForwarder",
            type: "text",
            label: l("Nom du transitaire", "Freight forwarder name"),
            required: true,
          },
        ],
      },
      {
        id: "belongings",
        title: l("Effets personnels", "Personal Belongings"),
        description: l(
          "Liste détaillée des effets à rapatrier",
          "Detailed list of belongings to repatriate",
        ),
        fields: [
          {
            id: "belongingsList",
            type: "textarea",
            label: l(
              "Liste des effets personnels (avec références)",
              "List of personal belongings (with references)",
            ),
            required: true,
          },
        ],
      },
    ],
    joinedDocuments: [
      {
        type: "handwritten_request",
        label: l("Lettre de demande", "Request letter"),
        required: true,
      },
      {
        type: "passport",
        label: l("Copie du passeport", "Passport copy"),
        required: true,
      },
      {
        type: "other_official_document",
        label: l(
          "Liste détaillée des effets personnels",
          "Detailed list of personal belongings",
        ),
        required: true,
      },
      {
        type: "other_official_document",
        label: l("Nom du transitaire", "Freight forwarder name"),
        required: true,
      },
    ],
    showRecap: true,
  },

  // ═══════════════════════════════════════════════════════════════════
  // CERTIFICATS DE COUTUME ET DE CÉLIBAT
  // ═══════════════════════════════════════════════════════════════════
  "certificat-coutume-celibat": {
    sections: [
      {
        id: "applicant",
        title: l("Informations du demandeur", "Applicant Information"),
        fields: [
          {
            id: "lastName",
            type: "text",
            label: l("Nom", "Last name"),
            required: true,
          },
          {
            id: "firstName",
            type: "text",
            label: l("Prénom(s)", "First name(s)"),
            required: true,
          },
          {
            id: "birthDate",
            type: "date",
            label: l("Date de naissance", "Date of birth"),
            required: true,
          },
          {
            id: "maritalStatus",
            type: "select",
            label: l(
              "Situation matrimoniale actuelle",
              "Current marital status",
            ),
            required: true,
            options: [
              { value: "single", label: l("Célibataire", "Single") },
              { value: "divorced", label: l("Divorcé(e)", "Divorced") },
              { value: "widowed", label: l("Veuf/Veuve", "Widowed") },
            ],
          },
        ],
      },
      {
        id: "spouse",
        title: l("Informations du futur conjoint", "Future Spouse Information"),
        fields: [
          {
            id: "spouseLastName",
            type: "text",
            label: l("Nom du futur conjoint", "Future spouse's last name"),
            required: true,
          },
          {
            id: "spouseFirstName",
            type: "text",
            label: l(
              "Prénom(s) du futur conjoint",
              "Future spouse's first name(s)",
            ),
            required: true,
          },
          {
            id: "spouseNationality",
            type: "country",
            label: l(
              "Nationalité du futur conjoint",
              "Future spouse's nationality",
            ),
            required: true,
          },
          {
            id: "marriageDate",
            type: "date",
            label: l("Date prévue du mariage", "Planned wedding date"),
            required: false,
          },
        ],
      },
    ],
    joinedDocuments: [
      {
        type: "handwritten_request",
        label: l("Lettre de demande", "Request letter"),
        required: true,
      },
      {
        type: "passport",
        label: l(
          "Passeport gabonais ou CNI",
          "Gabonese passport or national ID",
        ),
        required: true,
      },
      {
        type: "birth_certificate",
        label: l("Acte de naissance gabonais", "Gabonese birth certificate"),
        required: true,
      },
      {
        type: "divorce_judgment",
        label: l(
          "Jugement de divorce (si applicable)",
          "Divorce judgment (if applicable)",
        ),
        required: false,
      },
    ],
    showRecap: true,
  },

  // ═══════════════════════════════════════════════════════════════════
  // CERTIFICAT DE NATIONALITÉ
  // ═══════════════════════════════════════════════════════════════════
  "certificat-nationalite": {
    sections: [
      {
        id: "applicant",
        title: l("Informations du demandeur", "Applicant Information"),
        fields: [
          {
            id: "lastName",
            type: "text",
            label: l("Nom", "Last name"),
            required: true,
          },
          {
            id: "firstName",
            type: "text",
            label: l("Prénom(s)", "First name(s)"),
            required: true,
          },
          {
            id: "birthDate",
            type: "date",
            label: l("Date de naissance", "Date of birth"),
            required: true,
          },
          {
            id: "birthPlace",
            type: "text",
            label: l("Lieu de naissance", "Place of birth"),
            required: true,
          },
          {
            id: "fatherName",
            type: "text",
            label: l("Nom complet du père", "Father's full name"),
            required: true,
          },
          {
            id: "motherName",
            type: "text",
            label: l("Nom complet de la mère", "Mother's full name"),
            required: true,
          },
        ],
      },
    ],
    joinedDocuments: [
      {
        type: "handwritten_request",
        label: l("Lettre de demande", "Request letter"),
        required: true,
      },
      {
        type: "passport",
        label: l(
          "Passeport gabonais ou CNI",
          "Gabonese passport or national ID",
        ),
        required: true,
      },
      {
        type: "birth_certificate",
        label: l("Acte de naissance gabonais", "Gabonese birth certificate"),
        required: true,
      },
      {
        type: "birth_certificate",
        label: l(
          "Actes de naissance/passeports des parents",
          "Parents' birth certificates/passports",
        ),
        required: true,
      },
    ],
    showRecap: true,
  },

  // ═══════════════════════════════════════════════════════════════════
  // CERTIFICAT DE NON-OPPOSITION AU MARIAGE
  // ═══════════════════════════════════════════════════════════════════
  "certificat-non-opposition": {
    sections: [
      {
        id: "applicant",
        title: l("Époux gabonais", "Gabonese Spouse"),
        fields: [
          {
            id: "lastName",
            type: "text",
            label: l("Nom", "Last name"),
            required: true,
          },
          {
            id: "firstName",
            type: "text",
            label: l("Prénom(s)", "First name(s)"),
            required: true,
          },
          {
            id: "birthDate",
            type: "date",
            label: l("Date de naissance", "Date of birth"),
            required: true,
          },
          {
            id: "birthPlace",
            type: "text",
            label: l("Lieu de naissance", "Place of birth"),
            required: true,
          },
        ],
      },
      {
        id: "spouse",
        title: l("Futur conjoint", "Future Spouse"),
        fields: [
          {
            id: "spouseLastName",
            type: "text",
            label: l("Nom du futur conjoint", "Future spouse's last name"),
            required: true,
          },
          {
            id: "spouseFirstName",
            type: "text",
            label: l("Prénom(s)", "First name(s)"),
            required: true,
          },
          {
            id: "spouseBirthDate",
            type: "date",
            label: l("Date de naissance", "Date of birth"),
            required: true,
          },
          {
            id: "spouseNationality",
            type: "country",
            label: l("Nationalité", "Nationality"),
            required: true,
          },
          {
            id: "marriageDate",
            type: "date",
            label: l("Date prévue du mariage", "Planned wedding date"),
            required: true,
          },
          {
            id: "marriagePlace",
            type: "text",
            label: l("Lieu prévu du mariage", "Planned wedding location"),
            required: true,
          },
        ],
      },
    ],
    joinedDocuments: [
      {
        type: "handwritten_request",
        label: l("Lettre de demande", "Request letter"),
        required: true,
      },
      {
        type: "other_official_document",
        label: l("Dossier complet de mariage", "Complete marriage file"),
        required: true,
      },
    ],
    showRecap: true,
  },

  // ═══════════════════════════════════════════════════════════════════
  // TENANT LIEU DE PASSEPORT
  // ═══════════════════════════════════════════════════════════════════
  "tenant-lieu-passeport": {
    sections: [
      {
        id: "applicant",
        title: l("Informations du demandeur", "Applicant Information"),
        fields: [
          {
            id: "lastName",
            type: "text",
            label: l("Nom", "Last name"),
            required: true,
          },
          {
            id: "firstName",
            type: "text",
            label: l("Prénom(s)", "First name(s)"),
            required: true,
          },
          {
            id: "birthDate",
            type: "date",
            label: l("Date de naissance", "Date of birth"),
            required: true,
          },
          {
            id: "birthPlace",
            type: "text",
            label: l("Lieu de naissance", "Place of birth"),
            required: true,
          },
          {
            id: "lossReason",
            type: "select",
            label: l("Raison", "Reason"),
            required: true,
            options: [
              { value: "lost", label: l("Passeport perdu", "Lost passport") },
              {
                value: "stolen",
                label: l("Passeport volé", "Stolen passport"),
              },
              {
                value: "expired",
                label: l("Passeport expiré", "Expired passport"),
              },
              {
                value: "no_passport",
                label: l("Jamais eu de passeport", "Never had a passport"),
              },
            ],
          },
          {
            id: "travelDate",
            type: "date",
            label: l("Date de voyage prévue", "Planned travel date"),
            required: true,
          },
          {
            id: "destination",
            type: "text",
            label: l(
              "Destination (Gabon uniquement)",
              "Destination (Gabon only)",
            ),
            required: true,
          },
        ],
      },
    ],
    joinedDocuments: [
      {
        type: "handwritten_request",
        label: l("Lettre de demande", "Request letter"),
        required: true,
      },
      {
        type: "online_form_printed",
        label: l("Formulaire de demande", "Application form"),
        required: true,
      },
      {
        type: "other_official_document",
        label: l(
          "Document gabonais (passeport expiré, CNI, acte de naissance)",
          "Gabonese document (expired passport, ID, birth certificate)",
        ),
        required: true,
      },
      {
        type: "other_official_document",
        label: l("Billet d'avion", "Plane ticket"),
        required: true,
      },
      {
        type: "identity_photo",
        label: l("2 photos d'identité récentes", "2 recent passport photos"),
        required: true,
      },
    ],
    showRecap: true,
  },

  // ═══════════════════════════════════════════════════════════════════
  // LAISSEZ-PASSER
  // ═══════════════════════════════════════════════════════════════════
  "laissez-passer": {
    sections: [
      {
        id: "applicant",
        title: l("Informations du demandeur", "Applicant Information"),
        fields: [
          {
            id: "lastName",
            type: "text",
            label: l("Nom", "Last name"),
            required: true,
          },
          {
            id: "firstName",
            type: "text",
            label: l("Prénom(s)", "First name(s)"),
            required: true,
          },
          {
            id: "birthDate",
            type: "date",
            label: l("Date de naissance", "Date of birth"),
            required: true,
          },
          {
            id: "birthPlace",
            type: "text",
            label: l("Lieu de naissance", "Place of birth"),
            required: true,
          },
          {
            id: "urgencyReason",
            type: "textarea",
            label: l("Motif d'urgence", "Reason for urgency"),
            required: true,
          },
          {
            id: "travelDate",
            type: "date",
            label: l("Date de voyage prévue", "Planned travel date"),
            required: true,
          },
        ],
      },
    ],
    joinedDocuments: [
      {
        type: "handwritten_request",
        label: l("Lettre de demande", "Request letter"),
        required: true,
      },
      {
        type: "online_form_printed",
        label: l("Formulaire de demande", "Application form"),
        required: true,
      },
      {
        type: "other_official_document",
        label: l(
          "Document gabonais (passeport expiré, CNI, acte de naissance)",
          "Gabonese document (expired passport, ID, birth certificate)",
        ),
        required: true,
      },
      {
        type: "other_official_document",
        label: l("Billet d'avion", "Plane ticket"),
        required: true,
      },
      {
        type: "identity_photo",
        label: l("2 photos d'identité récentes", "2 recent passport photos"),
        required: true,
      },
    ],
    showRecap: true,
  },

  // ═══════════════════════════════════════════════════════════════════
  // LÉGALISATION DE DOCUMENTS
  // ═══════════════════════════════════════════════════════════════════
  "legalisation-documents": {
    sections: [
      {
        id: "applicant",
        title: l("Informations du demandeur", "Applicant Information"),
        fields: [
          {
            id: "lastName",
            type: "text",
            label: l("Nom", "Last name"),
            required: true,
          },
          {
            id: "firstName",
            type: "text",
            label: l("Prénom(s)", "First name(s)"),
            required: true,
          },
          {
            id: "phone",
            type: "tel",
            label: l("Téléphone", "Phone"),
            required: true,
          },
          {
            id: "email",
            type: "email",
            label: l("Email", "Email"),
            required: false,
          },
        ],
      },
      {
        id: "documents",
        title: l("Documents à légaliser", "Documents to Legalize"),
        fields: [
          {
            id: "documentType",
            type: "select",
            label: l("Type de document", "Document type"),
            required: true,
            options: [
              {
                value: "birth_certificate",
                label: l("Acte de naissance", "Birth certificate"),
              },
              {
                value: "marriage_certificate",
                label: l("Acte de mariage", "Marriage certificate"),
              },
              {
                value: "death_certificate",
                label: l("Acte de décès", "Death certificate"),
              },
              {
                value: "notarial_act",
                label: l("Acte notarié", "Notarial act"),
              },
              {
                value: "administrative",
                label: l("Acte administratif", "Administrative document"),
              },
              { value: "other", label: l("Autre", "Other") },
            ],
          },
          {
            id: "numberOfCopies",
            type: "number",
            label: l("Nombre de copies", "Number of copies"),
            required: true,
          },
          {
            id: "purpose",
            type: "textarea",
            label: l("Motif de la légalisation", "Purpose of legalization"),
            required: false,
          },
        ],
      },
    ],
    joinedDocuments: [
      {
        type: "handwritten_request",
        label: l("Lettre de demande", "Request letter"),
        required: true,
      },
      {
        type: "other_official_document",
        label: l(
          "Original du document à légaliser",
          "Original document to be legalized",
        ),
        required: true,
      },
      {
        type: "other_official_document",
        label: l("Copies du document (2 max)", "Document copies (2 max)"),
        required: false,
      },
    ],
    showRecap: true,
  },
};

/**
 * Seed formSchemas into existing services
 * Run: npx convex run seeds/serviceFormSchemas:seedFormSchemas
 */
export const seedFormSchemas = mutation({
  args: {},
  handler: async (ctx) => {
    const results = {
      updated: 0,
      skipped: 0,
      notFound: [] as string[],
      errors: [] as string[],
    };

    for (const [slug, formSchema] of Object.entries(FORM_SCHEMAS)) {
      try {
        const service = await ctx.db
          .query("services")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .first();

        if (!service) {
          results.notFound.push(slug);
          continue;
        }

        // Skip if already has formSchema with sections
        if (
          service.formSchema?.sections &&
          service.formSchema.sections.length > 0
        ) {
          results.skipped++;
          continue;
        }

        await ctx.db.patch(service._id, {
          formSchema: formSchema as any,
          updatedAt: Date.now(),
        });
        results.updated++;
      } catch (error) {
        results.errors.push(
          `${slug}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return results;
  },
});
