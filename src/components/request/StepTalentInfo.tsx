import { useState } from "react";
import { RequestFormData } from "@/lib/request-types";
import { DOMAINS, HARD_SKILLS_MAP, SOFT_SKILLS, LANGUAGES, DIPLOMAS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { X, Plus } from "lucide-react";

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

  const toggleSkill = (skill: string) => {
    const skills = data.skills.includes(skill)
      ? data.skills.filter((s) => s !== skill)
      : [...data.skills, skill];
    onChange({ skills });
  };

  const toggleSoftSkill = (skill: string) => {
    const softSkills = data.softSkills.includes(skill)
      ? data.softSkills.filter((s) => s !== skill)
      : [...data.softSkills, skill];
    onChange({ softSkills });
  };

  const addCustomSkill = () => {
    if (customSkillInput.trim() && !data.customSkills.includes(customSkillInput.trim())) {
      onChange({ customSkills: [...data.customSkills, customSkillInput.trim()] });
      setCustomSkillInput("");
    }
  };

  const addCustomSoft = () => {
    if (customSoftInput.trim() && !data.softSkills.includes(customSoftInput.trim())) {
      onChange({ softSkills: [...data.softSkills, customSoftInput.trim()] });
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
    onChange({
      languages: data.languages.map((l) => (l.name === name ? { ...l, level } : l)),
    });
  };

  const removeLang = (name: string) => {
    onChange({ languages: data.languages.filter((l) => l.name !== name) });
  };

  const canProceed = data.domain && data.skills.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Informations Talent</h2>
        <p className="text-sm text-muted-foreground">Décrivez le profil recherché</p>
      </div>

      {/* Domain */}
      <div className="space-y-2">
        <Label>Domaine *</Label>
        <Select
          value={data.domain}
          onValueChange={(v) => onChange({ domain: v, skills: [], customSkills: [] })}
        >
          <SelectTrigger><SelectValue placeholder="Sélectionner un domaine" /></SelectTrigger>
          <SelectContent>
            {DOMAINS.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Hard Skills */}
      {data.domain && (
        <div className="space-y-3">
          <Label>Hard Skills *</Label>
          <div className="flex flex-wrap gap-2">
            {hardSkills.map((skill) => (
              <Badge
                key={skill}
                variant={data.skills.includes(skill) ? "default" : "outline"}
                className="cursor-pointer transition-colors"
                onClick={() => toggleSkill(skill)}
              >
                {skill}
              </Badge>
            ))}
            {data.customSkills.map((skill) => (
              <Badge key={skill} variant="default" className="cursor-pointer gap-1" onClick={() => onChange({ customSkills: data.customSkills.filter((s) => s !== skill) })}>
                {skill} <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Ajouter un skill"
              value={customSkillInput}
              onChange={(e) => setCustomSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
            />
            <Button variant="outline" size="sm" onClick={addCustomSkill}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Soft Skills */}
      <div className="space-y-3">
        <Label>Soft Skills</Label>
        <div className="flex flex-wrap gap-2">
          {SOFT_SKILLS.map((skill) => (
            <Badge
              key={skill}
              variant={data.softSkills.includes(skill) ? "default" : "outline"}
              className="cursor-pointer transition-colors"
              onClick={() => toggleSoftSkill(skill)}
            >
              {skill}
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Ajouter un soft skill"
            value={customSoftInput}
            onChange={(e) => setCustomSoftInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSoft())}
          />
          <Button variant="outline" size="sm" onClick={addCustomSoft}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Languages */}
      <div className="space-y-3">
        <Label>Langues</Label>
        <div className="flex gap-2">
          {LANGUAGES.map((lang) => (
            <Button
              key={lang}
              variant={data.languages.find((l) => l.name === lang) ? "default" : "outline"}
              size="sm"
              onClick={() => addLanguage(lang)}
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
          />
          <Button variant="outline" size="sm" onClick={addCustomLang}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {data.languages.map((lang) => (
          <div key={lang.name} className="flex items-center gap-4 rounded-lg border p-3">
            <span className="w-28 font-medium">{lang.name}</span>
            <Slider
              value={[lang.level]}
              onValueChange={([v]) => updateLangLevel(lang.name, v)}
              min={1}
              max={5}
              step={1}
              className="flex-1"
            />
            <span className="w-8 text-center text-sm font-semibold">{lang.level}/5</span>
            <Button variant="ghost" size="sm" onClick={() => removeLang(lang.name)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Diploma */}
      <div className="space-y-2">
        <Label>Diplôme</Label>
        <Select value={data.diploma} onValueChange={(v) => onChange({ diploma: v })}>
          <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
          <SelectContent>
            {DIPLOMAS.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!canProceed}>Suivant</Button>
      </div>
    </div>
  );
};
