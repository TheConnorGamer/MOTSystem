import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StyledSectionProps {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  gradient?: string;
  children: React.ReactNode;
  className?: string;
}

export function StyledSection({
  id,
  title,
  subtitle,
  icon: Icon,
  gradient = "from-[#003078] to-[#1d70b8]",
  children,
  className,
}: StyledSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 overflow-hidden rounded-2xl border bg-card shadow-sm",
        className
      )}
    >
      <div className={cn("bg-gradient-to-r px-4 py-3", gradient)}>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-white" />}
          <div>
            <h2 className="font-bold text-white">{title}</h2>
            {subtitle && <p className="text-xs text-white/80">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
