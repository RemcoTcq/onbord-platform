import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { RequestFormData, defaultFormData } from "@/lib/request-types";
import { normalizeTalentType } from "@/lib/talent-type";
import { StepNaturalLanguage } from "@/components/request/StepNaturalLanguage";
import { StepProfileAndJob } from "@/components/request/StepProfileAndJob";
import { StepRecap } from "@/components/request/StepRecap";
import { StepConfirmation } from "@/components/request/StepConfirmation";
import { Check, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = ["Recherche IA", "Formulaire", "Récap"];

const NewRequest = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<RequestFormData>(defaultFormData);
  const [draftId, setDraftId] = useState<string | null>(searchParams.get("draft"));
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const initialized = useRef(false);

  // Load draft if editing
  useEffect(() => {
    const loadDraft = async () => {
      const id = searchParams.get("draft");
      if (!id) {
        initialized.current = true;
        return;
      }
      const { data: row } = await supabase.from("requests").select("*").eq("id", id).single();
      if (row) {
        setDraftId(id);
        setData({
          naturalLanguageQuery: (row as any).natural_language_query || "",
          talentType: normalizeTalentType((row as any).talent_type),
          domain: row.domain || "",
          mustHaveSkills: row.skills || [],
          niceToHaveSkills: (row as any).nice_to_have_skills || [],
          mustHaveSoftSkills: row.soft_skills || [],
          niceToHaveSoftSkills: (row as any).nice_to_have_soft_skills || [],
          customSkills: row.custom_skills || [],
          languages: (row.languages as any) || [],
          diploma: row.diploma || "",
          title: row.title || "",
          description: row.description || "",
          talentsNumber: row.talents_number,
          daysPerWeek: row.days_per_week,
          scheduleType: row.schedule_type as "flexible" | "fixed",
          scheduleDetails: (row.schedule_details as any) || {},
          workMode: row.work_mode || "remote",
          workLocation: (row as any).work_location || "",
          employmentType: ((row as any).employment_type as any) || null,
        });
        setStep(1);
      }
      initialized.current = true;
    };
    loadDraft();
  }, []);

  const saveDraft = useCallback(async () => {
    if (!user || !initialized.current) return;
    setSaveStatus("saving");

    const payload: any = {
      user_id: user.id,
      title: data.title || "Sans titre",
      description: data.description,
      domain: data.domain || "Non défini",
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
      status: "draft",
      natural_language_query: data.naturalLanguageQuery || null,
      employment_type: data.employmentType || null,
    };

    if (draftId) {
      await supabase.from("requests").update(payload).eq("id", draftId);
    } else {
      const { data: row } = await supabase.from("requests").insert(payload).select("id").single();
      if (row) {
        setDraftId(row.id);
        setSearchParams({ draft: row.id }, { replace: true });
      }
    }
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }, [user, data, draftId]);

  useEffect(() => {
    if (!initialized.current || submitted) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveDraft, 2000);
    return () => clearTimeout(saveTimer.current);
  }, [data, saveDraft, submitted]);

  const handleChange = (partial: Partial<RequestFormData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  if (submitted) {
    return (
      <AppLayout>
        <StepConfirmation requestId={submittedId} />
      </AppLayout>
    );
  }

  const progressPercent = ((step + 1) / steps.length) * 100;

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Save status discreet */}
        <div className="flex items-center justify-end gap-1.5 text-[11px] h-4">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Sauvegarde…
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />
              Brouillon enregistré
            </span>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Nouvelle demande</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Décrivez votre besoin, on s'occupe du reste.</p>
        </div>

        <div className="surface rounded-xl p-6 lg:p-8 animate-fade-in">
          {step === 0 && <StepNaturalLanguage data={data} onChange={handleChange} onNext={() => setStep(1)} />}
          {step === 1 && (
            <StepProfileAndJob data={data} onChange={handleChange} onNext={() => setStep(2)} onBack={() => setStep(0)} />
          )}
          {step === 2 && (
            <StepRecap
              data={data}
              onBack={() => setStep(1)}
              onEdit={setStep}
              draftId={draftId}
              onSubmitted={(id) => {
                setSubmittedId(id);
                setSubmitted(true);
              }}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default NewRequest;
