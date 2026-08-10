import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "./ui";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  unit,
  icon,
  trend,
  trendDir,
  accent = "emerald",
  delay = 0,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: ReactNode;
  trend?: string;
  trendDir?: "up" | "down" | "neutral";
  accent?: "emerald" | "amber" | "rose" | "sky";
  delay?: number;
}) {
  const accents: Record<string, { bg: string; text: string; ring: string; glow: string }> = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100", glow: "from-emerald-500/10" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100", glow: "from-amber-500/10" },
    rose: { bg: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-100", glow: "from-rose-500/10" },
    sky: { bg: "bg-sky-50", text: "text-sky-600", ring: "ring-sky-100", glow: "from-sky-500/10" },
  };
  const a = accents[accent];
  return (
    <Card hover className="animate-slide-up p-5" >
      <div className="flex items-start justify-between" style={{ animationDelay: `${delay}ms` }}>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl ring-1", a.bg, a.text, a.ring)}>
          {icon}
        </div>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              trendDir === "up" && "bg-emerald-50 text-emerald-700",
              trendDir === "down" && "bg-rose-50 text-rose-700",
              trendDir === "neutral" && "bg-ink-50 text-ink-600"
            )}
          >
            {trendDir === "up" && <ArrowUpRight className="h-3 w-3" />}
            {trendDir === "down" && <ArrowDownRight className="h-3 w-3" />}
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-3xl font-bold tracking-tight text-ink-900">{value}</span>
          {unit && <span className="text-sm font-medium text-ink-400">{unit}</span>}
        </div>
        <p className="mt-1 text-sm font-medium text-ink-500">{label}</p>
      </div>
    </Card>
  );
}
