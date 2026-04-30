import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings2, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

type CvCriteria = {
  must_have_skills: number;
  nice_to_have_skills: number;
  experience_years: number;
  diploma: number;
  languages: number;
  soft_skills: number;
};

type Config = {
  id?: string;
  cv_weight: number;
  interview_weight: number;
  green_threshold: number;
  yellow_threshold: number;
  cv_criteria: CvCriteria;
  interview_questions: string[];
  use_ai_generated_questions: boolean;
  interview_max_turns: number;
};

const DEFAULT_CONFIG: Config = {
  cv_weight: 0.6,
  interview_weight: 0.4,
  green_threshold: 80,
  yellow_threshold: 60,
  cv_criteria: {
    must_have_skills: 30,
    nice_to_have_skills: 15,
    experience_years: 15,
    diploma: 10,
    languages: 15,
    soft_skills: 15,
  },
  interview_questions: [],
  use_ai_generated_questions: true,
  interview_max_turns: 8,
};

export const ScoringConfigPanel = ({ requestId }: { requestId: string }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [newQuestion, setNewQuestion] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("request_scoring_config")
      .select("*")
      .eq("request_id", requestId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setConfig({
            id: data.id,
            cv_weight: Number(data.cv_weight),
            interview_weight: Number(data.interview_weight),
            green_threshold: data.green_threshold,
            yellow_threshold: data.yellow_threshold,
            cv_criteria: { ...DEFAULT_CONFIG.cv_criteria, ...(data.cv_criteria as any) },
            interview_questions: (data.interview_questions as string[]) || [],
            use_ai_generated_questions: data.use_ai_generated_questions,
            interview_max_turns: data.interview_max_turns,
          });
        }
        setLoading(false);
      });
  }, [open, requestId]);

  const cvCriteriaTotal = Object.values(config.cv_criteria).reduce((a, b) => a + b, 0);

  const handleCvWeightChange = (val: number) => {
    const cv = Math.round(val) / 100;
    setConfig({ ...config, cv_weight: cv, interview_weight: Number((1 - cv).toFixed(2)) });
  };

  const handleSave = async () => {
    if (config.yellow_threshold >= config.green_threshold) {
      toast.error("Le seuil rouge doit être inférieur au seuil vert");
      return;
    }
    if (cvCriteriaTotal !== 100) {
      toast.error(`Les critères CV doivent totaliser 100 (actuel: ${cvCriteriaTotal})`);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("request_scoring_config")
      .update({
        cv_weight: config.cv_weight,
        interview_weight: config.interview_weight,
        green_threshold: config.green_threshold,
        yellow_threshold: config.yellow_threshold,
        cv_criteria: config.cv_criteria,
        interview_questions: config.interview_questions,
        use_ai_generated_questions: config.use_ai_generated_questions,
        interview_max_turns: config.interview_max_turns,
      })
      .eq("request_id", requestId);
    setSaving(false);
    if (error) {
      toast.error("Erreur lors de la sauvegarde");
      return;
    }
    toast.success("Paramètres enregistrés");
    setOpen(false);
  };

  const addQuestion = () => {
    const q = newQuestion.trim();
    if (!q) return;
    if (q.length > 500) {
      toast.error("Question trop longue (max 500 caractères)");
      return;
    }
    if (config.interview_questions.length >= 15) {
      toast.error("Maximum 15 questions");
      return;
    }
    setConfig({ ...config, interview_questions: [...config.interview_questions, q] });
    setNewQuestion("");
  };

  const removeQuestion = (idx: number) => {
    setConfig({
      ...config,
      interview_questions: config.interview_questions.filter((_, i) => i !== idx),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          Paramètres de scoring
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Paramètres de scoring</DialogTitle>
          <DialogDescription>
            Configurez la pondération du score, les critères du CV et l'entretien IA.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* Pondération CV / Entretien */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Pondération CV / Entretien</Label>
                  <span className="text-sm text-muted-foreground">
                    CV {Math.round(config.cv_weight * 100)}% · Entretien{" "}
                    {Math.round(config.interview_weight * 100)}%
                  </span>
                </div>
                <Slider
                  value={[config.cv_weight * 100]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={([v]) => handleCvWeightChange(v)}
                />
              </CardContent>
            </Card>

            {/* Seuils de flag */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <Label className="font-semibold">Seuils de flag</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Vert (≥)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={config.green_threshold}
                      onChange={(e) =>
                        setConfig({ ...config, green_threshold: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Rouge (≥)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={config.yellow_threshold}
                      onChange={(e) =>
                        setConfig({ ...config, yellow_threshold: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  En dessous de {config.yellow_threshold}, le candidat est marqué rouge.
                </p>
              </CardContent>
            </Card>

            {/* Critères CV */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Critères de scoring CV</Label>
                  <span
                    className={`text-sm ${
                      cvCriteriaTotal === 100 ? "text-success" : "text-destructive"
                    }`}
                  >
                    Total : {cvCriteriaTotal}/100
                  </span>
                </div>
                {(Object.keys(config.cv_criteria) as (keyof CvCriteria)[]).map((k) => (
                  <div key={k} className="grid grid-cols-[1fr_80px] items-center gap-3">
                    <Label className="text-sm capitalize">{k.replace(/_/g, " ")}</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={config.cv_criteria[k]}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          cv_criteria: {
                            ...config.cv_criteria,
                            [k]: Math.max(0, Math.min(100, Number(e.target.value))),
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Entretien IA */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <Label className="font-semibold">Entretien IA</Label>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Questions générées par l'IA</Label>
                    <p className="text-xs text-muted-foreground">
                      L'IA génère des questions adaptées au poste.
                    </p>
                  </div>
                  <Switch
                    checked={config.use_ai_generated_questions}
                    onCheckedChange={(v) =>
                      setConfig({ ...config, use_ai_generated_questions: v })
                    }
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    Nombre max d'échanges ({config.interview_max_turns})
                  </Label>
                  <Slider
                    value={[config.interview_max_turns]}
                    min={3}
                    max={15}
                    step={1}
                    onValueChange={([v]) => setConfig({ ...config, interview_max_turns: v })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">
                    Questions personnalisées ({config.interview_questions.length})
                  </Label>
                  {config.interview_questions.map((q, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-md border bg-muted/30 p-2"
                    >
                      <span className="flex-1 text-sm">{q}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeQuestion(i)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Ex : Décris une situation où tu as dû gérer un conflit en équipe..."
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      maxLength={500}
                      rows={2}
                    />
                    <Button variant="outline" size="icon" onClick={addQuestion}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
