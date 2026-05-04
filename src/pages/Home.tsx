import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  Send,
  Clock,
  Users,
  Briefcase,
  Sparkles,
  UserCheck,
  FileSignature,
  CreditCard,
  Plus,
  Activity,
  Zap,
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

// Mini sparkline component (pure SVG, no deps)
const Sparkline = ({ data, color = "currentColor" }: { data: number[]; color?: string }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={`g-${color.replace(/[^a-z]/gi, "")}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#g-${color.replace(/[^a-z]/gi, "")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const Home = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [stats, setStats] = useState({ total: 0, active: 0, drafts: 0, talents: 0 });
  const [latest, setLatest] = useState<RequestSummary | null>(null);
  const [recent, setRecent] = useState<RequestSummary[]>([]);

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
      setRecent(submitted.slice(0, 5));
    };
    load();
  }, [user]);

  const firstName = profile?.first_name?.trim() || "";

  const metrics = [
    { icon: FileText, label: "Total demandes", value: stats.total, trend: "+12%", spark: [3, 5, 4, 7, 6, 9, 8, 11], color: "hsl(221 83% 53%)" },
    { icon: Send, label: "Actives", value: stats.active, trend: "+8%", spark: [2, 3, 3, 5, 4, 6, 7, 8], color: "hsl(265 85% 60%)" },
    { icon: Clock, label: "Brouillons", value: stats.drafts, trend: "—", spark: [1, 2, 2, 1, 3, 2, 2, 1], color: "hsl(38 92% 50%)" },
    { icon: Users, label: "Talents reçus", value: stats.talents, trend: "+24%", spark: [0, 1, 2, 2, 4, 5, 6, 9], color: "hsl(158 64% 42%)" },
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
      <div className="mx-auto max-w-6xl space-y-6">
        {/* HERO — mesh gradient immersif */}
        <section className="mesh-hero mesh-hero-noise relative overflow-hidden rounded-2xl border border-border/50 shadow-pop">
          {/* Aurora blobs */}
          <div className="absolute -top-20 -left-10 h-72 w-72 rounded-full bg-primary/30 blur-3xl animate-aurora" />
          <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl animate-aurora" style={{ animationDelay: "2s" }} />

          <div className="relative grid gap-6 p-6 lg:grid-cols-[1.4fr_1fr] lg:p-10">
            {/* Left: greeting + CTA */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium backdrop-blur-md">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Plateforme opérationnelle
              </div>
              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.05]">
                Bonjour {firstName || "👋"}
                {firstName && <span className="ml-2">👋</span>}
                <br />
                <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                  Votre prochain talent
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-200 via-purple-200 to-white bg-clip-text text-transparent">
                  vous attend.
                </span>
              </h1>
              <p className="mt-4 max-w-md text-[14px] text-white/70 leading-relaxed">
                Aperçu temps réel de vos recrutements, profils proposés et étapes en cours.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <Link to="/request/new">
                  <Button size="lg" className="gap-1.5 bg-white text-foreground hover:bg-white/90 shadow-pop">
                    <Plus className="h-4 w-4" />
                    Nouvelle demande
                  </Button>
                </Link>
                <Link to="/requests">
                  <Button size="lg" variant="ghost" className="gap-1.5 text-white hover:bg-white/10 hover:text-white">
                    Voir mes demandes
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: live activity card */}
            <div className="relative">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/80">
                    <Activity className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Activité live</span>
                  </div>
                  <span className="text-[10px] text-white/50 tabular-nums">MAJ il y a 2 min</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-white/50">Pipeline</p>
                    <p className="mt-1 text-2xl font-semibold text-white tabular-nums text-glow-primary">
                      {stats.active}
                    </p>
                    <p className="text-[10.5px] text-emerald-300 mt-0.5 flex items-center gap-1">
                      <ArrowUpRight className="h-3 w-3" /> en cours
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-white/50">Talents</p>
                    <p className="mt-1 text-2xl font-semibold text-white tabular-nums">
                      {stats.talents}
                    </p>
                    <p className="text-[10.5px] text-white/60 mt-0.5">recrutés</p>
                  </div>
                </div>

                {/* Mini activity stream */}
                <div className="mt-4 space-y-2">
                  {recent.slice(0, 3).map((r) => (
                    <Link
                      key={r.id}
                      to={`/request/${r.id}`}
                      className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 -mx-2 hover:bg-white/[0.06] transition-colors"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-glow shrink-0" />
                      <span className="flex-1 truncate text-[12px] text-white/85">{r.title}</span>
                      <ArrowUpRight className="h-3 w-3 text-white/40 group-hover:text-white/80 transition-colors" />
                    </Link>
                  ))}
                  {recent.length === 0 && (
                    <p className="text-[12px] text-white/50 italic py-1.5">Aucune activité récente</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* METRICS — bento avec sparklines */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m, i) => (
            <div
              key={m.label}
              className="group relative overflow-hidden rounded-xl border border-border/70 bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop hover:border-border animate-slide-up-fade"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-md"
                    style={{ background: `${m.color.replace(")", " / 0.1)")}` , color: m.color }}
                  >
                    <m.icon className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-[11px] font-medium text-muted-foreground">{m.label}</p>
                </div>
                <span
                  className={`text-[10.5px] font-semibold tabular-nums ${
                    m.trend.startsWith("+") ? "text-success" : "text-muted-foreground"
                  }`}
                >
                  {m.trend}
                </span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <p className="text-[32px] font-semibold tabular-nums leading-none tracking-tight">
                  {m.value}
                </p>
                <div style={{ color: m.color }}>
                  <Sparkline data={m.spark} color={m.color} />
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* PIPELINE TRACKER + QUICK ACTIONS */}
        <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          {/* Pipeline */}
          {latest ? (
            <div className="surface relative overflow-hidden rounded-xl p-5 lg:p-6">
              <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="section-title">Pipeline en cours</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 text-success px-2 py-0.5 text-[10.5px] font-medium border border-success/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />
                        Active
                      </span>
                    </div>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight">{latest.title}</h2>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                      Créée le {new Date(latest.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold">Progression</p>
                    <p className="text-3xl font-semibold tabular-nums tracking-tight bg-gradient-to-br from-primary to-primary-glow bg-clip-text text-transparent">
                      {Math.round(progressPercent)}%
                    </p>
                  </div>
                </div>

                {/* Animated progress bar */}
                <div className="mt-5 relative h-1.5 w-full overflow-hidden rounded-full bg-border/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Stations */}
                <div
                  className="mt-4 grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${PROGRESS_STEPS.length}, minmax(0, 1fr))` }}
                >
                  {PROGRESS_STEPS.map((step, i) => {
                    const done = i < currentStep;
                    const current = i === currentStep;
                    return (
                      <div key={step.key} className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold tabular-nums shrink-0 transition-all ${
                              done
                                ? "bg-success text-success-foreground"
                                : current
                                ? "bg-primary text-primary-foreground ring-4 ring-primary/15"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {done ? "✓" : i + 1}
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-medium leading-tight line-clamp-2 ${
                            current
                              ? "text-foreground"
                              : done
                              ? "text-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
                  <p className="text-[12px] text-muted-foreground">
                    Étape actuelle : <span className="font-medium text-foreground">{PROGRESS_STEPS[currentStep]?.label}</span>
                  </p>
                  <Link to={`/request/${latest.id}`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      Détails
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="surface relative overflow-hidden rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold">Aucune demande en cours</h3>
              <p className="text-[13px] text-muted-foreground mt-1 max-w-sm">
                Créez votre première demande pour démarrer le matching de talents.
              </p>
              <Link to="/request/new" className="mt-4">
                <Button variant="gradient" size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Démarrer
                </Button>
              </Link>
            </div>
          )}

          {/* Quick actions */}
          <div className="space-y-3">
            <Link
              to="/request/new"
              className="block group relative overflow-hidden rounded-xl border border-border/70 bg-card p-4 transition-all hover:shadow-pop hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-md shrink-0">
                  <Zap className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold">Démarrer une demande</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
                    Décrivez votre besoin en langage naturel.
                  </p>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>

            <Link
              to="/requests"
              className="block group rounded-xl border border-border/70 bg-card p-4 transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold">Toutes mes demandes</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
                    Suivez l'historique et l'avancement.
                  </p>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>

            <Link
              to="/drafts"
              className="block group rounded-xl border border-border/70 bg-card p-4 transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold">Brouillons</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
                    Reprenez là où vous vous êtes arrêté.
                  </p>
                </div>
                <span className="text-[11px] font-semibold tabular-nums text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {stats.drafts}
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Comment ça marche</h2>
              <p className="text-[12.5px] text-muted-foreground mt-0.5">5 étapes pour recruter sereinement.</p>
            </div>
          </div>
          <div className="relative grid gap-px overflow-hidden rounded-xl border border-border/70 bg-border/70 md:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, i) => (
              <div
                key={i}
                className="group relative bg-card p-5 transition-all duration-200 hover:bg-gradient-to-br hover:from-primary/[0.03] hover:to-transparent"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold tabular-nums text-muted-foreground/60 tracking-widest">
                    {String(i + 1).padStart(2, "0")} / 05
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/60 text-muted-foreground transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105">
                    <step.icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <h3 className="text-[13.5px] font-semibold leading-snug">{step.title}</h3>
                <p className="mt-1.5 text-[12px] text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card">
          <div className="absolute inset-0 grid-lines-bg opacity-50" />
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
          <div className="relative flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">
                Prêt à recruter votre prochain talent&nbsp;?
              </h3>
              <p className="mt-1 text-[13.5px] text-muted-foreground">
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
