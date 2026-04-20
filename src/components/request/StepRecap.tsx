import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RequestFormData } from "@/lib/request-types";
import { calculatePricing } from "@/lib/pricing-utils";
import { TalentTypeBadge } from "@/components/TalentTypeBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getTalentTypeLabel, normalizeTalentType } from "@/lib/talent-type";
import { toast } from "sonner";
import { ArrowLeft, Send, Pencil, Loader2 } from "lucide-react";

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

  const { weeklyHours, weeklyPrice, monthlyPrice } = calculatePricing({
    scheduleType: data.scheduleType,
    scheduleDetails: data.scheduleDetails,
    daysPerWeek: data.daysPerWeek,
    talentsNumber: data.talentsNumber,
    talentType: data.talentType,
    employmentType: data.employmentType,
  });

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
      weekly_hours: weeklyHours,
      weekly_price: weeklyPrice,
      monthly_price: monthlyPrice,
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

  const Section = ({ title, stepIdx, children }: { title: string; stepIdx: number; children: React.ReactNode }) => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-card-foreground">{title}</h3>
        <Button variant="ghost" size="sm" onClick={() => onEdit(stepIdx)} className="gap-1 text-primary text-xs">
          <Pencil className="h-3 w-3" /> Modifier
        </Button>
      </div>
      {children}
    </div>
  );

  // Schedule label
  let scheduleLabel = "";
  if (data.talentType === "graduate") {
    if (data.employmentType === "full_time") scheduleLabel = "Temps plein (5 jours)";
    else if (data.employmentType === "part_time") scheduleLabel = `Temps partiel (${data.daysPerWeek} jours)`;
    else scheduleLabel = "Non défini";
  } else {
    scheduleLabel = data.scheduleType === "flexible" ? "Flexibles" : "Fixes";
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-card-foreground">Récapitulatif</h2>
        <p className="text-sm text-card-foreground/60">Vérifiez les informations avant d'envoyer</p>
      </div>

      <div className="sticky top-4 z-10 rounded-lg border border-border bg-background/95 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Type de profil recherché</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TalentTypeBadge talentType={data.talentType} large showHint />
          <span className="text-sm font-medium text-card-foreground">{getTalentTypeLabel(data.talentType)}</span>
        </div>
      </div>

      <Section title="Profil recherché" stepIdx={1}>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-card-foreground/60">Domaine</span>
            <span className="text-card-foreground font-medium">{data.domain}</span>
          </div>
          {data.mustHaveSkills.length > 0 && (
            <div>
              <p className="text-xs text-card-foreground/50 mb-1">Must have</p>
              <div className="flex flex-wrap gap-1">{data.mustHaveSkills.map((s) => <Badge key={s} className="bg-primary text-primary-foreground">{s}</Badge>)}</div>
            </div>
          )}
          {data.niceToHaveSkills.length > 0 && (
            <div>
              <p className="text-xs text-card-foreground/50 mb-1">Nice to have</p>
              <div className="flex flex-wrap gap-1">{data.niceToHaveSkills.map((s) => <Badge key={s} variant="outline" className="border-card-foreground/20 text-card-foreground">{s}</Badge>)}</div>
            </div>
          )}
          {data.mustHaveSoftSkills.length > 0 && (
            <div>
              <p className="text-xs text-card-foreground/50 mb-1">Soft skills (must)</p>
              <div className="flex flex-wrap gap-1">{data.mustHaveSoftSkills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}</div>
            </div>
          )}
          {data.languages.length > 0 && (
            <div>
              <p className="text-xs text-card-foreground/50 mb-1">Langues</p>
              <div className="flex flex-wrap gap-1">{data.languages.map((l) => <Badge key={l.name} variant="secondary">{l.name} ({l.level}/5)</Badge>)}</div>
            </div>
          )}
          {data.diploma && (
            <div className="flex justify-between text-sm">
              <span className="text-card-foreground/60">Diplôme</span>
              <span className="text-card-foreground">{data.diploma}</span>
            </div>
          )}
        </div>
      </Section>

      <Separator className="bg-card-foreground/10" />

      <Section title="Détails du poste" stepIdx={1}>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-card-foreground/60">Titre</span><span className="text-card-foreground font-medium">{data.title}</span></div>
          <div className="flex justify-between"><span className="text-card-foreground/60">Description</span><span className="text-card-foreground text-right max-w-[60%]">{data.description}</span></div>
          <div className="flex justify-between"><span className="text-card-foreground/60">Talents</span><span className="text-card-foreground">{data.talentsNumber}</span></div>
          {data.talentType === "student" && (
            <div className="flex justify-between"><span className="text-card-foreground/60">Jours/semaine</span><span className="text-card-foreground">{data.daysPerWeek}</span></div>
          )}
          <div className="flex justify-between"><span className="text-card-foreground/60">{data.talentType === "graduate" ? "Contrat" : "Horaires"}</span><span className="text-card-foreground">{scheduleLabel}</span></div>
          <div className="flex justify-between"><span className="text-card-foreground/60">Mode</span><span className="text-card-foreground capitalize">{data.workMode}</span></div>
        </div>
      </Section>

      <Separator className="bg-card-foreground/10" />

      <Section title="Tarification" stepIdx={2}>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-card-foreground/60">Heures/semaine</span><span className="text-card-foreground">{weeklyHours}h</span></div>
          <div className="flex justify-between"><span className="text-card-foreground/60">Prix/semaine</span><span className="font-semibold text-card-foreground">{weeklyPrice.toLocaleString("fr-FR")}€</span></div>
          <div className="flex justify-between"><span className="text-card-foreground/60">Prix/mois</span><span className="font-bold text-primary">{monthlyPrice.toLocaleString("fr-FR")}€</span></div>
        </div>
      </Section>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2 border-card-foreground/20 text-card-foreground">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <Button onClick={handleSubmit} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {loading ? "Envoi..." : "Envoyer la demande"}
        </Button>
      </div>
    </div>
  );
};
