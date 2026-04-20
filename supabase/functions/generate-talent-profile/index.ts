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

const SKILL_ALIASES: Record<string, string> = {
  // IT
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
  "ts": "JavaScript",
  "typescript": "JavaScript",
  "html": "HTML/CSS",
  "css": "HTML/CSS",
  "html/css": "HTML/CSS",
  "c++": "C/C++",
  "c": "C/C++",
  "dotnet": ".NET",
  ".net": ".NET",
  "ruby": "Ruby on Rails",
  "rails": "Ruby on Rails",
  // Office
  "excel": "Microsoft Excel",
  "ms excel": "Microsoft Excel",
  "outlook": "Microsoft Outlook",
  "word": "Microsoft Word",
  "ms word": "Microsoft Word",
  "sharepoint": "Microsoft SharePoint",
  "google sheets": "Google Workspace",
  "gsuite": "Google Workspace",
  "g suite": "Google Workspace",
  // Marketing
  "ga": "Google Analytics",
  "google ads": "SEA",
  "tag manager": "Google Tag Manager",
  "gtm": "Google Tag Manager",
  // Domain hints handled separately
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
  // Exact match against catalog
  for (const d of DOMAINS) {
    if (normalize(d) === n) return d;
  }
  // Alias
  if (DOMAIN_ALIASES[n]) return DOMAIN_ALIASES[n];
  for (const [alias, d] of Object.entries(DOMAIN_ALIASES)) {
    if (n.includes(alias) || alias.includes(n)) return d;
  }
  // Includes
  for (const d of DOMAINS) {
    const nd = normalize(d);
    if (nd.includes(n) || n.includes(nd)) return d;
  }
  return "";
}

function matchSkill(raw: string, catalog: string[]): string | null {
  const n = normalize(raw);
  if (!n) return null;
  // Exact normalized
  for (const c of catalog) {
    if (normalize(c) === n) return c;
  }
  // Alias map
  if (SKILL_ALIASES[n]) {
    const target = SKILL_ALIASES[n];
    if (catalog.includes(target)) return target;
  }
  // Partial includes
  for (const c of catalog) {
    const nc = normalize(c);
    if (nc.includes(n) || n.includes(nc)) return c;
  }
  return null;
}

const SYSTEM_PROMPT = `Tu es un assistant de recrutement. Analyse la description donnée et retourne uniquement un JSON structuré via la fonction extract_profile.

Domaines disponibles (choisis exactement UN parmi cette liste) :
${DOMAINS.map((d) => `- ${d}`).join("\n")}

Hard skills disponibles par domaine (choisis UNIQUEMENT des skills du domaine sélectionné) :
${Object.entries(HARD_SKILLS_MAP)
  .map(([d, skills]) => `${d}: ${skills.join(", ")}`)
  .join("\n")}

Règles :
- domain : DOIT être un des 6 domaines listés ci-dessus, à l'identique (avec accents et casse).
- hardSkills : tableau de skills issus EXCLUSIVEMENT du catalogue du domaine choisi, à l'identique.
- Si la description mentionne une techno absente du catalogue (ex: TypeScript, Figma), ne la mets PAS dans hardSkills.
- softSkills : compétences comportementales libres (ex: Communication, Autonomie).
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
                  hardSkills: { type: "array", items: { type: "string" } },
                  softSkills: { type: "array", items: { type: "string" } },
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

    // Map talentType
    const talentTypeInternal = parsed.talentType === "Jeune diplômé" ? "graduate" : "student";

    // Match domain robustly
    const domain = matchDomain(String(parsed.domain || ""));

    // Match hard skills against the catalog of the matched domain
    const catalog = domain ? HARD_SKILLS_MAP[domain] || [] : [];
    const matchedHardSkills: string[] = [];
    const customHardSkills: string[] = [];
    const seen = new Set<string>();

    if (Array.isArray(parsed.hardSkills)) {
      for (const raw of parsed.hardSkills) {
        if (typeof raw !== "string") continue;
        const m = catalog.length ? matchSkill(raw, catalog) : null;
        if (m && !seen.has(m)) {
          matchedHardSkills.push(m);
          seen.add(m);
        } else if (!m) {
          const key = normalize(raw);
          if (key && !seen.has(key)) {
            customHardSkills.push(raw);
            seen.add(key);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        domain,
        hardSkills: matchedHardSkills,
        customHardSkills,
        softSkills: Array.isArray(parsed.softSkills) ? parsed.softSkills : [],
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
