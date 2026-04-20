import { GraduationCap, UserCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getTalentTypeHint, getTalentTypeLabel, normalizeTalentType } from "@/lib/talent-type";

interface TalentTypeBadgeProps {
  talentType?: string | null;
  large?: boolean;
  showHint?: boolean;
  className?: string;
}

export const TalentTypeBadge = ({ talentType, large = false, showHint = false, className }: TalentTypeBadgeProps) => {
  const normalized = normalizeTalentType(talentType);
  const Icon = normalized === "graduate" ? UserCheck : GraduationCap;

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-2 border-transparent bg-primary text-primary-foreground",
        large ? "px-4 py-2 text-sm font-semibold" : "px-3 py-1 text-xs font-semibold",
        className,
      )}
    >
      <Icon className={large ? "h-4 w-4" : "h-3.5 w-3.5"} />
      <span>{getTalentTypeLabel(normalized)}</span>
      {showHint && <span className="text-primary-foreground/80">• {getTalentTypeHint(normalized)}</span>}
    </Badge>
  );
};