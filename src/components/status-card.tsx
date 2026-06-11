import { CheckCircle2, AlertTriangle, ChevronRight } from "lucide-react";
import { cn, daysUntil, formatDate } from "@/lib/utils";

interface StatusCardProps {
  title: string;
  date?: string | Date | null | undefined;
  onClick?: () => void;
  href?: string;
  unknown?: boolean;
  unknownHint?: string;
}

export function StatusCard({
  title,
  date,
  onClick,
  href,
  unknown,
  unknownHint,
}: StatusCardProps) {
  const days = daysUntil(date);
  const isOk = !unknown && days !== null && days > 14;
  const isUrgent = !unknown && days !== null && days <= 14 && days >= 0;
  const isOverdue = !unknown && days !== null && days < 0;
  const isUnknown = unknown || days === null;

  const inner = (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl p-4 text-white shadow-md transition-transform hover:scale-[1.01]",
        isOk && "bg-gradient-to-r from-emerald-500 to-emerald-600",
        isUrgent && "bg-gradient-to-r from-amber-500 to-orange-500",
        isOverdue && "bg-gradient-to-r from-red-500 to-red-600",
        isUnknown && !isOverdue && "bg-gradient-to-r from-slate-500 to-slate-600"
      )}
    >
      <div className="rounded-full bg-white/20 p-2">
        {isOk ? (
          <CheckCircle2 className="h-6 w-6" />
        ) : (
          <AlertTriangle className="h-6 w-6" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold">{title}</p>
        {unknown ? (
          <p className="text-sm text-white/90">
            {unknownHint || "Not available from DVSA — check GOV.UK"}
          </p>
        ) : date ? (
          <p className="text-sm text-white/90">
            {days !== null && days < 0
              ? `Overdue · was ${formatDate(date)}`
              : `Expires ${formatDate(date)}${days !== null ? ` · ${days} days` : ""}`}
          </p>
        ) : (
          <p className="text-sm text-white/80">No date set — tap to add</p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 opacity-70" />
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left">
        {inner}
      </button>
    );
  }
  return inner;
}
