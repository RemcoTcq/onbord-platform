export const DOMAINS = ["Finance", "Business & Sales", "Marketing", "IT & Software"] as const;

export const HARD_SKILLS_MAP: Record<string, string[]> = {
  Finance: ["SAS", "Stata", "Gretl", "PowerBI", "Tableau", "QlikView", "Qualtrics", "Octopus", "Wolters Kluwer", "Yuki", "Exact Online", "ProAcc", "Winbooks", "Xero Accounting", "SPSS"],
  Marketing: ["Email Marketing", "Social Media Advertising", "Google Analytics", "SEO", "SEA", "Google Tag Manager"],
  "Business & Sales": ["CRM", "ERP", "Navision", "SAP", "Microsoft SharePoint", "Salesforce", "Oracle"],
  "IT & Software": ["HTML/CSS", "Docker", "PHP", "SQL", "C/C++", ".NET", "Java", "Ruby on Rails", "Swift", "React.js", "Ember.js", "CodeIgniter", "Scala", "Python", "NumPy", "Ubuntu", "Pandas", "JavaScript", "Angular.js", "Linux", "SAP", "Azure", "Django", "Node.js", "WordPress", "Shopify", "Vue.js"],
};

export const SOFT_SKILLS = [
  "Communication", "Travail en équipe", "Autonomie", "Proactivité", "Organisation",
  "Adaptabilité", "Gestion du temps", "Esprit analytique", "Résolution de problèmes",
  "Créativité", "Leadership", "Rigueur", "Sens du détail", "Esprit critique", "Orientation résultats",
];

export const LANGUAGES = ["Français", "Anglais", "Néerlandais"];

export const DIPLOMAS = ["Bachelier", "Master", "Indifférent"] as const;

export const STATUSES = [
  "Demande validée",
  "Recherche des profils",
  "Présentation des profils",
  "Profils validés",
  "Mission lancée",
] as const;

export const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"] as const;

export const HOURLY_RATE = 27;
