import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RequestFormData } from "@/lib/request-types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, ArrowRight, Loader2, Check, MapPin, Briefcase, Wrench, Languages } from "lucide-react";
import { toast } from "sonner";
import { JobOfferImporter } from "./JobOfferImporter";
import { cn } from "@/lib/utils";

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

  const runDetection = async (query: string): Promise<Detection | null> => {
    if (query === lastQueryRef.current && detection) return detection;
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
        else toast.error("Erreur lors de l'analyse.");
        return null;
      }
      if (result) {
        setDetection(result as Detection);
        return result as Detection;
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

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
    const q = data.naturalLanguageQuery.trim();
    if (q.length < MIN_CHARS) {
      onNext();
      return;
    }

    setApplying(true);
    setFillStepIdx(0);
    const STEP_DURATION = 700;
    const startedAt = Date.now();

    const stepTimer = setInterval(() => {
      setFillStepIdx((i) => Math.min(i + 1, fillSteps.length - 1));
    }, STEP_DURATION);

    try {
      let result = detection;
      if (!detection || lastQueryRef.current !== q) {
        clearTimeout(debounceRef.current);
        result = await runDetection(q);
      }
      if (result) applyDetection(result);
      const minTotal = STEP_DURATION * fillSteps.length + 300;
      const elapsed = Date.now() - startedAt;
      if (elapsed < minTotal) {
        await new Promise((r) => setTimeout(r, minTotal - elapsed));
      }
      setFillStepIdx(fillSteps.length - 1);
      await new Promise((r) => setTimeout(r, 200));
    } finally {
      clearInterval(stepTimer);
      setApplying(false);
      onNext();
    }
  };

  const handleImportedOffer = async (extractedText: string) => {
    setApplying(true);
    setFillStepIdx(0);

    const STEP_DURATION = 700;
    const startedAt = Date.now();
    const stepTimer = setInterval(() => {
      setFillStepIdx((i) => Math.min(i + 1, fillSteps.length - 1));
    }, STEP_DURATION);

    try {
      clearTimeout(debounceRef.current);
      lastQueryRef.current = "";
      const result = await runDetection(extractedText);
      if (!result) {
        toast.error("L'analyse de l'offre a échoué.");
        return;
      }
      applyDetection(result);
      const minTotal = STEP_DURATION * fillSteps.length + 300;
      const elapsed = Date.now() - startedAt;
      if (elapsed < minTotal) {
        await new Promise((r) => setTimeout(r, minTotal - elapsed));
      }
      setFillStepIdx(fillSteps.length - 1);
      await new Promise((r) => setTimeout(r, 200));
      onNext();
    } finally {
      clearInterval(stepTimer);
      setApplying(false);
    }
  };

  const detectionChips = [
    {
      key: "title",
      label: "Titre",
      icon: Briefcase,
      ok: !!detection?.jobTitle,
      value: detection?.jobTitle || "",
    },
    {
      key: "skills",
      label: "Skills",
      icon: Wrench,
      ok: !!detection && detection.hardSkills.length + detection.customHardSkills.length > 0,
      value: detection ? [...detection.hardSkills, ...detection.customHardSkills].slice(0, 4).join(", ") : "",
    },
    {
      key: "location",
      label: "Lieu",
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
    <div className="space-y-6 relative">
      {applying && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-xl bg-background/85 backdrop-blur-sm -m-4 p-4 animate-fade-in">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="relative mx-auto h-16 w-16">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary shadow-md">
                <Sparkles className="h-7 w-7 text-primary-foreground animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">L'IA remplit votre formulaire</h3>
              <p className="text-[12.5px] text-muted-foreground mt-1">Quelques secondes…</p>
            </div>
            <ul className="space-y-1.5 text-left max-w-xs mx-auto">
              {fillSteps.map((s, i) => {
                const done = i < fillStepIdx;
                const current = i === fillStepIdx;
                return (
                  <li
                    key={s}
                    className={cn(
                      "flex items-center gap-2 text-[12.5px] transition-colors",
                      done && "text-success",
                      current && "text-foreground",
                      !done && !current && "text-muted-foreground/60",
                    )}
                  >
                    {done ? (
                      <Check className="h-3.5 w-3.5 text-success animate-scale-in" />
                    ) : current ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    ) : (
                      <span className="h-3.5 w-3.5 rounded-full border border-border" />
                    )}
                    <span>{s}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Décrivez votre besoin</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          L'IA analyse votre description et structure le formulaire automatiquement.
        </p>
      </div>

      <div className="group relative rounded-xl border border-border bg-card transition-all focus-within:border-primary/60 focus-within:shadow-md">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-2.5 py-1.5">
          <JobOfferImporter onImported={handleImportedOffer} disabled={applying} label="Importer une offre" />
          {analyzing && (
            <span className="flex items-center gap-1.5 pr-2 text-[11px] text-primary font-medium">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Analyse IA
            </span>
          )}
        </div>
        <Textarea
          value={data.naturalLanguageQuery}
          onChange={(e) => onChange({ naturalLanguageQuery: e.target.value })}
          placeholder="Ex: Développeur Python à Bruxelles, 2 jours/semaine, FR/EN, niveau Master.&#10;Ou collez votre description d'offre…"
          rows={5}
          className="min-h-[160px] bg-transparent border-0 text-foreground resize-none pr-10 text-[14px] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none placeholder:text-muted-foreground/50"
        />
        <div className="absolute right-3 bottom-3 pointer-events-none">
          <Sparkles
            className={cn(
              "h-4 w-4 transition-colors",
              analyzing ? "text-primary animate-pulse" : "text-muted-foreground/40",
            )}
          />
        </div>
      </div>

      {/* Detection chips */}
      <TooltipProvider delayDuration={150}>
        <div className="flex flex-wrap items-center gap-1.5">
          {detectionChips.map((c) => {
            const Icon = c.icon;
            return (
              <Tooltip key={c.key}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11.5px] font-medium transition-all",
                      c.ok
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-border bg-muted/40 text-muted-foreground",
                    )}
                  >
                    {c.ok ? (
                      <Check className="h-3 w-3 animate-scale-in" />
                    ) : (
                      <Icon className="h-3 w-3" />
                    )}
                    {c.label}
                  </div>
                </TooltipTrigger>
                <TooltipContent>{c.ok && c.value ? c.value : "Pas encore détecté"}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center pt-2">
        <Button variant="ghost" onClick={onNext} className="text-muted-foreground hover:text-foreground">
          Passer cette étape
        </Button>
        <Button onClick={handleContinue} disabled={applying} variant="gradient" size="lg" className="gap-1.5">
          {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {applying ? "Analyse…" : "Continuer"}
          {!applying && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};
