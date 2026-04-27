import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, X, ShieldCheck, MapPin, Clock, GraduationCap, Briefcase, Languages, Target, Mail, Phone, Linkedin, User } from "lucide-react";

export interface DetailedProfile {
  id: string;
  alias: string;
  first_name: string | null;
  last_initial: string | null;
  bio: string | null;
  validated_by_onbord: boolean | null;
  headline: string | null;
  summary: string | null;
  experience_years: number;
  skills: string[];
  hard_skills_detail: { name: string; level: string }[] | null;
  soft_skills_detail: { name: string; example: string }[] | null;
  languages: { name: string; level: number }[] | null;
  school: string | null;
  diploma: string | null;
  study_year: string | null;
  study_field: string | null;
  experiences: { role: string; sector: string; duration: string; description: string }[] | null;
  looking_for: { contract_type?: string; sector?: string; ambitions?: string } | null;
  availability: string | null;
  availability_regime: string | null;
  location_area: string | null;
  status: "pending" | "accepted" | "rejected";
  full_name: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: DetailedProfile | null;
  requestSkills: string[];
  isFinalized: boolean;
  canAct: boolean;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

const Section = ({ icon: Icon, title, children }: any) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h4 className="font-semibold text-card-foreground">{title}</h4>
    </div>
    <div className="pl-6 text-sm text-card-foreground/90">{children}</div>
  </div>
);

export const ProfileDetailDialog = ({
  open,
  onOpenChange,
  profile,
  requestSkills,
  isFinalized,
  canAct,
  onAccept,
  onReject,
}: Props) => {
  if (!profile) return null;
  const matchSet = new Set(requestSkills.map((s) => s.toLowerCase().trim()));
  const isMatch = (name: string) => matchSet.has(name.toLowerCase().trim());

  const displayName =
    [profile.first_name, profile.last_initial].filter(Boolean).join(" ") || profile.alias;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {displayName}
            {profile.validated_by_onbord && (
              <Badge className="bg-success text-success-foreground gap-1">
                <ShieldCheck className="h-3 w-3" /> Validé Onbord
              </Badge>
            )}
            {profile.status === "accepted" && <Badge className="bg-success text-success-foreground">Intéressé</Badge>}
            {profile.status === "rejected" && <Badge variant="outline">Pas intéressé</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Présentation */}
          <Section icon={User} title="Présentation">
            {profile.bio ? <p>{profile.bio}</p> : <p className="text-muted-foreground">—</p>}
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              {profile.location_area && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.location_area}</span>}
              {profile.experience_years > 0 && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{profile.experience_years} an(s) d'XP</span>}
            </div>
          </Section>

          <Separator />

          {/* Formation */}
          <Section icon={GraduationCap} title="Formation">
            {profile.school || profile.diploma ? (
              <p>
                {[profile.school, profile.diploma, profile.study_year, profile.study_field].filter(Boolean).join(" · ")}
              </p>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </Section>

          <Separator />

          {/* Hard skills */}
          <Section icon={Briefcase} title="Hard skills">
            {profile.hard_skills_detail && profile.hard_skills_detail.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.hard_skills_detail.map((s, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={
                      isMatch(s.name)
                        ? "bg-success/15 text-success-foreground border-success"
                        : ""
                    }
                  >
                    {s.name} <span className="ml-1 opacity-70">· {s.level}</span>
                  </Badge>
                ))}
              </div>
            ) : profile.skills?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <Badge key={s} variant="outline" className={isMatch(s) ? "bg-success/15 border-success" : ""}>{s}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </Section>

          <Separator />

          {/* Soft skills */}
          <Section icon={ShieldCheck} title="Soft skills">
            {profile.soft_skills_detail && profile.soft_skills_detail.length > 0 ? (
              <ul className="space-y-1 list-disc list-inside">
                {profile.soft_skills_detail.map((s, i) => (
                  <li key={i}>
                    <span className="font-medium">{s.name}</span>
                    {s.example && <span className="text-muted-foreground"> — {s.example}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </Section>

          <Separator />

          {/* Langues */}
          <Section icon={Languages} title="Langues">
            {profile.languages && profile.languages.length > 0 ? (
              <ul className="space-y-1">
                {profile.languages.map((l, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="font-medium w-24">{l.name}</span>
                    <span className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          className={`h-2 w-4 rounded-sm ${n <= (l.level || 0) ? "bg-primary" : "bg-muted"}`}
                        />
                      ))}
                    </span>
                    <span className="text-xs text-muted-foreground">{l.level}/5</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </Section>

          <Separator />

          {/* Expériences */}
          <Section icon={Briefcase} title="Expériences">
            {profile.experiences && profile.experiences.length > 0 ? (
              <ul className="space-y-3">
                {profile.experiences.map((e, i) => (
                  <li key={i} className="border-l-2 border-primary/30 pl-3">
                    <div className="font-medium">{e.role}</div>
                    <div className="text-xs text-muted-foreground">
                      {[e.sector, e.duration].filter(Boolean).join(" · ")}
                    </div>
                    {e.description && <p className="text-sm mt-1">{e.description}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </Section>

          <Separator />

          {/* Objectifs */}
          <Section icon={Target} title="Objectifs">
            {profile.looking_for && (profile.looking_for.contract_type || profile.looking_for.sector || profile.looking_for.ambitions) ? (
              <div className="space-y-1">
                {profile.looking_for.contract_type && <p><span className="font-medium">Contrat :</span> {profile.looking_for.contract_type}</p>}
                {profile.looking_for.sector && <p><span className="font-medium">Secteur :</span> {profile.looking_for.sector}</p>}
                {profile.looking_for.ambitions && <p><span className="font-medium">Ambitions :</span> {profile.looking_for.ambitions}</p>}
              </div>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </Section>

          <Separator />

          {/* Disponibilité */}
          <Section icon={Clock} title="Disponibilité">
            <p>
              {[profile.availability, profile.availability_regime, profile.location_area]
                .filter(Boolean)
                .join(" · ") || "—"}
            </p>
          </Section>

          {/* Coordonnées (uniquement si finalisé) */}
          {isFinalized && (profile.full_name || profile.email || profile.phone || profile.linkedin_url) && (
            <>
              <Separator />
              <div className="rounded-md border border-success/30 bg-success/5 p-3 space-y-1 text-sm">
                <p className="font-semibold text-card-foreground mb-1">Coordonnées du talent</p>
                {profile.full_name && <div className="flex items-center gap-2"><User className="h-3 w-3" />{profile.full_name}</div>}
                {profile.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3" />{profile.email}</div>}
                {profile.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3" />{profile.phone}</div>}
                {profile.linkedin_url && (
                  <div className="flex items-center gap-2">
                    <Linkedin className="h-3 w-3" />
                    <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="underline">LinkedIn</a>
                  </div>
                )}
              </div>
            </>
          )}

          {canAct && profile.status === "pending" && (
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => onReject(profile.id)} className="gap-1">
                <X className="h-4 w-4" /> Pas le bon profil
              </Button>
              <Button onClick={() => onAccept(profile.id)} className="gap-1">
                <Check className="h-4 w-4" /> Intéressé
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
