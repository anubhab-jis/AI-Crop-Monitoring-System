import { useMemo, useState } from "react";
import { Map, MapPin, Droplets, Sprout, Layers, Navigation, Crosshair } from "lucide-react";
import type { AnalysisRecord } from "@/lib/types";
import { Card, SectionTitle, Badge } from "./ui";
import { LeafletFieldMap } from "./LeafletFieldMap";
import { ZoneSelector, DemoBanner } from "./ZoneSelector";
import { getZone, DEFAULT_ZONE } from "@/lib/zones";
import { labelForScore, scoreColor, healthBadge } from "@/lib/agronomy";
import { cn } from "@/lib/utils";

interface Zone {
  id: string;
  name: string;
  crop: string;
  soil: string;
  score: number;
  hectares: number;
  telemetry: { soilMoisture: number; temperature: number; humidity: number };
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function buildZones(records: AnalysisRecord[]): Zone[] {
  const letters = ["A", "B", "C", "D", "E", "F"];
  return records.slice(0, 6).map((r, i) => {
    const seed = hash(r.id ?? `${i}`);
    const tele = r.telemetry_json ?? { temperature: 25, humidity: 50, soilMoisture: 45 };
    return {
      id: r.id,
      name: `Zone ${letters[i] ?? i + 1}`,
      crop: r.crop_type,
      soil: r.soil_type,
      score: r.health_score ?? 0,
      hectares: 4 + (seed % 9),
      telemetry: {
        soilMoisture: tele.soilMoisture,
        temperature: tele.temperature,
        humidity: tele.humidity,
      },
    };
  });
}

export function FieldMap({ records }: { records: AnalysisRecord[] }) {
  const zones = useMemo(() => buildZones(records), [records]);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState(DEFAULT_ZONE.id);
  const zone = getZone(zoneId);

  const avgScore = zones.length
    ? Math.round(zones.reduce((a, z) => a + z.score, 0) / zones.length)
    : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <ZoneSelector value={zoneId} onChange={setZoneId} />
        <DemoBanner zoneName={zone.shortName} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Interactive Leaflet map */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-end justify-between gap-3">
            <SectionTitle
              title="Field Map"
              subtitle="Interactive GPS map of farm zones & live telemetry"
              icon={<Map className="h-5 w-5" />}
              action={
                <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-100">
                  <Navigation className="h-3 w-3" /> {zones.length} zones · avg {avgScore}%
                </Badge>
              }
            />
          </div>
          <LeafletFieldMap records={records} focusZoneId={focusId} center={zone.center} zoneLabel={zone.region} />
        </div>

        {/* Zone list with telemetry */}
        <div>
        <Card className="h-full p-5">
          <SectionTitle
            title="Zone Telemetry"
            subtitle="Tap a zone to fly to it on the map"
            icon={<MapPin className="h-5 w-5" />}
          />
          <div className="mt-4 space-y-3">
            {zones.map((z) => {
              const badge = healthBadge(labelForScore(z.score));
              const active = focusId === z.id;
              return (
                <button
                  key={z.id}
                  onClick={() => setFocusId(active ? null : z.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                    active
                      ? "border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-200"
                      : "border-ink-100 hover:bg-emerald-50/30"
                  )}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold ring-1 ring-inset"
                    style={{ background: `${scoreColor(z.score)}22`, color: scoreColor(z.score), borderColor: scoreColor(z.score) }}
                  >
                    {z.name.replace("Zone ", "")}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink-800">{z.crop}</span>
                      <span className="font-display font-bold" style={{ color: scoreColor(z.score) }}>
                        {z.score}%
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-500">
                      <span className="flex items-center gap-1"><Droplets className="h-3 w-3" /> {z.telemetry.soilMoisture}%</span>
                      <span className="flex items-center gap-1"><Sprout className="h-3 w-3" /> {z.soil}</span>
                      <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {z.hectares}ha</span>
                    </div>
                  </div>
                  {active && <Crosshair className="h-4 w-4 text-emerald-600" />}
                  {!active && <span className={cn("h-2 w-2 rounded-full", badge.dot)} />}
                </button>
              );
            })}
            {zones.length === 0 && (
              <p className="py-8 text-center text-sm text-ink-400">No zones to display. Run an analysis first.</p>
            )}
          </div>
        </Card>
      </div>
      </div>
    </div>
  );
}
