import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { candidateId } = await req.json();
    if (!candidateId) {
      return new Response(JSON.stringify({ error: "candidateId requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: candidate } = await supabase
      .from("candidates")
      .select("id, cv_text, request_id, first_name, last_name")
      .eq("id", candidateId)
      .single();

    if (!candidate) {
      return new Response(JSON.stringify({ error: "Candidat introuvable" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: request } = await supabase
      .from("requests")
      .select("title, description, skills, custom_skills, nice_to_have_skills, soft_skills, languages, diploma, talent_type")
      .eq("id", candidate.request_id)
      .single();

    const { data: config } = await supabase
      .from("request_scoring_config")
      .select("cv_criteria, cv_weight, interview_weight, green_threshold, yellow_threshold")
      .eq("request_id", candidate.request_id)
      .maybeSingle();

    const cvText = (candidate.cv_text || "").slice(0, 12000);
    if (cvText.length < 50) {
      return new Response(JSON.stringify({ error: "CV non parsé ou trop court" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const criteria = config?.cv_criteria as any || {};
    const langs = (request?.languages as any[] || []).map((l) => `${l.name} (niv ${l.level}/5)`).join(", ");

    const systemPrompt = `Tu es un recruteur expert. Tu évalues un CV par rapport à un poste avec des critères pondérés.
Pour CHAQUE critère, donne un score 0-100 et une justification courte.
Calcule le score CV global comme moyenne pondérée selon les pondérations fournies.
Identifie 2-4 forces, 2-4 préoccupations, et un résumé de 2 phrases max.`;

    const userPrompt = `POSTE: ${request?.title}
Description: ${request?.description || "-"}
Type: ${request?.talent_type}
Hard skills must-have: ${(request?.skills || []).join(", ")}
Hard skills nice-to-have: ${(request?.nice_to_have_skills || []).join(", ")}
Soft skills: ${(request?.soft_skills || []).join(", ")}
Langues: ${langs}
Diplôme attendu: ${request?.diploma || "-"}

PONDÉRATIONS CRITÈRES (total 100):
${Object.entries(criteria).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

CV DU CANDIDAT (${candidate.first_name} ${candidate.last_name}):
${cvText}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_cv_score",
              description: "Soumet le score CV structuré",
              parameters: {
                type: "object",
                properties: {
                  cv_score: { type: "integer", minimum: 0, maximum: 100 },
                  breakdown: {
                    type: "object",
                    description: "Score 0-100 par critère",
                    additionalProperties: { type: "integer" },
                  },
                  strengths: { type: "array", items: { type: "string" }, maxItems: 4 },
                  concerns: { type: "array", items: { type: "string" }, maxItems: 4 },
                  summary: { type: "string", maxLength: 400 },
                },
                required: ["cv_score", "breakdown", "strengths", "concerns", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_cv_score" } },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("AI gateway error:", res.status, t);
      if (res.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit atteint, réessaie plus tard." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (res.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Scoring IA échoué");
    }

    const j = await res.json();
    const toolCall = j.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Pas de tool_call dans la réponse");
    const args = JSON.parse(toolCall.function.arguments);

    const cvScore = Math.max(0, Math.min(100, args.cv_score));
    // Recompute global with current config (interview_score may not exist yet)
    const cvWeight = Number(config?.cv_weight ?? 0.6);
    const globalScore = Math.round(cvScore * cvWeight); // interview = 0 for now

    const greenT = config?.green_threshold ?? 80;
    const yellowT = config?.yellow_threshold ?? 60;
    // Compute provisional flag based on cv_score alone (will be recomputed after interview)
    const flag = cvScore >= greenT ? "green" : cvScore >= yellowT ? "yellow" : "red";

    await supabase.from("candidate_scores").upsert(
      {
        candidate_id: candidateId,
        cv_score: cvScore,
        cv_breakdown: args.breakdown,
        ai_strengths: args.strengths,
        ai_concerns: args.concerns,
        ai_summary: args.summary,
        global_score: globalScore,
        flag,
        scored_at: new Date().toISOString(),
      },
      { onConflict: "candidate_id" }
    );

    await supabase.from("candidates").update({ status: "cv_scored" }).eq("id", candidateId);

    return new Response(
      JSON.stringify({ success: true, cv_score: cvScore, flag }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("score-cv error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
