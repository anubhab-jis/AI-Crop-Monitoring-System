import { MapPin, ChevronDown, Info } from "lucide-react";
import { PRESET_ZONES } from "@/lib/zones";
import { cn } from "@/lib/utils";

export function ZoneSelector({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
        <MapPin className="h-3.5 w-3.5" /> Field Zone Profile
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-medium text-ink-800 transition-colors hover:border-emerald-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        >
          {PRESET_ZONES.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-[62%] h-4 w-4 -translate-y-1/2 text-ink-400" />
      </div>
    </div>
  );
}

export function DemoBanner({ zoneName }: { zoneName: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm animate-fade-in">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
        <Info className="h-4 w-4" />
      </span>
      <p className="text-sky-800">
        <span className="font-semibold">Using Demo Field Profile — {zoneName}</span>
        <span className="ml-1 text-sky-600">Geolocation unavailable; preset coordinates active.</span>
      </p>
    </div>
  );
}
