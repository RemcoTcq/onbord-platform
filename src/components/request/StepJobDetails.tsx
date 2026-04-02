import { RequestFormData } from "@/lib/request-types";
import { DAYS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Props {
  data: RequestFormData;
  onChange: (data: Partial<RequestFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const StepJobDetails = ({ data, onChange, onNext, onBack }: Props) => {
  const toggleScheduleSlot = (day: string, slot: string) => {
    const current = data.scheduleDetails[day] || [];
    const updated = current.includes(slot) ? current.filter((s) => s !== slot) : [...current, slot];
    onChange({ scheduleDetails: { ...data.scheduleDetails, [day]: updated } });
  };

  const canProceed = data.title && data.description && data.talentsNumber > 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-card-foreground">Détails du poste</h2>
        <p className="text-sm text-card-foreground/60">Décrivez le poste et le planning</p>
      </div>

      <div className="space-y-2">
        <Label className="text-card-foreground">Titre du poste *</Label>
        <Input value={data.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Ex: Analyste financier junior" className="bg-card border-card-foreground/20 text-card-foreground" />
      </div>

      <div className="space-y-2">
        <Label className="text-card-foreground">Description courte *</Label>
        <Textarea value={data.description} onChange={(e) => onChange({ description: e.target.value })} placeholder="Décrivez brièvement les responsabilités" rows={3} className="bg-card border-card-foreground/20 text-card-foreground" />
      </div>

      <div className="space-y-2">
        <Label className="text-card-foreground">Nombre de talents</Label>
        <div className="flex gap-2">
          {[1, 2, 3].map((n) => (
            <Button key={n} variant={data.talentsNumber === n ? "default" : "outline"} onClick={() => onChange({ talentsNumber: n })} className={data.talentsNumber !== n ? "border-card-foreground/20 text-card-foreground" : ""}>
              {n === 3 ? "3+" : n}
            </Button>
          ))}
        </div>
        {data.talentsNumber >= 3 && (
          <Input type="number" min={3} value={data.talentsNumber} onChange={(e) => onChange({ talentsNumber: parseInt(e.target.value) || 3 })} className="mt-2 w-24 bg-card border-card-foreground/20 text-card-foreground" />
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-card-foreground">Jours par semaine</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Button key={n} variant={data.daysPerWeek === n ? "default" : "outline"} size="sm" onClick={() => onChange({ daysPerWeek: n })} className={data.daysPerWeek !== n ? "border-card-foreground/20 text-card-foreground" : ""}>
              {n}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-card-foreground">Horaires</Label>
        <div className="flex gap-2">
          <Button variant={data.scheduleType === "flexible" ? "default" : "outline"} onClick={() => onChange({ scheduleType: "flexible", scheduleDetails: {} })} className={data.scheduleType !== "flexible" ? "border-card-foreground/20 text-card-foreground" : ""}>
            Flexibles
          </Button>
          <Button variant={data.scheduleType === "fixed" ? "default" : "outline"} onClick={() => onChange({ scheduleType: "fixed" })} className={data.scheduleType !== "fixed" ? "border-card-foreground/20 text-card-foreground" : ""}>
            Fixes
          </Button>
        </div>
      </div>

      {data.scheduleType === "fixed" && (
        <div className="space-y-3 rounded-lg border border-card-foreground/10 p-4">
          <p className="text-sm text-card-foreground/60">Sélectionnez les créneaux</p>
          <div className="grid gap-2">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-3">
                <span className="w-20 text-sm font-medium text-card-foreground">{day}</span>
                <Badge
                  variant={(data.scheduleDetails[day] || []).includes("morning") ? "default" : "outline"}
                  className={`cursor-pointer ${!(data.scheduleDetails[day] || []).includes("morning") ? "border-card-foreground/20 text-card-foreground" : ""}`}
                  onClick={() => toggleScheduleSlot(day, "morning")}
                >
                  Matin
                </Badge>
                <Badge
                  variant={(data.scheduleDetails[day] || []).includes("afternoon") ? "default" : "outline"}
                  className={`cursor-pointer ${!(data.scheduleDetails[day] || []).includes("afternoon") ? "border-card-foreground/20 text-card-foreground" : ""}`}
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
        <Label className="text-card-foreground">Mode de travail</Label>
        <Select value={data.workMode} onValueChange={(v) => onChange({ workMode: v })}>
          <SelectTrigger className="bg-card border-card-foreground/20 text-card-foreground"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="remote">Remote</SelectItem>
            <SelectItem value="hybrid">Hybride</SelectItem>
            <SelectItem value="onsite">Présentiel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2 border-card-foreground/20 text-card-foreground">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="gap-2">
          Suivant <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
