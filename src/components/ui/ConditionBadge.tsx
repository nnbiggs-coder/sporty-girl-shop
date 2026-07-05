import type { ConditionTier } from "@/lib/config";
import { cn } from "@/lib/utils";

const tierStyles: Record<ConditionTier, string> = {
  Pristine: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Excellent: "bg-blue-50 text-blue-700 border-blue-200",
  "Very Good": "bg-amber-50 text-amber-700 border-amber-200",
  Good: "bg-gray-50 text-gray-600 border-gray-200",
};

interface ConditionBadgeProps {
  tier: ConditionTier;
  className?: string;
}

export function ConditionBadge({ tier, className }: ConditionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tierStyles[tier],
        className
      )}
    >
      {tier}
    </span>
  );
}
