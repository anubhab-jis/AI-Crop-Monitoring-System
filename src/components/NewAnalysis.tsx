import { useMemo, useState } from "react";
import {
  ScanSearch,
  Sprout,
  Thermometer,
  Droplet,
  Wind,
  Gauge,
  Sparkles,
  Loader2,
  ArrowRight,
  Wand2,
} from "lucide-react";
import type { Telemetry } from "@/lib/types";
import { Card, Button, SectionTitle } from "./ui";
import { DropZone } from "./DropZone";
import { ZoneSelector, DemoBanner } from "./ZoneSelector";
import { getZone } from "@/lib/zones";
import { cn } from "@/lib/utils";

const CROPS = ["Rice", "Potato", "Cotton", "Wheat"];
const STAGES = ["Seedling", "Vegetative", "Flowering", "Maturation"];
const SOILS = ["Clay", "Loam", "Sandy"];

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-medium text-ink-800 transition-colors hover:border-emerald-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
      </svg>
    </div>
  );
}

function NumberSlider({
  label,
  icon,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50/40 p-3.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
          {icon} {label}
        </span>
        <span className="font-display text-base font-bold text-ink-900">
          {value}<span className="ml-0.5 text-xs font-medium text-ink-400">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full"
      />
      <div className="mt-1 flex justify-between text-[10px] font-medium text-ink-400">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

export function NewAnalysis({
  onRun,
  running,
}: {
  onRun: (params: {
    cropType: string;
    growthStage: string;
    soilProfile: string;
    telemetry: Telemetry;
    imageData: string | null;
    imageMime: string | null;
  }) => void;
  running: boolean;
}) {
  const [crop, setCrop] = useState("Wheat");
  const [stage, setStage] = useState("Flowering");
  const [soil, setSoil] = useState("Loam");
  const [temperature, setTemperature] = useState(29);
  const [humidity, setHumidity] = useState(48);
  const [soilMoisture, setSoilMoisture] = useState(42);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState("punjab-a");
  const [demoFlash, setDemoFlash] = useState(false);

  const zone = getZone(zoneId);

  const telemetry = useMemo(
    () => ({ temperature, humidity, soilMoisture }),
    [temperature, humidity, soilMoisture]
  );

  const canRun = crop && soil && !running;

  const loadDemo = () => {
    setCrop("Wheat");
    setStage("Vegetative");
    setSoil("Loam");
    setTemperature(28);
    setHumidity(65);
    setSoilMoisture(45);
    setDemoFlash(true);
    setTimeout(() => setDemoFlash(false), 1200);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 animate-fade-in">
      {/* Left: upload + context */}
      <div className="lg:col-span-3 space-y-6">
        <DemoBanner zoneName={zone.shortName} />

        <Card className="p-5">
          <SectionTitle
            title="Multimodal Upload"
            subtitle="Upload crop / soil imagery for visual AI analysis"
            icon={<ScanSearch className="h-5 w-5" />}
          />
          <div className="mt-4">
            <DropZone
              onImage={(d, m) => {
                setImageData(d);
                setImageMime(m);
              }}
              imageData={imageData}
              imageMime={imageMime}
              onClear={() => {
                setImageData(null);
                setImageMime(null);
              }}
            />
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle
            title="Context Parameters"
            subtitle="Crop, growth stage & soil profile"
            icon={<Sprout className="h-5 w-5" />}
          />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Crop Type" icon={<Sprout className="h-3.5 w-3.5" />}>
              <Select value={crop} onChange={setCrop} options={CROPS} />
            </Field>
            <Field label="Growth Stage" icon={<Gauge className="h-3.5 w-3.5" />}>
              <Select value={stage} onChange={setStage} options={STAGES} />
            </Field>
            <Field label="Soil Profile" icon={<Droplet className="h-3.5 w-3.5" />}>
              <Select value={soil} onChange={setSoil} options={SOILS} />
            </Field>
          </div>

          <div className="mt-5">
            <ZoneSelector value={zoneId} onChange={setZoneId} />
          </div>
        </Card>
      </div>

      {/* Right: telemetry + run */}
      <div className="lg:col-span-2 space-y-6">
        <button
          onClick={loadDemo}
          className={cn(
            "group flex w-full items-center justify-center gap-2.5 rounded-xl border-2 border-dashed px-4 py-3.5 text-sm font-bold transition-all duration-200",
            demoFlash
              ? "border-emerald-400 bg-emerald-50 text-emerald-700 scale-[1.01]"
              : "border-emerald-300 bg-gradient-to-r from-emerald-50 to-sky-50 text-emerald-700 hover:border-emerald-500 hover:shadow-glow"
          )}
        >
          <Wand2 className={cn("h-4.5 w-4.5 transition-transform", demoFlash ? "rotate-12" : "group-hover:scale-110")} />
          {demoFlash ? "Demo Sample Loaded!" : "Load Demo Sample"}
        </button>

        <Card className="p-5">
          <SectionTitle
            title="Environmental Telemetry"
            subtitle="Automated or manual sensor input"
            icon={<Thermometer className="h-5 w-5" />}
          />
          <div className="mt-4 space-y-3">
            <NumberSlider
              label="Temperature"
              icon={<Thermometer className="h-3.5 w-3.5" />}
              value={temperature}
              min={5}
              max={45}
              unit="°C"
              onChange={setTemperature}
            />
            <NumberSlider
              label="Relative Humidity"
              icon={<Wind className="h-3.5 w-3.5" />}
              value={humidity}
              min={10}
              max={95}
              unit="%"
              onChange={setHumidity}
            />
            <NumberSlider
              label="Soil Moisture Index"
              icon={<Droplet className="h-3.5 w-3.5" />}
              value={soilMoisture}
              min={0}
              max={100}
              unit="%"
              onChange={setSoilMoisture}
            />
          </div>
        </Card>

        <Card className={cn("p-5 transition-all", canRun && "shadow-glow")}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-sm font-bold text-ink-900">Run AI Analysis</p>
              <p className="text-xs text-ink-500">
                {imageData ? "Image + telemetry ready" : "Telemetry only — add an image for full multimodal"}
              </p>
            </div>
          </div>
          <Button
            onClick={() =>
              onRun({ cropType: crop, growthStage: stage, soilProfile: soil, telemetry, imageData, imageMime })
            }
            disabled={!canRun}
            size="lg"
            className="mt-4 w-full"
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing with Gemini…
              </>
            ) : (
              <>
                Analyze Field <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
          <p className="mt-3 text-center text-[11px] text-ink-400">
            Image + telemetry are passed to the Gemini multimodal API with an expert agronomist prompt
          </p>
        </Card>
      </div>
    </div>
  );
}

