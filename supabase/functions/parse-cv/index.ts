import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";

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
    if (!candidateId || typeof candidateId !== "string") {
      return new Response(JSON.stringify({ error: "candidateId requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: candidate, error: cErr } = await supabase
      .from("candidates")
      .select("id, cv_storage_path, request_id")
      .eq("id", candidateId)
      .single();

    if (cErr || !candidate || !candidate.cv_storage_path) {
      return new Response(JSON.stringify({ error: "Candidat ou CV introuvable" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download the CV from storage
    const { data: fileBlob, error: dErr } = await supabase.storage
      .from("cvs")
      .download(candidate.cv_storage_path);
    if (dErr || !fileBlob) {
      return new Response(JSON.stringify({ error: "Téléchargement CV échoué" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    let extractedText = "";
    let usedOcr = false;

    // Try native PDF text extraction first (cheap)
    try {
      const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
      const { text } = await extractText(pdf, { mergePages: true });
      extractedText = (text || "").trim();
    } catch (e) {
      console.error("unpdf failed:", e);
    }

    // If too little text, fallback to Gemini Vision OCR (more expensive)
    if (extractedText.length < 100) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

      // Encode PDF as base64 for Gemini
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);

      const ocrRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extrais TOUT le texte de ce CV au format brut (pas de markdown, garde les sauts de ligne). Si c'est un CV scanné, fais de l'OCR.",
                },
                {
                  type: "image_url",
                  image_url: { url: `data:application/pdf;base64,${base64}` },
                },
              ],
            },
          ],
        }),
      });

      if (!ocrRes.ok) {
        const t = await ocrRes.text();
        console.error("OCR failed:", ocrRes.status, t);
      } else {
        const j = await ocrRes.json();
        extractedText = j.choices?.[0]?.message?.content || extractedText;
        usedOcr = true;
      }
    }

    // Update candidate
    await supabase
      .from("candidates")
      .update({ cv_text: extractedText, status: "cv_parsed" })
      .eq("id", candidateId);

    return new Response(
      JSON.stringify({ success: true, length: extractedText.length, usedOcr }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("parse-cv error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
