import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";

interface Props {
  requestId: string | null;
}

export const StepConfirmation = ({ requestId }: Props) => {
  return (
    <div className="mx-auto max-w-lg py-12">
      <Card className="text-center">
        <CardContent className="p-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-card-foreground mb-3">
            Demande envoyée !
          </h2>
          <p className="text-card-foreground/60 mb-8 leading-relaxed">
            Votre demande a bien été envoyée.<br />
            Nous revenons vers vous sous <strong>24h</strong> avec des profils adaptés.
          </p>
          {requestId && (
            <Link to={`/request/${requestId}`}>
              <Button className="gap-2">
                Suivre ma demande <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <div className="mt-4">
            <Link to="/dashboard">
              <Button variant="ghost" className="text-card-foreground/50">
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
