import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { ensureProfile, loadProfile } from "@/lib/auth";
import { coerceReport } from "@/lib/agronomy";
import type {
  AnalysisRecord,
  AnalysisReport,
  Telemetry,
  User,
  View,
  WeatherData,
} from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { Auth } from "@/components/Auth";
import { Dashboard } from "@/components/Dashboard";
import { NewAnalysis } from "@/components/NewAnalysis";
import { ResultsReport } from "@/components/ResultsReport";
import { Economics } from "@/components/Economics";
import { SecurityDiagnostics } from "@/components/SecurityDiagnostics";

const FieldMap = lazy(() =>
  import("@/components/FieldMap").then((m) => ({ default: m.FieldMap }))
);

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [view, setView] = useState<View>("dashboard");
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Weather
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Report state
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [activeRecord, setActiveRecord] = useState<AnalysisRecord | null>(null);
  const [lastParams, setLastParams] = useState<{
    cropType: string;
    soilProfile: string;
    telemetry: Telemetry;
  } | null>(null);

  // ---------- Auth ----------
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load profile + data whenever session changes.
  useEffect(() => {
    if (!session) {
      setUser(null);
      setRecords([]);
      return;
    }
    let active = true;
    (async () => {
      const profile = await loadProfile();
      if (!active) return;
      setUser(profile);
      await loadRecords();
      if (profile?.farm_location) await loadWeather(profile.farm_location);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("analysisrecords")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("Failed to load analyses:", error.message);
    setRecords((data as AnalysisRecord[]) ?? []);
    setLoading(false);
  }, []);

  const loadWeather = useCallback(async (location: string) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/farmiq-weather`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ location }),
      });
      if (!res.ok) throw new Error(`Weather fetch failed (${res.status})`);
      const json = await res.json();
      if (json?.error) throw new Error(json.error);
      setWeather(json as WeatherData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not load weather.";
      setWeatherError(msg);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const handleAuthed = useCallback(() => {
    // onAuthStateChange will fire and trigger the session effect.
  }, []);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setView("dashboard");
    setReport(null);
    setWeather(null);
  }, []);

  const navigate = (v: View) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---------- Analysis ----------
  const handleRun = async (params: {
    cropType: string;
    growthStage: string;
    soilProfile: string;
    telemetry: Telemetry;
    imageData: string | null;
    imageMime: string | null;
  }) => {
    setRunning(true);
    setSaved(false);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/farmiq-analysis`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          imageData: params.imageData,
          imageMime: params.imageMime,
          cropType: params.cropType,
          growthStage: params.growthStage,
          soilProfile: params.soilProfile,
          telemetry: params.telemetry,
        }),
      });
      if (!res.ok) throw new Error(`Analysis failed (${res.status})`);
      const json = await res.json();
      const coerced = coerceReport(json?.report);
      setReport(coerced);
      setLastParams({
        cropType: params.cropType,
        soilProfile: params.soilProfile,
        telemetry: params.telemetry,
      });
      setActiveRecord({
        id: "pending",
        user_id: session?.user?.id ?? null,
        crop_type: params.cropType,
        soil_type: params.soilProfile,
        growth_stage: params.growthStage,
        image_url_placeholder: params.imageMime ?? "uploaded",
        health_score: coerced.healthScore,
        irrigation_plan_text: coerced.irrigation.schedule,
        agent_notes_json: {
          pathology: coerced.pathology,
          climateRisk: coerced.climateRisk,
          sustainability: coerced.sustainability,
        },
        telemetry_json: params.telemetry,
        created_at: new Date().toISOString(),
      });
      navigate("report");
    } catch (err) {
      console.error(err);
      alert("Could not run the AI analysis. Please try again.");
    } finally {
      setRunning(false);
    }
  };

  const handleSave = async () => {
    if (!activeRecord || !report) return;
    setSaving(true);
    try {
      const row = {
        crop_type: activeRecord.crop_type,
        soil_type: activeRecord.soil_type,
        growth_stage: activeRecord.growth_stage,
        image_url_placeholder: activeRecord.image_url_placeholder,
        health_score: report.healthScore,
        irrigation_plan_text: `${report.irrigation.recommendedLitersPerHectare} L/ha — ${report.irrigation.schedule}`,
        agent_notes_json: {
          pathology: report.pathology,
          climateRisk: report.climateRisk,
          sustainability: report.sustainability,
        },
        telemetry_json: activeRecord.telemetry_json,
      };
      const { error } = await supabase.from("analysisrecords").insert(row);
      if (error) throw error;
      setSaved(true);
      await loadRecords();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Could not save the analysis to the database.");
    } finally {
      setSaving(false);
    }
  };

  const viewReport = (r: AnalysisRecord) => {
    if (!r.agent_notes_json || !r.telemetry_json) return;
    const notes = r.agent_notes_json;
    const baseReport: AnalysisReport = {
      healthScore: r.health_score ?? 0,
      healthLabel:
        (r.health_score ?? 0) >= 80
          ? "Healthy"
          : (r.health_score ?? 0) >= 60
          ? "Moderate Stress"
          : "Critical",
      irrigation: {
        recommendedLitersPerHectare: parseLiters(r.irrigation_plan_text),
        rationale: "Stored plan from prior analysis.",
        schedule: r.irrigation_plan_text ?? "",
      },
      pathology: notes.pathology,
      climateRisk: notes.climateRisk,
      sustainability: notes.sustainability,
    };
    setReport(baseReport);
    setLastParams({
      cropType: r.crop_type,
      soilProfile: r.soil_type,
      telemetry: r.telemetry_json,
    });
    setActiveRecord(r);
    setSaved(true);
    navigate("report");
  };

  // ---------- Render ----------
  if (!authReady) {
    return (
      <div className="app-bg flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Auth onAuthed={handleAuthed} />;
  }

  return (
    <div className="app-bg min-h-screen">
      <Navbar view={view} onNavigate={navigate} user={user} onSignOut={handleSignOut} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {view === "dashboard" && (
          <PageHeader
            title="Operations Dashboard"
            subtitle={user?.farm_location ? `Farm intelligence for ${user.farm_location}` : "Real-time intelligence across your active fields"}
          />
        )}
        {view === "new-analysis" && (
          <PageHeader title="New Field Analysis" subtitle="Run a multimodal AI crop & soil scan" />
        )}
        {view === "field-map" && (
          <PageHeader title="Field Map & Zones" subtitle="Spatial health distribution across your operation" />
        )}
        {view === "economics" && (
          <PageHeader title="Resource Economics" subtitle="Water, input & carbon savings across the season" />
        )}
        {view === "security" && (
          <PageHeader title="Security & System Diagnostics" subtitle="IoT network security posture & live audit" />
        )}

        <div className="mt-6">
          {view === "dashboard" && (
            <Dashboard
              records={records}
              loading={loading}
              onNavigate={navigate}
              onViewReport={viewReport}
              weather={weather}
              weatherLoading={weatherLoading}
              weatherError={weatherError}
              onRefreshWeather={() => user?.farm_location && loadWeather(user.farm_location)}
              farmLocation={user?.farm_location ?? "Central Valley, California"}
            />
          )}
          {view === "new-analysis" && (
            <NewAnalysis onRun={handleRun} running={running} />
          )}
          {view === "field-map" && (
            <Suspense
              fallback={
                <div className="flex h-[520px] items-center justify-center rounded-2xl border border-ink-100 bg-white">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                </div>
              }
            >
              <FieldMap records={records} />
            </Suspense>
          )}
          {view === "economics" && <Economics records={records} />}
          {view === "security" && <SecurityDiagnostics />}
          {view === "report" && report && lastParams && (
            <ResultsReport
              report={report}
              record={activeRecord}
              telemetry={lastParams.telemetry}
              cropType={lastParams.cropType}
              soilProfile={lastParams.soilProfile}
              onBack={() => navigate("dashboard")}
              onSave={handleSave}
              saving={saving}
              saved={saved}
            />
          )}
          {view === "report" && !report && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white/50 py-20 text-center">
              <p className="font-display text-lg font-bold text-ink-800">No report loaded</p>
              <p className="mt-1 text-sm text-ink-500">Run a new analysis to see the advisory report.</p>
              <button
                onClick={() => navigate("new-analysis")}
                className="mt-4 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Run New Crop Scan
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="mx-auto max-w-7xl px-4 py-8 text-center text-xs text-ink-400 sm:px-6 lg:px-8">
        FarmIQ AI · Agricultural Intelligence Platform · Multimodal Gemini analysis with multi-agent advisory
      </footer>
    </div>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
        {title}
      </h1>
      <p className="mt-1 text-sm text-ink-500">{subtitle}</p>
    </div>
  );
}

function parseLiters(text: string | null): number {
  if (!text) return 0;
  const m = text.match(/([\d,]+)\s*L\/ha/i);
  if (m) return Number(m[1].replace(/,/g, ""));
  return 0;
}
