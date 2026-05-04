import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
      <div className="mx-auto max-w-3xl py-8 space-y-8">
        <div className="text-center space-y-4">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-success/15 animate-ping opacity-30" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-success/10 ring-1 ring-success/20">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Demande enregistrée
            </h2>
            <p className="mt-2 text-muted-foreground">
              Comment souhaitez-vous trouver vos candidats ?
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <button
            onClick={() => setMode("onbord")}
            className="group relative text-left rounded-xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-pop hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground tracking-tight">
                  Onbord trouve mes candidats
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                  Notre équipe vous propose des profils adaptés sous <span className="font-medium text-foreground">24h</span>.
                </p>
              </div>
              <div className="flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Choisir <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </div>
          </button>

          <button
            onClick={() => setMode("self")}
            className="group relative text-left rounded-xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-pop hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground tracking-tight">
                  J'importe mes propres candidats
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                  Importez vos CV et laissez l'<span className="font-medium text-foreground">IA scorer</span> chaque candidat automatiquement.
                </p>
              </div>
              <div className="flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Importer <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </div>
          </button>
        </div>

        <div className="flex justify-center">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Onbord sourcing — simple confirmation
  if (mode === "onbord") {
    return (
      <div className="mx-auto max-w-2xl py-12 space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 ring-1 ring-success/20">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">C'est parti !</h2>
            <p className="mt-2 text-muted-foreground">
              Notre équipe revient vers vous sous <span className="font-medium text-foreground">24h</span> avec des profils adaptés.
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setMode(null)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Changer d'avis
          </Button>
          {requestId && (
            <Link to={`/request/${requestId}`}>
              <Button variant="gradient" className="gap-2 shadow-pop">
                Suivre ma demande <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Link to="/dashboard">
            <Button variant="ghost" className="text-muted-foreground">
              Accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Self import
  return (
    <div className="mx-auto max-w-4xl py-6 space-y-6">
      <div className="rounded-xl border border-border bg-gradient-subtle p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
            <Upload className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Importez vos candidats
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Importez un CSV avec les infos candidats, puis uploadez les CV. L'IA score chaque candidat selon vos critères.
            </p>
          </div>
        </div>
      </div>

      {requestId && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-sm font-semibold text-foreground tracking-tight">Vos candidats</h3>
            <ScoringConfigPanel requestId={requestId} />
          </div>

          <CandidatesSection requestId={requestId} />
        </>
      )}

      <div className="flex justify-between gap-3 pt-2 flex-wrap">
        <Button variant="outline" onClick={() => setMode(null)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Changer d'avis
        </Button>
        <div className="flex gap-2">
          {requestId && (
            <Link to={`/request/${requestId}`}>
              <Button variant="gradient" className="gap-2 shadow-pop">
                Suivre ma demande <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Link to="/dashboard">
            <Button variant="ghost" className="text-muted-foreground">
              Accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
