import { useEffect, useMemo, useRef, useState } from "react";
import { Fragment } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Popup,
  Tooltip,
  Polyline,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { Navigation, Radio, Satellite, Pause, Play, Gauge } from "lucide-react";
import type { AnalysisRecord } from "@/lib/types";
import { labelForScore, scoreColor } from "@/lib/agronomy";

interface ZoneFeature {
  id: string;
  name: string;
  crop: string;
  soil: string;
  score: number;
  hectares: number;
  center: [number, number];
  polygon: [number, number][];
  telemetry: {
    soilMoisture: number;
    temperature: number;
    humidity: number;
  };
}

// Agricultural region: Central Valley, California.
const FARM_CENTER: [number, number] = [36.7378, -119.7871];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Stable per-zone offset around the given map center.
function zoneGeometry(seed: number, idx: number, origin: [number, number]): { center: [number, number]; polygon: [number, number][] } {
  const angle = (idx * 137.5 * Math.PI) / 180;
  const radius = 0.018 + (seed % 7) * 0.004;
  const cx = origin[0] + Math.cos(angle) * radius;
  const cy = origin[1] + Math.sin(angle) * radius;
  const w = 0.006 + (seed % 4) * 0.0015;
  const h = 0.005 + (seed % 3) * 0.0015;
  const rot = ((seed % 90) - 45) * (Math.PI / 180);
  const corners: [number, number][] = [
    [-w, -h], [w, -h], [w, h], [-w, h],
  ];
  const polygon = corners.map(([dx, dy]) => {
    const rx = dx * Math.cos(rot) - dy * Math.sin(rot);
    const ry = dx * Math.sin(rot) + dy * Math.cos(rot);
    return [cx + rx, cy + ry] as [number, number];
  });
  return { center: [cx, cy], polygon };
}

function buildZones(records: AnalysisRecord[], origin: [number, number]): ZoneFeature[] {
  const letters = ["A", "B", "C", "D", "E", "F"];
  return records.slice(0, 6).map((r, i) => {
    const seed = hash(r.id ?? `${i}`);
    const geo = zoneGeometry(seed, i, origin);
    const tele = r.telemetry_json ?? { temperature: 25, humidity: 50, soilMoisture: 45 };
    return {
      id: r.id,
      name: `Zone ${letters[i] ?? i + 1}`,
      crop: r.crop_type,
      soil: r.soil_type,
      score: r.health_score ?? 0,
      hectares: 4 + (seed % 9),
      center: geo.center,
      polygon: geo.polygon,
      telemetry: {
        soilMoisture: tele.soilMoisture,
        temperature: tele.temperature,
        humidity: tele.humidity,
      },
    };
  });
}

// GPS-tracker-style pulsing DivIcon for each zone.
function gpsIcon(score: number, label: string) {
  const color = scoreColor(score);
  return L.divIcon({
    className: "farmiq-gps-marker",
    html: `
      <div style="position:relative;width:34px;height:34px;">
        <span style="position:absolute;inset:0;border-radius:9999px;background:${color};opacity:0.25;animation:farmiq-ping 2s ease-out infinite;"></span>
        <span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:16px;height:16px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 1px 6px ${color}aa;"></span>
        <span style="position:absolute;left:50%;top:calc(50% + 16px);transform:translateX(-50%);font-size:10px;font-weight:700;color:#1a1e26;background:#fff;padding:1px 5px;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,0.15);white-space:nowrap;">${label}</span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

// Rover marker: pulsing dot + rotating heading arrow + label.
function roverIcon(heading: number) {
  return L.divIcon({
    className: "farmiq-gps-marker",
    html: `
      <div style="position:relative;width:44px;height:44px;">
        <span style="position:absolute;inset:0;border-radius:9999px;background:#059669;opacity:0.18;animation:farmiq-ping 1.5s ease-out infinite;"></span>
        <span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:20px;height:20px;border-radius:9999px;background:#059669;border:3px solid #fff;box-shadow:0 2px 10px rgba(5,150,105,0.6);"></span>
        <span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(${heading}deg);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:14px solid #fff;transform-origin:50% 100%;margin-top:-18px;"></span>
        <span style="position:absolute;left:50%;top:calc(50% + 18px);transform:translateX(-50%);font-size:9px;font-weight:800;color:#fff;background:#059669;padding:1px 6px;border-radius:6px;white-space:nowrap;letter-spacing:0.05em;">ROVER-01</span>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

// Bearing between two lat/lng points, in degrees [0, 360).
function bearing(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const dLng = toRad(b[1] - a[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function compass(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

function FlyToZone({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, 13, { duration: 0.8 });
    }
  }, [target, map]);
  return null;
}

export function LeafletFieldMap({
  records,
  focusZoneId,
  center = FARM_CENTER,
  zoneLabel,
}: {
  records: AnalysisRecord[];
  focusZoneId?: string | null;
  center?: [number, number];
  zoneLabel?: string;
}) {
  const zones = useMemo(() => buildZones(records, center), [records, center]);
  const focus = useMemo(
    () => zones.find((z) => z.id === focusZoneId)?.center ?? null,
    [zones, focusZoneId]
  );

  const avgScore = zones.length
    ? Math.round(zones.reduce((a, z) => a + z.score, 0) / zones.length)
    : 0;

  // ---------- GPS Rover tracker ----------
  const patrolPath = useMemo<[number, number][]>(() => {
    if (zones.length >= 2) return zones.map((z) => z.center);
    // Default patrol loop around center if no zones.
    const r = 0.02;
    return [
      [center[0] - r, center[1] - r],
      [center[0] - r, center[1] + r],
      [center[0] + r, center[1] + r],
      [center[0] + r, center[1] - r],
    ];
  }, [zones, center]);

  const [roverPos, setRoverPos] = useState<[number, number]>(patrolPath[0]);
  const [trail, setTrail] = useState<[number, number][]>([]);
  const [active, setActive] = useState(true);
  const [speed, setSpeed] = useState(8.4);
  const segRef = useRef(0);
  const progRef = useRef(0);

  // Reset rover when path changes (zone switch).
  useEffect(() => {
    segRef.current = 0;
    progRef.current = 0;
    setRoverPos(patrolPath[0]);
    setTrail([patrolPath[0]]);
  }, [patrolPath]);

  useEffect(() => {
    if (!active || patrolPath.length < 2) return;
    const STEP = 0.008;
    const id = setInterval(() => {
      progRef.current += STEP;
      if (progRef.current >= 1) {
        progRef.current = 0;
        segRef.current = (segRef.current + 1) % patrolPath.length;
      }
      const seg = segRef.current;
      const next = (seg + 1) % patrolPath.length;
      const a = patrolPath[seg];
      const b = patrolPath[next];
      const pos: [number, number] = [
        a[0] + (b[0] - a[0]) * progRef.current,
        a[1] + (b[1] - a[1]) * progRef.current,
      ];
      setRoverPos(pos);
      setTrail((prev) => [...prev.slice(-49), pos]);
      setSpeed(7.5 + Math.sin(Date.now() / 2000) * 1.8 + Math.random() * 0.6);
    }, 150);
    return () => clearInterval(id);
  }, [active, patrolPath]);

  const heading = useMemo(() => {
    if (trail.length < 2) return 0;
    return bearing(trail[trail.length - 2], roverPos);
  }, [trail, roverPos]);

  const distanceTraveled = useMemo(() => {
    if (trail.length < 2) return 0;
    let d = 0;
    for (let i = 1; i < trail.length; i++) {
      d += Math.sqrt(
        Math.pow((trail[i][0] - trail[i - 1][0]) * 111, 2) +
          Math.pow((trail[i][1] - trail[i - 1][1]) * 111 * Math.cos((trail[i][0] * Math.PI) / 180), 2)
      );
    }
    return d;
  }, [trail]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
      {/* GPS status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 bg-ink-50/50 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink-700">
          <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-600" />
          GPS Tracker · Live
        </div>
        <div className="flex items-center gap-3 text-xs text-ink-500">
          <span className="flex items-center gap-1"><Navigation className="h-3 w-3 text-emerald-600" /> {zones.length} zones</span>
          <span>·</span>
          <span>avg health <span className="font-bold text-ink-700">{avgScore}%</span></span>
          <span>·</span>
          <span>{zoneLabel ?? "Central Valley, CA"}</span>
        </div>
      </div>

      <div className="relative">
        <MapContainer
          center={center}
          zoom={12}
          scrollWheelZoom={false}
          style={{ height: "520px", width: "100%", background: "#e8efe9" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {zones.map((z) => {
            const color = scoreColor(z.score);
            const label = labelForScore(z.score);
            return (
              <Fragment key={z.id}>
                <Polygon
                  positions={z.polygon}
                  pathOptions={{
                    color,
                    weight: 2,
                    fillColor: color,
                    fillOpacity: 0.18,
                  }}
                >
                  <Popup>
                    <ZonePopup zone={z} />
                  </Popup>
                  <Tooltip sticky>{z.name}</Tooltip>
                </Polygon>
                <Marker position={z.center} icon={gpsIcon(z.score, z.name)}>
                  <Popup>
                    <ZonePopup zone={z} />
                  </Popup>
                </Marker>
              </Fragment>
            );
          })}

          {/* Rover breadcrumb trail */}
          {trail.length > 1 && (
            <Polyline
              positions={trail}
              pathOptions={{ color: "#059669", weight: 3, opacity: 0.5, dashArray: "6 4" }}
            />
          )}

          {/* Scanning radius */}
          <Circle
            center={roverPos}
            radius={900}
            pathOptions={{ color: "#059669", weight: 1, fillColor: "#059669", fillOpacity: 0.06 }}
          />

          {/* Rover marker */}
          <Marker position={roverPos} icon={roverIcon(heading)} />

          <FlyToZone target={focus} />
        </MapContainer>

        {/* GPS HUD — bottom-left overlay */}
        <div className="pointer-events-none absolute bottom-4 left-4 z-10 w-64">
          <div className="pointer-events-auto rounded-xl border border-emerald-200/30 bg-ink-900/85 p-3.5 text-white shadow-xl backdrop-blur-md animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-xs font-bold tracking-wider">GPS ROVER-01</span>
              </div>
              <button
                onClick={() => setActive((v) => !v)}
                className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[10px] font-semibold transition-colors hover:bg-white/20"
              >
                {active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                {active ? "Pause" : "Play"}
              </button>
            </div>

            <div className="mt-3 space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-emerald-300/70">LAT</span>
                <span className="tabular-nums">{roverPos[0].toFixed(5)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-300/70">LNG</span>
                <span className="tabular-nums">{roverPos[1].toFixed(5)}°</span>
              </div>
            </div>

            <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-white/10 pt-2.5">
              <div>
                <div className="flex items-center gap-1 text-[9px] uppercase text-emerald-300/60">
                  <Gauge className="h-2.5 w-2.5" /> Spd
                </div>
                <div className="font-mono text-sm font-bold tabular-nums">{speed.toFixed(1)}</div>
                <div className="text-[8px] text-white/40">km/h</div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-[9px] uppercase text-emerald-300/60">
                  <Navigation className="h-2.5 w-2.5" /> Hdg
                </div>
                <div className="font-mono text-sm font-bold tabular-nums">{Math.round(heading)}°</div>
                <div className="text-[8px] text-white/40">{compass(heading)}</div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-[9px] uppercase text-emerald-300/60">
                  <Radio className="h-2.5 w-2.5" /> Dist
                </div>
                <div className="font-mono text-sm font-bold tabular-nums">{distanceTraveled.toFixed(2)}</div>
                <div className="text-[8px] text-white/40">km</div>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2 text-[10px]">
              <span className={`flex items-center gap-1 font-semibold ${active ? "text-emerald-400" : "text-amber-400"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                {active ? "PATROLLING" : "PAUSED"}
              </span>
              <span className="text-white/40">{trail.length} pts</span>
            </div>
          </div>
        </div>

        {/* GPS signal — top-right overlay */}
        <div className="pointer-events-none absolute right-4 top-4 z-10">
          <div className="rounded-lg border border-white/10 bg-ink-900/85 px-3 py-2 text-white shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Satellite className="h-3 w-3 animate-pulse" />
                <span className="font-bold">RTK FIX</span>
              </span>
              <span className="text-white/50">|</span>
              <span className="text-white/70">12 sats</span>
              <span className="text-white/50">|</span>
              <span className="text-emerald-400 font-semibold">±2cm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 border-t border-ink-100 px-4 py-3 text-xs text-ink-500">
        <span className="font-semibold text-ink-600">Health legend:</span>
        {[{ l: "Healthy (80+)", c: "#059669" }, { l: "Moderate (60-79)", c: "#d97706" }, { l: "Critical (<60)", c: "#e11d48" }].map((x) => (
          <span key={x.l} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: x.c }} /> {x.l}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-600 shadow-sm" /> GPS Rover
          <span className="ml-1 inline-block h-0.5 w-5 rounded-full border-t-2 border-dashed border-emerald-500/50" /> Trail
        </span>
      </div>
    </div>
  );
}

function ZonePopup({ zone }: { zone: ZoneFeature }) {
  const color = scoreColor(zone.score);
  const label = labelForScore(zone.score);
  return (
    <div style={{ minWidth: "210px", fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontWeight: 700, fontSize: "13px", color: "#1a1e26" }}>{zone.name}</span>
        <span style={{ fontWeight: 700, fontSize: "13px", color }}>{zone.score}%</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
        <span style={{ fontSize: "10px", fontWeight: 600, color, background: `${color}1a`, padding: "2px 8px", borderRadius: "999px" }}>{label}</span>
        <span style={{ fontSize: "10px", color: "#636c7e" }}>{zone.hectares} ha</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px", color: "#4d5566" }}>
        <PopupStat label="Soil Moisture" value={`${zone.telemetry.soilMoisture}%`} />
        <PopupStat label="Crop Type" value={zone.crop} />
        <PopupStat label="Temperature" value={`${zone.telemetry.temperature}°C`} />
        <PopupStat label="Humidity" value={`${zone.telemetry.humidity}%`} />
        <PopupStat label="Soil Profile" value={zone.soil} />
        <PopupStat label="Health Score" value={`${zone.score}%`} />
      </div>
    </div>
  );
}

function PopupStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "#f6f7f9", borderRadius: "6px", padding: "5px 7px" }}>
      <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.04em", color: "#828da0", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: "12px", fontWeight: 700, color: "#272c36", marginTop: "1px" }}>{value}</div>
    </div>
  );
}
