import { RequestFormData } from "@/lib/request-types";
import { DAYS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Props {
  data: RequestFormData;
  onChange: (data: Partial<RequestFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const StepJobDetails = ({ data, onChange, onNext, onBack }: Props) => {
  const talentsOptions = [1, 2, 3];

  const toggleScheduleSlot = (day: string, slot: string) => {
    const current = data.scheduleDetails[day] || [];
    const updated = current.includes(slot)
      ? current.filter((s) => s !== slot)
      : [...current, slot];
    onChange({ scheduleDetails: { ...data.scheduleDetails, [day]: updated } });
  };

  const totalHalfDays = data.scheduleType === "fixed"
    ? Object.values(data.scheduleDetails).reduce((sum, slots) => sum + slots.length, 0)
    : data.daysPerWeek * 2;

  const canProceed = data.title && data.description && data.talentsNumber > 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Détails du poste</h2>
        <p className="text-sm text-muted-foreground">Décrivez le poste à pourvoir</p>
      </div>

      <div className="space-y-2">
        <Label>Titre du poste *</Label>
        <Input value={data.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Ex: Analyste financier junior" />
      </div>

      <div className="space-y-2">
        <Label>Description courte *</Label>
        <Textarea value={data.description} onChange={(e) => onChange({ description: e.target.value })} placeholder="Décrivez brièvement les responsabilités" rows={3} />
      </div>

      <div className="space-y-2">
        <Label>Nombre de talents</Label>
        <div className="flex gap-2">
          {talentsOptions.map((n) => (
            <Button
              key={n}
              variant={data.talentsNumber === n ? "default" : "outline"}
              onClick={() => onChange({ talentsNumber: n })}
            >
              {n === 3 ? "3+" : n}
            </Button>
          ))}
        </div>
        {data.talentsNumber >= 3 && (
          <Input
            type="number"
            min={3}
            value={data.talentsNumber}
            onChange={(e) => onChange({ talentsNumber: parseInt(e.target.value) || 3 })}
            className="mt-2 w-24"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label>Jours par semaine</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Button
              key={n}
              variant={data.daysPerWeek === n ? "default" : "outline"}
              size="sm"
              onClick={() => onChange({ daysPerWeek: n })}
            >
              {n}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Horaires</Label>
        <div className="flex gap-2">
          <Button
            variant={data.scheduleType === "flexible" ? "default" : "outline"}
            onClick={() => onChange({ scheduleType: "flexible", scheduleDetails: {} })}
          >
            Flexibles
          </Button>
          <Button
            variant={data.scheduleType === "fixed" ? "default" : "outline"}
            onClick={() => onChange({ scheduleType: "fixed" })}
          >
            Fixes
          </Button>
        </div>
      </div>

      {data.scheduleType === "fixed" && (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Sélectionnez les créneaux ({data.daysPerWeek * 2} demi-journées max)
          </p>
          <div className="grid gap-2">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-3">
                <span className="w-20 text-sm font-medium">{day}</span>
                <Badge
                  variant={(data.scheduleDetails[day] || []).includes("morning") ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleScheduleSlot(day, "morning")}
                >
                  Matin
                </Badge>
                <Badge
                  variant={(data.scheduleDetails[day] || []).includes("afternoon") ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleScheduleSlot(day, "afternoon")}
                >
                  Après-midi
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Mode de travail</Label>
        <Select value={data.workMode} onValueChange={(v) => onChange({ workMode: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="remote">Remote</SelectItem>
            <SelectItem value="hybrid">Hybride</SelectItem>
            <SelectItem value="onsite">Présentiel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Retour</Button>
        <Button onClick={onNext} disabled={!canProceed}>Suivant</Button>
      </div>
    </div>
  );
};
