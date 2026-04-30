import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Loader2, Users, RefreshCw, Mail } from "lucide-react";
import { toast } from "sonner";

type Candidate = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  cv_storage_path: string;
  candidate_scores?: { cv_score: number | null; global_score: number | null; flag: string | null; ai_summary: string }[];
};

const FLAG_STYLES: Record<string, string> = {
  green: "bg-success text-success-foreground",
  yellow: "bg-warning text-warning-foreground",
  red: "bg-destructive text-destructive-foreground",
};

export const CandidatesSection = ({ requestId }: { requestId: string }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [uploadingCv, setUploadingCv] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "green" | "yellow" | "red">("all");
  const [requestTitle, setRequestTitle] = useState<string>("");
  const csvInputRef = useRef<HTMLInputElement>(null);
  const cvInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("candidates")
      .select("*, candidate_scores(cv_score, global_score, flag, ai_summary)")
      .eq("request_id", requestId)
      .order("created_at", { ascending: false });
    setCandidates((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [requestId]);

  const parseCsv = (text: string): Record<string, string>[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(/[,;]/).map((h) => h.trim().toLowerCase());
    return lines.slice(1).map((line) => {
      const values = line.split(/[,;]/).map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => (row[h] = values[i] || ""));
      return row;
    });
  };

  const matchField = (row: Record<string, string>, keys: string[]) => {
    for (const k of keys) {
      const found = Object.keys(row).find((h) => h.includes(k));
      if (found && row[found]) return row[found];
    }
    return "";
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("CSV trop volumineux (max 2MB)");
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        toast.error("CSV vide ou invalide");
        return;
      }
      if (rows.length > 200) {
        toast.error("Maximum 200 candidats par import");
        return;
      }
      const toInsert = rows.map((r) => ({
        request_id: requestId,
        first_name: matchField(r, ["prenom", "first", "firstname"]).slice(0, 100),
        last_name: matchField(r, ["nom", "last", "lastname"]).slice(0, 100),
        email: matchField(r, ["email", "mail"]).slice(0, 255),
        phone: matchField(r, ["phone", "tel", "telephone"]).slice(0, 50),
        linkedin_url: matchField(r, ["linkedin", "url"]).slice(0, 500),
        source: "csv_import",
      }));
      const { error } = await supabase.from("candidates").insert(toInsert);
      if (error) throw error;
      toast.success(`${toInsert.length} candidat(s) importé(s)`);
      load();
    } catch (err: any) {
      toast.error(err?.message || "Import échoué");
    } finally {
      setImporting(false);
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  };

  const handleCvUpload = async (candidateId: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("PDF trop volumineux (max 5MB)");
      return;
    }
    if (file.type !== "application/pdf") {
      toast.error("Seuls les PDF sont acceptés");
      return;
    }
    setUploadingCv(candidateId);
    try {
      const path = `${requestId}/${candidateId}-${Date.now()}.pdf`;
      const { error: upErr } = await supabase.storage.from("cvs").upload(path, file, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (upErr) throw upErr;
      await supabase
        .from("candidates")
        .update({ cv_storage_path: path, status: "cv_uploaded" })
        .eq("id", candidateId);
      toast.success("CV uploadé. Analyse en cours...");
      // Trigger parse + score in background
      const { error: pErr } = await supabase.functions.invoke("parse-cv", {
        body: { candidateId },
      });
      if (pErr) {
        toast.error("Parsing CV échoué");
      } else {
        const { error: sErr } = await supabase.functions.invoke("score-cv", {
          body: { candidateId },
        });
        if (sErr) toast.error("Scoring CV échoué");
        else toast.success("Score calculé !");
      }
      load();
    } catch (err: any) {
      toast.error(err?.message || "Upload échoué");
    } finally {
      setUploadingCv(null);
    }
  };

  const filtered = candidates
    .filter((c) => {
      if (filter === "all") return true;
      return c.candidate_scores?.[0]?.flag === filter;
    })
    .sort((a, b) => {
      const sa = a.candidate_scores?.[0]?.global_score ?? -1;
      const sb = b.candidate_scores?.[0]?.global_score ?? -1;
      return sb - sa;
    });

  const counts = {
    green: candidates.filter((c) => c.candidate_scores?.[0]?.flag === "green").length,
    yellow: candidates.filter((c) => c.candidate_scores?.[0]?.flag === "yellow").length,
    red: candidates.filter((c) => c.candidate_scores?.[0]?.flag === "red").length,
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-card-foreground" />
            <h3 className="text-lg font-semibold text-card-foreground">
              Mes candidats ({candidates.length})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={load} title="Actualiser">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCsvUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => csvInputRef.current?.click()}
              disabled={importing}
            >
              {importing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Importer CSV
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Format CSV attendu : colonnes <code>prenom</code>, <code>nom</code>, <code>email</code>,{" "}
          <code>phone</code>, <code>linkedin</code> (séparateur , ou ;).
        </p>

        {/* Filters */}
        {candidates.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              Tous ({candidates.length})
            </Button>
            <Button
              variant={filter === "green" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("green")}
              className={filter === "green" ? FLAG_STYLES.green : ""}
            >
              Vert ({counts.green})
            </Button>
            <Button
              variant={filter === "yellow" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("yellow")}
              className={filter === "yellow" ? FLAG_STYLES.yellow : ""}
            >
              Orange ({counts.yellow})
            </Button>
            <Button
              variant={filter === "red" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("red")}
              className={filter === "red" ? FLAG_STYLES.red : ""}
            >
              Rouge ({counts.red})
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {candidates.length === 0
              ? "Aucun candidat. Importe un CSV pour commencer."
              : "Aucun candidat ne correspond au filtre."}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => {
              const score = c.candidate_scores?.[0];
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-card-foreground">
                        {c.first_name} {c.last_name}
                      </span>
                      {score?.flag && (
                        <Badge className={FLAG_STYLES[score.flag]}>
                          {score.global_score ?? score.cv_score}/100
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {c.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.email} {c.phone && `· ${c.phone}`}
                    </p>
                    {score?.ai_summary && (
                      <p className="text-xs text-card-foreground/70 mt-1 line-clamp-2">
                        {score.ai_summary}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      ref={(el) => (cvInputRefs.current[c.id] = el)}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleCvUpload(c.id, f);
                        e.target.value = "";
                      }}
                    />
                    <Button
                      variant={c.cv_storage_path ? "ghost" : "outline"}
                      size="sm"
                      onClick={() => cvInputRefs.current[c.id]?.click()}
                      disabled={uploadingCv === c.id}
                    >
                      {uploadingCv === c.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      <span className="ml-1 text-xs">{c.cv_storage_path ? "CV" : "Upload CV"}</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
