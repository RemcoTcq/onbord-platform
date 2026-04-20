const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DOMAINS = ["Finance", "Business & Sales", "Marketing", "IT & Software", "Administration", "Ingénierie"] as const;

const HARD_SKILLS_MAP: Record<string, string[]> = {
  Finance: ["SAS", "Stata", "Gretl", "PowerBI", "Tableau", "QlikView", "Qualtrics", "Octopus", "Wolters Kluwer", "Yuki", "Exact Online", "ProAcc", "Winbooks", "Xero Accounting", "SPSS"],
  Marketing: ["Email Marketing", "Social Media Advertising", "Google Analytics", "SEO", "SEA", "Google Tag Manager"],
  "Business & Sales": ["CRM", "ERP", "Navision", "SAP", "Microsoft SharePoint", "Salesforce", "Oracle"],
  "IT & Software": ["HTML/CSS", "Docker", "PHP", "SQL", "C/C++", ".NET", "Java", "Ruby on Rails", "Swift", "React.js", "Ember.js", "CodeIgniter", "Scala", "Python", "NumPy", "Ubuntu", "Pandas", "JavaScript", "Angular.js", "Linux", "SAP", "Azure", "Django", "Node.js", "WordPress", "Shopify", "Vue.js"],
  Administration: ["Microsoft Excel", "Microsoft Outlook", "Microsoft Word", "Google Workspace", "Gestion administrative", "Gestion d'emails", "Organisation & planning"],
  "Ingénierie": ["AutoCAD", "Autodesk", "SolidWorks", "Solid Edge", "Siemens PLC", "Siemens NX", "Matlab", "EPLAN", "R Studio", "Vectorworks", "Revit", "Archicad", "LaTeX", "Primavera", "Inventor", "Arduino", "Sony Vegas", "Raspberry Pi"],
};

const ALL_HARD_SKILLS = Array.from(new Set(Object.values(HARD_SKILLS_MAP).flat()));

const SOFT_SKILLS = [
  "Communication", "Travail en équipe", "Autonomie", "Proactivité", "Organisation",
  "Adaptabilité", "Gestion du temps", "Esprit analytique", "Résolution de problèmes",
  "Créativité", "Leadership", "Rigueur", "Sens du détail", "Esprit critique", "Orientation résultats",
] as const;

const SKILL_ALIASES: Record<string, string> = {
  "react": "React.js",
  "reactjs": "React.js",
  "react js": "React.js",
  "node": "Node.js",
  "nodejs": "Node.js",
  "node js": "Node.js",
  "vue": "Vue.js",
  "vuejs": "Vue.js",
  "angular": "Angular.js",
  "angularjs": "Angular.js",
  "ember": "Ember.js",
  "js": "JavaScript",
  "html": "HTML/CSS",
  "css": "HTML/CSS",
  "html/css": "HTML/CSS",
  "c++": "C/C++",
  "c": "C/C++",
  "dotnet": ".NET",
  ".net": ".NET",
  "ruby": "Ruby on Rails",
  "rails": "Ruby on Rails",
  "excel": "Microsoft Excel",
  "ms excel": "Microsoft Excel",
  "outlook": "Microsoft Outlook",
  "word": "Microsoft Word",
  "ms word": "Microsoft Word",
  "sharepoint": "Microsoft SharePoint",
  "google sheets": "Google Workspace",
  "gsuite": "Google Workspace",
  "g suite": "Google Workspace",
  "ga": "Google Analytics",
  "google ads": "SEA",
  "tag manager": "Google Tag Manager",
  "gtm": "Google Tag Manager",
};

const SOFT_SKILL_ALIASES: Record<string, string> = {
  "communication": "Communication",
  "communiquer": "Communication",
  "bon communicant": "Communication",
  "teamwork": "Travail en équipe",
  "travail en equipe": "Travail en équipe",
  "esprit d'equipe": "Travail en équipe",
  "esprit d equipe": "Travail en équipe",
  "autonome": "Autonomie",
  "autonomie": "Autonomie",
  "proactif": "Proactivité",
  "proactive": "Proactivité",
  "proactivite": "Proactivité",
  "organise": "Organisation",
  "organisation": "Organisation",
  "adaptable": "Adaptabilité",
  "adaptabilite": "Adaptabilité",
  "flexible": "Adaptabilité",
  "gestion du temps": "Gestion du temps",
  "time management": "Gestion du temps",
  "analytique": "Esprit analytique",
  "esprit analytique": "Esprit analytique",
  "analytical": "Esprit analytique",
  "resolution de problemes": "Résolution de problèmes",
  "problem solving": "Résolution de problèmes",
  "creatif": "Créativité",
  "creative": "Créativité",
  "creativite": "Créativité",
  "leader": "Leadership",
  "leadership": "Leadership",
  "rigoureux": "Rigueur",
  "rigueur": "Rigueur",
  "rigorous": "Rigueur",
  "sens du detail": "Sens du détail",
  "detail oriented": "Sens du détail",
  "esprit critique": "Esprit critique",
  "critical thinking": "Esprit critique",
  "orientation resultats": "Orientation résultats",
  "results oriented": "Orientation résultats",
};

const DOMAIN_ALIASES: Record<string, string> = {
  "it": "IT & Software",
  "tech": "IT & Software",
  "software": "IT & Software",
  "développement": "IT & Software",
  "developpement": "IT & Software",
  "informatique": "IT & Software",
  "dev": "IT & Software",
  "finance": "Finance",
  "comptabilité": "Finance",
  "comptabilite": "Finance",
  "marketing": "Marketing",
  "communication": "Marketing",
  "vente": "Business & Sales",
  "ventes": "Business & Sales",
  "sales": "Business & Sales",
  "business": "Business & Sales",
  "commercial": "Business & Sales",
  "admin": "Administration",
  "administratif": "Administration",
  "administration": "Administration",
  "secrétariat": "Administration",
  "secretariat": "Administration",
  "ingénierie": "Ingénierie",
  "ingenierie": "Ingénierie",
  "engineering": "Ingénierie",
  "ingénieur": "Ingénierie",
  "ingenieur": "Ingénierie",
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function matchDomain(raw: string): string {
  const n = normalize(raw);
  if (!n) return "";
  for (const d of DOMAINS) {
    if (normalize(d) === n) return d;
  }
  if (DOMAIN_ALIASES[n]) return DOMAIN_ALIASES[n];
  for (const [alias, d] of Object.entries(DOMAIN_ALIASES)) {
    if (n.includes(alias) || alias.includes(n)) return d;
  }
  for (const d of DOMAINS) {
    const nd = normalize(d);
    if (nd.includes(n) || n.includes(nd)) return d;
  }
  return "";
}

function matchInCatalog(raw: string, catalog: string[], aliases: Record<string, string>): string | null {
  const n = normalize(raw);
  if (!n) return null;
  for (const c of catalog) {
    if (normalize(c) === n) return c;
  }
  if (aliases[n]) {
    const target = aliases[n];
    if (catalog.includes(target)) return target;
  }
  for (const c of catalog) {
    const nc = normalize(c);
    if (nc === n) return c;
    if (nc.includes(n) && n.length >= 3) return c;
    if (n.includes(nc) && nc.length >= 3) return c;
  }
  return null;
}

const SYSTEM_PROMPT = `Tu es un assistant de recrutement. Analyse la description donnée et retourne uniquement un JSON structuré via la fonction extract_profile.

Domaines disponibles (choisis exactement UN parmi cette liste) :
${DOMAINS.map((d) => `- ${d}`).join("\n")}

Hard skills disponibles par domaine (tu DOIS choisir UNIQUEMENT des skills du domaine sélectionné, à l'identique) :
${Object.entries(HARD_SKILLS_MAP)
  .map(([d, skills]) => `${d}: ${skills.join(", ")}`)
  .join("\n")}

Soft skills disponibles (liste FERMÉE, choisis UNIQUEMENT parmi celle-ci, à l'identique) :
${SOFT_SKILLS.join(", ")}

RÈGLES STRICTES :
- domain : DOIT être un des 6 domaines listés ci-dessus, à l'identique (avec accents et casse).
- hardSkills : tableau de skills issus EXCLUSIVEMENT du catalogue du domaine choisi, à l'identique. INTERDIT d'inventer ou paraphraser un skill. Si un besoin exprimé n'a pas d'équivalent dans la liste (ex: "cold calling", "prospection", "TypeScript", "Figma"), NE LE METS PAS — laisse-le de côté, l'utilisateur l'ajoutera lui-même.
- softSkills : tableau strictement issu de la liste fermée des soft skills ci-dessus, à l'identique. INTERDIT d'inventer.
- Un savoir-faire technique, un outil, une méthode commerciale ou métier (ex: cold calling, prospection, négociation, comptabilité, design) n'est JAMAIS un soft skill. Les soft skills sont uniquement des traits comportementaux génériques.
- Si tu hésites pour un item, NE LE METS PAS plutôt que de le mettre au mauvais endroit ou de l'inventer.
- talentType : "Étudiant" si stage/job étudiant/temps partiel, "Jeune diplômé" si poste à temps plein/CDI/après diplôme.
- diplome : "Bachelier", "Master" ou null si non précisé.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description } = await req.json();
    if (!description || typeof description !== "string") {
      return new Response(JSON.stringify({ error: "description requise" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: description },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_profile",
              description: "Extrait le profil structuré à partir de la description.",
              parameters: {
                type: "object",
                properties: {
                  domain: { type: "string", enum: [...DOMAINS] },
                  hardSkills: {
                    type: "array",
                    items: { type: "string", enum: ALL_HARD_SKILLS },
                  },
                  softSkills: {
                    type: "array",
                    items: { type: "string", enum: [...SOFT_SKILLS] },
                  },
                  talentType: { type: "string", enum: ["Étudiant", "Jeune diplômé"] },
                  diplome: { type: ["string", "null"], enum: ["Bachelier", "Master", null] },
                },
                required: ["domain", "hardSkills", "softSkills", "talentType", "diplome"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_profile" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA épuisés, ajoutez des fonds dans votre espace Lovable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await aiResp.json();
    const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Réponse IA invalide" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    const talentTypeInternal = parsed.talentType === "Jeune diplômé" ? "graduate" : "student";
    const domain = matchDomain(String(parsed.domain || ""));

    // Filter hard skills strictly against the catalog of the matched domain.
    const hardCatalog = domain ? HARD_SKILLS_MAP[domain] || [] : [];
    const matchedHardSkills: string[] = [];
    const seenHard = new Set<string>();

    if (Array.isArray(parsed.hardSkills) && hardCatalog.length > 0) {
      for (const raw of parsed.hardSkills) {
        if (typeof raw !== "string") continue;
        const m = matchInCatalog(raw, hardCatalog, SKILL_ALIASES);
        if (m && !seenHard.has(m)) {
          matchedHardSkills.push(m);
          seenHard.add(m);
        }
      }
    }

    // Filter soft skills strictly against the closed soft skills catalog.
    const softCatalog = [...SOFT_SKILLS];
    const matchedSoftSkills: string[] = [];
    const seenSoft = new Set<string>();

    if (Array.isArray(parsed.softSkills)) {
      for (const raw of parsed.softSkills) {
        if (typeof raw !== "string") continue;
        const m = matchInCatalog(raw, softCatalog, SOFT_SKILL_ALIASES);
        if (m && !seenSoft.has(m)) {
          matchedSoftSkills.push(m);
          seenSoft.add(m);
        }
      }
    }

    return new Response(
      JSON.stringify({
        domain,
        hardSkills: matchedHardSkills,
        softSkills: matchedSoftSkills,
        talentType: talentTypeInternal,
        diplome: parsed.diplome ?? null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-talent-profile error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
