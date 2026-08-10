import { useMemo } from "react";
import {
  CloudSun,
  Droplets,
  Wind,
  Thermometer,
  MapPin,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudDrizzle,
  CloudLightning,
  type LucideIcon,
} from "lucide-react";
import type { WeatherData, WeatherAlert } from "@/lib/types";
import { Card, Badge, Button, SectionTitle } from "./ui";
import { cn } from "@/lib/utils";

const WMO: Record<number, { label: string; icon: LucideIcon }> = {
  0: { label: "Clear sky", icon: Sun },
  1: { label: "Mainly clear", icon: Sun },
  2: { label: "Partly cloudy", icon: Cloud },
  3: { label: "Overcast", icon: Cloud },
  45: { label: "Fog", icon: CloudFog },
  48: { label: "Rime fog", icon: CloudFog },
  51: { label: "Light drizzle", icon: CloudDrizzle },
  53: { label: "Drizzle", icon: CloudDrizzle },
  55: { label: "Heavy drizzle", icon: CloudDrizzle },
  61: { label: "Light rain", icon: CloudRain },
  63: { label: "Rain", icon: CloudRain },
  65: { label: "Heavy rain", icon: CloudRain },
  66: { label: "Freezing rain", icon: CloudRain },
  67: { label: "Freezing rain", icon: CloudRain },
  71: { label: "Light snow", icon: CloudSnow },
  73: { label: "Snow", icon: CloudSnow },
  75: { label: "Heavy snow", icon: CloudSnow },
  80: { label: "Rain showers", icon: CloudRain },
  81: { label: "Rain showers", icon: CloudRain },
  82: { label: "Violent showers", icon: CloudRain },
  95: { label: "Thunderstorm", icon: CloudLightning },
  96: { label: "Thunderstorm", icon: CloudLightning },
  99: { label: "Thunderstorm", icon: CloudLightning },
};

function wmo(code: number) {
  return WMO[code] ?? { label: "—", icon: Cloud };
}

const ALERT_STYLE: Record<
  WeatherAlert["type"],
  { icon: LucideIcon; bg: string; text: string; ring: string; dot: string }
> = {
  heat: { icon: Thermometer, bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-100", dot: "bg-rose-500" },
  frost: { icon: CloudSnow, bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-100", dot: "bg-sky-500" },
  rain: { icon: CloudRain, bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-100", dot: "bg-sky-500" },
  wind: { icon: Wind, bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-100", dot: "bg-amber-500" },
  disease: { icon: AlertTriangle, bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-100", dot: "bg-amber-500" },
  drought: { icon: Thermometer, bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-100", dot: "bg-rose-500" },
};

export function WeatherPanel({
  weather,
  loading,
  error,
  onRefresh,
  location,
}: {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  location: string;
}) {
  const today = weather?.daily?.[0];
  const cur = weather?.current;
  const WIcon = cur ? wmo(cur.weatherCode).icon : CloudSun;

  const highAlerts = useMemo(
    () => weather?.alerts.filter((a) => a.severity === "high").length ?? 0,
    [weather]
  );

  return (
    <Card className="overflow-hidden animate-fade-in">
      <div className="border-b border-ink-100 p-5">
        <SectionTitle
          title="Weather & Alerts"
          subtitle={location}
          icon={<CloudSun className="h-5 w-5" />}
          action={
            <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
            </Button>
          }
        />
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-ink-400">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          <p className="mt-2 text-xs">Fetching forecast…</p>
        </div>
      )}

      {error && !loading && (
        <div className="px-5 py-10 text-center">
          <AlertTriangle className="mx-auto h-6 w-6 text-amber-500" />
          <p className="mt-2 text-sm text-ink-500">{error}</p>
          <Button variant="secondary" size="sm" onClick={onRefresh} className="mt-3">
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </Button>
        </div>
      )}

      {weather && !loading && !error && (
        <div className="p-5">
          {/* Current conditions */}
          <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <WIcon className="h-12 w-12 text-white/90" />
              <div>
                <p className="font-display text-4xl font-bold tabular-nums">
                  {Math.round(cur?.temperature ?? 0)}°
                </p>
                <p className="text-sm text-sky-100">{wmo(cur?.weatherCode ?? 0).label}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-sky-100">
                  <MapPin className="h-3 w-3" /> {weather.location.name}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Stat icon={<Droplets className="h-4 w-4" />} label="Humidity" value={`${cur?.humidity ?? 0}%`} />
              <Stat icon={<Wind className="h-4 w-4" />} label="Wind" value={`${Math.round(cur?.windSpeed ?? 0)}`} unit="km/h" />
              <Stat icon={<CloudRain className="h-4 w-4" />} label="Rain" value={`${cur?.precip ?? 0}`} unit="mm" />
            </div>
          </div>

          {/* Alerts */}
          {weather.alerts.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
                  <AlertTriangle className="h-3.5 w-3.5" /> Agronomic Alerts
                </h3>
                {highAlerts > 0 && (
                  <Badge className="bg-rose-50 text-rose-700 ring-rose-100">
                    {highAlerts} high severity
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                {weather.alerts.map((a, i) => {
                  const s = ALERT_STYLE[a.type];
                  const I = s.icon;
                  return (
                    <div
                      key={i}
                      className={cn("flex items-start gap-3 rounded-xl px-3.5 py-3 ring-1 ring-inset", s.bg, s.ring)}
                    >
                      <I className={cn("mt-0.5 h-4 w-4 shrink-0", s.text)} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn("text-sm font-semibold", s.text)}>{a.title}</p>
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-ink-500">
                            <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                            {a.severity}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-ink-600">{a.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {weather.alerts.length === 0 && (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
              <Sun className="h-4 w-4" /> No weather alerts — conditions are favorable over the next 7 days.
            </div>
          )}

          {/* 7-day forecast */}
          <div className="mt-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
              7-Day Forecast
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {weather.daily.map((d, i) => {
                const dw = wmo(d.weatherCode);
                const I = dw.icon;
                return (
                  <div
                    key={d.date}
                    className="flex flex-col items-center rounded-xl border border-ink-100 bg-ink-50/40 px-2 py-3 text-center"
                  >
                    <span className="text-[11px] font-semibold uppercase text-ink-500">
                      {i === 0 ? "Today" : new Date(d.date).toLocaleDateString(undefined, { weekday: "short" })}
                    </span>
                    <I className="my-1.5 h-6 w-6 text-ink-600" />
                    <span className="font-display text-sm font-bold text-ink-900">{Math.round(d.tempMax)}°</span>
                    <span className="text-[11px] text-ink-400">{Math.round(d.tempMin)}°</span>
                    {d.precip > 0 && (
                      <span className="mt-1 flex items-center gap-0.5 text-[10px] font-medium text-sky-600">
                        <Droplets className="h-2.5 w-2.5" /> {d.precip}mm
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function Stat({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="rounded-lg bg-white/15 px-2 py-2">
      <div className="flex items-center justify-center text-sky-100">{icon}</div>
      <p className="mt-1 font-display text-base font-bold tabular-nums">{value}</p>
      {unit && <p className="text-[10px] text-sky-100">{unit}</p>}
      <p className="text-[10px] text-sky-100/80">{label}</p>
    </div>
  );
}
