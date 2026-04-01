import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { RequestFormData, defaultFormData } from "@/lib/request-types";
import { StepTalentInfo } from "@/components/request/StepTalentInfo";
import { StepJobDetails } from "@/components/request/StepJobDetails";
import { StepPricing } from "@/components/request/StepPricing";
import { StepConfirmation } from "@/components/request/StepConfirmation";

const steps = ["Talent", "Poste", "Tarif", "Confirmation"];

const NewRequest = () => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<RequestFormData>(defaultFormData);

  const handleChange = (partial: Partial<RequestFormData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Stepper */}
        <div className="flex items-center justify-between">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  i <= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <span className={`hidden text-sm sm:inline ${i <= step ? "font-medium" : "text-muted-foreground"}`}>
                {label}
              </span>
              {i < steps.length - 1 && (
                <div className={`mx-2 h-px w-8 sm:w-16 ${i < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {step === 0 && <StepTalentInfo data={data} onChange={handleChange} onNext={() => setStep(1)} />}
        {step === 1 && <StepJobDetails data={data} onChange={handleChange} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
        {step === 2 && <StepPricing data={data} onChange={handleChange} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <StepConfirmation data={data} onBack={() => setStep(2)} />}
      </div>
    </AppLayout>
  );
};

export default NewRequest;
