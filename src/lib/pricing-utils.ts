import { HOURLY_RATE } from "@/lib/constants";

export function calculatePricing(params: {
  scheduleType: string;
  scheduleDetails: Record<string, string[]>;
  daysPerWeek: number;
  talentsNumber: number;
  talentType?: "student" | "graduate";
  employmentType?: "full_time" | "part_time" | null;
}) {
  let weeklyHours: number;

  if (params.talentType === "graduate") {
    // Graduate: 8h/day
    const days = params.employmentType === "full_time" ? 5 : Math.max(3, params.daysPerWeek || 3);
    weeklyHours = days * 8 * params.talentsNumber;
  } else {
    // Student: half-day model (4h per half-day)
    const halfDays =
      params.scheduleType === "fixed"
        ? Object.values(params.scheduleDetails).reduce((sum, slots) => sum + slots.length, 0)
        : params.daysPerWeek * 2;
    weeklyHours = halfDays * 4 * params.talentsNumber;
  }

  const weeklyPrice = weeklyHours * HOURLY_RATE;
  const monthlyPrice = weeklyPrice * 4;
  return { weeklyHours, weeklyPrice, monthlyPrice };
}
