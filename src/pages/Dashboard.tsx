import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Briefcase } from "lucide-react";

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
    case "Recherche des profils": return "bg-warning text-warning-foreground";
    case "Présentation des profils": return "bg-primary/80 text-primary-foreground";
    case "Profils validés": return "bg-success/80 text-success-foreground";
    case "Mission lancée": return "bg-success text-success-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

const Dashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      const { data } = await supabase
        .from("requests")
        .select("id, title, domain, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setRequests(data || []);
      setLoading(false);
    };
    fetchRequests();
  }, [user]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mes demandes</h1>
            <p className="text-muted-foreground">Suivez vos demandes de talents</p>
          </div>
          <Link to="/request/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle demande
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : requests.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Briefcase className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold">Aucune demande</h3>
              <p className="mb-6 text-muted-foreground">Commencez par créer votre première demande de talents</p>
              <Link to="/request/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Créer une demande
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {requests.map((req) => (
              <Card key={req.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{req.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{req.domain}</p>
                    </div>
                    <Badge className={statusColor(req.status)}>{req.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {new Date(req.created_at).toLocaleDateString("fr-FR")}
                  </span>
                  <Link to={`/request/${req.id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Voir détails
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
