import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RequestFormData } from "@/lib/request-types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  data: RequestFormData;
  onChange: (data: Partial<RequestFormData>) => void;
  onNext: () => void;
}

export const StepNaturalLanguage = ({ data, onChange, onNext }: Props) => {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    const description = data.naturalLanguageQuery.trim();
    if (!description) {
      toast.error("Décrivez d'abord le talent recherché.");
      return;
    }
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-talent-profile", {
        body: { description },
      });

      if (error) {
        // Try to parse the underlying status
        const status = (error as any)?.context?.status;
        if (status === 429) toast.error("Trop de requêtes, réessayez dans un instant.");
        else if (status === 402) toast.error("Crédits IA épuisés. Ajoutez des fonds pour continuer.");
        else toast.error("Erreur lors de la génération du profil.");
        return;
      }

      if (!result) {
        toast.error("Aucune réponse de l'IA.");
        return;
      }

      const update: Partial<RequestFormData> = {
        talentType: result.talentType === "graduate" ? "graduate" : "student",
      };
      if (result.domain) update.domain = result.domain;

      const matched = Array.isArray(result.hardSkills) ? result.hardSkills : [];
      const custom = Array.isArray(result.customHardSkills) ? result.customHardSkills : [];
      const merged = Array.from(new Set([...matched, ...custom]));
      if (merged.length > 0) {
        update.mustHaveSkills = merged;
        update.niceToHaveSkills = [];
      }
      if (Array.isArray(result.softSkills) && result.softSkills.length > 0) {
        update.mustHaveSoftSkills = result.softSkills;
        update.niceToHaveSoftSkills = [];
      }
      if (result.diplome) update.diploma = result.diplome;

      onChange(update);
      toast.success("Profil pré-rempli ! Vous pouvez l'affiner à l'étape suivante.");
      onNext();
    } catch (e) {
      console.error(e);
      toast.error("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-card-foreground">Décrivez votre besoin</h2>
        <p className="text-sm text-card-foreground/60">
          Notre IA analyse votre description et pré-remplit le formulaire pour vous.
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-card-foreground">Description en langage naturel</Label>
        <Textarea
          value={data.naturalLanguageQuery}
          onChange={(e) => onChange({ naturalLanguageQuery: e.target.value })}
          placeholder="Décrivez le talent que vous recherchez... (ex: développeur JavaScript junior 3 jours par semaine)"
          rows={6}
          className="bg-card border-card-foreground/20 text-card-foreground resize-none"
        />
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center">
        <Button
          variant="ghost"
          onClick={onNext}
          className="text-card-foreground/70 hover:text-card-foreground"
        >
          Passer cette étape
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={loading || !data.naturalLanguageQuery.trim()}
          className="gap-2"
          size="lg"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Génération..." : "Générer le profil"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};
