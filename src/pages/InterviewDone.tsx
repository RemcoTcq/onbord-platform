import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const InterviewDone = () => (
  <div className="min-h-screen flex items-center justify-center bg-background p-4">
    <Card className="max-w-md w-full">
      <CardContent className="p-8 text-center">
        <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2 text-card-foreground">Merci !</h1>
        <p className="text-muted-foreground">
          Ton entretien est terminé. Tu peux fermer cet onglet, l'équipe va revenir
          vers toi rapidement.
        </p>
      </CardContent>
    </Card>
  </div>
);

export default InterviewDone;
