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
  Plus,
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
    { icon: Briefcase, title: "Vous publiez un poste", desc: "Décrivez votre besoin en quelques minutes." },
    { icon: Sparkles, title: "Nous matchons les profils", desc: "Notre équipe sélectionne les talents les plus pertinents." },
    { icon: UserCheck, title: "Vous validez vos candidats", desc: "Choisissez les profils qui vous correspondent." },
    { icon: FileSignature, title: "Le contrat est signé", desc: "On gère toute la partie administrative." },
    { icon: CreditCard, title: "Vous payez à la finalisation", desc: "Aucun frais tant que le recrutement n'est pas conclu." },
  ];

  const currentStep = latest ? getStepIndex(latest.status) : 0;
  const progressPercent =
    PROGRESS_STEPS.length > 1 ? (currentStep / (PROGRESS_STEPS.length - 1)) * 100 : 0;

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Bonjour {firstName || "👋"}
              {firstName && <span className="ml-1.5 inline-block">👋</span>}
            </h1>
            <p className="mt-1.5 text-[14px] text-muted-foreground">
              Voici un aperçu de votre activité de recrutement.
            </p>
          </div>
          <Link to="/request/new">
            <Button variant="gradient" size="lg" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Nouvelle demande
            </Button>
          </Link>
        </header>

        {/* Metrics — Linear-style stat blocks */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m, i) => (
            <div
              key={m.label}
              className="surface group relative overflow-hidden rounded-lg p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-border animate-slide-up-fade"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <m.icon className="absolute right-3 top-3 h-9 w-9 text-foreground/[0.05] transition-transform duration-300 group-hover:scale-110 group-hover:text-primary/20" />
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {m.label}
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground leading-none">
                {m.value}
              </p>
            </div>
          ))}
        </section>

        {/* Latest request — hero card */}
        {latest && (
          <section className="surface-subtle relative overflow-hidden rounded-xl p-6 lg:p-7">
            <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="section-title">Dernière demande</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 text-success px-2 py-0.5 text-[10.5px] font-medium border border-success/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />
                    En cours
                  </span>
                </div>
                <h2 className="mt-1.5 text-lg font-semibold text-foreground">{latest.title}</h2>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  Créée le {new Date(latest.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <Link to={`/request/${latest.id}`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  Voir les détails
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {/* Segmented progress timeline */}
            <div>
              <div className="flex gap-1">
                {PROGRESS_STEPS.map((step, i) => {
                  const done = i < currentStep;
                  const current = i === currentStep;
                  return (
                    <div
                      key={step.key}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                        done
                          ? "bg-success"
                          : current
                          ? "bg-primary animate-pulse-soft"
                          : "bg-border"
                      }`}
                    />
                  );
                })}
              </div>
              <div
                className="mt-3 grid gap-2"
                style={{ gridTemplateColumns: `repeat(${PROGRESS_STEPS.length}, minmax(0, 1fr))` }}
              >
                {PROGRESS_STEPS.map((step, i) => {
                  const done = i < currentStep;
                  const current = i === currentStep;
                  return (
                    <div key={step.key} className="flex flex-col items-start gap-0.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`text-[11.5px] font-medium leading-tight line-clamp-2 ${
                          current
                            ? "text-foreground"
                            : done
                            ? "text-foreground/80"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground tabular-nums">
                {Math.round(progressPercent)}% complété
              </p>
            </div>
          </section>
        )}

        {/* How it works */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Comment ça marche</h2>
            <span className="text-[11px] text-muted-foreground">5 étapes</span>
          </div>
          <div className="grid gap-px overflow-hidden rounded-lg border border-border/70 bg-border/70 md:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, i) => (
              <div
                key={i}
                className="group relative bg-card p-5 transition-colors duration-150 hover:bg-muted/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold tabular-nums text-muted-foreground/30 leading-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <step.icon className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                </div>
                <h3 className="text-[13.5px] font-semibold text-foreground leading-snug">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-[12px] text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="surface relative overflow-hidden rounded-xl">
          <div className="absolute inset-0 dot-grid-bg opacity-60" />
          <div className="absolute inset-0 bg-gradient-subtle" />
          <div className="relative flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between lg:p-7">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Prêt à recruter votre prochain talent ?
              </h3>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Décrivez votre besoin, on s'occupe du reste.
              </p>
            </div>
            <Link to="/request/new">
              <Button variant="gradient" size="lg" className="gap-1.5">
                Créer une nouvelle demande
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Home;
