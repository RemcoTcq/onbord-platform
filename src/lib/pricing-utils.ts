import { HOURLY_RATE } from "@/lib/constants";

export function calculatePricing(params: {
  scheduleType: string;
  scheduleDetails: Record<string, string[]>;
  daysPerWeek: number;
  talentsNumber: number;
}) {
  const halfDays = params.scheduleType === "fixed"
    ? Object.values(params.scheduleDetails).reduce((sum, slots) => sum + slots.length, 0)
    : params.daysPerWeek * 2;
  const weeklyHours = halfDays * 4 * params.talentsNumber;
  const weeklyPrice = weeklyHours * HOURLY_RATE;
  const monthlyPrice = weeklyPrice * 4;
  return { weeklyHours, weeklyPrice, monthlyPrice };
}
