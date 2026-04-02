import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Search, Users, Rocket, FileText, Clock, Send } from "lucide-react";

interface RequestSummary {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ active: 0, drafts: 0, total: 0 });
  const [recent, setRecent] = useState<RequestSummary[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("requests")
        .select("id, title, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      const all = data || [];
      setRecent(all.filter((r) => r.status !== "draft").slice(0, 3));
      setStats({
        active: all.filter((r) => r.status !== "draft" && r.status !== "Mission lancée").length,
        drafts: all.filter((r) => r.status === "draft").length,
        total: all.filter((r) => r.status !== "draft").length,
      });
    };
    load();
  }, [user]);

  const steps = [
    { icon: FileText, title: "Décrivez votre besoin", desc: "Remplissez le formulaire avec les compétences et détails recherchés" },
    { icon: Search, title: "On trouve les profils", desc: "Notre équipe identifie les meilleurs talents étudiants pour vous" },
    { icon: Rocket, title: "Vous lancez la mission", desc: "Validez les profils et démarrez la collaboration" },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-12">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-accent to-secondary p-8 lg:p-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground lg:text-4xl">
            Trouvez les bons talents<br />étudiants rapidement
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground text-lg">
            Onbord vous connecte aux meilleurs profils étudiants pour vos missions, en quelques clics.
          </p>
          <Link to="/request/new">
            <Button size="lg" className="mt-6 gap-2 bg-card text-card-foreground hover:bg-card/90 font-semibold">
              Créer une demande
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* 3 Steps */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-6">Comment ça marche</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map((step, i) => (
              <Card key={i} className="card-hover">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-xs font-semibold text-primary/60 mb-1">Étape {i + 1}</div>
                  <h3 className="font-semibold text-card-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-card-foreground/60">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Video placeholder */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center justify-center bg-card-foreground/5 h-64 lg:h-80">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Rocket className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-medium text-card-foreground/40">Vidéo de présentation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats + Recent */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="card-hover">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Send className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{stats.active}</p>
                <p className="text-sm text-card-foreground/60">Demandes en cours</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{stats.drafts}</p>
                <p className="text-sm text-card-foreground/60">Brouillons</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <Users className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{stats.total}</p>
                <p className="text-sm text-card-foreground/60">Total demandes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent requests */}
        {recent.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Dernières demandes</h2>
              <Link to="/requests">
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                  Voir tout <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="grid gap-3">
              {recent.map((r) => (
                <Link key={r.id} to={`/request/${r.id}`}>
                  <Card className="card-hover">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-card-foreground">{r.title}</p>
                        <p className="text-xs text-card-foreground/50">{new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">{r.status}</Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Home;
