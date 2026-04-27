import { useState, useEffect } from "react";
import { RequestFormData } from "@/lib/request-types";
import { DOMAINS, HARD_SKILLS_MAP, SOFT_SKILLS, LANGUAGES, DIPLOMAS, DAYS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { X, Plus, ArrowRight, ArrowLeft } from "lucide-react";

interface Props {
  data: RequestFormData;
  onChange: (data: Partial<RequestFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const StepProfileAndJob = ({ data, onChange, onNext, onBack }: Props) => {
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [customSoftInput, setCustomSoftInput] = useState("");
  const [customLangInput, setCustomLangInput] = useState("");

  const hardSkills = data.domain ? HARD_SKILLS_MAP[data.domain] || [] : [];

  // When switching to graduate, ensure employmentType has a default
  useEffect(() => {
    if (data.talentType === "graduate" && !data.employmentType) {
      onChange({ employmentType: "full_time", daysPerWeek: 5, scheduleType: "flexible", scheduleDetails: {} });
    }
    if (data.talentType === "student" && data.employmentType) {
      onChange({ employmentType: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.talentType]);

  const selectSkill = (skill: string) => {
    if (data.mustHaveSkills.includes(skill) || data.niceToHaveSkills.includes(skill)) return;
    onChange({ mustHaveSkills: [...data.mustHaveSkills, skill] });
  };
  const removeSkill = (skill: string) => {
    onChange({
      mustHaveSkills: data.mustHaveSkills.filter((s) => s !== skill),
      niceToHaveSkills: data.niceToHaveSkills.filter((s) => s !== skill),
    });
  };
  const moveSkillToNice = (skill: string) => {
    onChange({
      mustHaveSkills: data.mustHaveSkills.filter((s) => s !== skill),
      niceToHaveSkills: [...data.niceToHaveSkills, skill],
    });
  };
  const moveSkillToMust = (skill: string) => {
    onChange({
      niceToHaveSkills: data.niceToHaveSkills.filter((s) => s !== skill),
      mustHaveSkills: [...data.mustHaveSkills, skill],
    });
  };

  const selectSoft = (skill: string) => {
    if (data.mustHaveSoftSkills.includes(skill) || data.niceToHaveSoftSkills.includes(skill)) return;
    onChange({ mustHaveSoftSkills: [...data.mustHaveSoftSkills, skill] });
  };
  const removeSoft = (skill: string) => {
    onChange({
      mustHaveSoftSkills: data.mustHaveSoftSkills.filter((s) => s !== skill),
      niceToHaveSoftSkills: data.niceToHaveSoftSkills.filter((s) => s !== skill),
    });
  };
  const moveSoftToNice = (skill: string) => {
    onChange({
      mustHaveSoftSkills: data.mustHaveSoftSkills.filter((s) => s !== skill),
      niceToHaveSoftSkills: [...data.niceToHaveSoftSkills, skill],
    });
  };
  const moveSoftToMust = (skill: string) => {
    onChange({
      niceToHaveSoftSkills: data.niceToHaveSoftSkills.filter((s) => s !== skill),
      mustHaveSoftSkills: [...data.mustHaveSoftSkills, skill],
    });
  };

  const addCustomSkill = () => {
    const v = customSkillInput.trim();
    if (v && !data.mustHaveSkills.includes(v) && !data.niceToHaveSkills.includes(v)) {
      onChange({ mustHaveSkills: [...data.mustHaveSkills, v] });
      setCustomSkillInput("");
    }
  };
  const addCustomSoft = () => {
    const v = customSoftInput.trim();
    if (v && !data.mustHaveSoftSkills.includes(v) && !data.niceToHaveSoftSkills.includes(v)) {
      onChange({ mustHaveSoftSkills: [...data.mustHaveSoftSkills, v] });
      setCustomSoftInput("");
    }
  };
  const addLanguage = (name: string) => {
    if (!data.languages.find((l) => l.name === name)) {
      onChange({ languages: [...data.languages, { name, level: 3 }] });
    }
  };
  const addCustomLang = () => {
    if (customLangInput.trim()) {
      addLanguage(customLangInput.trim());
      setCustomLangInput("");
    }
  };
  const updateLangLevel = (name: string, level: number) => {
    onChange({ languages: data.languages.map((l) => (l.name === name ? { ...l, level } : l)) });
  };
  const removeLang = (name: string) => {
    onChange({ languages: data.languages.filter((l) => l.name !== name) });
  };

  // Half-day slots: 1 day = 2 half-days
  const maxSlots = (data.daysPerWeek || 0) * 2;
  const usedSlots = Object.values(data.scheduleDetails || {}).reduce(
    (sum, slots) => sum + (slots?.length || 0),
    0,
  );
  const slotsLocked = usedSlots >= maxSlots;

  const toggleScheduleSlot = (day: string, slot: string) => {
    const current = data.scheduleDetails[day] || [];
    const isSelected = current.includes(slot);
    // Block adding if max reached
    if (!isSelected && usedSlots >= maxSlots) return;
    const updated = isSelected ? current.filter((s) => s !== slot) : [...current, slot];
    onChange({ scheduleDetails: { ...data.scheduleDetails, [day]: updated } });
  };

  // Auto-truncate excess slots when daysPerWeek decreases
  useEffect(() => {
    if (data.talentType !== "student" || data.scheduleType !== "fixed") return;
    if (usedSlots <= maxSlots) return;
    let toRemove = usedSlots - maxSlots;
    const next: Record<string, string[]> = {};
    // Iterate in reverse over DAYS to drop the latest first
    const reversed = [...DAYS].reverse();
    for (const day of reversed) {
      const slots = [...(data.scheduleDetails[day] || [])];
      while (toRemove > 0 && slots.length > 0) {
        slots.pop();
        toRemove--;
      }
      next[day] = slots;
    }
    onChange({ scheduleDetails: next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.daysPerWeek]);

  const setEmploymentType = (type: "full_time" | "part_time") => {
    if (type === "full_time") {
      onChange({ employmentType: "full_time", daysPerWeek: 5, scheduleType: "flexible", scheduleDetails: {} });
    } else {
      onChange({ employmentType: "part_time", daysPerWeek: Math.max(3, Math.min(4, data.daysPerWeek || 3)) });
    }
  };

  const canProceed =
    data.domain &&
    data.mustHaveSkills.length > 0 &&
    data.title &&
    data.description &&
    data.talentsNumber > 0 &&
    data.workLocation.trim().length > 0;

  const SkillColumns = ({
    mustHave,
    niceToHave,
    onMoveToNice,
    onMoveToMust,
    onRemove,
    label,
  }: {
    mustHave: string[];
    niceToHave: string[];
    onMoveToNice: (s: string) => void;
    onMoveToMust: (s: string) => void;
    onRemove: (s: string) => void;
    label: string;
  }) => (
    <div className="grid grid-cols-5 gap-3 mt-3">
      <div className="col-span-3 rounded-lg border border-card-foreground/10 p-3 bg-card-foreground/[0.02]">
        <p className="text-xs font-semibold text-card-foreground/60 mb-2 uppercase tracking-wider">Must have</p>
        <div className="flex flex-wrap gap-1.5 min-h-[40px]">
          {mustHave.map((s) => (
            <Badge key={s} className="gap-1 bg-primary text-primary-foreground cursor-pointer group" onClick={() => onMoveToNice(s)}>
              {s}
              <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              <X className="h-3 w-3 opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); onRemove(s); }} />
            </Badge>
          ))}
          {mustHave.length === 0 && <p className="text-xs text-card-foreground/30 italic">Sélectionnez des {label}</p>}
        </div>
      </div>
      <div className="col-span-2 rounded-lg border border-card-foreground/10 p-3 bg-card-foreground/[0.02]">
        <p className="text-xs font-semibold text-card-foreground/60 mb-2 uppercase tracking-wider">Nice to have</p>
        <div className="flex flex-wrap gap-1.5 min-h-[40px]">
          {niceToHave.map((s) => (
            <Badge key={s} variant="outline" className="gap-1 cursor-pointer group border-card-foreground/20 text-card-foreground" onClick={() => onMoveToMust(s)}>
              <ArrowLeft className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              {s}
              <X className="h-3 w-3 opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); onRemove(s); }} />
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* SECTION: Profil recherché */}
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-card-foreground">Profil recherché</h2>
          <p className="text-sm text-card-foreground/60">Définissez le type de talent et ses compétences</p>
        </div>

        {/* Talent type */}
        <div className="space-y-2">
          <Label className="text-card-foreground">Type de talent *</Label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "student" as const, title: "Étudiant", desc: "En cours d'études" },
              { value: "graduate" as const, title: "Jeune diplômé", desc: "Diplômé récent" },
            ].map((opt) => {
              const selected = data.talentType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ talentType: opt.value })}
                  className={`rounded-lg border p-4 text-left transition-all ${
                    selected
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-card-foreground/15 hover:border-card-foreground/30 bg-card"
                  }`}
                >
                  <p className="font-semibold text-card-foreground">{opt.title}</p>
                  <p className="text-xs text-card-foreground/60 mt-1">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Domain */}
        <div className="space-y-2">
          <Label className="text-card-foreground">Domaine *</Label>
          <Select value={data.domain} onValueChange={(v) => onChange({ domain: v, mustHaveSkills: [], niceToHaveSkills: [], customSkills: [] })}>
            <SelectTrigger className="bg-card border-card-foreground/20 text-card-foreground"><SelectValue placeholder="Sélectionner un domaine" /></SelectTrigger>
            <SelectContent>
              {DOMAINS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Hard Skills */}
        {data.domain && (
          <div className="space-y-3">
            <Label className="text-card-foreground">Hard Skills *</Label>
            <div className="flex flex-wrap gap-1.5">
              {hardSkills.map((skill) => {
                const selected = data.mustHaveSkills.includes(skill) || data.niceToHaveSkills.includes(skill);
                return (
                  <Badge
                    key={skill}
                    variant={selected ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      selected ? "opacity-50" : "border-card-foreground/20 text-card-foreground hover:bg-primary hover:text-primary-foreground"
                    }`}
                    onClick={() => !selected && selectSkill(skill)}
                  >
                    {skill}
                  </Badge>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter un skill personnalisé"
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
                className="bg-card border-card-foreground/20 text-card-foreground"
              />
              <Button variant="outline" size="sm" onClick={addCustomSkill} className="border-card-foreground/20 text-card-foreground">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <SkillColumns
              mustHave={data.mustHaveSkills}
              niceToHave={data.niceToHaveSkills}
              onMoveToNice={moveSkillToNice}
              onMoveToMust={moveSkillToMust}
              onRemove={removeSkill}
              label="skills"
            />
          </div>
        )}

        {/* Soft Skills */}
        <div className="space-y-3">
          <Label className="text-card-foreground">Soft Skills</Label>
          <div className="flex flex-wrap gap-1.5">
            {SOFT_SKILLS.map((skill) => {
              const selected = data.mustHaveSoftSkills.includes(skill) || data.niceToHaveSoftSkills.includes(skill);
              return (
                <Badge
                  key={skill}
                  variant={selected ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    selected ? "opacity-50" : "border-card-foreground/20 text-card-foreground hover:bg-primary hover:text-primary-foreground"
                  }`}
                  onClick={() => !selected && selectSoft(skill)}
                >
                  {skill}
                </Badge>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Ajouter un soft skill"
              value={customSoftInput}
              onChange={(e) => setCustomSoftInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSoft())}
              className="bg-card border-card-foreground/20 text-card-foreground"
            />
            <Button variant="outline" size="sm" onClick={addCustomSoft} className="border-card-foreground/20 text-card-foreground">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {(data.mustHaveSoftSkills.length > 0 || data.niceToHaveSoftSkills.length > 0) && (
            <SkillColumns
              mustHave={data.mustHaveSoftSkills}
              niceToHave={data.niceToHaveSoftSkills}
              onMoveToNice={moveSoftToNice}
              onMoveToMust={moveSoftToMust}
              onRemove={removeSoft}
              label="soft skills"
            />
          )}
        </div>

        {/* Languages */}
        <div className="space-y-3">
          <Label className="text-card-foreground">Langues</Label>
          <div className="flex gap-2">
            {LANGUAGES.map((lang) => (
              <Button
                key={lang}
                variant={data.languages.find((l) => l.name === lang) ? "default" : "outline"}
                size="sm"
                onClick={() => addLanguage(lang)}
                className={data.languages.find((l) => l.name === lang) ? "" : "border-card-foreground/20 text-card-foreground"}
              >
                {lang}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Ajouter une langue"
              value={customLangInput}
              onChange={(e) => setCustomLangInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomLang())}
              className="bg-card border-card-foreground/20 text-card-foreground"
            />
            <Button variant="outline" size="sm" onClick={addCustomLang} className="border-card-foreground/20 text-card-foreground">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {data.languages.map((lang) => (
            <div key={lang.name} className="flex items-center gap-4 rounded-lg border border-card-foreground/10 p-3">
              <span className="w-28 font-medium text-card-foreground">{lang.name}</span>
              <Slider value={[lang.level]} onValueChange={([v]) => updateLangLevel(lang.name, v)} min={1} max={5} step={1} className="flex-1" />
              <span className="w-8 text-center text-sm font-semibold text-card-foreground">{lang.level}/5</span>
              <Button variant="ghost" size="sm" onClick={() => removeLang(lang.name)} className="text-card-foreground/40">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Diploma */}
        <div className="space-y-2">
          <Label className="text-card-foreground">Diplôme</Label>
          <Select value={data.diploma} onValueChange={(v) => onChange({ diploma: v })}>
            <SelectTrigger className="bg-card border-card-foreground/20 text-card-foreground"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
            <SelectContent>
              {DIPLOMAS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="bg-card-foreground/10" />

      {/* SECTION: Détails du poste */}
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

        {/* CONDITIONAL: Student → days + schedule */}
        {data.talentType === "student" && (
          <>
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
          </>
        )}

        {/* CONDITIONAL: Graduate → full/part time */}
        {data.talentType === "graduate" && (
          <>
            <div className="space-y-2">
              <Label className="text-card-foreground">Type de contrat</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "full_time" as const, title: "Temps plein", desc: "5 jours / semaine" },
                  { value: "part_time" as const, title: "Temps partiel", desc: "Min. 3 jours / semaine" },
                ].map((opt) => {
                  const selected = data.employmentType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEmploymentType(opt.value)}
                      className={`rounded-lg border p-4 text-left transition-all ${
                        selected
                          ? "border-primary bg-primary/5 ring-2 ring-primary"
                          : "border-card-foreground/15 hover:border-card-foreground/30 bg-card"
                      }`}
                    >
                      <p className="font-semibold text-card-foreground">{opt.title}</p>
                      <p className="text-xs text-card-foreground/60 mt-1">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {data.employmentType === "part_time" && (
              <div className="space-y-2">
                <Label className="text-card-foreground">Nombre de jours par semaine</Label>
                <div className="flex gap-2">
                  {[3, 4].map((n) => (
                    <Button
                      key={n}
                      variant={data.daysPerWeek === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => onChange({ daysPerWeek: n })}
                      className={data.daysPerWeek !== n ? "border-card-foreground/20 text-card-foreground" : ""}
                    >
                      {n} jours
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-card-foreground/50">Minimum 3 jours, maximum 4 jours pour un temps partiel.</p>
              </div>
            )}
          </>
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
