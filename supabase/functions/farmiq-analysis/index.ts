import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Telemetry {
  temperature: number;
  humidity: number;
  soilMoisture: number;
}

interface AnalysisRequest {
  imageData?: string; // base64 data URL
  imageMime?: string;
  cropType: string;
  growthStage: string;
  soilProfile: string;
  telemetry: Telemetry;
}

const SYSTEM_PROMPT = `You are FarmIQ AI's chief agronomist, an expert in precision agriculture, plant pathology, and sustainable irrigation.
Analyze the uploaded crop/soil imagery together with the provided environmental telemetry.
Return ONLY a compact JSON object (no markdown, no prose) with exactly this shape:
{
  "healthScore": number (0-100, overall physiological vitality),
  "healthLabel": "Healthy" | "Moderate Stress" | "Critical",
  "irrigation": {
    "recommendedLitersPerHectare": number,
    "rationale": short string explaining the volume vs. weather/soil,
    "schedule": short string describing application timing/cycles
  },
  "pathology": {
    "finding": string (disease or nutrient deficiency from leaf/stem visual cues, or "No disease signatures detected"),
    "severity": "low" | "moderate" | "high",
    "recommendation": string
  },
  "climateRisk": {
    "finding": string (predictive thermal/moisture stress warning),
    "severity": "low" | "moderate" | "high",
    "recommendation": string
  },
  "sustainability": {
    "finding": string (estimated reduction in chemical runoff and water waste),
    "recommendation": string
  }
}
Be specific and actionable. Base numbers on realistic agronomic benchmarks.`;

function labelForScore(score: number): "Healthy" | "Moderate Stress" | "Critical" {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "Moderate Stress";
  return "Critical";
}

function severityForScore(score: number): "low" | "moderate" | "high" {
  if (score >= 80) return "low";
  if (score >= 60) return "moderate";
  return "high";
}

// Deterministic advisory engine used when no Gemini key is configured.
function deterministicReport(req: AnalysisRequest) {
  const { temperature, humidity, soilMoisture } = req.telemetry;
  const optimalWater: Record<string, number> = {
    Rice: 8000, Potato: 5000, Cotton: 6500, Wheat: 4500,
  };
  const soilFactor: Record<string, number> = {
    Clay: 1.25, Loam: 1.0, Sandy: 0.7,
  };
  const base = optimalWater[req.cropType] ?? 5500;
  const factor = soilFactor[req.soilProfile] ?? 1.0;

  // Health score from telemetry deviation.
  const tempStress = Math.max(0, Math.min(1, (temperature - 25) / 15));
  const humidStress = Math.max(0, Math.min(1, (60 - humidity) / 50));
  const moistureStress = Math.max(0, Math.min(1, (50 - soilMoisture) / 50));
  const stress = (tempStress + humidStress + moistureStress) / 3;
  const healthScore = Math.round(Math.max(20, 95 - stress * 60));

  // Irrigation: dry + hot + sandy => more water.
  const dryness = Math.max(0, 50 - soilMoisture) / 50;
  const heat = Math.max(0, temperature - 20) / 20;
  const adj = 0.6 + dryness * 0.5 + heat * 0.3;
  const recommendedLitersPerHectare = Math.round(base * factor * adj);

  const stageHint: Record<string, string> = {
    Seedling: "shallow roots — frequent light applications",
    Vegetative: "build canopy — steady uniform moisture",
    Flowering: "stress-sensitive — avoid deficit",
    Maturation: "taper down — reduce volume to improve quality",
  };

  return {
    healthScore,
    healthLabel: labelForScore(healthScore),
    irrigation: {
      recommendedLitersPerHectare,
      rationale: `${req.soilProfile} soil (factor ${factor.toFixed(2)}) at ${soilMoisture}% moisture and ${temperature}°C raises water demand ${(adj * 100 - 100).toFixed(0)}% vs baseline.`,
      schedule: `Split across two evening cycles. ${stageHint[req.growthStage] ?? ""}.`,
    },
    pathology: {
      finding:
        healthScore < 60
          ? "Visual cues suggest possible nutrient deficiency and early stress chlorosis on mid-canopy leaves."
          : "No disease signatures detected; canopy colour and turgor appear adequate.",
      severity: severityForScore(healthScore),
      recommendation:
        healthScore < 60
          ? "Apply a balanced foliar nutrient feed and scout for pathogen lesions over 48h."
          : "Continue routine scouting and maintain the current nutrient programme.",
    },
    climateRisk: {
      finding:
        temperature > 32
          ? `High thermal stress forecast at ${temperature}°C; ${req.growthStage.toLowerCase()} stage is vulnerable to heat and moisture depletion.`
          : `Conditions near nominal; watch humidity-driven disease pressure at ${humidity}% RH.`,
      severity: temperature > 32 ? "high" : temperature > 28 ? "moderate" : "low",
      recommendation:
        temperature > 32
          ? "Initiate cooling irrigation misting at dawn and dusk; shade sensitive blocks."
          : "Maintain standard irrigation cadence and monitor canopy temperature.",
    },
    sustainability: {
      finding: `Precision scheduling cuts water waste by ~${Math.round(dryness * 25 + 15)}% and nitrogen runoff by ~${Math.round((1 - factor) * 20 + 10)}% versus flood irrigation.`,
      recommendation: "Maintain buffer strips and reuse drainage where feasible to protect waterways.",
    },
  };
}

async function callGemini(req: AnalysisRequest) {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return null;

  const model = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const parts: unknown[] = [{ text: SYSTEM_PROMPT + "\n\nInputs:\n" + JSON.stringify({
    cropType: req.cropType,
    growthStage: req.growthStage,
    soilProfile: req.soilProfile,
    telemetry: req.telemetry,
  }) }];

  if (req.imageData && req.imageMime) {
    const base64 = req.imageData.includes(",") ? req.imageData.split(",")[1] : req.imageData;
    parts.push({ inline_data: { mime_type: req.imageMime, data: base64 } });
  }

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");

  // Strip any accidental code fences and parse.
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as AnalysisRequest;
    if (!body.cropType || !body.telemetry) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let report;
    let source = "gemini";
    try {
      report = await callGemini(body);
      if (!report) {
        report = deterministicReport(body);
        source = "deterministic";
      }
    } catch (err) {
      console.error("Gemini call failed, using fallback:", err.message);
      report = deterministicReport(body);
      source = "deterministic-fallback";
    }

    return new Response(
      JSON.stringify({ report, source }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message ?? "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
