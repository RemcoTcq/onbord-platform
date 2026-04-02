import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { STATUSES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

const RequestDetail = () => {
  const { id } = useParams();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("requests")
        .select("*")
        .eq("id", id)
        .single();
      setRequest(data);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleGenerateOffer = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-job-offer", {
        body: { requestId: id },
      });

      if (error) throw error;

      const content = data?.content || "Erreur";
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `offre-${request?.title?.replace(/\s+/g, "-") || "emploi"}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Offre d'emploi générée et téléchargée !");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (!request) {
    return <AppLayout><p className="text-center text-muted-foreground">Demande introuvable</p></AppLayout>;
  }

  const currentIdx = STATUSES.indexOf(request.status as any);
  const languages = (request.languages || []) as { name: string; level: number }[];

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{request.title}</h1>
            <p className="text-muted-foreground">{request.domain}</p>
          </div>
          <Button onClick={handleGenerateOffer} disabled={generating} className="gap-2">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            {generating ? "Génération..." : "Télécharger l'offre"}
          </Button>
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Progression</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {STATUSES.map((status, i) => (
                <div key={status} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    i <= currentIdx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {i <= currentIdx ? <Check className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </div>
                  <span className={i <= currentIdx ? "font-medium" : "text-muted-foreground"}>{status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-lg">Détails du poste</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Description</span><span>{request.description}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Talents</span><span>{request.talents_number}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Jours/semaine</span><span>{request.days_per_week}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Horaires</span><span>{request.schedule_type === "flexible" ? "Flexibles" : "Fixes"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Mode</span><span className="capitalize">{request.work_mode}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Diplôme</span><span>{request.diploma || "-"}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Tarification</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Heures/semaine</span><span>{request.weekly_hours}h</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Prix/semaine</span><span className="font-semibold">{Number(request.weekly_price).toLocaleString("fr-FR")}€</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Prix/mois</span><span className="font-semibold text-primary">{Number(request.monthly_price).toLocaleString("fr-FR")}€</span></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Compétences</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Hard Skills</p>
              <div className="flex flex-wrap gap-1">
                {[...(request.skills || []), ...(request.custom_skills || [])].map((s: string) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Soft Skills</p>
              <div className="flex flex-wrap gap-1">
                {(request.soft_skills || []).map((s: string) => (
                  <Badge key={s} variant="outline">{s}</Badge>
                ))}
              </div>
            </div>
            {languages.length > 0 && (
              <div>
                <p className="mb-1 text-sm text-muted-foreground">Langues</p>
                <div className="flex flex-wrap gap-2">
                  {languages.map((l) => (
                    <Badge key={l.name} variant="secondary">{l.name} ({l.level}/5)</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default RequestDetail;
