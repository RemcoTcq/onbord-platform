import { useMemo } from "react";
import { RequestFormData } from "@/lib/request-types";
import { HOURLY_RATE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

interface Props {
  data: RequestFormData;
  onChange: (data: Partial<RequestFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const StepPricing = ({ data, onChange, onNext, onBack }: Props) => {
  const pricing = useMemo(() => {
    const halfDays = data.scheduleType === "fixed"
      ? Object.values(data.scheduleDetails).reduce((sum, slots) => sum + slots.length, 0)
      : data.daysPerWeek * 2;

    const weeklyHours = halfDays * 4 * data.talentsNumber;
    const weeklyPrice = weeklyHours * HOURLY_RATE;
    const monthlyPrice = weeklyPrice * 4;

    return { halfDays, weeklyHours, weeklyPrice, monthlyPrice };
  }, [data.scheduleType, data.scheduleDetails, data.daysPerWeek, data.talentsNumber]);

  const handleNext = () => {
    onChange({
      weeklyHours: pricing.weeklyHours,
      weeklyPrice: pricing.weeklyPrice,
      monthlyPrice: pricing.monthlyPrice,
    });
    onNext();
  };

  const includes = [
    "Matching profils", "Screening", "Gestion administrative",
    "Contrat", "Support", "Suivi",
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Tarification</h2>
        <p className="text-sm text-muted-foreground">Estimation basée sur vos critères</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="gradient-primary text-primary-foreground">
          <CardContent className="p-6 text-center">
            <p className="text-sm opacity-80">Prix hebdomadaire</p>
            <p className="text-3xl font-bold">{pricing.weeklyPrice.toLocaleString("fr-FR")}€</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-primary">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Prix mensuel</p>
            <p className="text-3xl font-bold text-primary">{pricing.monthlyPrice.toLocaleString("fr-FR")}€</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <span className="text-muted-foreground">Talents</span>
            <span className="text-right font-medium">{data.talentsNumber}</span>
            <span className="text-muted-foreground">Jours / semaine</span>
            <span className="text-right font-medium">{data.daysPerWeek}</span>
            <span className="text-muted-foreground">Heures / semaine</span>
            <span className="text-right font-medium">{pricing.weeklyHours}h</span>
            <span className="text-muted-foreground">Frais de sélection</span>
            <span className="text-right font-medium text-success">0€</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-semibold">Inclus dans le service</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {includes.map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-success" />
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Retour</Button>
        <Button onClick={handleNext}>Suivant</Button>
      </div>
    </div>
  );
};
