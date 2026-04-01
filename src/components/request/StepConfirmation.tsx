import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RequestFormData } from "@/lib/request-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, Send } from "lucide-react";

interface Props {
  data: RequestFormData;
  onBack: () => void;
}

export const StepConfirmation = ({ data, onBack }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showCal, setShowCal] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("requests").insert({
      user_id: user.id,
      title: data.title,
      description: data.description,
      domain: data.domain,
      skills: data.skills,
      soft_skills: data.softSkills,
      custom_skills: data.customSkills,
      languages: data.languages as any,
      diploma: data.diploma,
      talents_number: data.talentsNumber,
      days_per_week: data.daysPerWeek,
      schedule_type: data.scheduleType,
      schedule_details: data.scheduleDetails as any,
      work_mode: data.workMode,
      weekly_hours: data.weeklyHours,
      weekly_price: data.weeklyPrice,
      monthly_price: data.monthlyPrice,
    });
    setLoading(false);
    if (error) {
      toast.error("Erreur lors de l'envoi");
    } else {
      toast.success("Demande envoyée avec succès !");
      navigate("/dashboard");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Confirmation</h2>
        <p className="text-sm text-muted-foreground">Choisissez comment finaliser votre demande</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${showCal ? "border-2 border-primary" : ""}`}
          onClick={() => setShowCal(true)}
        >
          <CardContent className="flex flex-col items-center p-8 text-center">
            <Calendar className="mb-4 h-10 w-10 text-primary" />
            <h3 className="font-semibold">Planifier un appel</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Discutez avec notre équipe pour affiner vos besoins
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:shadow-md"
          onClick={handleSubmit}
        >
          <CardContent className="flex flex-col items-center p-8 text-center">
            <Send className="mb-4 h-10 w-10 text-primary" />
            <h3 className="font-semibold">Envoyer la demande</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {loading ? "Envoi en cours..." : "Nous traitons votre demande sous 24h"}
            </p>
          </CardContent>
        </Card>
      </div>

      {showCal && (
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-lg">
            <iframe
              src="https://cal.com"
              className="h-[500px] w-full border-0"
              title="Planifier un appel"
            />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Retour</Button>
        <Button onClick={handleSubmit} disabled={loading} className="gap-2">
          <Send className="h-4 w-4" />
          {loading ? "Envoi..." : "Envoyer la demande"}
        </Button>
      </div>
    </div>
  );
};
