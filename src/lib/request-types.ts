export interface RequestFormData {
  // Step 1
  domain: string;
  skills: string[];
  softSkills: string[];
  customSkills: string[];
  languages: { name: string; level: number }[];
  diploma: string;
  // Step 2
  title: string;
  description: string;
  talentsNumber: number;
  daysPerWeek: number;
  scheduleType: "flexible" | "fixed";
  scheduleDetails: Record<string, string[]>; // day -> ["morning", "afternoon"]
  workMode: string;
  // Computed
  weeklyHours: number;
  weeklyPrice: number;
  monthlyPrice: number;
}

export const defaultFormData: RequestFormData = {
  domain: "",
  skills: [],
  softSkills: [],
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
