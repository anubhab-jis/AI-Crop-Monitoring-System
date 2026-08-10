import { useMemo, useState } from "react";
import {
  HeartPulse,
  Droplets,
  Bug,
  CloudSun,
  Leaf,
  SlidersHorizontal,
  RotateCcw,
  ArrowLeft,
  Thermometer,
  Wind,
  Gauge,
  Sun,
  Save,
  Loader2,
  Sparkles,
  Activity,
} from "lucide-react";
import type { AnalysisRecord, AnalysisReport, Telemetry } from "@/lib/types";
import { Card, Button, Badge, SectionTitle } from "./ui";
import { HealthGauge } from "./HealthGauge";
import {
  recalcIrrigation,
  recalcHealthScore,
  healthBadge,
  severityBadge,
  scoreColor,
  labelForScore,
} from "@/lib/agronomy";
import { cn } from "@/lib/utils";

function AgentCard({
  title,
  agent,
  icon,
  accent,
  note,
}: {
  title: string;
  agent: string;
  icon: React.ReactNode;
  accent: "emerald" | "amber" | "sky";
  note: { finding: string; severity: "low" | "moderate" | "high"; recommendation: string };
}) {
  const accents = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100", bar: "bg-emerald-500" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100", bar: "bg-amber-500" },
    sky: { bg: "bg-sky-50", text: "text-sky-600", ring: "ring-sky-100", bar: "bg-sky-500" },
  };
  const a = accents[accent];
  const sev = severityBadge(note.severity);
  return (
    <Card hover className="relative overflow-hidden p-5 animate-scale-in">
      <span className={cn("absolute left-0 top-0 h-full w-1", a.bar)} />
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl ring-1", a.bg, a.text, a.ring)}>
            {icon}
          </span>
          <div>
            <h3 className="font-display text-sm font-bold text-ink-900">{title}</h3>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{agent}</p>
          </div>
        </div>
        <Badge className={cn(sev.bg, sev.text, "ring-ink-100")}>
          <span className={cn("h-1.5 w-1.5 rounded-full", sev.dot)} />
          {sev.label} risk
        </Badge>
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Finding</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-700">{note.finding}</p>
        </div>
        <div className="rounded-lg bg-ink-50/60 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Recommendation</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-700">{note.recommendation}</p>
        </div>
      </div>
    </Card>
  );
}

export function ResultsReport({
  report,
  record,
  telemetry,
  cropType,
  soilProfile,
  onBack,
  onSave,
  saving,
  saved,
}: {
  report: AnalysisReport;
  record: AnalysisRecord | null;
  telemetry: Telemetry;
  cropType: string;
  soilProfile: string;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  // What-if simulator state
  const [simTemp, setSimTemp] = useState(telemetry.temperature);
  const [simHumidity, setSimHumidity] = useState(telemetry.humidity);
  const [simMoisture, setSimMoisture] = useState(telemetry.soilMoisture);

  const simTelemetry: Telemetry = useMemo(
    () => ({ temperature: simTemp, humidity: simHumidity, soilMoisture: simMoisture }),
    [simTemp, simHumidity, simMoisture]
  );
  const simIrrigation = useMemo(
    () => recalcIrrigation(cropType, soilProfile, simTelemetry),
    [cropType, soilProfile, simTelemetry]
  );
  const simScore = useMemo(() => recalcHealthScore(simTelemetry), [simTelemetry]);
  const delta = simIrrigation.recommendedLitersPerHectare - report.irrigation.recommendedLitersPerHectare;

  const resetSim = () => {
    setSimTemp(telemetry.temperature);
    setSimHumidity(telemetry.humidity);
    setSimMoisture(telemetry.soilMoisture);
  };

  const badge = healthBadge(report.healthLabel);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="font-display text-xl font-bold text-ink-900">Multi-Agent Advisory Report</h1>
            <p className="text-sm text-ink-500">
              {cropType} · {soilProfile} soil ·{" "}
              {record?.growth_stage ?? "—"} stage
            </p>
          </div>
        </div>
        <Button onClick={onSave} disabled={saving || saved} size="md">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : saved ? (
            <>
              <Leaf className="h-4 w-4" /> Saved to records
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Save analysis
            </>
          )}
        </Button>
      </div>

      {/* Top: gauge + irrigation + telemetry snapshot */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 animate-fade-in" style={{ animationDelay: "80ms" }}>
        {/* AI Health Score */}
        <Card className="flex flex-col items-center justify-center p-6">
          <SectionTitle
            title="AI Health Score"
            subtitle="Overall physiological vitality"
            icon={<HeartPulse className="h-5 w-5" />}
          />
          <div className="mt-4">
            <HealthGauge score={report.healthScore} label={report.healthLabel} />
          </div>
          <Badge className={cn(badge.bg, badge.text, badge.ring, "mt-4")}>
            <span className={cn("h-1.5 w-1.5 rounded-full", badge.dot)} />
            {report.healthLabel}
          </Badge>
        </Card>

        {/* Precision Irrigation Plan */}
        <Card className="p-6 lg:col-span-2">
          <SectionTitle
            title="Precision Irrigation Plan"
            subtitle="Optimized against current weather variables"
            icon={<Droplets className="h-5 w-5" />}
          />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 p-4 text-white">
              <Droplets className="h-5 w-5 text-sky-100" />
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-sky-100">Recommended Volume</p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                {report.irrigation.recommendedLitersPerHectare.toLocaleString()}
              </p>
              <p className="text-xs text-sky-100">Liters / Hectare</p>
            </div>
            <div className="rounded-xl border border-ink-100 bg-ink-50/40 p-4">
              <Gauge className="h-5 w-5 text-ink-400" />
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Current Demand</p>
              <p className="mt-1 font-display text-2xl font-bold text-ink-900">
                {delta >= 0 ? "+" : ""}{Math.round((delta / (report.irrigation.recommendedLitersPerHectare || 1)) * 100)}%
              </p>
              <p className="text-xs text-ink-400">vs. baseline</p>
            </div>
            <div className="rounded-xl border border-ink-100 bg-ink-50/40 p-4">
              <Activity className="h-5 w-5 text-ink-400" />
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Soil Profile</p>
              <p className="mt-1 font-display text-2xl font-bold text-ink-900">{soilProfile}</p>
              <p className="text-xs text-ink-400">retention factor</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-ink-100 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Rationale</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-700">{report.irrigation.rationale}</p>
            </div>
            <div className="rounded-xl border border-ink-100 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Application Schedule</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-700">{report.irrigation.schedule}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Multi-agent insights */}
      <div className="animate-fade-in" style={{ animationDelay: "160ms" }}>
        <SectionTitle
          title="Agentic Risk & Prescriptive Notes"
          subtitle="Three specialised AI agents cross-analyse your field"
          icon={<Sparkles className="h-5 w-5" />}
        />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <AgentCard
            title="Pathology Agent"
            agent="Disease & nutrient detection"
            icon={<Bug className="h-5 w-5" />}
            accent={report.pathology.severity === "high" ? "amber" : "emerald"}
            note={report.pathology}
          />
          <AgentCard
            title="Climate Risk Agent"
            agent="Thermal & moisture forecast"
            icon={<CloudSun className="h-5 w-5" />}
            accent={report.climateRisk.severity === "high" ? "amber" : "sky"}
            note={report.climateRisk}
          />
          <AgentCard
            title="Sustainability Agent"
            agent="Runoff & water-waste reduction"
            icon={<Leaf className="h-5 w-5" />}
            accent="emerald"
            note={report.sustainability}
          />
        </div>
      </div>

      {/* What-If simulator */}
      <Card className="overflow-hidden animate-fade-in" >
        <div className="border-b border-ink-100 bg-gradient-to-br from-emerald-50/60 to-white p-5">
          <SectionTitle
            title='What-If Climate Scenario Simulator'
            subtitle="Drag the sliders — irrigation recalculates in real time"
            icon={<SlidersHorizontal className="h-5 w-5" />}
            action={
              <Button variant="ghost" size="sm" onClick={resetSim}>
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </Button>
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2">
          {/* Sliders */}
          <div className="space-y-4">
            <SimSlider
              label="Temperature"
              icon={<Thermometer className="h-4 w-4" />}
              value={simTemp}
              min={5}
              max={45}
              unit="°C"
              onChange={setSimTemp}
              accent="rose"
            />
            <SimSlider
              label="Relative Humidity"
              icon={<Wind className="h-4 w-4" />}
              value={simHumidity}
              min={10}
              max={95}
              unit="%"
              onChange={setSimHumidity}
              accent="sky"
            />
            <SimSlider
              label="Soil Moisture"
              icon={<Droplets className="h-4 w-4" />}
              value={simMoisture}
              min={0}
              max={100}
              unit="%"
              onChange={setSimMoisture}
              accent="emerald"
            />
          </div>

          {/* Live recalc */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-ink-100 bg-ink-50/40 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">Simulated Health</span>
                <span className="font-display text-3xl font-bold tabular-nums" style={{ color: scoreColor(simScore) }}>
                  {simScore}
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${simScore}%`, background: scoreColor(simScore) }}
                />
              </div>
              <p className="mt-2 text-xs text-ink-500">
                Status: <span className="font-semibold" style={{ color: scoreColor(simScore) }}>{labelForScore(simScore)}</span>
              </p>
            </div>

            <div className="rounded-2xl border border-ink-100 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">Recalculated Irrigation</span>
                <span className="font-display text-3xl font-bold tabular-nums text-ink-900">
                  {simIrrigation.recommendedLitersPerHectare.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-ink-400">Liters / Hectare</p>
              <div className="mt-3 flex items-center gap-2">
                {delta === 0 ? (
                  <Badge className="bg-ink-50 text-ink-600 ring-ink-100">No change</Badge>
                ) : (
                  <Badge className={delta > 0 ? "bg-amber-50 text-amber-700 ring-amber-100" : "bg-emerald-50 text-emerald-700 ring-emerald-100"}>
                    {delta > 0 ? "+" : ""}{delta.toLocaleString()} L/ha vs original
                  </Badge>
                )}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ink-500">{simIrrigation.rationale}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-ink-100 bg-emerald-50/30 px-5 py-3">
          <Sun className="h-4 w-4 text-emerald-600" />
          <p className="text-xs text-ink-600">
            Push the temperature up or dry the soil out — watch the irrigation plan and health score respond instantly.
          </p>
        </div>
      </Card>
    </div>
  );
}

function SimSlider({
  label,
  icon,
  value,
  min,
  max,
  unit,
  onChange,
  accent,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
  accent: "rose" | "sky" | "emerald";
}) {
  const accents = {
    rose: "#e11d48",
    sky: "#0284c7",
    emerald: "#059669",
  };
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink-700">
          {icon} {label}
        </span>
        <span className="font-display text-xl font-bold tabular-nums text-ink-900">
          {value}<span className="ml-0.5 text-sm font-medium text-ink-400">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full"
        style={{
          background: `linear-gradient(to right, ${accents[accent]} ${pct}%, #d4d9e1 ${pct}%)`,
        }}
      />
      <div className="mt-1 flex justify-between text-[10px] font-medium text-ink-400">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}
