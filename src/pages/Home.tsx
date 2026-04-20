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
    { icon: Search, title: "On trouve les profils", desc: "Notre équipe identifie les meilleurs talents pour vous" },
    { icon: Rocket, title: "Vous lancez la mission", desc: "Validez les profils et démarrez la collaboration" },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Hero */}
        <Card className="overflow-hidden">
          <CardContent className="p-8 lg:p-10">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Rocket className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              Recrutez les talents de demain,<br />dès aujourd'hui
            </h1>
            <p className="mt-3 max-w-xl text-muted-foreground text-[15px]">
              Onbord vous connecte aux meilleurs profils pour vos missions, en quelques clics.
            </p>
            <Link to="/request/new">
              <Button size="lg" className="mt-6 gap-2">
                Créer une demande
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 3 Steps */}
        <div>
          <h2 className="section-title mb-4">Comment ça marche</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map((step, i) => (
              <Card key={i} className="card-hover">
                <CardContent className="p-5">
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <step.icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Étape {i + 1}</div>
                  <h3 className="font-semibold text-card-foreground text-[15px]">{step.title}</h3>
                  <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Video placeholder */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center justify-center bg-muted/40 h-64 lg:h-72">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Rocket className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-[13px] font-medium text-muted-foreground">Vidéo de présentation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats + Recent */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="card-hover">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Send className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{stats.active}</p>
                <p className="text-[13px] text-muted-foreground">Demandes en cours</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Clock className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{stats.drafts}</p>
                <p className="text-[13px] text-muted-foreground">Brouillons</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Users className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{stats.total}</p>
                <p className="text-[13px] text-muted-foreground">Total demandes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent requests */}
        {recent.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Dernières demandes</h2>
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
                        <p className="font-medium text-card-foreground text-[14px]">{r.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <Badge variant="secondary">{r.status}</Badge>
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
