import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const REASONS = [
  "Niveau de diplôme trop faible",
  "Hard skills insuffisants",
  "Soft skills ne correspondent pas",
  "Localisation ou disponibilité inadaptée",
  "Autre",
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (reasons: string[], other: string) => Promise<void> | void;
}

export const RejectAllProfilesDialog = ({ open, onOpenChange, onSubmit }: Props) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [other, setOther] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggle = (r: string) => {
    setSelected((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);
  };

  const otherSelected = selected.includes("Autre");
  const canSubmit = selected.length > 0 && (!otherSelected || other.trim().length > 0);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(selected, other.trim());
      setSelected([]);
      setOther("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pourquoi ces profils ne correspondent pas&nbsp;?</DialogTitle>
          <DialogDescription>Votre retour nous aide à mieux cibler les prochains profils.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {REASONS.map((r) => (
            <div key={r} className="flex items-center gap-2">
              <Checkbox id={r} checked={selected.includes(r)} onCheckedChange={() => toggle(r)} />
              <Label htmlFor={r} className="cursor-pointer text-sm">{r}</Label>
            </div>
          ))}
          {otherSelected && (
            <Textarea
              placeholder="Précisez la raison…"
              value={other}
              onChange={(e) => setOther(e.target.value)}
              rows={3}
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? "Envoi…" : "Envoyer le feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
