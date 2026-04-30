import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Public — token-validated. Sends candidate message + returns AI reply.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token, message } = await req.json();
    if (!token || typeof token !== "string" || token.length < 20) {
      return new Response(JSON.stringify({ error: "Token invalide" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof message !== "string" || message.trim().length === 0 || message.length > 3000) {
      return new Response(JSON.stringify({ error: "Message invalide (1-3000 car.)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: session } = await admin
      .from("interview_sessions")
      .select("id, candidate_id, status, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (!session) {
      return new Response(JSON.stringify({ error: "Session introuvable" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (session.status === "completed") {
      return new Response(JSON.stringify({ error: "Entretien déjà terminé" }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (new Date(session.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Lien expiré" }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: candidate } = await admin
      .from("candidates")
      .select("first_name, last_name, cv_text, request_id")
      .eq("id", session.candidate_id)
      .single();

    const { data: request } = await admin
      .from("requests")
      .select("title, description, talent_type, soft_skills")
      .eq("id", candidate?.request_id)
      .single();

    const { data: config } = await admin
      .from("request_scoring_config")
      .select("interview_questions, use_ai_generated_questions, interview_max_turns")
      .eq("request_id", candidate?.request_id)
      .maybeSingle();

    const { data: history } = await admin
      .from("interview_messages")
      .select("role, content")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });

    // Mark started
    if (session.status === "pending") {
      await admin
        .from("interview_sessions")
        .update({ status: "in_progress", started_at: new Date().toISOString() })
        .eq("id", session.id);
    }

    // Insert candidate msg
    await admin.from("interview_messages").insert({
      session_id: session.id,
      role: "user",
      content: message.trim(),
    });

    // Count exchanges (user messages)
    const userMsgCount = (history || []).filter((m) => m.role === "user").length + 1;
    const maxTurns = config?.interview_max_turns ?? 8;
    const isLastTurn = userMsgCount >= maxTurns;

    const customQs = (config?.interview_questions as string[] | undefined) || [];
    const useAi = config?.use_ai_generated_questions ?? true;

    const systemPrompt = `Tu es un recruteur IA bienveillant menant un entretien CONVERSATIONNEL en français pour découvrir la personne (motivations, soft skills, fit culturel).
Poste : "${request?.title}" (${request?.talent_type}).
${request?.description ? `Contexte : ${request.description.slice(0, 500)}` : ""}
Soft skills recherchés : ${(request?.soft_skills || []).join(", ") || "non précisés"}.

RÈGLES :
- Pose UNE seule question à la fois, courte et ouverte.
- Sois chaleureux, encourage le candidat.
- Maximum ${maxTurns} échanges (actuellement : ${userMsgCount}/${maxTurns}).
${customQs.length > 0 ? `- Couvre OBLIGATOIREMENT ces thèmes du recruteur :\n${customQs.map((q, i) => `  ${i + 1}. ${q}`).join("\n")}` : ""}
${useAi ? "- Tu peux ajouter tes propres questions pertinentes." : "- Reste strictement sur les questions du recruteur."}
${isLastTurn ? "- C'EST LE DERNIER TOUR : remercie le candidat, dis-lui que l'équipe va revenir vers lui, et termine ton message par exactement [FIN_ENTRETIEN]." : ""}

Si c'est le tout début (pas d'historique), commence par te présenter brièvement et pose la première question.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message.trim() },
    ];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessaie dans un instant." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Service indisponible." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiJson = await aiRes.json();
    const reply: string = aiJson.choices?.[0]?.message?.content || "";
    const finished = reply.includes("[FIN_ENTRETIEN]") || isLastTurn;
    const cleanReply = reply.replace("[FIN_ENTRETIEN]", "").trim();

    await admin.from("interview_messages").insert({
      session_id: session.id,
      role: "assistant",
      content: cleanReply,
    });

    if (finished) {
      await admin
        .from("interview_sessions")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", session.id);
      // Trigger interview scoring (fire & forget)
      admin.functions.invoke("score-interview", {
        body: { sessionId: session.id },
      }).catch((e) => console.error("score-interview trigger failed:", e));
    }

    return new Response(
      JSON.stringify({ reply: cleanReply, finished }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("interview-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
