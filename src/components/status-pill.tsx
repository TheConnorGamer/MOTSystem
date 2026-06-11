import { cn, daysUntil } from "@/lib/utils";

interface StatusPillProps {
  label: string;
  date?: string | Date | null;
  className?: string;
  compact?: boolean;
}

function pillStyle(days: number | null, hasDate: boolean): string {
  if (!hasDate) return "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500";
  if (days === null) return "bg-slate-200 text-slate-600";
  if (days < 0) return "bg-red-500 text-white";
  if (days <= 14) return "bg-orange-500 text-white";
  if (days <= 30) return "bg-amber-400 text-amber-950";
  return "bg-emerald-500 text-white";
}

function pillText(days: number | null, hasDate: boolean): string {
  if (!hasDate) return "add";
  if (days === null) return "—";
  if (days < 0) return `${Math.abs(days)}d`;
  return `${days}d`;
}

export function StatusPill({ label, date, className, compact }: StatusPillProps) {
  const days = daysUntil(date);
  const hasDate = date != null;
  return (
    <div
      className={cn(
        "flex flex-col items-center overflow-hidden rounded-md text-center shadow-sm ring-1 ring-black/5",
        compact ? "min-w-0" : "min-w-[2.75rem]",
        className
      )}
    >
      <span
        className={cn(
          "w-full bg-slate-800 font-bold uppercase tracking-wide text-white",
          compact ? "px-0.5 py-0.5 text-[8px]" : "px-1.5 py-0.5 text-[10px]"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "w-full font-bold uppercase",
          compact ? "px-0.5 py-0.5 text-[9px]" : "px-1.5 py-1 text-xs",
          pillStyle(days, hasDate)
        )}
      >
        {pillText(days, hasDate)}
      </span>
    </div>
  );
}
