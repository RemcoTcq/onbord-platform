import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface IR {
  id: string;
  proposed_profile_id: string;
  request_id: string;
  mode: string;
  proposed_slots: { date: string; period: string }[];
  confirmed_slot: { date: string; period: string } | null;
  status: string;
  created_at: string;
}

export const AdminInterviewsPanel = ({ requestId, onConfirmed }: { requestId: string; onConfirmed?: () => void }) => {
  const [items, setItems] = useState<IR[]>([]);

  const fetch = async () => {
    const { data } = await supabase.from("interview_requests").select("*").eq("request_id", requestId).order("created_at", { ascending: false });
    setItems((data as any) || []);
  };

  useEffect(() => { fetch(); }, [requestId]);

  const confirmSlot = async (ir: IR, slot: { date: string; period: string }) => {
    const { error } = await supabase.from("interview_requests").update({ confirmed_slot: slot, status: "confirmed" }).eq("id", ir.id);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Créneau confirmé");
    await fetch();
    onConfirmed?.();
  };

  if (items.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-6 space-y-3">
        <h3 className="text-lg font-semibold text-card-foreground">Entretiens (admin)</h3>
        {items.map((ir) => (
          <div key={ir.id} className="rounded border border-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Badge variant="secondary">{ir.mode === "video" ? "Vidéo" : "Sur place"}</Badge>
                <Badge className="ml-2" variant={ir.status === "confirmed" ? "default" : "outline"}>{ir.status}</Badge>
              </div>
              <span className="text-xs text-muted-foreground">{format(new Date(ir.created_at), "PPp", { locale: fr })}</span>
            </div>
            {ir.confirmed_slot ? (
              <p className="text-sm">
                Confirmé : {format(new Date(ir.confirmed_slot.date), "PPP", { locale: fr })} ({ir.confirmed_slot.period === "morning" ? "matin" : "après-midi"})
              </p>
            ) : (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Créneaux proposés :</p>
                {ir.proposed_slots.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 rounded border border-border/60 p-2 text-sm">
                    <span>{format(new Date(s.date), "PPP", { locale: fr })} — {s.period === "morning" ? "matin" : "après-midi"}</span>
                    <Button size="sm" onClick={() => confirmSlot(ir, s)}>Confirmer</Button>
                  </div>
                ))}
              </div>
            )}
            {ir.status === "confirmed" && (
              <Button size="sm" variant="outline" onClick={() => toast.info("Envoi d'invitations non encore implémenté")}>
                Envoyer les invitations
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
