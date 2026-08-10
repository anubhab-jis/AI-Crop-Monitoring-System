export interface User {
  id: string;
  username: string;
  email: string;
  farm_location: string | null;
  created_at: string;
}

export interface ReferenceDatum {
  id: string;
  category: "crop_type" | "soil_type";
  name: string;
  optimal_water_threshold: number | null;
  created_at: string;
}

export interface Telemetry {
  temperature: number;
  humidity: number;
  soilMoisture: number;
}

export interface AgentNote {
  finding: string;
  severity: "low" | "moderate" | "high";
  recommendation: string;
}

export interface AgentNotes {
  pathology: AgentNote;
  climateRisk: AgentNote;
  sustainability: AgentNote;
}

export interface IrrigationPlan {
  recommendedLitersPerHectare: number;
  rationale: string;
  schedule: string;
}

export interface AnalysisReport {
  healthScore: number;
  healthLabel: "Healthy" | "Moderate Stress" | "Critical";
  irrigation: IrrigationPlan;
  pathology: AgentNote;
  climateRisk: AgentNote;
  sustainability: AgentNote;
}

export interface AnalysisRecord {
  id: string;
  user_id: string | null;
  crop_type: string;
  soil_type: string;
  growth_stage: string | null;
  image_url_placeholder: string | null;
  health_score: number | null;
  irrigation_plan_text: string | null;
  agent_notes_json: AgentNotes | null;
  telemetry_json: Telemetry | null;
  created_at: string;
}

export type View =
  | "dashboard"
  | "new-analysis"
  | "field-map"
  | "economics"
  | "report"
  | "security";

export type WeatherAlertType =
  | "heat"
  | "frost"
  | "rain"
  | "wind"
  | "disease"
  | "drought";

export interface WeatherAlert {
  type: WeatherAlertType;
  severity: "low" | "moderate" | "high";
  title: string;
  message: string;
  date: string;
}

export interface DayForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  precip: number;
  humidityMax: number;
  windMax: number;
  weatherCode: number;
}

export interface WeatherData {
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
