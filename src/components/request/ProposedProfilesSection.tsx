import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Check,
  X,
  MapPin,
  Clock,
  GraduationCap,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { RejectAllProfilesDialog } from "./RejectAllProfilesDialog";
import { OrganizeInterviewDialog, type InterviewMode, type Slot } from "./OrganizeInterviewDialog";
import { ProfileDetailDialog, type DetailedProfile } from "./ProfileDetailDialog";

interface PublicProfile extends DetailedProfile {
  request_id: string;
}

interface Props {
  requestId: string;
  requestStatus: string;
  requestSkills?: string[];
  onStatusChange?: (newStatus: string) => void;
}

export const ProposedProfilesSection = ({
  requestId,
  requestStatus,
  requestSkills = [],
  onStatusChange,
}: Props) => {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectAllOpen, setRejectAllOpen] = useState(false);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [interviewProfileId, setInterviewProfileId] = useState<string | null>(null);
  const [detailProfile, setDetailProfile] = useState<PublicProfile | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");

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

  useEffect(() => {
    fetch();
  }, [requestId, requestStatus]);

  const matchSet = useMemo(
    () => new Set(requestSkills.map((s) => s.toLowerCase().trim())),
    [requestSkills]
  );
  const isMatch = (name: string) => matchSet.has(name.toLowerCase().trim());

  const isFinalized = requestStatus === "Recrutement finalisé";
  const isOrganizing = requestStatus === "Entretien en cours d'organisation";
  const canAct = !isFinalized && !isOrganizing;

  const updateStatus = async (id: string, status: "accepted" | "rejected", extra?: { rejection_other?: string }) => {
    const payload: any = { status };
    if (extra?.rejection_other !== undefined) payload.rejection_other = extra.rejection_other;
    const { error } = await supabase.from("proposed_profiles").update(payload).eq("id", id);
    if (error) {
      toast.error("Erreur");
      return false;
    }
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, status, ...(extra || {}) } as any : p)));
    return true;
  };

  const handleAccept = async (id: string) => {
    const ok = await updateStatus(id, "accepted");
    if (!ok) return;
    await supabase.from("requests").update({ status: "Profils validés" }).eq("id", requestId);
    await supabase.from("admin_notifications").insert({
      type: "profile_accepted",
      request_id: requestId,
      payload: { profile_id: id },
    });
    onStatusChange?.("Profils validés");
    setDetailProfile(null);
    setInterviewProfileId(id);
    setInterviewOpen(true);
  };

  const openRejectComment = (id: string) => {
    setRejectingId(id);
    setRejectComment("");
    setDetailProfile(null);
  };

  const confirmReject = async () => {
    if (!rejectingId) return;
    const id = rejectingId;
    const comment = rejectComment.trim();
    const ok = await updateStatus(id, "rejected", { rejection_other: comment });
    if (!ok) return;
    setRejectingId(null);
    setRejectComment("");

    const updated = profiles.map((p) =>
      p.id === id ? { ...p, status: "rejected" as const, rejection_other: comment } : p
    );
    const allRejected = updated.length > 0 && updated.every((p) => p.status === "rejected");
    if (allRejected) setRejectAllOpen(true);
  };

  const submitRejectAllFeedback = async (reasons: string[], other: string) => {
    await supabase
      .from("requests")
      .update({ status: "Profils en cours de sélection" })
      .eq("id", requestId);
    await supabase.from("admin_notifications").insert({
      type: "profiles_rejected",
      request_id: requestId,
      payload: { reasons, other },
    });
    onStatusChange?.("Profils en cours de sélection");
    toast.success("Merci ! Nous revenons vers vous sous 48h.");
    setRejectAllOpen(false);
  };

  const submitInterview = async (mode: InterviewMode, slots: Slot[], onsiteAddress?: string) => {
    if (!interviewProfileId) return;
    const { error } = await supabase.from("interview_requests").insert({
      proposed_profile_id: interviewProfileId,
      request_id: requestId,
      mode,
      proposed_slots: slots as any,
      onsite_address: onsiteAddress ?? "",
    });
    if (error) {
      toast.error("Erreur lors de l'envoi");
      return;
    }
    await supabase
      .from("requests")
      .update({ status: "Entretien en cours d'organisation" })
      .eq("id", requestId);
    await supabase.from("admin_notifications").insert({
      type: "interview_slots_proposed",
      request_id: requestId,
      payload: { profile_id: interviewProfileId, mode, slots, onsite_address: onsiteAddress ?? "" },
    });
    onStatusChange?.("Entretien en cours d'organisation");
    toast.success("Créneaux envoyés !");
    setInterviewOpen(false);
  };

  if (loading) return null;
  if (profiles.length === 0) return null;

  return (
    <>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">Profils proposés</h3>
            <p className="text-sm text-muted-foreground">
              {isFinalized
                ? "Coordonnées des talents accessibles ci-dessous."
                : "Cliquez sur « Voir profil complet » pour découvrir le détail anonymisé, puis indiquez si le profil vous intéresse."}
            </p>
          </div>

          {isOrganizing && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
              Entretien en cours d'organisation — Onbord revient vers vous sous 24h avec un créneau confirmé.
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {profiles.map((p) => {
              const displayName =
                [p.first_name, p.last_initial].filter(Boolean).join(" ") || p.alias;
              const hardSkills =
                p.hard_skills_detail && p.hard_skills_detail.length > 0
                  ? p.hard_skills_detail.map((s) => s.name)
                  : p.skills || [];
              return (
                <div key={p.id} className="rounded-lg border border-border p-4 space-y-3 bg-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-card-foreground">{displayName}</h4>
                        {p.validated_by_onbord && (
                          <Badge className="bg-success text-success-foreground gap-1 text-xs">
                            <ShieldCheck className="h-3 w-3" /> Validé Onbord
                          </Badge>
                        )}
                        {p.status === "accepted" && (
                          <Badge className="bg-success text-success-foreground text-xs">Intéressé</Badge>
                        )}
                        {p.status === "rejected" && <Badge variant="outline" className="text-xs">Pas intéressé</Badge>}
                      </div>
                      {(p.school || p.study_year || p.study_field) && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <GraduationCap className="h-3 w-3" />
                          {[p.school, p.study_year, p.study_field].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>

                  {hardSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {hardSkills.slice(0, 6).map((s, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className={`text-xs ${
                            isMatch(s) ? "bg-success/15 border-success text-secondary-foreground" : ""
                          }`}
                        >
                          {s}
                        </Badge>
                      ))}
                      {hardSkills.length > 6 && (
                        <Badge variant="outline" className="text-xs">+{hardSkills.length - 6}</Badge>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {(p.availability || p.availability_regime) && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {[p.availability, p.availability_regime].filter(Boolean).join(" · ")}
                      </span>
                    )}
                    {p.location_area && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {p.location_area}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => setDetailProfile(p)} className="gap-1">
                      <Eye className="h-4 w-4" /> Voir profil complet
                    </Button>
                    {canAct && p.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => openRejectComment(p.id)} className="gap-1">
                          <X className="h-4 w-4" /> Pas le bon profil
                        </Button>
                        <Button size="sm" onClick={() => handleAccept(p.id)} className="gap-1">
                          <Check className="h-4 w-4" /> Intéressé
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <ProfileDetailDialog
        open={!!detailProfile}
        onOpenChange={(o) => !o && setDetailProfile(null)}
        profile={detailProfile}
        requestSkills={requestSkills}
        isFinalized={isFinalized}
        canAct={canAct}
        onAccept={handleAccept}
        onReject={openRejectComment}
      />

      <Dialog open={!!rejectingId} onOpenChange={(o) => !o && setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pourquoi ce profil ne convient pas ?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Commentaire (optionnel)</Label>
            <Textarea
              rows={3}
              placeholder="Aidez-nous à mieux cibler les prochains profils…"
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>Annuler</Button>
            <Button onClick={confirmReject}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RejectAllProfilesDialog
        open={rejectAllOpen}
        onOpenChange={setRejectAllOpen}
        onSubmit={submitRejectAllFeedback}
      />
      <OrganizeInterviewDialog
        open={interviewOpen}
        onOpenChange={setInterviewOpen}
        onSubmit={submitInterview}
      />
    </>
  );
};
