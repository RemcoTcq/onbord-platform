import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Sparkles, Upload, ArrowLeft } from "lucide-react";
import { CandidatesSection } from "@/components/request/CandidatesSection";
import { ScoringConfigPanel } from "@/components/request/ScoringConfigPanel";

interface Props {
  requestId: string | null;
}

type Mode = null | "onbord" | "self";

export const StepConfirmation = ({ requestId }: Props) => {
  const [mode, setMode] = useState<Mode>(null);

  // Step 1: choice screen
  if (mode === null) {
    return (
      <div className="mx-auto max-w-3xl py-8 space-y-6">
        <Card className="text-center">
          <CardContent className="p-8">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-9 w-9 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-card-foreground mb-2">
              Demande enregistrée !
            </h2>
            <p className="text-card-foreground/60 leading-relaxed">
              Comment souhaitez-vous trouver vos candidats ?
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={() => setMode("onbord")}
            className="group text-left rounded-xl border border-border bg-card p-6 hover:border-primary hover:shadow-md transition-all"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-card-foreground mb-1">
              Onbord trouve mes candidats
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Notre équipe vous propose des profils adaptés sous <strong>24h</strong>.
            </p>
          </button>

          <button
            onClick={() => setMode("self")}
            className="group text-left rounded-xl border border-border bg-card p-6 hover:border-primary hover:shadow-md transition-all"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-card-foreground mb-1">
              J'importe mes propres candidats
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Importez vos CV et laissez l'<strong>IA scorer</strong> chaque candidat automatiquement.
            </p>
          </button>
        </div>

        <div className="flex justify-center pt-2">
          <Link to="/dashboard">
            <Button variant="ghost" className="text-card-foreground/60">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Step 2a: Onbord sourcing — simple confirmation
  if (mode === "onbord") {
    return (
      <div className="mx-auto max-w-3xl py-8 space-y-6">
        <Card className="text-center">
          <CardContent className="p-8">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-9 w-9 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-card-foreground mb-2">
              C'est parti !
            </h2>
            <p className="text-card-foreground/60 leading-relaxed">
              Notre équipe revient vers vous sous <strong>24h</strong> avec des profils adaptés.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-3 pt-2">
          <Button variant="outline" onClick={() => setMode(null)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Changer d'avis
          </Button>
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
  }

  // Step 2b: Self import
  return (
    <div className="mx-auto max-w-3xl py-8 space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-card-foreground mb-1">
                Importez vos candidats
              </h2>
              <p className="text-sm text-muted-foreground">
                Importez un CSV avec les infos candidats, puis uploadez les CV. L'IA score chaque candidat selon vos critères.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {requestId && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-base font-semibold text-card-foreground">Vos candidats</h3>
            <ScoringConfigPanel requestId={requestId} />
          </div>

          <CandidatesSection requestId={requestId} />
        </>
      )}

      <div className="flex justify-between gap-3 pt-2">
        <Button variant="outline" onClick={() => setMode(null)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Changer d'avis
        </Button>
        <div className="flex gap-3">
          {requestId && (
            <Link to={`/request/${requestId}`}>
              <Button className="gap-2">
                Suivre ma demande <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Link to="/dashboard">
            <Button variant="ghost" className="text-card-foreground/60">
              Accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
