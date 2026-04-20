export type TalentType = "student" | "graduate";

export interface RequestFormData {
  // Step 1 - Talent
  talentType: TalentType;
  domain: string;
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  mustHaveSoftSkills: string[];
  niceToHaveSoftSkills: string[];
  customSkills: string[];
  languages: { name: string; level: number }[];
  diploma: string;
  // Step 2 - Job
  title: string;
  description: string;
  talentsNumber: number;
  daysPerWeek: number;
  scheduleType: "flexible" | "fixed";
  scheduleDetails: Record<string, string[]>;
  workMode: string;
  // Computed
  weeklyHours: number;
  weeklyPrice: number;
  monthlyPrice: number;
}

export const defaultFormData: RequestFormData = {
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
  weeklyHours: 0,
  weeklyPrice: 0,
  monthlyPrice: 0,
};
