import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"loading" | "valid" | "already" | "invalid" | "done" | "error">("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } }
        );
        const data = await res.json();
        if (data.valid) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("error");
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
        method: "POST",
        headers: { apikey: SUPABASE_ANON, "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success || data.reason === "already_unsubscribed") setState("done");
      else setState("error");
    } catch {
      setState("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-4">
          <h1 className="text-xl font-semibold text-card-foreground">Désabonnement Onbord</h1>

          {state === "loading" && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {state === "valid" && (
            <>
              <p className="text-sm text-muted-foreground">
                Confirmez-vous votre désabonnement de tous les emails Onbord ?
              </p>
              <Button onClick={confirm} disabled={submitting} className="w-full">
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmer le désabonnement
              </Button>
            </>
          )}

          {state === "already" && (
            <div className="space-y-2">
              <CheckCircle2 className="h-10 w-10 mx-auto text-success" />
              <p className="text-sm text-muted-foreground">Vous êtes déjà désabonné(e).</p>
            </div>
          )}

          {state === "done" && (
            <div className="space-y-2">
              <CheckCircle2 className="h-10 w-10 mx-auto text-success" />
              <p className="text-sm text-card-foreground">Désabonnement confirmé.</p>
              <p className="text-xs text-muted-foreground">Vous ne recevrez plus d'emails Onbord.</p>
            </div>
          )}

          {(state === "invalid" || state === "error") && (
            <div className="space-y-2">
              <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
              <p className="text-sm text-muted-foreground">
                {state === "invalid" ? "Lien invalide ou expiré." : "Une erreur est survenue."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
