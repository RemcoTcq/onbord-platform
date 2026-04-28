import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Plus, Trash2, Video, Building2, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type InterviewMode = "video" | "onsite";
export type Slot = { date: string; period: "morning" | "afternoon" };

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (mode: InterviewMode, slots: Slot[], onsiteAddress?: string) => Promise<void> | void;
}

export const OrganizeInterviewDialog = ({ open, onOpenChange, onSubmit }: Props) => {
  const [mode, setMode] = useState<InterviewMode | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [onsiteAddress, setOnsiteAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addSlot = () => {
    if (slots.length >= 3) return;
    setSlots((prev) => [...prev, { date: "", period: "morning" }]);
  };
  const removeSlot = (i: number) => setSlots((prev) => prev.filter((_, idx) => idx !== i));
  const updateSlot = (i: number, patch: Partial<Slot>) =>
    setSlots((prev) => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s));

  const validSlots = slots.filter((s) => s.date);
  const onsiteOk = mode !== "onsite" || onsiteAddress.trim().length > 3;
  const requiredSlots = mode === "onsite" ? 3 : 2;
  const canSubmit = mode !== null && validSlots.length >= requiredSlots && onsiteOk;

  const handleSubmit = async () => {
    if (!mode) return;
    setSubmitting(true);
    try {
      await onSubmit(mode, validSlots, mode === "onsite" ? onsiteAddress.trim() : undefined);
      setMode(null);
      setSlots([]);
      setOnsiteAddress("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Super&nbsp;! Comment souhaitez-vous rencontrer ce talent&nbsp;?</DialogTitle>
          <DialogDescription>Sélectionnez 2 à 3 créneaux. Onbord coordonne avec le talent.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode("video")}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border p-4 text-sm transition-all",
              mode === "video" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
            )}
          >
            <Video className="h-6 w-6" />
            <span className="font-medium">Appel vidéo</span>
            <span className="text-xs text-muted-foreground">Onbord organise le call</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("onsite")}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border p-4 text-sm transition-all",
              mode === "onsite" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
            )}
          >
            <Building2 className="h-6 w-6" />
            <span className="font-medium">Entretien sur place</span>
            <span className="text-xs text-muted-foreground">Le talent se déplace</span>
          </button>
        </div>

        {mode && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Créneaux proposés ({slots.length}/3)</p>
            {slots.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal", !s.date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {s.date ? format(new Date(s.date), "PPP", { locale: fr }) : "Choisir une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={s.date ? new Date(s.date) : undefined}
                      onSelect={(d) => d && updateSlot(i, { date: d.toISOString() })}
                      disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex rounded-md border">
                  <button
                    type="button"
                    onClick={() => updateSlot(i, { period: "morning" })}
                    className={cn("px-3 py-2 text-xs", s.period === "morning" ? "bg-primary text-primary-foreground" : "")}
                  >
                    Matin
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSlot(i, { period: "afternoon" })}
                    className={cn("px-3 py-2 text-xs", s.period === "afternoon" ? "bg-primary text-primary-foreground" : "")}
                  >
                    A-M
                  </button>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeSlot(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {slots.length < 3 && (
              <Button variant="outline" size="sm" onClick={addSlot} className="gap-2">
                <Plus className="h-4 w-4" /> Ajouter un créneau
              </Button>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Plus tard</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? "Envoi…" : "Confirmer les créneaux"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
