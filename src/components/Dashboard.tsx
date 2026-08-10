import { useMemo } from "react";
import {
  Layers,
  HeartPulse,
  Droplets,
  AlertTriangle,
  Plus,
  CloudSun,
  FileText,
  ArrowRight,
  Loader2,
} from "lucide-react";
import type { AnalysisRecord, View, WeatherData } from "@/lib/types";
import { Card, Button, Badge, SectionTitle } from "./ui";
import { MetricCard } from "./MetricCard";
import { WeatherPanel } from "./WeatherPanel";
import {
  healthBadge,
  labelForScore,
  relativeTime,
  scoreColor,
} from "@/lib/agronomy";

export function Dashboard({
  records,
  loading,
  onNavigate,
  onViewReport,
  weather,
  weatherLoading,
  weatherError,
  onRefreshWeather,
  farmLocation,
}: {
  records: AnalysisRecord[];
  loading: boolean;
  onNavigate: (v: View) => void;
  onViewReport: (r: AnalysisRecord) => void;
  weather: WeatherData | null;
  weatherLoading: boolean;
  weatherError: string | null;
  onRefreshWeather: () => void;
  farmLocation: string;
}) {
  const metrics = useMemo(() => {
    const total = records.length;
    const scores = records
      .filter((r) => r.health_score != null)
      .map((r) => r.health_score as number);
    const avgHealth = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    // Water saved: assume precision plan saves ~18% of baseline per field (5,000 L avg)
    const waterSaved = total * 900;
    const critical = records.filter(
      (r) => r.health_score != null && r.health_score < 60
    ).length;
    return { total, avgHealth, waterSaved, critical };
  }, [records]);

  const quickActions = [
    {
      title: "Run New Crop Scan",
      desc: "Upload imagery & telemetry for AI analysis",
      icon: Plus,
      accent: "emerald" as const,
      onClick: () => onNavigate("new-analysis"),
    },
    {
      title: "Simulate Weather Stress",
      desc: "Model heat & drought impact on fields",
      icon: CloudSun,
      accent: "amber" as const,
      onClick: () => onNavigate("new-analysis"),
    },
    {
      title: "Export PDF Report",
      desc: "Generate a shareable advisory document",
      icon: FileText,
      accent: "sky" as const,
      onClick: () => window.print(),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Active Fields"
          value={metrics.total}
          icon={<Layers className="h-5 w-5" />}
          trend="+2 this week"
          trendDir="up"
          accent="emerald"
          delay={0}
        />
        <MetricCard
          label="Average Crop Health Index"
          value={metrics.avgHealth}
          unit="%"
          icon={<HeartPulse className="h-5 w-5" />}
          trend={metrics.avgHealth >= 75 ? "Stable" : "Watch"}
          trendDir={metrics.avgHealth >= 75 ? "up" : "down"}
          accent={metrics.avgHealth >= 75 ? "emerald" : "amber"}
          delay={60}
        />
        <MetricCard
          label="Water Saved"
          value={metrics.waterSaved.toLocaleString()}
          unit="L"
          icon={<Droplets className="h-5 w-5" />}
          trend="18% vs flood"
          trendDir="up"
          accent="sky"
          delay={120}
        />
        <MetricCard
          label="Critical Risk Alerts"
          value={metrics.critical}
          icon={<AlertTriangle className="h-5 w-5" />}
          trend={metrics.critical === 0 ? "All clear" : "Action needed"}
          trendDir={metrics.critical === 0 ? "up" : "down"}
          accent={metrics.critical === 0 ? "emerald" : "rose"}
          delay={180}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent analyses */}
        <div className="lg:col-span-2 animate-fade-in">
          <Card className="overflow-hidden">
            <div className="border-b border-ink-100 p-5">
              <SectionTitle
                title="Recent Analyses"
                subtitle="Latest AI field scans across your operation"
                icon={<HeartPulse className="h-5 w-5" />}
                action={
                  <Button variant="ghost" size="sm" onClick={() => onNavigate("new-analysis")}>
                    New scan <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                }
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 bg-ink-50/50 text-xs uppercase tracking-wide text-ink-500">
                    <th className="px-5 py-3 font-semibold">Crop</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Health</th>
                    <th className="px-5 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50">
                  {loading && (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-ink-400">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-500" />
                        <p className="mt-2 text-xs">Loading analyses…</p>
                      </td>
                    </tr>
                  )}
                  {!loading && records.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-ink-400">
                        No analyses yet. Run your first crop scan to see results here.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    records.slice(0, 8).map((r) => {
                      const score = r.health_score ?? 0;
                      const label = labelForScore(score);
                      const badge = healthBadge(label);
                      return (
                        <tr key={r.id} className="group transition-colors hover:bg-emerald-50/30">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <span
                                className="h-9 w-9 shrink-0 rounded-lg ring-1 ring-inset"
                                style={{
                                  background: `linear-gradient(135deg, ${scoreColor(score)}22, ${scoreColor(score)}08)`,
                                  borderColor: scoreColor(score),
                                }}
                              />
                              <div>
                                <div className="font-semibold text-ink-800">{r.crop_type}</div>
                                <div className="text-xs text-ink-400">{r.growth_stage ?? "—"} · {r.soil_type}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-ink-500">
                            <div className="font-medium text-ink-700">{relativeTime(r.created_at)}</div>
                            <div className="text-xs text-ink-400">{new Date(r.created_at).toLocaleDateString()}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge className={`${badge.bg} ${badge.text} ${badge.ring}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                              {label}
                              <span className="ml-1 opacity-70">· {score}%</span>
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => onViewReport(r)}
                              className="opacity-80 group-hover:opacity-100"
                            >
                              View Full Report <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="animate-fade-in space-y-6" style={{ animationDelay: "120ms" }}>
          <Card className="p-5">
            <SectionTitle
              title="Quick Actions"
              subtitle="One-click workflows"
              icon={<Plus className="h-5 w-5" />}
            />
            <div className="mt-4 space-y-3">
              {quickActions.map((a) => {
                const Icon = a.icon;
                const accents = {
                  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100 group-hover:bg-emerald-600 group-hover:text-white",
                  amber: "bg-amber-50 text-amber-600 ring-amber-100 group-hover:bg-amber-600 group-hover:text-white",
                  sky: "bg-sky-50 text-sky-600 ring-sky-100 group-hover:bg-sky-600 group-hover:text-white",
                };
                return (
                  <button
                    key={a.title}
                    onClick={a.onClick}
                    className="group flex w-full items-center gap-4 rounded-xl border border-ink-100 p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-card-hover"
                  >
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 transition-colors ${accents[a.accent]}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold text-ink-800">{a.title}</span>
                      <span className="block text-xs text-ink-500">{a.desc}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-ink-300 transition-all group-hover:translate-x-1 group-hover:text-emerald-600" />
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Weather panel — full width below */}
      <div className="mt-6">
        <WeatherPanel
          weather={weather}
          loading={weatherLoading}
          error={weatherError}
          onRefresh={onRefreshWeather}
          location={farmLocation}
        />
      </div>
    </div>
  );
}
