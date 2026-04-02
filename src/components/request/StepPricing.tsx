import { useMemo } from "react";
import { RequestFormData } from "@/lib/request-types";
import { HOURLY_RATE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Users, Clock, CalendarDays, Euro, TrendingUp, Sparkles, ArrowLeft, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
    const dailyRate = HOURLY_RATE * 8;
    return { halfDays, weeklyHours, weeklyPrice, monthlyPrice, dailyRate };
  }, [data.scheduleType, data.scheduleDetails, data.daysPerWeek, data.talentsNumber]);

  const handleNext = () => {
    onChange({ weeklyHours: pricing.weeklyHours, weeklyPrice: pricing.weeklyPrice, monthlyPrice: pricing.monthlyPrice });
    onNext();
  };

  const includes = ["Matching profils", "Screening", "Gestion administrative", "Contrat", "Support dédié", "Suivi de mission"];

  const stats = [
    { icon: Users, label: "Talents", value: data.talentsNumber.toString() },
    { icon: CalendarDays, label: "Jours / sem.", value: data.daysPerWeek.toString() },
    { icon: Clock, label: "Heures / sem.", value: `${pricing.weeklyHours}h` },
    { icon: Euro, label: "Taux jour.", value: `${pricing.dailyRate}€` },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-card-foreground">Tarification</h2>
        <p className="text-sm text-card-foreground/60">Estimation basée sur vos critères</p>
      </div>

      {/* Price cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary-foreground/10" />
          <p className="text-sm font-medium opacity-80">Prix hebdomadaire</p>
          <p className="mt-2 text-4xl font-extrabold tracking-tight">{pricing.weeklyPrice.toLocaleString("fr-FR")}€</p>
          <p className="mt-1 text-xs opacity-60">HT / semaine</p>
        </div>
        <div className="rounded-xl border-2 border-primary p-6 relative overflow-hidden bg-primary/5">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5" />
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-card-foreground/60">Prix mensuel</p>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-4xl font-extrabold tracking-tight text-primary">{pricing.monthlyPrice.toLocaleString("fr-FR")}€</p>
          <p className="mt-1 text-xs text-card-foreground/50">HT / mois (estimation)</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-card-foreground/10 p-4 text-center">
            <div className="mb-2 mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-lg font-bold text-card-foreground">{value}</p>
            <p className="text-xs text-card-foreground/50">{label}</p>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      <div className="rounded-xl border border-card-foreground/10 p-6 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-card-foreground/60">Taux horaire</span>
          <span className="font-medium text-card-foreground">{HOURLY_RATE}€ / heure</span>
        </div>
        <Separator className="bg-card-foreground/10" />
        <div className="flex items-center justify-between text-sm">
          <span className="text-card-foreground/60">Heures / semaine</span>
          <span className="font-medium text-card-foreground">{pricing.weeklyHours}h</span>
        </div>
        <Separator className="bg-card-foreground/10" />
        <div className="flex items-center justify-between text-sm">
          <span className="text-card-foreground/60">Nombre de talents</span>
          <span className="font-medium text-card-foreground">× {data.talentsNumber}</span>
        </div>
        <Separator className="bg-card-foreground/10" />
        <div className="flex items-center justify-between text-sm">
          <span className="text-card-foreground/60">Frais de sélection</span>
          <span className="font-semibold text-success">Offerts</span>
        </div>
        <Separator className="bg-card-foreground/10" />
        <div className="flex items-center justify-between text-sm font-semibold">
          <span className="text-card-foreground">Total mensuel estimé</span>
          <span className="text-primary">{pricing.monthlyPrice.toLocaleString("fr-FR")}€</span>
        </div>
      </div>

      {/* Includes */}
      <div className="rounded-xl bg-primary/5 p-6">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-card-foreground">Inclus dans le service</h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {includes.map((item) => (
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
        <Button onClick={handleNext} className="gap-2">
          Suivant <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
