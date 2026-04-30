import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "sessionId requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: session } = await admin
      .from("interview_sessions")
      .select("id, candidate_id")
      .eq("id", sessionId)
      .single();

    if (!session) throw new Error("Session introuvable");

    const { data: candidate } = await admin
      .from("candidates")
      .select("id, request_id, first_name, last_name")
      .eq("id", session.candidate_id)
      .single();

    const { data: request } = await admin
      .from("requests")
      .select("title, soft_skills, talent_type")
      .eq("id", candidate?.request_id)
      .single();

    const { data: config } = await admin
      .from("request_scoring_config")
      .select("cv_weight, interview_weight, green_threshold, yellow_threshold")
      .eq("request_id", candidate?.request_id)
      .maybeSingle();

    const { data: messages } = await admin
      .from("interview_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    const transcript = (messages || [])
      .map((m) => `${m.role === "user" ? "CANDIDAT" : "RECRUTEUR"}: ${m.content}`)
      .join("\n\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              "Tu évalues un entretien découverte d'un candidat (motivation, fit, soft skills, communication). Donne un score 0-100 et un breakdown.",
          },
          {
            role: "user",
            content: `POSTE: ${request?.title} (${request?.talent_type})
Soft skills attendus: ${(request?.soft_skills || []).join(", ")}

ENTRETIEN AVEC ${candidate?.first_name} ${candidate?.last_name}:
${transcript}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_interview_score",
              description: "Score d'entretien structuré",
              parameters: {
                type: "object",
                properties: {
                  interview_score: { type: "integer", minimum: 0, maximum: 100 },
                  breakdown: {
                    type: "object",
                    additionalProperties: { type: "integer" },
                  },
                  strengths: { type: "array", items: { type: "string" }, maxItems: 4 },
                  concerns: { type: "array", items: { type: "string" }, maxItems: 4 },
                  summary: { type: "string", maxLength: 500 },
                },
                required: ["interview_score", "breakdown", "strengths", "concerns", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_interview_score" } },
      }),
    });

    if (!res.ok) throw new Error(`AI error ${res.status}`);
    const j = await res.json();
    const args = JSON.parse(j.choices[0].message.tool_calls[0].function.arguments);
    const intScore = Math.max(0, Math.min(100, args.interview_score));

    // Get existing CV score and recompute global
    const { data: existing } = await admin
      .from("candidate_scores")
      .select("cv_score, ai_strengths, ai_concerns, ai_summary")
      .eq("candidate_id", candidate?.id)
      .maybeSingle();

    const cvScore = existing?.cv_score ?? 0;
    const cvWeight = Number(config?.cv_weight ?? 0.6);
    const intWeight = Number(config?.interview_weight ?? 0.4);
    const globalScore = Math.round(cvScore * cvWeight + intScore * intWeight);

    const greenT = config?.green_threshold ?? 80;
    const yellowT = config?.yellow_threshold ?? 60;
    const flag = globalScore >= greenT ? "green" : globalScore >= yellowT ? "yellow" : "red";

    await admin.from("candidate_scores").upsert(
      {
        candidate_id: candidate?.id,
        interview_score: intScore,
        interview_breakdown: args.breakdown,
        ai_strengths: [...(existing?.ai_strengths || []), ...args.strengths].slice(0, 6),
        ai_concerns: [...(existing?.ai_concerns || []), ...args.concerns].slice(0, 6),
        ai_summary: existing?.ai_summary
          ? `${existing.ai_summary}\n\nEntretien: ${args.summary}`
          : args.summary,
        global_score: globalScore,
        flag,
        scored_at: new Date().toISOString(),
      },
      { onConflict: "candidate_id" }
    );

    await admin
      .from("candidates")
      .update({ status: "interview_scored" })
      .eq("id", candidate?.id);

    return new Response(
      JSON.stringify({ success: true, interview_score: intScore, global_score: globalScore, flag }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("score-interview error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
