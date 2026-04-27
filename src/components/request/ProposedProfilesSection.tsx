import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, MapPin, Clock, Briefcase, Mail, Phone, Linkedin, User } from "lucide-react";
import { toast } from "sonner";
import { RejectAllProfilesDialog } from "./RejectAllProfilesDialog";
import { OrganizeInterviewDialog, type InterviewMode, type Slot } from "./OrganizeInterviewDialog";

interface PublicProfile {
  id: string;
  request_id: string;
  alias: string;
  headline: string;
  summary: string;
  experience_years: number;
  skills: string[];
  languages: any;
  availability: string;
  location_area: string;
  status: "pending" | "accepted" | "rejected";
  full_name: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
}

interface Props {
  requestId: string;
  requestStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

export const ProposedProfilesSection = ({ requestId, requestStatus, onStatusChange }: Props) => {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [interviewProfileId, setInterviewProfileId] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("proposed_profiles_public" as any)
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });
    setProfiles((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [requestId, requestStatus]);

  const updateStatus = async (id: string, status: "accepted" | "rejected") => {
    const { error } = await supabase.from("proposed_profiles").update({ status }).eq("id", id);
    if (error) {
      toast.error("Erreur");
      return;
    }
    setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
  };

  const handleAccept = async (id: string) => {
    await updateStatus(id, "accepted");
    // bump request status to "Profils validés"
    await supabase.from("requests").update({ status: "Profils validés" }).eq("id", requestId);
    await supabase.from("admin_notifications").insert({
      type: "profile_accepted",
      request_id: requestId,
      payload: { profile_id: id },
    });
    onStatusChange?.("Profils validés");
    setInterviewProfileId(id);
    setInterviewOpen(true);
  };

  const handleReject = async (id: string) => {
    await updateStatus(id, "rejected");
    // check if all are rejected now
    const updated = profiles.map((p) => p.id === id ? { ...p, status: "rejected" as const } : p);
    const allRejected = updated.length > 0 && updated.every((p) => p.status === "rejected");
    if (allRejected) {
      setRejectOpen(true);
    }
  };

  const submitRejectFeedback = async (reasons: string[], other: string) => {
    await supabase.from("requests").update({ status: "Profils en cours de sélection" }).eq("id", requestId);
    await supabase.from("admin_notifications").insert({
      type: "profiles_rejected",
      request_id: requestId,
      payload: { reasons, other },
    });
    onStatusChange?.("Profils en cours de sélection");
    toast.success("Merci ! Nous revenons vers vous sous 48h.");
    setRejectOpen(false);
  };

  const submitInterview = async (mode: InterviewMode, slots: Slot[]) => {
    if (!interviewProfileId) return;
    const { error } = await supabase.from("interview_requests").insert({
      proposed_profile_id: interviewProfileId,
      request_id: requestId,
      mode,
      proposed_slots: slots as any,
    });
    if (error) {
      toast.error("Erreur lors de l'envoi");
      return;
    }
    await supabase.from("requests").update({ status: "Entretien en cours d'organisation" }).eq("id", requestId);
    await supabase.from("admin_notifications").insert({
      type: "interview_slots_proposed",
      request_id: requestId,
      payload: { profile_id: interviewProfileId, mode, slots },
    });
    onStatusChange?.("Entretien en cours d'organisation");
    toast.success("Créneaux envoyés !");
    setInterviewOpen(false);
  };

  if (loading) return null;
  if (profiles.length === 0) return null;

  const isFinalized = requestStatus === "Recrutement finalisé";
  const isOrganizing = requestStatus === "Entretien en cours d'organisation";

  return (
    <>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">Profils proposés</h3>
            <p className="text-sm text-muted-foreground">
              {isFinalized
                ? "Coordonnées des talents accessibles ci-dessous."
                : "Indiquez les profils qui vous intéressent. Les coordonnées sont révélées une fois le recrutement finalisé."}
            </p>
          </div>

          {isOrganizing && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
              Entretien en cours d'organisation — Onbord revient vers vous sous 24h avec un créneau confirmé.
            </div>
          )}

          <div className="space-y-3">
            {profiles.map((p) => (
              <div key={p.id} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-card-foreground">{p.alias}</h4>
                      {p.status === "accepted" && <Badge className="bg-success text-success-foreground">Intéressé</Badge>}
                      {p.status === "rejected" && <Badge variant="outline">Pas intéressé</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{p.headline}</p>
                  </div>
                  {p.status === "pending" && !isFinalized && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleReject(p.id)} className="gap-1">
                        <X className="h-4 w-4" /> Pas intéressé
                      </Button>
                      <Button size="sm" onClick={() => handleAccept(p.id)} className="gap-1">
                        <Check className="h-4 w-4" /> Intéressé
                      </Button>
                    </div>
                  )}
                </div>

                {p.summary && <p className="text-sm text-card-foreground/80">{p.summary}</p>}

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {p.experience_years > 0 && (
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{p.experience_years} an(s) d'XP</span>
                  )}
                  {p.location_area && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.location_area}</span>
                  )}
                  {p.availability && (
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{p.availability}</span>
                  )}
                </div>

                {p.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.skills.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                  </div>
                )}

                {isFinalized && (p.full_name || p.email || p.phone || p.linkedin_url) && (
                  <div className="rounded-md border border-success/30 bg-success/5 p-3 space-y-1 text-sm">
                    <p className="font-semibold text-card-foreground mb-1">Coordonnées du talent</p>
                    {p.full_name && <div className="flex items-center gap-2"><User className="h-3 w-3" />{p.full_name}</div>}
                    {p.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3" />{p.email}</div>}
                    {p.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3" />{p.phone}</div>}
                    {p.linkedin_url && (
                      <div className="flex items-center gap-2">
                        <Linkedin className="h-3 w-3" />
                        <a href={p.linkedin_url} target="_blank" rel="noreferrer" className="underline">LinkedIn</a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <RejectAllProfilesDialog open={rejectOpen} onOpenChange={setRejectOpen} onSubmit={submitRejectFeedback} />
      <OrganizeInterviewDialog open={interviewOpen} onOpenChange={setInterviewOpen} onSubmit={submitInterview} />
    </>
  );
};
