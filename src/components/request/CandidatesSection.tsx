import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Loader2, Users, RefreshCw, Mail, Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type ScoreRow = {
  cv_score: number | null;
  global_score: number | null;
  interview_score: number | null;
  flag: string | null;
  ai_summary: string;
  ai_strengths: string[];
  ai_concerns: string[];
  cv_breakdown: Record<string, any>;
  interview_breakdown: Record<string, any>;
};

type Candidate = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  cv_storage_path: string;
  candidate_scores?: ScoreRow[];
};

const CRITERIA_LABELS: Record<string, string> = {
  must_have_skills: "Compétences requises",
  nice_to_have_skills: "Compétences bonus",
  experience_years: "Années d'expérience",
  diploma: "Diplôme",
  languages: "Langues",
  soft_skills: "Soft skills",
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
  const [detailsCandidate, setDetailsCandidate] = useState<Candidate | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const cvInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = async () => {
    setLoading(true);
    const { data: candData } = await supabase
      .from("candidates")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: false });
    const list = (candData as any[]) || [];
    if (list.length > 0) {
      const ids = list.map((c) => c.id);
      const { data: scoresData } = await supabase
        .from("candidate_scores")
        .select("candidate_id, cv_score, global_score, interview_score, flag, ai_summary, ai_strengths, ai_concerns, cv_breakdown, interview_breakdown")
        .in("candidate_id", ids);
      const byId = new Map<string, any>();
      (scoresData || []).forEach((s: any) => byId.set(s.candidate_id, s));
      list.forEach((c: any) => {
        const s = byId.get(c.id);
        c.candidate_scores = s ? [s] : [];
      });
    }
    setCandidates(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
    supabase
      .from("requests")
      .select("title")
      .eq("id", requestId)
      .maybeSingle()
      .then(({ data }) => setRequestTitle((data as any)?.title || ""));
  }, [requestId]);

  const inviteToInterview = async (candidate: Candidate) => {
    if (!candidate.email) {
      toast.error("Email manquant pour ce candidat");
      return;
    }
    setInvitingId(candidate.id);
    try {
      // Reuse existing pending session or create a new one
      const { data: existing } = await supabase
        .from("interview_sessions")
        .select("id, token, status")
        .eq("candidate_id", candidate.id)
        .in("status", ["pending", "in_progress"])
        .maybeSingle();

      let token = (existing as any)?.token as string | undefined;
      if (!token) {
        const { data: created, error: insErr } = await supabase
          .from("interview_sessions")
          .insert({ candidate_id: candidate.id })
          .select("token")
          .single();
        if (insErr) throw insErr;
        token = (created as any).token;
      }

      const interviewUrl = `${window.location.origin}/interview/${token}`;

      const { error: emailErr } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "interview-invitation",
          recipientEmail: candidate.email,
          idempotencyKey: `interview-invite-${candidate.id}-${token}`,
          templateData: {
            candidateFirstName: candidate.first_name,
            jobTitle: requestTitle,
            interviewUrl,
            estimatedMinutes: 10,
          },
        },
      });
      if (emailErr) throw emailErr;

      await supabase
        .from("candidates")
        .update({ status: "interview_invited" })
        .eq("id", candidate.id);

      toast.success(`Invitation envoyée à ${candidate.email}`);
      load();
    } catch (err: any) {
      toast.error(err?.message || "Envoi de l'invitation échoué");
    } finally {
      setInvitingId(null);
    }
  };

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
                        <button
                          type="button"
                          onClick={() => setDetailsCandidate(c)}
                          className="focus:outline-none"
                          title="Voir le détail du scoring"
                        >
                          <Badge className={`${FLAG_STYLES[score.flag]} cursor-pointer hover:opacity-90`}>
                            {score.global_score ?? score.cv_score}/100
                          </Badge>
                        </button>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailsCandidate(c)}
                      disabled={!score}
                      title={score ? "Voir le détail du scoring" : "Score non disponible"}
                    >
                      <Info className="h-4 w-4" />
                      <span className="ml-1 text-xs">Détails</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => inviteToInterview(c)}
                      disabled={invitingId === c.id || !c.email}
                      title={!c.email ? "Email manquant" : "Inviter à l'entretien IA"}
                    >
                      {invitingId === c.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      <span className="ml-1 text-xs">Inviter</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <CandidateDetailsDialog
          candidate={detailsCandidate}
          onClose={() => setDetailsCandidate(null)}
        />
      </CardContent>
    </Card>
  );
};

const CandidateDetailsDialog = ({
  candidate,
  onClose,
}: {
  candidate: Candidate | null;
  onClose: () => void;
}) => {
  const score = candidate?.candidate_scores?.[0];
  const cvBreakdown = (score?.cv_breakdown || {}) as Record<string, any>;
  const interviewBreakdown = (score?.interview_breakdown || {}) as Record<string, any>;

  return (
    <Dialog open={!!candidate} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {candidate?.first_name} {candidate?.last_name}
          </DialogTitle>
          <DialogDescription>
            Détail du scoring et analyse IA
          </DialogDescription>
        </DialogHeader>

        {!score ? (
          <p className="text-sm text-muted-foreground">
            Aucun score disponible. Upload un CV pour lancer l'analyse.
          </p>
        ) : (
          <div className="space-y-5">
            {/* Scores summary */}
            <div className="grid grid-cols-3 gap-3">
              <ScoreTile label="Score global" value={score.global_score} flag={score.flag} />
              <ScoreTile label="Score CV" value={score.cv_score} />
              <ScoreTile label="Score entretien" value={score.interview_score} />
            </div>

            {/* AI summary */}
            {score.ai_summary && (
              <section>
                <h4 className="text-sm font-semibold mb-2 text-card-foreground">
                  Résumé de l'IA
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {score.ai_summary}
                </p>
              </section>
            )}

            {/* Concerns first — that's what user asked */}
            {score.ai_concerns?.length > 0 && (
              <section>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-destructive">
                  <XCircle className="h-4 w-4" />
                  Pourquoi ce candidat n'est pas idéal
                </h4>
                <ul className="space-y-1.5">
                  {score.ai_concerns.map((c, i) => (
                    <li key={i} className="text-sm text-card-foreground flex gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Strengths */}
            {score.ai_strengths?.length > 0 && (
              <section>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Points forts
                </h4>
                <ul className="space-y-1.5">
                  {score.ai_strengths.map((s, i) => (
                    <li key={i} className="text-sm text-card-foreground flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* CV breakdown */}
            {Object.keys(cvBreakdown).length > 0 && (
              <section>
                <h4 className="text-sm font-semibold mb-2 text-card-foreground">
                  Détail du score CV
                </h4>
                <div className="space-y-2">
                  {Object.entries(cvBreakdown).map(([key, val]) => (
                    <BreakdownRow key={key} criterion={key} value={val} />
                  ))}
                </div>
              </section>
            )}

            {/* Interview breakdown */}
            {Object.keys(interviewBreakdown).length > 0 && (
              <section>
                <h4 className="text-sm font-semibold mb-2 text-card-foreground">
                  Détail du score entretien
                </h4>
                <div className="space-y-2">
                  {Object.entries(interviewBreakdown).map(([key, val]) => (
                    <BreakdownRow key={key} criterion={key} value={val} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const ScoreTile = ({
  label,
  value,
  flag,
}: {
  label: string;
  value: number | null | undefined;
  flag?: string | null;
}) => (
  <div className="rounded-lg border bg-muted/30 p-3 text-center">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p
      className={`text-2xl font-semibold mt-1 ${
        flag === "green"
          ? "text-success"
          : flag === "yellow"
          ? "text-warning"
          : flag === "red"
          ? "text-destructive"
          : "text-card-foreground"
      }`}
    >
      {value ?? "—"}
      {value != null && <span className="text-sm text-muted-foreground">/100</span>}
    </p>
  </div>
);

const BreakdownRow = ({ criterion, value }: { criterion: string; value: any }) => {
  const label = CRITERIA_LABELS[criterion] || criterion.replace(/_/g, " ");
  // value can be a number or { score, max, comment }
  const score = typeof value === "object" && value !== null ? value.score : value;
  const max = typeof value === "object" && value !== null ? value.max : null;
  const comment = typeof value === "object" && value !== null ? value.comment : null;
  const ratio = typeof score === "number" && typeof max === "number" && max > 0
    ? score / max
    : null;
  const barColor = ratio == null
    ? "bg-muted"
    : ratio >= 0.8
    ? "bg-success"
    : ratio >= 0.5
    ? "bg-warning"
    : "bg-destructive";
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-sm">
        <span className="capitalize text-card-foreground">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {typeof score === "number" ? score : "—"}
          {max ? `/${max}` : ""}
        </span>
      </div>
      {ratio != null && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all`}
            style={{ width: `${Math.min(100, Math.max(0, ratio * 100))}%` }}
          />
        </div>
      )}
      {comment && (
        <p className="text-xs text-muted-foreground italic">{comment}</p>
      )}
    </div>
  );
};
