import { RequestFormData } from "@/lib/request-types";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, ArrowLeft, ArrowRight } from "lucide-react";

interface Props {
  data: RequestFormData;
  onChange: (data: Partial<RequestFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const INCLUDES = [
  "Matching profils",
  "Screening",
  "Gestion administrative",
  "Contrat",
  "Support dédié",
  "Suivi",
];

export const StepPricing = ({ onNext, onBack }: Props) => {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold text-card-foreground">
          Votre estimation tarifaire personnalisée
        </h2>
        <p className="text-sm text-card-foreground/60 max-w-xl mx-auto">
          La tarification varie selon le profil recherché et le type d'engagement.
          Notre équipe vous contacte rapidement avec une proposition adaptée.
        </p>
      </div>

      <div className="rounded-xl bg-primary/5 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-card-foreground">Inclus dans le service</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {INCLUDES.map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-card-foreground">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/20">
                <Check className="h-3 w-3 text-success" />
              </div>
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2 border-card-foreground/20 text-card-foreground">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <Button onClick={onNext} className="gap-2">
          Suivant <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
