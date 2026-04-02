import { useState } from "react";
import { RequestFormData } from "@/lib/request-types";
import { DOMAINS, HARD_SKILLS_MAP, SOFT_SKILLS, LANGUAGES, DIPLOMAS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { X, Plus, ArrowRight, ArrowLeft } from "lucide-react";

interface Props {
  data: RequestFormData;
  onChange: (data: Partial<RequestFormData>) => void;
  onNext: () => void;
}

export const StepTalentInfo = ({ data, onChange, onNext }: Props) => {
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [customSoftInput, setCustomSoftInput] = useState("");
  const [customLangInput, setCustomLangInput] = useState("");

  const hardSkills = data.domain ? HARD_SKILLS_MAP[data.domain] || [] : [];

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

  const canProceed = data.domain && data.mustHaveSkills.length > 0;

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
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-card-foreground">Profil recherché</h2>
        <p className="text-sm text-card-foreground/60">Décrivez les compétences du talent idéal</p>
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

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!canProceed} className="gap-2">
          Suivant <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
