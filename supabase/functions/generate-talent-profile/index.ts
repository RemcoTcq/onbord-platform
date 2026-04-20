const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT =
  "Tu es un assistant de recrutement. Analyse la description donnée et retourne uniquement un JSON avec ces champs : { domain: string, hardSkills: string[], softSkills: string[], talentType: 'Étudiant' | 'Jeune diplômé', diplome: 'Bachelier' | 'Master' | null }";

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
                  domain: { type: "string" },
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

    // Map talentType to internal value
    const talentTypeInternal = parsed.talentType === "Jeune diplômé" ? "graduate" : "student";

    // Match domain against known list (case-insensitive)
    const DOMAINS = ["Finance", "Business & Sales", "Marketing", "IT & Software", "Administration", "Ingénierie"];
    const domainMatch =
      DOMAINS.find((d) => d.toLowerCase() === String(parsed.domain || "").toLowerCase()) ||
      DOMAINS.find((d) => String(parsed.domain || "").toLowerCase().includes(d.toLowerCase())) ||
      DOMAINS.find((d) => d.toLowerCase().includes(String(parsed.domain || "").toLowerCase())) ||
      "";

    return new Response(
      JSON.stringify({
        domain: domainMatch,
        hardSkills: Array.isArray(parsed.hardSkills) ? parsed.hardSkills : [],
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
