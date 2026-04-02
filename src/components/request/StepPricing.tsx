import { useMemo } from "react";
import { RequestFormData } from "@/lib/request-types";
import { HOURLY_RATE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Users, Clock, CalendarDays, Euro, TrendingUp, Sparkles } from "lucide-react";
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
    onChange({
      weeklyHours: pricing.weeklyHours,
      weeklyPrice: pricing.weeklyPrice,
      monthlyPrice: pricing.monthlyPrice,
    });
    onNext();
  };

  const includes = [
    "Matching profils", "Screening", "Gestion administrative",
    "Contrat", "Support dédié", "Suivi de mission",
  ];

  const stats = [
    { icon: Users, label: "Talents", value: data.talentsNumber.toString() },
    { icon: CalendarDays, label: "Jours / semaine", value: data.daysPerWeek.toString() },
    { icon: Clock, label: "Heures / semaine", value: `${pricing.weeklyHours}h` },
    { icon: Euro, label: "Taux journalier", value: `${pricing.dailyRate}€` },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Tarification</h2>
        <p className="text-sm text-muted-foreground">Estimation basée sur vos critères</p>
      </div>

      {/* Price cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="gradient-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary-foreground/10" />
          <CardContent className="relative p-6">
            <p className="text-sm font-medium opacity-80">Prix hebdomadaire</p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight">
              {pricing.weeklyPrice.toLocaleString("fr-FR")}€
            </p>
            <p className="mt-1 text-xs opacity-60">HT / semaine</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-primary relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5" />
          <CardContent className="relative p-6">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">Prix mensuel</p>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-4xl font-extrabold tracking-tight text-primary">
              {pricing.monthlyPrice.toLocaleString("fr-FR")}€
            </p>
            <p className="mt-1 text-xs text-muted-foreground">HT / mois (estimation)</p>
          </CardContent>
        </Card>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="flex flex-col items-center p-4 text-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                <Icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <p className="text-lg font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Breakdown */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Taux horaire</span>
            <span className="font-medium">{HOURLY_RATE}€ / heure</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Heures / semaine</span>
            <span className="font-medium">{pricing.weeklyHours}h</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Nombre de talents</span>
            <span className="font-medium">× {data.talentsNumber}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Frais de sélection</span>
            <span className="font-semibold text-success">Offerts</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Total mensuel estimé</span>
            <span className="text-primary">{pricing.monthlyPrice.toLocaleString("fr-FR")}€</span>
          </div>
        </CardContent>
      </Card>

      {/* Includes */}
      <Card className="bg-accent/30">
        <CardContent className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Inclus dans le service</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {includes.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/20">
                  <Check className="h-3 w-3 text-success" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Retour</Button>
        <Button onClick={handleNext}>Suivant</Button>
      </div>
    </div>
  );
};
