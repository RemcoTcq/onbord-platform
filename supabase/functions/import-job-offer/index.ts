import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_OUTPUT_CHARS = 50_000;

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function cleanText(s: string): string {
  return s
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_OUTPUT_CHARS);
}

async function extractPdf(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n\n") : String(text || "");
}

async function extractDocx(bytes: Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(bytes);
  const docXml = zip.file("word/document.xml");
  if (!docXml) throw new Error("DOCX invalide");
  const xml = await docXml.async("string");
  // Convert paragraph ends to newlines, extract <w:t> contents
  const withBreaks = xml
    .replace(/<w:p\b[^>]*\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:tab\b[^>]*\/>/g, "\t")
    .replace(/<w:br\b[^>]*\/>/g, "\n");
  const matches = withBreaks.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
  const parts: string[] = [];
  // We need to also keep the surrounding newlines that we inserted. Easier: strip tags entirely.
  const stripped = withBreaks
    .replace(/<w:t[^>]*>/g, "")
    .replace(/<\/w:t>/g, "")
    .replace(/<[^>]+>/g, "");
  // Decode XML entities
  const decoded = stripped
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
  return decoded;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Payload invalide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { fileName, fileType, fileBase64 } = body as {
      fileName?: string;
      fileType?: string;
      fileBase64?: string;
    };

    if (!fileBase64 || typeof fileBase64 !== "string") {
      return new Response(JSON.stringify({ error: "Fichier manquant" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bytes = base64ToBytes(fileBase64);
    if (bytes.byteLength > MAX_FILE_BYTES) {
      return new Response(JSON.stringify({ error: "Fichier trop volumineux (max 5 Mo)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lowerName = (fileName || "").toLowerCase();
    const type = (fileType || "").toLowerCase();

    let text = "";
    if (type === "application/pdf" || lowerName.endsWith(".pdf")) {
      text = await extractPdf(bytes);
    } else if (
      type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      lowerName.endsWith(".docx")
    ) {
      text = await extractDocx(bytes);
    } else if (type === "text/plain" || lowerName.endsWith(".txt")) {
      text = new TextDecoder("utf-8").decode(bytes);
    } else {
      return new Response(
        JSON.stringify({ error: "Format non supporté. Utilisez PDF, DOCX ou TXT." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const cleaned = cleanText(text);
    if (cleaned.length < 30) {
      return new Response(
        JSON.stringify({
          error:
            "Impossible d'extraire le texte. Si c'est un PDF scanné, copiez-collez le texte manuellement.",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ text: cleaned }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("import-job-offer error:", e);
    return new Response(JSON.stringify({ error: "Erreur lors de l'extraction du fichier" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
