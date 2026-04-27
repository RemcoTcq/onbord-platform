export const DOMAINS = ["Finance", "Business & Sales", "Marketing", "IT & Software", "Administration", "Ingénierie"] as const;

export const HARD_SKILLS_MAP: Record<string, string[]> = {
  Finance: ["SAS", "Stata", "Gretl", "PowerBI", "Tableau", "QlikView", "Qualtrics", "Octopus", "Wolters Kluwer", "Yuki", "Exact Online", "ProAcc", "Winbooks", "Xero Accounting", "SPSS"],
  Marketing: ["Email Marketing", "Social Media Advertising", "Google Analytics", "SEO", "SEA", "Google Tag Manager"],
  "Business & Sales": ["CRM", "ERP", "Navision", "SAP", "Microsoft SharePoint", "Salesforce", "Oracle"],
  "IT & Software": ["HTML/CSS", "Docker", "PHP", "SQL", "C/C++", ".NET", "Java", "Ruby on Rails", "Swift", "React.js", "Ember.js", "CodeIgniter", "Scala", "Python", "NumPy", "Ubuntu", "Pandas", "JavaScript", "Angular.js", "Linux", "SAP", "Azure", "Django", "Node.js", "WordPress", "Shopify", "Vue.js"],
  Administration: ["Microsoft Excel", "Microsoft Outlook", "Microsoft Word", "Google Workspace", "Gestion administrative", "Gestion d'emails", "Organisation & planning"],
  "Ingénierie": ["AutoCAD", "Autodesk", "SolidWorks", "Solid Edge", "Siemens PLC", "Siemens NX", "Matlab", "EPLAN", "R Studio", "Vectorworks", "Revit", "Archicad", "LaTeX", "Primavera", "Inventor", "Arduino", "Sony Vegas", "Raspberry Pi"],
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
  "Profils en cours de sélection",
  "Profils envoyés",
  "Profils validés",
  "Entretien en cours d'organisation",
  "Recrutement finalisé",
] as const;

export const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"] as const;

export const HOURLY_RATE = 27;
