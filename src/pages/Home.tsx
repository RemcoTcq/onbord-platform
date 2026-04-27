import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  FileText,
  Send,
  Clock,
  Users,
  Briefcase,
  Sparkles,
  UserCheck,
  FileSignature,
  CreditCard,
  Check,
} from "lucide-react";

import { STATUSES } from "@/lib/constants";

interface RequestSummary {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

const PROGRESS_STEPS = STATUSES.map((s) => ({ key: s, label: s }));

const getStepIndex = (status: string): number => {
  const idx = STATUSES.indexOf(status as any);
  return idx >= 0 ? idx : 0;
};

const Home = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [stats, setStats] = useState({ total: 0, active: 0, drafts: 0, talents: 0 });
  const [latest, setLatest] = useState<RequestSummary | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("requests")
        .select("id, title, status, created_at, talents_number")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const all = data || [];
      const submitted = all.filter((r) => r.status !== "draft");
      const finalized = submitted.filter((r) => r.status === "Recrutement finalisé");
      const active = submitted.filter((r) => r.status !== "Recrutement finalisé");
      const talents = finalized.reduce((sum, r: any) => sum + (r.talents_number || 0), 0);

      setStats({
        total: submitted.length,
        active: active.length,
        drafts: all.filter((r) => r.status === "draft").length,
        talents,
      });
      setLatest(active[0] || submitted[0] || null);
    };
    load();
  }, [user]);

  const firstName = profile?.first_name?.trim() || "";

  const metrics = [
    { icon: FileText, label: "Total demandes", value: stats.total },
    { icon: Send, label: "Demandes actives", value: stats.active },
    { icon: Clock, label: "Brouillons", value: stats.drafts },
    { icon: Users, label: "Talents reçus", value: stats.talents },
  ];

  const steps = [
    { icon: Briefcase, title: "L'entreprise publie un poste", desc: "Vous décrivez votre besoin en quelques minutes." },
    { icon: Sparkles, title: "Onbord présente les meilleurs matchs", desc: "Notre équipe sélectionne les profils les plus pertinents." },
    { icon: UserCheck, title: "Votre équipe RH sélectionne les profils", desc: "Vous validez les candidats qui vous correspondent." },
    { icon: FileSignature, title: "Le contrat est signé", desc: "Nous gérons toute la partie administrative." },
    { icon: CreditCard, title: "Paiement uniquement si recrutement finalisé", desc: "Aucun frais tant que le recrutement n'est pas finalisé." },
  ];

  const currentStep = latest ? getStepIndex(latest.status) : 0;

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            Bonjour {firstName} <span className="inline-block">👋</span>
          </h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Voici un aperçu de votre activité de recrutement.
          </p>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <Card key={m.label} className="card-hover">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <m.icon className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">{m.value}</p>
                  <p className="text-[13px] text-muted-foreground">{m.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Latest request with progress */}
        {latest && (
          <Card className="overflow-hidden">
            <CardContent className="p-6 lg:p-7">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="section-title mb-1">Dernière demande en cours</div>
                  <h2 className="text-lg font-semibold text-card-foreground">{latest.title}</h2>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    Créée le {new Date(latest.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <Link to={`/request/${latest.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                    Voir les détails
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {/* Progress bar */}
              <div className="relative pt-2">
                <div className="absolute left-0 right-0 top-[calc(0.5rem+0.875rem)] h-0.5 bg-muted" />
                <div
                  className="absolute left-0 top-[calc(0.5rem+0.875rem)] h-0.5 bg-primary transition-all duration-500"
                  style={{
                    width:
                      PROGRESS_STEPS.length > 1
                        ? `${(currentStep / (PROGRESS_STEPS.length - 1)) * 100}%`
                        : "0%",
                  }}
                />
                <div
                  className="relative grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${PROGRESS_STEPS.length}, minmax(0, 1fr))` }}
                >
                  {PROGRESS_STEPS.map((step, i) => {
                    const done = i < currentStep;
                    const current = i === currentStep;
                    return (
                      <div key={step.key} className="flex flex-col items-center text-center">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full border-2 bg-card transition-all ${
                            done
                              ? "border-primary bg-primary text-primary-foreground"
                              : current
                              ? "border-primary text-primary"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          {done ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <span className="text-[11px] font-semibold">{i + 1}</span>
                          )}
                        </div>
                        <span
                          className={`mt-2 text-[11px] font-medium leading-tight ${
                            current || done ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* How it works */}
        <div>
          <h2 className="section-title mb-4">Comment ça marche</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, i) => (
              <Card key={i} className="card-hover">
                <CardContent className="p-5">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <step.icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Étape {i + 1}
                  </div>
                  <h3 className="text-[14px] font-semibold text-card-foreground leading-snug">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-[12px] text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between lg:p-7">
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">
                Prêt à recruter votre prochain talent ?
              </h3>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Décrivez votre besoin, on s'occupe du reste.
              </p>
            </div>
            <Link to="/request/new">
              <Button size="lg" className="gap-2">
                Créer une nouvelle demande
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Home;
