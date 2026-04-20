import { TalentType } from "@/lib/request-types";

export const normalizeTalentType = (value?: string | null): TalentType =>
  value === "graduate" ? "graduate" : "student";

export const getTalentTypeLabel = (value?: string | null) =>
  normalizeTalentType(value) === "graduate" ? "Jeune diplômé" : "Étudiant";

export const getTalentTypeHint = (value?: string | null) =>
  normalizeTalentType(value) === "graduate" ? "Diplômé récent" : "En cours d'études";