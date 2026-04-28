import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RequestFormData } from "@/lib/request-types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, ArrowRight, Loader2, Check, Circle, MapPin, Briefcase, Wrench, Languages } from "lucide-react";
import { toast } from "sonner";

interface Props {
  data: RequestFormData;
  onChange: (data: Partial<RequestFormData>) => void;
  onNext: () => void;
}

interface Detection {
  jobTitle: string;
  jobDescription: string;
  domain: string;
  hardSkills: string[];
  customHardSkills: string[];
  softSkills: string[];
  customSoftSkills: string[];
  langues: { name: string; level: number }[];
  diplome: string | null;
  talentType: "student" | "graduate";
  location: string | null;
}

const MIN_CHARS = 15;
const DEBOUNCE_MS = 700;

export const StepNaturalLanguage = ({ data, onChange, onNext }: Props) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [detection, setDetection] = useState<Detection | null>(null);
  const [applying, setApplying] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const lastQueryRef = useRef<string>("");

  const runDetection = async (query: string) => {
    if (query === lastQueryRef.current) return;
    lastQueryRef.current = query;
    setAnalyzing(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-talent-profile", {
        body: { description: query },
      });
      if (error) {
        const status = (error as any)?.context?.status;
        if (status === 429) toast.error("Trop de requêtes, réessayez dans un instant.");
        else if (status === 402) toast.error("Crédits IA épuisés.");
        return;
      }
      if (result) setDetection(result as Detection);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  // Debounced auto-analyse
  useEffect(() => {
    clearTimeout(debounceRef.current);
    const q = data.naturalLanguageQuery.trim();
    if (q.length < MIN_CHARS) {
      setDetection(null);
      lastQueryRef.current = "";
      return;
    }
    debounceRef.current = setTimeout(() => runDetection(q), DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.naturalLanguageQuery]);

  const applyDetection = (d: Detection) => {
    const allHard = [...d.hardSkills, ...d.customHardSkills];
    const allSoft = [...d.softSkills, ...d.customSoftSkills];
    const update: Partial<RequestFormData> = {
      talentType: d.talentType === "graduate" ? "graduate" : "student",
    };
    if (d.domain) update.domain = d.domain;
    if (allHard.length > 0) {
      update.mustHaveSkills = allHard;
      update.niceToHaveSkills = [];
    }
    if (d.customHardSkills.length > 0) {
      update.customSkills = d.customHardSkills;
    }
    if (allSoft.length > 0) {
      update.mustHaveSoftSkills = allSoft;
      update.niceToHaveSoftSkills = [];
    }
    if (d.diplome) update.diploma = d.diplome;
    if (d.jobTitle) update.title = d.jobTitle;
    if (d.jobDescription) update.description = d.jobDescription;
    if (Array.isArray(d.langues) && d.langues.length > 0) update.languages = d.langues;
    if (d.location) update.workLocation = d.location;
    onChange(update);
  };

  const fillSteps = [
    "Analyse de votre description…",
    "Détection du profil et du domaine…",
    "Extraction des compétences techniques…",
    "Identification des soft skills et langues…",
    "Pré-remplissage du formulaire…",
  ];
  const [fillStepIdx, setFillStepIdx] = useState(0);

  const handleContinue = async () => {
    setApplying(true);
    setFillStepIdx(0);
    const q = data.naturalLanguageQuery.trim();

    // Animate the steps progressively
    const stepTimer = setInterval(() => {
      setFillStepIdx((i) => Math.min(i + 1, fillSteps.length - 1));
    }, 600);

    try {
      if (q.length >= MIN_CHARS && (!detection || lastQueryRef.current !== q)) {
        clearTimeout(debounceRef.current);
        await runDetection(q);
      }
      if (detection) applyDetection(detection);
      // Ensure all steps shown briefly
      setFillStepIdx(fillSteps.length - 1);
      await new Promise((r) => setTimeout(r, 500));
    } finally {
      clearInterval(stepTimer);
      setApplying(false);
      onNext();
    }
  };

  const checks = [
    {
      key: "title",
      label: "Titre du job",
      icon: Briefcase,
      ok: !!detection?.jobTitle,
      value: detection?.jobTitle || "",
    },
    {
      key: "skills",
      label: "Skills",
      icon: Wrench,
      ok: !!detection && (detection.hardSkills.length + detection.customHardSkills.length) > 0,
      value: detection
        ? [...detection.hardSkills, ...detection.customHardSkills].slice(0, 4).join(", ")
        : "",
    },
    {
      key: "location",
      label: "Localisation",
      icon: MapPin,
      ok: !!detection?.location,
      value: detection?.location || "",
    },
    {
      key: "languages",
      label: "Langues",
      icon: Languages,
      ok: !!detection && detection.langues.length > 0,
      value: detection?.langues.map((l) => l.name).join(", ") || "",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-card-foreground">Décrivez votre besoin</h2>
        <p className="text-sm text-card-foreground/60">
          Notre IA analyse votre description en temps réel et structure le formulaire pour vous.
        </p>
      </div>

      <div className="relative">
        <Textarea
          value={data.naturalLanguageQuery}
          onChange={(e) => onChange({ naturalLanguageQuery: e.target.value })}
          placeholder="Ex: Développeur Python à Bruxelles 2 jours par semaine, FR/EN, Master"
          rows={4}
          className="bg-card border-card-foreground/20 text-card-foreground resize-none pr-10 text-base"
        />
        <div className="absolute right-3 top-3 text-card-foreground/40">
          {analyzing ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </div>
      </div>

      {/* Checkmarks */}
      <TooltipProvider delayDuration={150}>
        <div className="flex flex-wrap items-center gap-2">
          {checks.map((c) => {
            const Icon = c.icon;
            return (
              <Tooltip key={c.key}>
                <TooltipTrigger asChild>
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      c.ok
                        ? "border-success/40 bg-success/10 text-success"
                        : "border-card-foreground/15 bg-card-foreground/[0.03] text-card-foreground/40"
                    }`}
                  >
                    {c.ok ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                    <Icon className="h-3.5 w-3.5" />
                    {c.label}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {c.ok && c.value ? c.value : "Pas encore détecté"}
                </TooltipContent>
              </Tooltip>
            );
          })}
          {analyzing && (
            <span className="text-xs text-card-foreground/50 ml-1">Analyse…</span>
          )}
        </div>
      </TooltipProvider>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center">
        <Button
          variant="ghost"
          onClick={onNext}
          className="text-card-foreground/70 hover:text-card-foreground"
        >
          Passer cette étape
        </Button>
        <Button
          onClick={handleContinue}
          disabled={applying}
          className="gap-2"
          size="lg"
        >
          {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {applying ? "Analyse..." : "Continuer"}
          {!applying && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};
