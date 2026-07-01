import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  danger: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

interface StatusChipProps {
  label: string;
  tone?: StatusTone;
  className?: string;
}

// Generic status pill for any status string (estimate status, order
// status, etc). Callers map their domain status to a tone; this
// component doesn't know about any specific business status set.
export function StatusChip({
  label,
  tone = "neutral",
  className,
}: StatusChipProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent font-medium",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {label}
    </Badge>
  );
}
