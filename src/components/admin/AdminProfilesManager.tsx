import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  request_id: string;
  alias: string;
  headline: string;
  summary: string;
  experience_years: number;
  skills: string[];
  availability: string;
  location_area: string;
  full_name: string;
  email: string;
  phone: string;
  linkedin_url: string;
  status: string;
  rejection_reasons: string[];
  rejection_other: string;
}

const empty = (request_id: string): Partial<Profile> => ({
  request_id, alias: "Talent", headline: "", summary: "", experience_years: 0,
  skills: [], availability: "", location_area: "",
  full_name: "", email: "", phone: "", linkedin_url: "",
});

export const AdminProfilesManager = ({ requestId, requestStatus, onProfilesChanged }: { requestId: string; requestStatus: string; onProfilesChanged?: () => void }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editing, setEditing] = useState<Partial<Profile> | null>(null);
  const [skillsInput, setSkillsInput] = useState("");

  const fetch = async () => {
    const { data } = await supabase.from("proposed_profiles").select("*").eq("request_id", requestId).order("created_at");
    setProfiles((data as any) || []);
  };

  useEffect(() => { fetch(); }, [requestId]);

  const openNew = () => {
    setEditing(empty(requestId));
    setSkillsInput("");
  };

  const openEdit = (p: Profile) => {
    setEditing(p);
    setSkillsInput((p.skills || []).join(", "));
  };

  const save = async () => {
    if (!editing) return;
    const payload = {
      ...editing,
      skills: skillsInput.split(",").map((s) => s.trim()).filter(Boolean),
    };
    let error;
    if ((editing as Profile).id) {
      ({ error } = await supabase.from("proposed_profiles").update(payload).eq("id", (editing as Profile).id));
    } else {
      ({ error } = await supabase.from("proposed_profiles").insert(payload as any));
      // bump request status if first profile pushed
      if (!error && profiles.length === 0 && requestStatus === "Demande validée") {
        await supabase.from("requests").update({ status: "Profils envoyés" }).eq("id", requestId);
      }
    }
    if (error) {
      toast.error("Erreur");
      return;
    }
    toast.success("Profil enregistré");
    setEditing(null);
    await fetch();
    onProfilesChanged?.();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce profil ?")) return;
    await supabase.from("proposed_profiles").delete().eq("id", id);
    await fetch();
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-card-foreground">Gestion des profils (admin)</h3>
          <Button size="sm" onClick={openNew} className="gap-1"><Plus className="h-4 w-4" /> Ajouter</Button>
        </div>

        {profiles.length === 0 && <p className="text-sm text-muted-foreground">Aucun profil proposé.</p>}

        {profiles.map((p) => (
          <div key={p.id} className="rounded border border-border p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{p.alias}</span>
                  <span className="text-xs text-muted-foreground">— {p.full_name || "Sans nom"}</span>
                  <Badge variant={p.status === "accepted" ? "default" : p.status === "rejected" ? "outline" : "secondary"} className="text-xs">{p.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{p.headline}</p>
                {p.status === "rejected" && (p.rejection_reasons?.length > 0 || p.rejection_other) && (
                  <div className="mt-1 text-xs text-destructive">
                    {p.rejection_reasons?.join(", ")}
                    {p.rejection_other && ` — ${p.rejection_other}`}
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        ))}

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{(editing as Profile)?.id ? "Modifier" : "Nouveau"} profil</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Alias public</Label><Input value={editing.alias || ""} onChange={(e) => setEditing({ ...editing, alias: e.target.value })} /></div>
                  <div><Label>Années d'XP</Label><Input type="number" value={editing.experience_years || 0} onChange={(e) => setEditing({ ...editing, experience_years: parseInt(e.target.value) || 0 })} /></div>
                </div>
                <div><Label>Headline (anonyme)</Label><Input value={editing.headline || ""} onChange={(e) => setEditing({ ...editing, headline: e.target.value })} /></div>
                <div><Label>Résumé (anonyme)</Label><Textarea rows={3} value={editing.summary || ""} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Disponibilité</Label><Input value={editing.availability || ""} onChange={(e) => setEditing({ ...editing, availability: e.target.value })} /></div>
                  <div><Label>Zone</Label><Input value={editing.location_area || ""} onChange={(e) => setEditing({ ...editing, location_area: e.target.value })} /></div>
                </div>
                <div><Label>Skills (séparés par des virgules)</Label><Input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} /></div>
                <div className="border-t pt-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">DONNÉES PRIVÉES (jamais affichées au client avant finalisation)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Nom complet</Label><Input value={editing.full_name || ""} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} /></div>
                    <div><Label>Email</Label><Input value={editing.email || ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
                    <div><Label>Téléphone</Label><Input value={editing.phone || ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></div>
                    <div><Label>LinkedIn</Label><Input value={editing.linkedin_url || ""} onChange={(e) => setEditing({ ...editing, linkedin_url: e.target.value })} /></div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
              <Button onClick={save}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
