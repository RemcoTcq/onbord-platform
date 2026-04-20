export type TalentType = "student" | "graduate";
export type EmploymentType = "full_time" | "part_time" | null;

export interface RequestFormData {
  // Step 1 - Natural language
  naturalLanguageQuery: string;
  // Profil
  talentType: TalentType;
  domain: string;
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  mustHaveSoftSkills: string[];
  niceToHaveSoftSkills: string[];
  customSkills: string[];
  languages: { name: string; level: number }[];
  diploma: string;
  // Job
  title: string;
  description: string;
  talentsNumber: number;
  daysPerWeek: number;
  scheduleType: "flexible" | "fixed";
  scheduleDetails: Record<string, string[]>;
  workMode: string;
  // Graduate-only
  employmentType: EmploymentType;
  // Computed
  weeklyHours: number;
  weeklyPrice: number;
  monthlyPrice: number;
}

export const defaultFormData: RequestFormData = {
  naturalLanguageQuery: "",
  talentType: "student",
  domain: "",
  mustHaveSkills: [],
  niceToHaveSkills: [],
  mustHaveSoftSkills: [],
  niceToHaveSoftSkills: [],
  customSkills: [],
  languages: [],
  diploma: "",
  title: "",
  description: "",
  talentsNumber: 1,
  daysPerWeek: 1,
  scheduleType: "flexible",
  scheduleDetails: {},
  workMode: "remote",
  employmentType: null,
  weeklyHours: 0,
  weeklyPrice: 0,
  monthlyPrice: 0,
};
