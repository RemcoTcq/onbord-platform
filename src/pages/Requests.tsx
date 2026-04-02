import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Copy, Briefcase, Plus } from "lucide-react";
import { toast } from "sonner";

interface Request {
  id: string;
  title: string;
  domain: string;
  status: string;
  created_at: string;
}

const statusColor = (status: string) => {
  switch (status) {
    case "Demande validée": return "bg-accent text-accent-foreground";
    case "Recherche des profils": return "bg-warning/20 text-warning";
    case "Présentation des profils": return "bg-primary/20 text-primary";
    case "Profils validés": return "bg-success/20 text-success";
    case "Mission lancée": return "bg-success text-success-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

const Requests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("requests")
        .select("id, title, domain, status, created_at")
        .eq("user_id", user.id)
        .neq("status", "draft")
        .order("created_at", { ascending: false });
      setRequests(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleDuplicate = async (req: Request) => {
    if (!user) return;
    const { data: original } = await supabase
      .from("requests")
      .select("*")
      .eq("id", req.id)
      .single();
    if (!original) return;

    const { id, created_at, status, ...rest } = original;
    const { data, error } = await supabase
      .from("requests")
      .insert({ ...rest, user_id: user.id, status: "draft", title: `${rest.title} (copie)` })
      .select("id")
      .single();

    if (error) {
      toast.error("Erreur lors de la duplication");
    } else {
      toast.success("Demande dupliquée en brouillon");
      navigate(`/request/new?draft=${data.id}`);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mes demandes</h1>
            <p className="text-muted-foreground text-sm">Suivez vos demandes de talents</p>
          </div>
          <Link to="/request/new">
            <Button className="gap-2 bg-card text-card-foreground hover:bg-card/90">
              <Plus className="h-4 w-4" /> Nouvelle demande
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-foreground/20 border-t-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Briefcase className="mb-4 h-12 w-12 text-card-foreground/30" />
              <h3 className="text-lg font-semibold text-card-foreground">Aucune demande</h3>
              <p className="mb-6 text-card-foreground/60 text-sm">Commencez par créer votre première demande</p>
              <Link to="/request/new">
                <Button className="gap-2"><Plus className="h-4 w-4" /> Créer une demande</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {requests.map((req) => (
              <Card key={req.id} className="card-hover">
                <CardContent className="flex items-center justify-between p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-card-foreground truncate">{req.title}</h3>
                      <Badge className={statusColor(req.status)}>{req.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-card-foreground/50">
                      <span>{req.domain}</span>
                      <span>•</span>
                      <span>{new Date(req.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link to={`/request/${req.id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5 border-card-foreground/20 text-card-foreground">
                        <Eye className="h-3.5 w-3.5" /> Voir
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => handleDuplicate(req)} className="gap-1.5 text-card-foreground/60">
                      <Copy className="h-3.5 w-3.5" /> Dupliquer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Requests;
