import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

type SkillLevel = "Débutant" | "Intermédiaire" | "Avancé";
type HardSkill = { name: string; level: SkillLevel };
type SoftSkill = { name: string; example: string };
type LanguageItem = { name: string; level: number };
type Experience = { role: string; sector: string; duration: string; description: string };
type LookingFor = { contract_type?: string; sector?: string; ambitions?: string };

interface Profile {
  id: string;
  request_id: string;
  alias: string;
  first_name: string;
  last_initial: string;
  bio: string;
  validated_by_onbord: boolean;
  headline: string;
  summary: string;
  experience_years: number;
  skills: string[];
  hard_skills_detail: HardSkill[];
  soft_skills_detail: SoftSkill[];
  languages: LanguageItem[];
  school: string;
  diploma: string;
  study_year: string;
  study_field: string;
  experiences: Experience[];
  looking_for: LookingFor;
  availability: string;
  availability_regime: string;
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
  request_id,
  alias: "Talent",
  first_name: "",
  last_initial: "",
  bio: "",
  validated_by_onbord: true,
  headline: "",
  summary: "",
  experience_years: 0,
  skills: [],
  hard_skills_detail: [],
  soft_skills_detail: [],
  languages: [],
  school: "",
  diploma: "",
  study_year: "",
  study_field: "",
  experiences: [],
  looking_for: {},
  availability: "",
  availability_regime: "",
  location_area: "",
  full_name: "",
  email: "",
  phone: "",
  linkedin_url: "",
});

const lastInitialFromFullName = (full: string): string => {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return "";
  return parts[parts.length - 1].charAt(0).toUpperCase() + ".";
};

export const AdminProfilesManager = ({
  requestId,
  requestStatus,
  onProfilesChanged,
}: {
  requestId: string;
  requestStatus: string;
  onProfilesChanged?: () => void;
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editing, setEditing] = useState<Partial<Profile> | null>(null);
  const [skillsInput, setSkillsInput] = useState("");

  const fetch = async () => {
    const { data } = await supabase
      .from("proposed_profiles")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at");
    setProfiles((data as any) || []);
  };

  useEffect(() => {
    fetch();
  }, [requestId]);

  const openNew = () => {
    setEditing(empty(requestId));
    setSkillsInput("");
  };

  const openEdit = (p: Profile) => {
    setEditing({
      ...p,
      hard_skills_detail: p.hard_skills_detail || [],
      soft_skills_detail: p.soft_skills_detail || [],
      languages: (p.languages as any) || [],
      experiences: p.experiences || [],
      looking_for: p.looking_for || {},
    });
    setSkillsInput((p.skills || []).join(", "));
  };

  const save = async () => {
    if (!editing) return;
    const payload: any = {
      ...editing,
      skills: skillsInput.split(",").map((s) => s.trim()).filter(Boolean),
      last_initial: editing.full_name
        ? lastInitialFromFullName(editing.full_name)
        : editing.last_initial || "",
      // also keep alias roughly in sync with first name for backward compat
      alias: editing.first_name
        ? `${editing.first_name} ${lastInitialFromFullName(editing.full_name || "")}`.trim()
        : editing.alias || "Talent",
    };
    let error;
    if ((editing as Profile).id) {
      ({ error } = await supabase
        .from("proposed_profiles")
        .update(payload)
        .eq("id", (editing as Profile).id));
    } else {
      ({ error } = await supabase.from("proposed_profiles").insert(payload));
      if (!error && profiles.length === 0 && requestStatus === "Demande validée") {
        await supabase
          .from("requests")
          .update({ status: "Profils envoyés" })
          .eq("id", requestId);
      }
    }
    if (error) {
      toast.error("Erreur lors de l'enregistrement");
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

  // ---------- Dynamic editors ----------
  const updateField = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setEditing((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const HardSkillsEditor = () => {
    const items = (editing?.hard_skills_detail as HardSkill[]) || [];
    const add = () => updateField("hard_skills_detail", [...items, { name: "", level: "Intermédiaire" }] as any);
    const update = (i: number, patch: Partial<HardSkill>) =>
      updateField(
        "hard_skills_detail",
        items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) as any
      );
    const remove = (i: number) => updateField("hard_skills_detail", items.filter((_, idx) => idx !== i) as any);
    return (
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              placeholder="Compétence"
              value={it.name}
              onChange={(e) => update(i, { name: e.target.value })}
              className="flex-1"
            />
            <Select value={it.level} onValueChange={(v) => update(i, { level: v as SkillLevel })}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Débutant">Débutant</SelectItem>
                <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                <SelectItem value="Avancé">Avancé</SelectItem>
              </SelectContent>
            </Select>
            <Button size="icon" variant="ghost" onClick={() => remove(i)}><X className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={add} className="gap-1"><Plus className="h-3 w-3" /> Ajouter</Button>
      </div>
    );
  };

  const SoftSkillsEditor = () => {
    const items = (editing?.soft_skills_detail as SoftSkill[]) || [];
    const add = () => updateField("soft_skills_detail", [...items, { name: "", example: "" }] as any);
    const update = (i: number, patch: Partial<SoftSkill>) =>
      updateField(
        "soft_skills_detail",
        items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) as any
      );
    const remove = (i: number) => updateField("soft_skills_detail", items.filter((_, idx) => idx !== i) as any);
    return (
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-center">
            <Input placeholder="Soft skill" value={it.name} onChange={(e) => update(i, { name: e.target.value })} />
            <Input placeholder="Exemple concret" value={it.example} onChange={(e) => update(i, { example: e.target.value })} />
            <Button size="icon" variant="ghost" onClick={() => remove(i)}><X className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={add} className="gap-1"><Plus className="h-3 w-3" /> Ajouter (3–5)</Button>
      </div>
    );
  };

  const LanguagesEditor = () => {
    const items = (editing?.languages as LanguageItem[]) || [];
    const add = () => updateField("languages", [...items, { name: "", level: 3 }] as any);
    const update = (i: number, patch: Partial<LanguageItem>) =>
      updateField("languages", items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) as any);
    const remove = (i: number) => updateField("languages", items.filter((_, idx) => idx !== i) as any);
    return (
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input placeholder="Langue" value={it.name} onChange={(e) => update(i, { name: e.target.value })} className="flex-1" />
            <Select value={String(it.level)} onValueChange={(v) => update(i, { level: parseInt(v) })}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}/5</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="icon" variant="ghost" onClick={() => remove(i)}><X className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={add} className="gap-1"><Plus className="h-3 w-3" /> Ajouter</Button>
      </div>
    );
  };

  const ExperiencesEditor = () => {
    const items = (editing?.experiences as Experience[]) || [];
    const add = () => updateField("experiences", [...items, { role: "", sector: "", duration: "", description: "" }] as any);
    const update = (i: number, patch: Partial<Experience>) =>
      updateField("experiences", items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) as any);
    const remove = (i: number) => updateField("experiences", items.filter((_, idx) => idx !== i) as any);
    return (
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="rounded border border-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Expérience {i + 1}</span>
              <Button size="icon" variant="ghost" onClick={() => remove(i)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Rôle" value={it.role} onChange={(e) => update(i, { role: e.target.value })} />
              <Input placeholder="Secteur" value={it.sector} onChange={(e) => update(i, { sector: e.target.value })} />
              <Input placeholder="Durée (ex: 6 mois)" value={it.duration} onChange={(e) => update(i, { duration: e.target.value })} />
            </div>
            <Textarea
              rows={2}
              placeholder="Description (sans nom d'entreprise)"
              value={it.description}
              onChange={(e) => update(i, { description: e.target.value })}
            />
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={add} className="gap-1"><Plus className="h-3 w-3" /> Ajouter</Button>
      </div>
    );
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">
                    {p.first_name || p.alias} {p.last_initial}
                  </span>
                  <span className="text-xs text-muted-foreground">— {p.full_name || "Sans nom"}</span>
                  <Badge
                    variant={p.status === "accepted" ? "default" : p.status === "rejected" ? "outline" : "secondary"}
                    className="text-xs"
                  >
                    {p.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.school} {p.study_year && `· ${p.study_year}`} {p.study_field && `· ${p.study_field}`}
                </p>
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{(editing as Profile)?.id ? "Modifier" : "Nouveau"} profil étudiant</DialogTitle>
            </DialogHeader>
            {editing && (
              <Accordion
                type="multiple"
                defaultValue={["identity", "public", "education", "hard", "soft", "languages", "experiences", "looking", "availability"]}
                className="w-full"
              >
                <AccordionItem value="identity">
                  <AccordionTrigger>1. Identité (privée Onbord)</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Nom complet</Label><Input value={editing.full_name || ""} onChange={(e) => updateField("full_name", e.target.value)} /></div>
                      <div><Label>Email</Label><Input value={editing.email || ""} onChange={(e) => updateField("email", e.target.value)} /></div>
                      <div><Label>Téléphone</Label><Input value={editing.phone || ""} onChange={(e) => updateField("phone", e.target.value)} /></div>
                      <div><Label>LinkedIn</Label><Input value={editing.linkedin_url || ""} onChange={(e) => updateField("linkedin_url", e.target.value)} /></div>
                    </div>
                    <p className="text-xs text-muted-foreground">L'initiale du nom sera générée automatiquement : <span className="font-mono">{lastInitialFromFullName(editing.full_name || "") || "—"}</span></p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="public">
                  <AccordionTrigger>2. Présentation publique</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Prénom</Label><Input value={editing.first_name || ""} onChange={(e) => updateField("first_name", e.target.value)} /></div>
                      <div><Label>Localisation</Label><Input value={editing.location_area || ""} onChange={(e) => updateField("location_area", e.target.value)} /></div>
                    </div>
                    <div><Label>Bio (3–4 lignes)</Label><Textarea rows={4} value={editing.bio || ""} onChange={(e) => updateField("bio", e.target.value)} /></div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="education">
                  <AccordionTrigger>3. Formation</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>École</Label><Input value={editing.school || ""} onChange={(e) => updateField("school", e.target.value)} /></div>
                      <div><Label>Diplôme</Label><Input value={editing.diploma || ""} onChange={(e) => updateField("diploma", e.target.value)} /></div>
                      <div><Label>Année</Label><Input placeholder="ex: Master 1" value={editing.study_year || ""} onChange={(e) => updateField("study_year", e.target.value)} /></div>
                      <div><Label>Domaine</Label><Input value={editing.study_field || ""} onChange={(e) => updateField("study_field", e.target.value)} /></div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="hard">
                  <AccordionTrigger>4. Hard skills (avec niveau)</AccordionTrigger>
                  <AccordionContent><HardSkillsEditor /></AccordionContent>
                </AccordionItem>

                <AccordionItem value="soft">
                  <AccordionTrigger>5. Soft skills (3–5 + exemple)</AccordionTrigger>
                  <AccordionContent><SoftSkillsEditor /></AccordionContent>
                </AccordionItem>

                <AccordionItem value="languages">
                  <AccordionTrigger>6. Langues (niveau /5)</AccordionTrigger>
                  <AccordionContent><LanguagesEditor /></AccordionContent>
                </AccordionItem>

                <AccordionItem value="experiences">
                  <AccordionTrigger>7. Expériences (anonymisées)</AccordionTrigger>
                  <AccordionContent><ExperiencesEditor /></AccordionContent>
                </AccordionItem>

                <AccordionItem value="looking">
                  <AccordionTrigger>8. Ce qu'il/elle cherche</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div>
                        <Label>Type de contrat</Label>
                        <Input
                          value={(editing.looking_for as LookingFor)?.contract_type || ""}
                          onChange={(e) => updateField("looking_for", { ...(editing.looking_for || {}), contract_type: e.target.value } as any)}
                        />
                      </div>
                      <div>
                        <Label>Secteur recherché</Label>
                        <Input
                          value={(editing.looking_for as LookingFor)?.sector || ""}
                          onChange={(e) => updateField("looking_for", { ...(editing.looking_for || {}), sector: e.target.value } as any)}
                        />
                      </div>
                      <div>
                        <Label>Ambitions</Label>
                        <Textarea
                          rows={2}
                          value={(editing.looking_for as LookingFor)?.ambitions || ""}
                          onChange={(e) => updateField("looking_for", { ...(editing.looking_for || {}), ambitions: e.target.value } as any)}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="availability">
                  <AccordionTrigger>9. Disponibilité</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Date de début</Label>
                        <Input placeholder="ex: 01/09/2026" value={editing.availability || ""} onChange={(e) => updateField("availability", e.target.value)} />
                      </div>
                      <div>
                        <Label>Régime</Label>
                        <Input placeholder="ex: 3 jours/sem, temps plein…" value={editing.availability_regime || ""} onChange={(e) => updateField("availability_regime", e.target.value)} />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
