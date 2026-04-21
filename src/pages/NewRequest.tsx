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
import { Card, CardContent } from "@/components/ui/card";
import { Check, Save } from "lucide-react";

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
      if (!id) { initialized.current = true; return; }
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
          employmentType: ((row as any).employment_type as any) || null,
        });
        // Skip the AI step when editing an existing draft
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
      weekly_hours: 0,
      weekly_price: 0,
      monthly_price: 0,
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

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-end gap-2 text-xs">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Save className="h-3 w-3 animate-pulse" /> Sauvegarde...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-success">
              <Check className="h-3 w-3" /> Brouillon enregistré
            </span>
          )}
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {steps.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <button
                    onClick={() => i < step && setStep(i)}
                    disabled={i > step}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                      i < step
                        ? "bg-success text-success-foreground cursor-pointer"
                        : i === step
                        ? "bg-primary text-primary-foreground"
                        : "bg-card-foreground/10 text-card-foreground/40"
                    }`}
                  >
                    {i < step ? <Check className="h-4 w-4" /> : i + 1}
                  </button>
                  <span className={`hidden text-sm sm:inline ${
                    i <= step ? "font-medium text-card-foreground" : "text-card-foreground/40"
                  }`}>
                    {label}
                  </span>
                  {i < steps.length - 1 && (
                    <div className={`mx-2 h-px w-6 sm:w-12 ${i < step ? "bg-success" : "bg-card-foreground/10"}`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 lg:p-8">
            {step === 0 && <StepNaturalLanguage data={data} onChange={handleChange} onNext={() => setStep(1)} />}
            {step === 1 && <StepProfileAndJob data={data} onChange={handleChange} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
            {step === 2 && (
              <StepRecap
                data={data}
                onBack={() => setStep(1)}
                onEdit={setStep}
                draftId={draftId}
                onSubmitted={(id) => { setSubmittedId(id); setSubmitted(true); }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default NewRequest;
