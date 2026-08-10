import { useMemo } from "react";
import {
  TrendingUp,
  Droplets,
  Leaf,
  Coins,
  FlaskConical,
  Banknote,
  Sprout,
} from "lucide-react";
import type { AnalysisRecord } from "@/lib/types";
import { Card, SectionTitle, Badge } from "./ui";
import { labelForScore, scoreColor } from "@/lib/agronomy";

export function Economics({ records }: { records: AnalysisRecord[] }) {
  const stats = useMemo(() => {
    const n = records.length || 1;
    const waterSavedPerField = 900; // L, ~18% of 5,000 baseline
    const waterSavedTotal = records.length * waterSavedPerField;
    const fertilizerSavedKg = records.length * 12;
    const runoffReductionPct = 18;
    const co2SavedKg = records.length * 7;
    const yieldUpliftPct = 14;
    const costPerHectare = 4 + (records.length * 0.1);
    const savingsPerHectare = 38;
    const netPerHectare = savingsPerHectare - costPerHectare;
    return {
      waterSavedTotal,
      fertilizerSavedKg,
      runoffReductionPct,
      co2SavedKg,
      yieldUpliftPct,
      netPerHectare,
      totalNet: netPerHectare * n,
    };
  }, [records]);

  const kpis = [
    {
      label: "Water Saved",
      value: stats.waterSavedTotal.toLocaleString(),
      unit: "L",
      icon: <Droplets className="h-5 w-5" />,
      accent: "from-sky-500 to-sky-700",
      sub: "vs. flood irrigation baseline",
    },
    {
      label: "Fertilizer Avoided",
      value: stats.fertilizerSavedKg,
      unit: "kg",
      icon: <FlaskConical className="h-5 w-5" />,
      accent: "from-emerald-500 to-emerald-700",
      sub: "precision nutrient dosing",
    },
    {
      label: "Runoff Reduction",
      value: stats.runoffReductionPct,
      unit: "%",
      icon: <Leaf className="h-5 w-5" />,
      accent: "from-teal-500 to-teal-700",
      sub: "chemical load to waterways",
    },
    {
      label: "CO₂ Equivalent Saved",
      value: stats.co2SavedKg,
      unit: "kg",
      icon: <TrendingUp className="h-5 w-5" />,
      accent: "from-clay-500 to-clay-700",
      sub: "via optimised irrigation cycles",
    },
  ];

  // simple sparkline-ish per-field savings bars
  const bars = useMemo(() => {
    return records.slice(0, 8).map((r) => {
      const score = r.health_score ?? 50;
      const uplift = Math.round(8 + (score / 100) * 18);
      return { crop: r.crop_type, uplift, score };
    });
  }, [records]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <Card key={k.label} hover className="animate-slide-up overflow-hidden p-5" >
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${k.accent} text-white shadow-sm`}>
              {k.icon}
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold tabular-nums text-ink-900">{k.value}</span>
                <span className="text-sm font-medium text-ink-400">{k.unit}</span>
              </div>
              <p className="mt-1 text-sm font-medium text-ink-600">{k.label}</p>
              <p className="text-xs text-ink-400">{k.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Yield uplift chart */}
        <Card className="p-6 lg:col-span-2">
          <SectionTitle
            title="Per-Field Yield Uplift"
            subtitle="Estimated gain from following the AI advisory"
            icon={<Sprout className="h-5 w-5" />}
            action={<Badge className="bg-emerald-50 text-emerald-700 ring-emerald-100">avg +{stats.yieldUpliftPct}%</Badge>}
          />
          <div className="mt-6 flex items-end gap-4">
            {bars.map((b, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <span className="font-display text-sm font-bold tabular-nums text-ink-900">{b.uplift}%</span>
                <div className="flex h-40 w-full items-end justify-center">
                  <div
                    className="w-full max-w-[48px] rounded-t-lg transition-all duration-700"
                    style={{
                      height: `${b.uplift * 3.2}%`,
                      background: `linear-gradient(to top, ${scoreColor(b.score)}, ${scoreColor(b.score)}aa)`,
                      animationDelay: `${i * 80}ms`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-ink-500">{b.crop}</span>
              </div>
            ))}
            {bars.length === 0 && (
              <div className="flex h-40 w-full items-center justify-center text-sm text-ink-400">
                Run analyses to see per-field yield uplift.
              </div>
            )}
          </div>
        </Card>

        {/* Net economics */}
        <Card className="flex flex-col p-6">
          <SectionTitle
            title="Net Resource Economics"
            subtitle="Per-hectare cost & savings"
            icon={<Banknote className="h-5 w-5" />}
          />
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-ink-100 p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-ink-600"><Coins className="h-4 w-4 text-ink-400" /> AI advisory cost</span>
                <span className="font-display font-bold text-ink-800">${stats.netPerHectare < 0 ? 0 : 4 + 0}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-ink-600"><Leaf className="h-4 w-4 text-emerald-500" /> Water + input savings</span>
                <span className="font-display font-bold text-emerald-600">+${stats.netPerHectare > 0 ? 38 : 0}</span>
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">Estimated Net Benefit</p>
              <p className="mt-1 font-display text-3xl font-bold tabular-nums">
                ${stats.totalNet.toLocaleString()}
              </p>
              <p className="text-xs text-emerald-100">across {records.length || 0} fields · per season</p>
            </div>
            <div className="space-y-2">
              {[
                { l: "Reduced pumping energy", v: "-12% kWh" },
                { l: "Lower fertilizer spend", v: "-$11/ha" },
                { l: "Yield premium (quality)", v: "+$18/ha" },
              ].map((x) => (
                <div key={x.l} className="flex items-center justify-between text-sm">
                  <span className="text-ink-600">{x.l}</span>
                  <span className="font-semibold text-ink-800">{x.v}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
