import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Public function (no auth) — uses service role internally, validated by token
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token || token.length < 20) {
      return new Response(JSON.stringify({ error: "Token invalide" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: session } = await admin
      .from("interview_sessions")
      .select("id, candidate_id, status, expires_at, started_at, completed_at")
      .eq("token", token)
      .maybeSingle();

    if (!session) {
      return new Response(JSON.stringify({ error: "Session introuvable" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(session.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Lien expiré" }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: candidate } = await admin
      .from("candidates")
      .select("first_name, last_name, request_id")
      .eq("id", session.candidate_id)
      .single();

    const { data: request } = await admin
      .from("requests")
      .select("title")
      .eq("id", candidate?.request_id)
      .single();

    const { data: messages } = await admin
      .from("interview_messages")
      .select("role, content, created_at")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });

    return new Response(
      JSON.stringify({
        session: {
          id: session.id,
          status: session.status,
          completed_at: session.completed_at,
        },
        candidate: { first_name: candidate?.first_name, last_name: candidate?.last_name },
        request: { title: request?.title },
        messages: messages || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("get-interview-session error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
