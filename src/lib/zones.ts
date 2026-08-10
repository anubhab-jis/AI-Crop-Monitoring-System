export interface PresetZone {
  id: string;
  name: string;
  shortName: string;
  center: [number, number];
  region: string;
  defaultCrop: string;
  defaultSoil: string;
}

export const PRESET_ZONES: PresetZone[] = [
  {
    id: "punjab-a",
    name: "Punjab Sector A (Default)",
    shortName: "Punjab Sector A",
    center: [30.901, 75.8573],
    region: "Ludhiana, Punjab, India",
    defaultCrop: "Wheat",
    defaultSoil: "Loam",
  },
  {
    id: "maharashtra-b",
    name: "Maharashtra Region B",
    shortName: "Maharashtra Region B",
    center: [19.9975, 74.7898],
    region: "Nashik, Maharashtra, India",
    defaultCrop: "Cotton",
    defaultSoil: "Sandy",
  },
  {
    id: "karnataka-c",
    name: "Karnataka Zone C",
    shortName: "Karnataka Zone C",
    center: [15.3173, 75.7139],
    region: "Belagavi, Karnataka, India",
    defaultCrop: "Rice",
    defaultSoil: "Clay",
  },
];

export const DEFAULT_ZONE = PRESET_ZONES[0];

export function getZone(id: string): PresetZone {
  return PRESET_ZONES.find((z) => z.id === id) ?? DEFAULT_ZONE;
}
