import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RequestFormData } from "@/lib/request-types";
import { TalentTypeBadge } from "@/components/TalentTypeBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTalentTypeLabel, normalizeTalentType } from "@/lib/talent-type";
import { toast } from "sonner";
import { ArrowLeft, Send, Pencil, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  data: RequestFormData;
  onBack: () => void;
  onEdit: (step: number) => void;
  draftId: string | null;
  onSubmitted: (id: string) => void;
}

export const StepRecap = ({ data, onBack, onEdit, draftId, onSubmitted }: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    const payload: any = {
      user_id: user.id,
      title: data.title,
      description: data.description,
      domain: data.domain,
      talent_type: normalizeTalentType(data.talentType),
      skills: data.mustHaveSkills,
      nice_to_have_skills: data.niceToHaveSkills,
      soft_skills: data.mustHaveSoftSkills,
      nice_to_have_soft_skills: data.niceToHaveSoftSkills,
      custom_skills: data.customSkills,
      languages: data.languages as any,
      diploma: data.diploma,
      talents_number: data.talentsNumber,
      days_per_week: data.daysPerWeek,
      schedule_type: data.scheduleType,
      schedule_details: data.scheduleDetails as any,
      work_mode: data.workMode,
      work_location: data.workLocation || "",
      status: "Demande validée",
      natural_language_query: data.naturalLanguageQuery || null,
      employment_type: data.employmentType || null,
    };

    let id = draftId;
    if (draftId) {
      const { error } = await supabase.from("requests").update(payload).eq("id", draftId);
      if (error) { toast.error("Erreur lors de l'envoi"); setLoading(false); return; }
    } else {
      const { data: row, error } = await supabase.from("requests").insert(payload).select("id").single();
      if (error || !row) { toast.error("Erreur lors de l'envoi"); setLoading(false); return; }
      id = row.id;
    }

    toast.success("Demande envoyée avec succès !");
    onSubmitted(id!);
  };

  let scheduleLabel = "";
  if (data.talentType === "graduate") {
    if (data.employmentType === "full_time") scheduleLabel = "Temps plein (5 jours)";
    else if (data.employmentType === "part_time") scheduleLabel = `Temps partiel (${data.daysPerWeek} jours)`;
    else scheduleLabel = "Non défini";
  } else {
    scheduleLabel = data.scheduleType === "flexible" ? "Flexibles" : "Fixes";
  }

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-6 py-2.5 border-b border-border/60 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground text-right max-w-[60%]">{value}</dd>
    </div>
  );

  const Section = ({ title, stepIdx, children }: { title: string; stepIdx: number; children: React.ReactNode }) => (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-gradient-subtle">
        <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
        <Button variant="ghost" size="sm" onClick={() => onEdit(stepIdx)} className="h-7 gap-1 text-primary text-xs">
          <Pencil className="h-3 w-3" /> Modifier
        </Button>
      </header>
      <div className="px-5 py-2">{children}</div>
    </section>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground tracking-tight">Récapitulatif</h2>
        <p className="text-sm text-muted-foreground mt-1">Vérifiez les informations avant d'envoyer votre demande.</p>
      </div>

      {/* Hero summary card */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-subtle p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_50%)] pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Type de profil</p>
              <p className="text-base font-semibold text-foreground">{getTalentTypeLabel(data.talentType)}</p>
            </div>
          </div>
          <TalentTypeBadge talentType={data.talentType} large showHint />
        </div>
      </div>

      <Section title="Profil recherché" stepIdx={1}>
        <dl>
          <Row label="Domaine" value={data.domain} />
          {data.mustHaveSkills.length > 0 && (
            <Row
              label="Must have"
              value={
                <div className="flex flex-wrap gap-1 justify-end">
                  {data.mustHaveSkills.map((s) => (
                    <Badge key={s} className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">{s}</Badge>
                  ))}
                </div>
              }
            />
          )}
          {data.niceToHaveSkills.length > 0 && (
            <Row
              label="Nice to have"
              value={
                <div className="flex flex-wrap gap-1 justify-end">
                  {data.niceToHaveSkills.map((s) => (
                    <Badge key={s} variant="outline">{s}</Badge>
                  ))}
                </div>
              }
            />
          )}
          {data.mustHaveSoftSkills.length > 0 && (
            <Row
              label="Soft skills"
              value={
                <div className="flex flex-wrap gap-1 justify-end">
                  {data.mustHaveSoftSkills.map((s) => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>
              }
            />
          )}
          {data.languages.length > 0 && (
            <Row
              label="Langues"
              value={
                <div className="flex flex-wrap gap-1 justify-end">
                  {data.languages.map((l) => (
                    <Badge key={l.name} variant="secondary">{l.name} · {l.level}/5</Badge>
                  ))}
                </div>
              }
            />
          )}
          {data.diploma && <Row label="Diplôme" value={data.diploma} />}
        </dl>
      </Section>

      <Section title="Détails du poste" stepIdx={1}>
        <dl>
          <Row label="Titre" value={data.title} />
          <Row label="Description" value={<span className="text-muted-foreground">{data.description}</span>} />
          <Row label="Talents recherchés" value={<span className="tabular-nums">{data.talentsNumber}</span>} />
          {data.talentType === "student" && (
            <Row label="Jours / semaine" value={<span className="tabular-nums">{data.daysPerWeek}</span>} />
          )}
          <Row label={data.talentType === "graduate" ? "Contrat" : "Horaires"} value={scheduleLabel} />
          <Row label="Mode de travail" value={<span className="capitalize">{data.workMode}</span>} />
          {data.workLocation && <Row label="Adresse" value={data.workLocation} />}
        </dl>
      </Section>

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <Button onClick={handleSubmit} disabled={loading} variant="gradient" size="lg" className="gap-2 shadow-pop">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {loading ? "Envoi..." : "Envoyer la demande"}
        </Button>
      </div>
    </div>
  );
};
