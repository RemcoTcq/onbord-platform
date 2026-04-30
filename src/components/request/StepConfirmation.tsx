import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";
import { CandidatesSection } from "@/components/request/CandidatesSection";
import { ScoringConfigPanel } from "@/components/request/ScoringConfigPanel";

interface Props {
  requestId: string | null;
}

export const StepConfirmation = ({ requestId }: Props) => {
  return (
    <div className="mx-auto max-w-3xl py-8 space-y-6">
      <Card className="text-center">
        <CardContent className="p-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-9 w-9 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-card-foreground mb-2">
            Demande envoyée !
          </h2>
          <p className="text-card-foreground/60 leading-relaxed">
            Notre équipe revient vers vous sous <strong>24h</strong> avec des profils adaptés.
          </p>
          <p className="text-card-foreground/60 leading-relaxed mt-1">
            En parallèle, vous pouvez dès maintenant <strong>importer vos propres candidats</strong> pour les faire scorer par l'IA.
          </p>
        </CardContent>
      </Card>

      {requestId && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Vos candidats</h3>
              <p className="text-sm text-muted-foreground">
                Importez un CSV et uploadez les CV pour un scoring automatique.
              </p>
            </div>
            <ScoringConfigPanel requestId={requestId} />
          </div>

          <CandidatesSection requestId={requestId} />
        </>
      )}

      <div className="flex justify-center gap-3 pt-2">
        {requestId && (
          <Link to={`/request/${requestId}`}>
            <Button className="gap-2">
              Suivre ma demande <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <Link to="/dashboard">
          <Button variant="ghost" className="text-card-foreground/60">
            Retour à l'accueil
          </Button>
        </Link>
      </div>
    </div>
  );
};
