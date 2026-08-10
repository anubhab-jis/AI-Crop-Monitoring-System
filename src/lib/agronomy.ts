import type {
  AgentNotes,
  AnalysisReport,
  IrrigationPlan,
  Telemetry,
} from "./types";

export type HealthLabel = "Healthy" | "Moderate Stress" | "Critical";

export function healthBadge(label: HealthLabel) {
  switch (label) {
    case "Healthy":
      return { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-200" };
    case "Moderate Stress":
      return { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", ring: "ring-amber-200" };
    case "Critical":
      return { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", ring: "ring-rose-200" };
  }
}

export function severityBadge(sev: "low" | "moderate" | "high") {
  switch (sev) {
    case "low":
      return { label: "Low", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" };
    case "moderate":
      return { label: "Moderate", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" };
    case "high":
      return { label: "High", bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" };
  }
}

export function labelForScore(score: number): HealthLabel {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "Moderate Stress";
  return "Critical";
}

export function scoreColor(score: number) {
  if (score >= 80) return "#059669";
  if (score >= 60) return "#d97706";
  return "#e11d48";
}

const OPTIMAL_WATER: Record<string, number> = {
  Rice: 8000, Potato: 5000, Cotton: 6500, Wheat: 4500,
};
const SOIL_FACTOR: Record<string, number> = {
  Clay: 1.25, Loam: 1.0, Sandy: 0.7,
};

// Recalculate an irrigation plan for the "what-if" simulator.
export function recalcIrrigation(
  cropType: string,
  soilProfile: string,
  t: Telemetry
): IrrigationPlan {
  const base = OPTIMAL_WATER[cropType] ?? 5500;
  const factor = SOIL_FACTOR[soilProfile] ?? 1.0;
  const dryness = Math.max(0, 50 - t.soilMoisture) / 50;
  const heat = Math.max(0, t.temperature - 20) / 20;
  const adj = 0.6 + dryness * 0.5 + heat * 0.3;
  const liters = Math.round(base * factor * adj);
  return {
    recommendedLitersPerHectare: liters,
    rationale: `${soilProfile} soil (factor ${factor.toFixed(2)}) at ${t.soilMoisture}% moisture and ${t.temperature}°C raises water demand ${(adj * 100 - 100).toFixed(0)}% vs baseline.`,
    schedule: `Split across two evening cycles. Adjust to ${t.humidity < 45 ? "shorter, more frequent" : "standard"} intervals at ${t.humidity}% RH.`,
  };
}

export function recalcHealthScore(t: Telemetry): number {
  const tempStress = Math.max(0, Math.min(1, (t.temperature - 25) / 15));
  const humidStress = Math.max(0, Math.min(1, (60 - t.humidity) / 50));
  const moistureStress = Math.max(0, Math.min(1, (50 - t.soilMoisture) / 50));
  const stress = (tempStress + humidStress + moistureStress) / 3;
  return Math.round(Math.max(20, 95 - stress * 60));
}

// Coerce an unknown edge-function payload into a validated AnalysisReport.
export function coerceReport(raw: unknown): AnalysisReport {
  const r = (raw ?? {}) as Partial<AnalysisReport>;
  const score = typeof r.healthScore === "number" ? r.healthScore : 0;
  const irrigation = (r.irrigation ?? {}) as Partial<IrrigationPlan>;
  const mk = (n: unknown) => {
    const a = (n ?? {}) as Partial<AgentNotes[keyof AgentNotes]>;
    const sev = a.severity === "low" || a.severity === "moderate" || a.severity === "high"
      ? a.severity : "low";
    return {
      finding: typeof a.finding === "string" ? a.finding : "No data.",
      severity: sev,
      recommendation: typeof a.recommendation === "string" ? a.recommendation : "—",
    };
  };
  return {
    healthScore: score,
    healthLabel: r.healthLabel === "Healthy" || r.healthLabel === "Moderate Stress" || r.healthLabel === "Critical"
      ? r.healthLabel : labelForScore(score),
    irrigation: {
      recommendedLitersPerHectare:
        typeof irrigation.recommendedLitersPerHectare === "number"
          ? irrigation.recommendedLitersPerHectare : 0,
      rationale: typeof irrigation.rationale === "string" ? irrigation.rationale : "",
      schedule: typeof irrigation.schedule === "string" ? irrigation.schedule : "",
    },
    pathology: mk(r.pathology),
    climateRisk: mk(r.climateRisk),
    sustainability: mk(r.sustainability),
  };
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}
