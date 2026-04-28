import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DOMAINS, HARD_SKILLS_MAP, SOFT_SKILLS, LANGUAGES, DIPLOMAS, DAYS } from "@/lib/constants";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, X, Plus } from "lucide-react";
import { toast } from "sonner";

interface Props {
  request: any;
  onSave: (updated: any) => void;
  onCancel: () => void;
}

export const AdminRequestEditForm = ({ request, onSave, onCancel }: Props) => {
  const [form, setForm] = useState({
    domain: request.domain || "",
    title: request.title || "",
    description: request.description || "",
    talents_number: request.talents_number || 1,
    days_per_week: request.days_per_week || 1,
    schedule_type: request.schedule_type || "flexible",
    schedule_details: (request.schedule_details as Record<string, string[]>) || {},
    work_mode: request.work_mode || "remote",
    work_location: request.work_location || "",
    diploma: request.diploma || "",
    skills: request.skills || [],
    nice_to_have_skills: request.nice_to_have_skills || [],
    soft_skills: request.soft_skills || [],
    nice_to_have_soft_skills: request.nice_to_have_soft_skills || [],
    languages: (request.languages || []) as { name: string; level: number }[],
  });

  const [customSkillInput, setCustomSkillInput] = useState("");
  const [customSoftInput, setCustomSoftInput] = useState("");
  const [customLangInput, setCustomLangInput] = useState("");
  const [saving, setSaving] = useState(false);


  const hardSkills = form.domain ? HARD_SKILLS_MAP[form.domain] || [] : [];

  const update = (partial: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...partial }));

  // Skills management
  const addSkill = (skill: string) => {
    if (!form.skills.includes(skill) && !form.nice_to_have_skills.includes(skill)) {
      update({ skills: [...form.skills, skill] });
    }
  };
  const removeSkill = (skill: string) => update({
    skills: form.skills.filter((s: string) => s !== skill),
    nice_to_have_skills: form.nice_to_have_skills.filter((s: string) => s !== skill),
  });
  const moveSkillToNice = (skill: string) => update({
    skills: form.skills.filter((s: string) => s !== skill),
    nice_to_have_skills: [...form.nice_to_have_skills, skill],
  });
  const moveSkillToMust = (skill: string) => update({
    nice_to_have_skills: form.nice_to_have_skills.filter((s: string) => s !== skill),
    skills: [...form.skills, skill],
  });

  // Soft skills management
  const addSoft = (skill: string) => {
    if (!form.soft_skills.includes(skill) && !form.nice_to_have_soft_skills.includes(skill)) {
      update({ soft_skills: [...form.soft_skills, skill] });
    }
  };
  const removeSoft = (skill: string) => update({
    soft_skills: form.soft_skills.filter((s: string) => s !== skill),
    nice_to_have_soft_skills: form.nice_to_have_soft_skills.filter((s: string) => s !== skill),
  });
  const moveSoftToNice = (skill: string) => update({
    soft_skills: form.soft_skills.filter((s: string) => s !== skill),
    nice_to_have_soft_skills: [...form.nice_to_have_soft_skills, skill],
  });
  const moveSoftToMust = (skill: string) => update({
    nice_to_have_soft_skills: form.nice_to_have_soft_skills.filter((s: string) => s !== skill),
    soft_skills: [...form.soft_skills, skill],
  });

  // Languages
  const addLanguage = (name: string) => {
    if (!form.languages.find((l) => l.name === name)) {
      update({ languages: [...form.languages, { name, level: 3 }] });
    }
  };
  const removeLang = (name: string) => update({ languages: form.languages.filter((l) => l.name !== name) });
  const updateLangLevel = (name: string, level: number) => update({
    languages: form.languages.map((l) => l.name === name ? { ...l, level } : l),
  });

  const maxSlots = (form.days_per_week || 0) * 2;
  const usedSlots = Object.values(form.schedule_details || {}).reduce(
    (sum: number, slots: any) => sum + (slots?.length || 0),
    0,
  );
  const slotsLocked = usedSlots >= maxSlots;

  const toggleScheduleSlot = (day: string, slot: string) => {
    const current = form.schedule_details[day] || [];
    const isSelected = current.includes(slot);
    if (!isSelected && usedSlots >= maxSlots) return;
    const updated = isSelected ? current.filter((s) => s !== slot) : [...current, slot];
    update({ schedule_details: { ...form.schedule_details, [day]: updated } });
  };

  // Auto-truncate when daysPerWeek decreases
  useEffect(() => {
    if (form.schedule_type !== "fixed") return;
    if (usedSlots <= maxSlots) return;
    let toRemove = usedSlots - maxSlots;
    const next: Record<string, string[]> = {};
    const reversed = [...DAYS].reverse();
    for (const day of reversed) {
      const slots = [...(form.schedule_details[day] || [])];
      while (toRemove > 0 && slots.length > 0) {
        slots.pop();
        toRemove--;
      }
      next[day] = slots;
    }
    update({ schedule_details: next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.days_per_week]);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      ...form,
      weekly_hours: pricing.weeklyHours,
      weekly_price: pricing.weeklyPrice,
      monthly_price: pricing.monthlyPrice,
    };
    const { error } = await supabase.from("requests").update(payload).eq("id", request.id);
    if (error) {
      toast.error("Erreur lors de la sauvegarde");
    } else {
      toast.success("Demande mise à jour");
      onSave({ ...request, ...payload });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2 sticky top-0 z-10 bg-background py-2">
        <Button variant="outline" onClick={onCancel} className="gap-2 border-card-foreground/20 text-card-foreground">
          <X className="h-4 w-4" /> Annuler
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? "Sauvegarde..." : "Enregistrer"}
        </Button>
      </div>

      {/* Domain & Title */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-card-foreground">Informations générales</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-card-foreground">Domaine</Label>
              <Select value={form.domain} onValueChange={(v) => update({ domain: v })}>
                <SelectTrigger className="bg-card border-card-foreground/20 text-card-foreground"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOMAINS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Titre du poste</Label>
              <Input value={form.title} onChange={(e) => update({ title: e.target.value })} className="bg-card border-card-foreground/20 text-card-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-card-foreground">Description</Label>
            <Textarea value={form.description} onChange={(e) => update({ description: e.target.value })} rows={3} className="bg-card border-card-foreground/20 text-card-foreground" />
          </div>
          <div className="space-y-2">
            <Label className="text-card-foreground">Diplôme</Label>
            <Select value={form.diploma} onValueChange={(v) => update({ diploma: v })}>
              <SelectTrigger className="bg-card border-card-foreground/20 text-card-foreground"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>
                {DIPLOMAS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Hard Skills */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-card-foreground">Hard Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {hardSkills.map((skill) => {
              const selected = form.skills.includes(skill) || form.nice_to_have_skills.includes(skill);
              return (
                <Badge key={skill} variant={selected ? "default" : "outline"} className={`cursor-pointer transition-all ${selected ? "opacity-50" : "border-card-foreground/20 text-card-foreground hover:bg-primary hover:text-primary-foreground"}`} onClick={() => !selected && addSkill(skill)}>
                  {skill}
                </Badge>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Ajouter un skill" value={customSkillInput} onChange={(e) => setCustomSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (customSkillInput.trim()) { addSkill(customSkillInput.trim()); setCustomSkillInput(""); } } }} className="bg-card border-card-foreground/20 text-card-foreground" />
            <Button variant="outline" size="sm" onClick={() => { if (customSkillInput.trim()) { addSkill(customSkillInput.trim()); setCustomSkillInput(""); } }} className="border-card-foreground/20 text-card-foreground"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-3 rounded-lg border border-card-foreground/10 p-3">
              <p className="text-xs font-semibold text-card-foreground/60 mb-2 uppercase">Must have</p>
              <div className="flex flex-wrap gap-1.5 min-h-[40px]">
                {form.skills.map((s: string) => (
                  <Badge key={s} className="gap-1 bg-primary text-primary-foreground cursor-pointer" onClick={() => moveSkillToNice(s)}>
                    {s} <X className="h-3 w-3 opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); removeSkill(s); }} />
                  </Badge>
                ))}
              </div>
            </div>
            <div className="col-span-2 rounded-lg border border-card-foreground/10 p-3">
              <p className="text-xs font-semibold text-card-foreground/60 mb-2 uppercase">Nice to have</p>
              <div className="flex flex-wrap gap-1.5 min-h-[40px]">
                {form.nice_to_have_skills.map((s: string) => (
                  <Badge key={s} variant="outline" className="gap-1 cursor-pointer border-card-foreground/20 text-card-foreground" onClick={() => moveSkillToMust(s)}>
                    {s} <X className="h-3 w-3 opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); removeSkill(s); }} />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Soft Skills */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-card-foreground">Soft Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {SOFT_SKILLS.map((skill) => {
              const selected = form.soft_skills.includes(skill) || form.nice_to_have_soft_skills.includes(skill);
              return (
                <Badge key={skill} variant={selected ? "default" : "outline"} className={`cursor-pointer transition-all ${selected ? "opacity-50" : "border-card-foreground/20 text-card-foreground hover:bg-primary hover:text-primary-foreground"}`} onClick={() => !selected && addSoft(skill)}>
                  {skill}
                </Badge>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Ajouter un soft skill" value={customSoftInput} onChange={(e) => setCustomSoftInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (customSoftInput.trim()) { addSoft(customSoftInput.trim()); setCustomSoftInput(""); } } }} className="bg-card border-card-foreground/20 text-card-foreground" />
            <Button variant="outline" size="sm" onClick={() => { if (customSoftInput.trim()) { addSoft(customSoftInput.trim()); setCustomSoftInput(""); } }} className="border-card-foreground/20 text-card-foreground"><Plus className="h-4 w-4" /></Button>
          </div>
          {(form.soft_skills.length > 0 || form.nice_to_have_soft_skills.length > 0) && (
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-3 rounded-lg border border-card-foreground/10 p-3">
                <p className="text-xs font-semibold text-card-foreground/60 mb-2 uppercase">Must have</p>
                <div className="flex flex-wrap gap-1.5 min-h-[40px]">
                  {form.soft_skills.map((s: string) => (
                    <Badge key={s} className="gap-1 bg-primary text-primary-foreground cursor-pointer" onClick={() => moveSoftToNice(s)}>
                      {s} <X className="h-3 w-3 opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); removeSoft(s); }} />
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="col-span-2 rounded-lg border border-card-foreground/10 p-3">
                <p className="text-xs font-semibold text-card-foreground/60 mb-2 uppercase">Nice to have</p>
                <div className="flex flex-wrap gap-1.5 min-h-[40px]">
                  {form.nice_to_have_soft_skills.map((s: string) => (
                    <Badge key={s} variant="outline" className="gap-1 cursor-pointer border-card-foreground/20 text-card-foreground" onClick={() => moveSoftToMust(s)}>
                      {s} <X className="h-3 w-3 opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); removeSoft(s); }} />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-card-foreground">Langues</h3>
          <div className="flex gap-2">
            {LANGUAGES.map((lang) => (
              <Button key={lang} variant={form.languages.find((l) => l.name === lang) ? "default" : "outline"} size="sm" onClick={() => addLanguage(lang)} className={!form.languages.find((l) => l.name === lang) ? "border-card-foreground/20 text-card-foreground" : ""}>
                {lang}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Ajouter une langue" value={customLangInput} onChange={(e) => setCustomLangInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (customLangInput.trim()) { addLanguage(customLangInput.trim()); setCustomLangInput(""); } } }} className="bg-card border-card-foreground/20 text-card-foreground" />
            <Button variant="outline" size="sm" onClick={() => { if (customLangInput.trim()) { addLanguage(customLangInput.trim()); setCustomLangInput(""); } }} className="border-card-foreground/20 text-card-foreground"><Plus className="h-4 w-4" /></Button>
          </div>
          {form.languages.map((lang) => (
            <div key={lang.name} className="flex items-center gap-4 rounded-lg border border-card-foreground/10 p-3">
              <span className="w-28 font-medium text-card-foreground">{lang.name}</span>
              <Slider value={[lang.level]} onValueChange={([v]) => updateLangLevel(lang.name, v)} min={1} max={5} step={1} className="flex-1" />
              <span className="w-8 text-center text-sm font-semibold text-card-foreground">{lang.level}/5</span>
              <Button variant="ghost" size="sm" onClick={() => removeLang(lang.name)} className="text-card-foreground/40"><X className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Planning & Pricing */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-card-foreground">Planning & Tarification</h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-card-foreground">Nombre de talents</Label>
              <div className="flex gap-2">
                {[1, 2, 3].map((n) => (
                  <Button key={n} variant={form.talents_number === n ? "default" : "outline"} size="sm" onClick={() => update({ talents_number: n })} className={form.talents_number !== n ? "border-card-foreground/20 text-card-foreground" : ""}>
                    {n === 3 ? "3+" : n}
                  </Button>
                ))}
              </div>
              {form.talents_number >= 3 && (
                <Input type="number" min={3} value={form.talents_number} onChange={(e) => update({ talents_number: parseInt(e.target.value) || 3 })} className="w-24 bg-card border-card-foreground/20 text-card-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Jours par semaine</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Button key={n} variant={form.days_per_week === n ? "default" : "outline"} size="sm" onClick={() => update({ days_per_week: n })} className={form.days_per_week !== n ? "border-card-foreground/20 text-card-foreground" : ""}>
                    {n}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-card-foreground">Horaires</Label>
            <div className="flex gap-2">
              <Button variant={form.schedule_type === "flexible" ? "default" : "outline"} size="sm" onClick={() => update({ schedule_type: "flexible", schedule_details: {} })} className={form.schedule_type !== "flexible" ? "border-card-foreground/20 text-card-foreground" : ""}>Flexibles</Button>
              <Button variant={form.schedule_type === "fixed" ? "default" : "outline"} size="sm" onClick={() => update({ schedule_type: "fixed" })} className={form.schedule_type !== "fixed" ? "border-card-foreground/20 text-card-foreground" : ""}>Fixes</Button>
            </div>
          </div>

          {form.schedule_type === "fixed" && (
            <div className="rounded-lg border border-card-foreground/10 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-card-foreground/60">1 jour = 2 demi-journées{slotsLocked ? " — limite atteinte" : ""}.</p>
                <p className="text-xs font-medium text-card-foreground/70">{usedSlots} / {maxSlots}</p>
              </div>
              {DAYS.map((day) => {
                const slots = form.schedule_details[day] || [];
                const morningOn = slots.includes("morning");
                const afternoonOn = slots.includes("afternoon");
                const morningDisabled = !morningOn && slotsLocked;
                const afternoonDisabled = !afternoonOn && slotsLocked;
                return (
                  <div key={day} className="flex items-center gap-3">
                    <span className="w-20 text-sm font-medium text-card-foreground">{day}</span>
                    <Badge
                      variant={morningOn ? "default" : "outline"}
                      className={morningDisabled ? "cursor-not-allowed opacity-40 border-card-foreground/20 text-card-foreground" : `cursor-pointer ${!morningOn ? "border-card-foreground/20 text-card-foreground" : ""}`}
                      onClick={() => !morningDisabled && toggleScheduleSlot(day, "morning")}
                    >Matin</Badge>
                    <Badge
                      variant={afternoonOn ? "default" : "outline"}
                      className={afternoonDisabled ? "cursor-not-allowed opacity-40 border-card-foreground/20 text-card-foreground" : `cursor-pointer ${!afternoonOn ? "border-card-foreground/20 text-card-foreground" : ""}`}
                      onClick={() => !afternoonDisabled && toggleScheduleSlot(day, "afternoon")}
                    >Après-midi</Badge>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-card-foreground">Mode de travail</Label>
            <Select value={form.work_mode} onValueChange={(v) => update({ work_mode: v })}>
              <SelectTrigger className="bg-card border-card-foreground/20 text-card-foreground"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="hybrid">Hybride</SelectItem>
                <SelectItem value="onsite">Présentiel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-card-foreground">Adresse du lieu de travail *</Label>
            <Input
              value={form.work_location}
              onChange={(e) => update({ work_location: e.target.value })}
              placeholder="Ex: Avenue Louise 250, 1050 Bruxelles"
              className="bg-card border-card-foreground/20 text-card-foreground"
            />
          </div>

        </CardContent>
      </Card>

      {/* Bottom actions */}
      <div className="flex justify-end gap-2 pb-6">
        <Button variant="outline" onClick={onCancel} className="gap-2 border-card-foreground/20 text-card-foreground">
          <X className="h-4 w-4" /> Annuler
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? "Sauvegarde..." : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
};
