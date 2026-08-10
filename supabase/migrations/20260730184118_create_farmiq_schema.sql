/*
# FarmIQ AI — Core Schema & Seed Data

## Purpose
Powers the FarmIQ AI agricultural intelligence platform: a single-tenant demo
prototype (no sign-in screen) where all data is intentionally shared/public.
Frontend reads/writes through the Supabase anon key, so every table's policies
must allow the `anon` role.

## New Tables

1. `users`
   - `id` uuid primary key
   - `username` text not null
   - `email` text unique not null
   - `farm_location` text (human-readable farm address/region)
   - `created_at` timestamptz default now()

2. `referencedata`
   - `id` uuid primary key
   - `category` text not null (values: 'crop_type', 'soil_type')
   - `name` text not null (e.g. 'Rice', 'Loam')
   - `optimal_water_threshold` numeric — optimal irrigation volume in
     liters/hectare for the crop, or water-retention factor for soil profiles
   - `created_at` timestamptz default now()
   - Unique on (category, name)

3. `analysisrecords`
   - `id` uuid primary key
   - `user_id` uuid nullable — references `users(id)`. Nullable because the demo
     runs as anon; seeded demo user is linked where available.
   - `crop_type` text not null
   - `soil_type` text not null
   - `growth_stage` text
   - `image_url_placeholder` text (data URL or label for the uploaded imagery)
   - `health_score` numeric (0-100) overall physiological vitality
   - `irrigation_plan_text` text — human-readable precision irrigation plan
   - `agent_notes_json` jsonb — structured multi-agent advisory output
   - `telemetry_json` jsonb — environmental telemetry snapshot at analysis time
   - `created_at` timestamptz default now()

## Security (RLS)
- All three tables enable RLS.
- Single-tenant demo: policies allow `anon, authenticated` full CRUD with
  `USING (true)` / `WITH CHECK (true)` because all data is intentionally public
  for the prototype. Documented here so this is not mistaken for a shortcut.

## Seed Data
- One demo `users` row ('AgriCorp Pilot').
- `referencedata` rows for crop types (Rice, Potato, Cotton, Wheat) with
  optimal water thresholds, and soil types (Clay, Loam, Sandy) with retention
  factors.
- A few sample `analysisrecords` so the dashboard shows data on first load.

## Important Notes
1. Re-runnable: uses IF NOT EXISTS and DROP POLICY IF EXISTS.
2. `analysisrecords.user_id` is nullable so anon inserts succeed without auth.
3. Index on created_at for recent-analyses ordering.
*/

-- ---------- users ----------
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  email text UNIQUE NOT NULL,
  farm_location text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_users" ON users;
CREATE POLICY "anon_select_users" ON users FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_users" ON users;
CREATE POLICY "anon_insert_users" ON users FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_users" ON users;
CREATE POLICY "anon_update_users" ON users FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_users" ON users;
CREATE POLICY "anon_delete_users" ON users FOR DELETE
  TO anon, authenticated USING (true);

-- ---------- referencedata ----------
CREATE TABLE IF NOT EXISTS referencedata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  name text NOT NULL,
  optimal_water_threshold numeric,
  created_at timestamptz DEFAULT now(),
  UNIQUE (category, name)
);

ALTER TABLE referencedata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_referencedata" ON referencedata;
CREATE POLICY "anon_select_referencedata" ON referencedata FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_referencedata" ON referencedata;
CREATE POLICY "anon_insert_referencedata" ON referencedata FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_referencedata" ON referencedata;
CREATE POLICY "anon_update_referencedata" ON referencedata FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_referencedata" ON referencedata;
CREATE POLICY "anon_delete_referencedata" ON referencedata FOR DELETE
  TO anon, authenticated USING (true);

-- ---------- analysisrecords ----------
CREATE TABLE IF NOT EXISTS analysisrecords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  crop_type text NOT NULL,
  soil_type text NOT NULL,
  growth_stage text,
  image_url_placeholder text,
  health_score numeric,
  irrigation_plan_text text,
  agent_notes_json jsonb,
  telemetry_json jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analysisrecords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_analysisrecords" ON analysisrecords;
CREATE POLICY "anon_select_analysisrecords" ON analysisrecords FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_analysisrecords" ON analysisrecords;
CREATE POLICY "anon_insert_analysisrecords" ON analysisrecords FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_analysisrecords" ON analysisrecords;
CREATE POLICY "anon_update_analysisrecords" ON analysisrecords FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_analysisrecords" ON analysisrecords;
CREATE POLICY "anon_delete_analysisrecords" ON analysisrecords FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_analysisrecords_created_at
  ON analysisrecords (created_at DESC);

-- ---------- Seed: demo user ----------
INSERT INTO users (username, email, farm_location)
SELECT 'AgriCorp Pilot', 'pilot@farmiq.ai', 'Central Valley, California'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'pilot@farmiq.ai');

-- ---------- Seed: referencedata ----------
INSERT INTO referencedata (category, name, optimal_water_threshold)
SELECT 'crop_type', name, vol
FROM (VALUES
  ('Rice',   8000.0),
  ('Potato', 5000.0),
  ('Cotton', 6500.0),
  ('Wheat',  4500.0)
) AS v(name, vol)
WHERE NOT EXISTS (
  SELECT 1 FROM referencedata WHERE category = 'crop_type' AND name = v.name
);

INSERT INTO referencedata (category, name, optimal_water_threshold)
SELECT 'soil_type', name, factor
FROM (VALUES
  ('Clay',  1.25),
  ('Loam',  1.00),
  ('Sandy', 0.70)
) AS v(name, factor)
WHERE NOT EXISTS (
  SELECT 1 FROM referencedata WHERE category = 'soil_type' AND name = v.name
);

-- ---------- Seed: sample analyses ----------
INSERT INTO analysisrecords
  (user_id, crop_type, soil_type, growth_stage, image_url_placeholder,
   health_score, irrigation_plan_text, agent_notes_json, telemetry_json, created_at)
SELECT
  u.id, crop, soil, stage, label, score, plan, notes, tele, ts
FROM (VALUES
  ('Wheat',  'Loam',  'Flowering',  'field_wheat_north.jpg', 78.0,
   'Apply 4,200 L/ha in two evening cycles. Skip zones 3 & 5 (moisture adequate).',
   '{"pathology":{"finding":"Early signs of nitrogen deficiency; pale flag leaves.","severity":"moderate","recommendation":"Apply split top-dressing of urea at 40 kg/ha."},"climateRisk":{"finding":"Heat wave expected in 72h; flowering stage vulnerable to thermal stress.","severity":"high","recommendation":"Initiate cooling irrigation misting 06:00 and 18:00."},"sustainability":{"finding":"Adopted plan cuts nitrogen runoff by ~22% and saves 1,400 L/ha water.","recommendation":"Maintain buffer strips to protect adjacent waterways."}}'::jsonb,
   '{"temperature":29,"humidity":48,"soilMoisture":42}'::jsonb,
   now() - interval '2 hours'),
  ('Rice',   'Clay',  'Vegetative', 'field_rice_east.jpg',  88.0,
   'Maintain 5 cm flood level. Top-up 6,200 L/ha over next 24h.',
   '{"pathology":{"finding":"No disease signatures detected; canopy uniform and green.","severity":"low","recommendation":"Continue routine scouting."},"climateRisk":{"finding":"Humidity rising; monitor for blast fungus in 5-7 days.","severity":"low","recommendation":"Increase aeration drainage cycles."},"sustainability":{"finding":"Alternate wetting & drying reduces methane emissions by ~30%.","recommendation":"Draw down flood mid-cycle for 48h."}}'::jsonb,
   '{"temperature":31,"humidity":72,"soilMoisture":68}'::jsonb,
   now() - interval '9 hours'),
  ('Cotton', 'Sandy', 'Maturation',  'field_cotton_south.jpg', 61.0,
   'Apply 4,700 L/ha via drip; sandy profile drains fast — split into 3 short cycles.',
   '{"pathology":{"finding":"Suspected early bacterial blight on lower leaves; angular water-soaked lesions.","severity":"moderate","recommendation":"Remove affected foliage and apply copper-based protectant."},"climateRisk":{"finding":"Low humidity accelerating boll dehydration; yield at risk.","severity":"moderate","recommendation":"Increase drip frequency, mulch rows."},"sustainability":{"finding":"Drip conversion avoids 1,900 L/ha evaporative loss vs flood.","recommendation":"Cover soil with organic mulch to retain moisture."}}'::jsonb,
   '{"temperature":34,"humidity":35,"soilMoisture":28}'::jsonb,
   now() - interval '1 day'),
  ('Potato', 'Loam',  'Vegetative',  'field_potato_west.jpg', 92.0,
   'Standard 4,900 L/ha this cycle. Soil moisture optimal.',
   '{"pathology":{"finding":"Healthy vigorous canopy; no pest or pathogen indicators.","severity":"low","recommendation":"Maintain integrated pest management schedule."},"climateRisk":{"finding":"Stable conditions; no thermal or moisture stress forecast.","severity":"low","recommendation":"No action needed."},"sustainability":{"finding":"Precision scheduling reduces water waste by ~18% and leaching by ~15%.","recommendation":"Continue soil-moisture probe calibration."}}'::jsonb,
   '{"temperature":22,"humidity":58,"soilMoisture":55}'::jsonb,
   now() - interval '2 days')
) AS v(crop, soil, stage, label, score, plan, notes, tele, ts)
CROSS JOIN (SELECT id FROM users WHERE email = 'pilot@farmiq.ai' LIMIT 1) u
WHERE NOT EXISTS (SELECT 1 FROM analysisrecords LIMIT 1);
