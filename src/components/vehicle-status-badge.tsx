import { Badge } from "@/components/ui/badge";
import { cn, daysUntil, getStatusBadgeClass } from "@/lib/utils";
import { getUrgencyLevel } from "@/lib/garage";

interface VehicleStatusBadgeProps {
  label: string;
  date: string | Date | null | undefined;
  className?: string;
}

export function VehicleStatusBadge({
  label,
  date,
  className,
}: VehicleStatusBadgeProps) {
  const days = daysUntil(date);
  const urgency = getUrgencyLevel(days);

  const text =
    days === null
      ? "Not set"
      : days < 0
      ? `${Math.abs(days)}d overdue`
      : days === 0
      ? "Due today"
      : `${days}d left`;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-normal",
        date ? getStatusBadgeClass(days) : "bg-muted text-muted-foreground",
        className
      )}
    >
      <span className="font-medium">{label}:</span>{" "}
      <span className={urgency === "overdue" ? "font-semibold" : ""}>
        {text}
      </span>
    </Badge>
  );
}
