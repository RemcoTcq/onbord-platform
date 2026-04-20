import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { STATUSES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock, FileDown, Loader2, Trash2, Pencil, Building2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AdminRequestEditForm } from "@/components/admin/AdminRequestEditForm";

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState<{ first_name: string; last_name: string; company_name: string } | null>(null);

  useEffect(() => {
    if (user) {
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
    }
  }, [user]);

  useEffect(() => {
    supabase.from("requests").select("*").eq("id", id).single().then(({ data }) => {
      setRequest(data);
      setLoading(false);
      if (data?.user_id) {
        supabase.from("profiles").select("first_name, last_name, company_name").eq("user_id", data.user_id).single().then(({ data: p }) => {
          if (p) setOwnerProfile(p);
        });
      }
    });
  }, [id]);

  const handleGenerateOffer = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-job-offer", { body: { requestId: id } });
      if (error) throw error;
      const content = typeof data === "string" ? data : (data?.content || "Erreur lors de la génération");
      if (data?.error) throw new Error(data.error);
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `offre-${request?.title?.replace(/\s+/g, "-") || "emploi"}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Offre générée et téléchargée !");
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase.from("requests").delete().eq("id", id);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Demande supprimée");
      navigate(isAdmin ? "/admin" : "/requests");
    }
  };

  const canDelete = user && request && (request.user_id === user.id || isAdmin);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-foreground/20 border-t-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!request) {
    return <AppLayout><p className="text-center text-muted-foreground">Demande introuvable</p></AppLayout>;
  }

  // Edit mode for admin
  if (editing && isAdmin) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold text-foreground mb-6">Modifier la demande</h1>
          <AdminRequestEditForm
            request={request}
            onSave={(updated) => { setRequest(updated); setEditing(false); }}
            onCancel={() => setEditing(false)}
          />
        </div>
      </AppLayout>
    );
  }

  const currentIdx = STATUSES.indexOf(request.status as any);
  const languages = (request.languages || []) as { name: string; level: number }[];
  const niceToHaveSkills = request.nice_to_have_skills || [];
  const niceToHaveSoftSkills = request.nice_to_have_soft_skills || [];

  const ownerLabel = ownerProfile
    ? [ownerProfile.company_name, [ownerProfile.first_name, ownerProfile.last_name].filter(Boolean).join(" ")].filter(Boolean).join(" — ")
    : null;

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{request.title}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-muted-foreground">{request.domain}</p>
              <Badge variant="secondary">
                {request.talent_type === "graduate" ? "Jeune diplômé" : "Étudiant"}
              </Badge>
            </div>
            {ownerLabel && (
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{ownerLabel}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button onClick={() => setEditing(true)} variant="outline" className="gap-2">
                <Pencil className="h-4 w-4" /> Modifier
              </Button>
            )}
            <Button onClick={handleGenerateOffer} disabled={generating} className="gap-2 bg-card text-card-foreground hover:bg-card/90">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {generating ? "Génération..." : "Télécharger l'offre"}
            </Button>
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer cette demande ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. La demande sera définitivement supprimée.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Timeline */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">Progression</h3>
            <div className="relative flex items-start justify-between">
              <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-card-foreground/10" />
              {currentIdx > 0 && (
                <div className="absolute top-5 h-0.5 bg-success" style={{ left: "10%", width: `${(currentIdx / (STATUSES.length - 1)) * 80}%` }} />
              )}
              {STATUSES.map((status, i) => (
                <div key={status} className="flex flex-col items-center flex-1">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full z-10 transition-all ${
                    i <= currentIdx
                      ? "bg-success text-success-foreground shadow-lg shadow-success/20"
                      : "bg-card-foreground/10 text-card-foreground/30"
                  }`}>
                    {i <= currentIdx ? <Check className="h-5 w-5" /> : <Clock className="h-4 w-4" />}
                  </div>
                  <span className={`mt-2 text-xs text-center max-w-[100px] ${
                    i <= currentIdx ? "font-medium text-card-foreground" : "text-card-foreground/40"
                  }`}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Job details */}
          <Card>
            <CardContent className="p-6 space-y-3">
              <h3 className="text-lg font-semibold text-card-foreground">Détails du poste</h3>
              {[
                ["Type de talent", request.talent_type === "graduate" ? "Jeune diplômé" : "Étudiant"],
                ["Description", request.description],
                ["Talents", request.talents_number],
                ["Jours/semaine", request.days_per_week],
                ["Horaires", request.schedule_type === "flexible" ? "Flexibles" : "Fixes"],
                ["Mode", request.work_mode],
                ["Diplôme", request.diploma || "-"],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex justify-between text-sm">
                  <span className="text-card-foreground/60">{label}</span>
                  <span className="text-card-foreground capitalize">{String(val)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardContent className="p-6 space-y-3">
              <h3 className="text-lg font-semibold text-card-foreground">Tarification</h3>
              <div className="flex justify-between text-sm">
                <span className="text-card-foreground/60">Heures/semaine</span>
                <span className="text-card-foreground">{Number(request.weekly_hours)}h</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-card-foreground/60">Prix/semaine</span>
                <span className="font-semibold text-card-foreground">{Number(request.weekly_price).toLocaleString("fr-FR")}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-card-foreground/60">Prix/mois</span>
                <span className="font-bold text-primary">{Number(request.monthly_price).toLocaleString("fr-FR")}€</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skills */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-card-foreground">Compétences</h3>
            {(request.skills || []).length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold text-card-foreground/50 uppercase">Hard Skills — Must have</p>
                <div className="flex flex-wrap gap-1">{(request.skills || []).map((s: string) => <Badge key={s} className="bg-primary text-primary-foreground">{s}</Badge>)}</div>
              </div>
            )}
            {niceToHaveSkills.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold text-card-foreground/50 uppercase">Hard Skills — Nice to have</p>
                <div className="flex flex-wrap gap-1">{niceToHaveSkills.map((s: string) => <Badge key={s} variant="outline" className="border-card-foreground/20 text-card-foreground">{s}</Badge>)}</div>
              </div>
            )}
            {(request.soft_skills || []).length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold text-card-foreground/50 uppercase">Soft Skills — Must have</p>
                <div className="flex flex-wrap gap-1">{(request.soft_skills || []).map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}</div>
              </div>
            )}
            {niceToHaveSoftSkills.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold text-card-foreground/50 uppercase">Soft Skills — Nice to have</p>
                <div className="flex flex-wrap gap-1">{niceToHaveSoftSkills.map((s: string) => <Badge key={s} variant="outline" className="border-card-foreground/20 text-card-foreground">{s}</Badge>)}</div>
              </div>
            )}
            {languages.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold text-card-foreground/50 uppercase">Langues</p>
                <div className="flex flex-wrap gap-2">{languages.map((l) => <Badge key={l.name} variant="secondary">{l.name} ({l.level}/5)</Badge>)}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default RequestDetail;
