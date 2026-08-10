import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WeatherAlert {
  type: "heat" | "frost" | "rain" | "wind" | "disease" | "drought";
  severity: "low" | "moderate" | "high";
  title: string;
  message: string;
  date: string;
}

interface DayForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  precip: number;
  humidityMax: number;
  windMax: number;
  weatherCode: number;
}

interface WeatherResponse {
  location: { name: string; latitude: number; longitude: number };
  current: {
    temperature: number;
    humidity: number;
    precip: number;
    windSpeed: number;
    weatherCode: number;
  };
  daily: DayForecast[];
  alerts: WeatherAlert[];
}

function computeAlerts(daily: DayForecast[]): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  for (const d of daily) {
    if (d.tempMax >= 35) {
      alerts.push({
        type: "heat",
        severity: "high",
        title: "Severe heat stress forecast",
        message: `${d.tempMax}°C on ${d.date}. Canopy heat stress likely — initiate cooling irrigation and shade sensitive blocks.`,
        date: d.date,
      });
    } else if (d.tempMax >= 32) {
      alerts.push({
        type: "heat",
        severity: "moderate",
        title: "Heat stress watch",
        message: `${d.tempMax}°C on ${d.date}. Flowering and seedling stages are vulnerable; increase irrigation frequency.`,
        date: d.date,
      });
    }

    if (d.tempMin <= 0) {
      alerts.push({
        type: "frost",
        severity: "high",
        title: "Frost warning",
        message: `Low of ${d.tempMin}°C on ${d.date}. Protect tender crops with row covers or wind machines.`,
        date: d.date,
      });
    } else if (d.tempMin <= 2) {
      alerts.push({
        type: "frost",
        severity: "moderate",
        title: "Near-frost conditions",
        message: `Low of ${d.tempMin}°C on ${d.date}. Monitor for cold damage in low-lying zones.`,
        date: d.date,
      });
    }

    if (d.precip >= 25) {
      alerts.push({
        type: "rain",
        severity: "high",
        title: "Heavy rainfall expected",
        message: `${d.precip}mm on ${d.date}. Delay fertilizer application and ensure field drainage is clear.`,
        date: d.date,
      });
    } else if (d.precip >= 15) {
      alerts.push({
        type: "rain",
        severity: "moderate",
        title: "Notable rainfall",
        message: `${d.precip}mm on ${d.date}. Reduce irrigation volume accordingly.`,
        date: d.date,
      });
    }

    if (d.windMax >= 40) {
      alerts.push({
        type: "wind",
        severity: "high",
        title: "Strong wind advisory",
        message: `Wind up to ${d.windMax} km/h on ${d.date}. Risk of lodging and physical crop damage.`,
        date: d.date,
      });
    }
  }

  // Disease pressure: 3+ consecutive days with humidity >= 85%.
  let streak = 0;
  let streakStart = "";
  for (const d of daily) {
    if (d.humidityMax >= 85) {
      if (streak === 0) streakStart = d.date;
      streak++;
      if (streak >= 3) {
        alerts.push({
          type: "disease",
          severity: "moderate",
          title: "Disease pressure building",
          message: `3+ consecutive humid days from ${streakStart}. Fungal pressure (blast, blight) rises — plan a protective scouting pass.`,
          date: streakStart,
        });
        break;
      }
    } else {
      streak = 0;
    }
  }

  // Drought: extended dry + hot.
  const dryHot = daily.filter((d) => d.precip < 1 && d.tempMax >= 30).length;
  if (dryHot >= 3) {
    alerts.push({
      type: "drought",
      severity: "high",
      title: "Drought & evapotranspiration stress",
      message: `${dryHot} dry hot days ahead. Soil moisture will drop fast — increase irrigation budget and mulch bare rows.`,
      date: daily[0]?.date ?? "",
    });
  }

  // Sort by severity (high first) then date.
  const order = { high: 0, moderate: 1, low: 2 };
  alerts.sort((a, b) => order[a.severity] - order[b.severity] || a.date.localeCompare(b.date));
  return alerts;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const location = (body?.location ?? "Central Valley, California") as string;

    // Geocode the location name.
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      location
    )}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) throw new Error(`Geocoding failed (${geoRes.status})`);
    const geo = await geoRes.json();
    const place = geo?.results?.[0];
    if (!place) throw new Error(`Could not find location "${location}"`);

    const { latitude, longitude, name } = place;

    // Fetch forecast.
    const forecastUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max,relative_humidity_2m_max` +
      `&timezone=auto&forecast_days=7`;
    const fxRes = await fetch(forecastUrl);
    if (!fxRes.ok) throw new Error(`Forecast fetch failed (${fxRes.status})`);
    const fx = await fxRes.json();

    const daily: DayForecast[] = (fx.daily?.time ?? []).map((t: string, i: number) => ({
      date: t,
      tempMax: fx.daily.temperature_2m_max[i],
      tempMin: fx.daily.temperature_2m_min[i],
      precip: fx.daily.precipitation_sum[i],
      humidityMax: fx.daily.relative_humidity_2m_max[i],
      windMax: fx.daily.wind_speed_10m_max[i],
      weatherCode: fx.daily.weather_code[i],
    }));

    const result: WeatherResponse = {
      location: { name, latitude, longitude },
      current: {
        temperature: fx.current?.temperature_2m ?? 0,
        humidity: fx.current?.relative_humidity_2m ?? 0,
        precip: fx.current?.precipitation ?? 0,
        windSpeed: fx.current?.wind_speed_10m ?? 0,
        weatherCode: fx.current?.weather_code ?? 0,
      },
      daily,
      alerts: computeAlerts(daily),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message ?? "Weather lookup failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
