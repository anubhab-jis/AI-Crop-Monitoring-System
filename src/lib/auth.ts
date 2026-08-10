import { supabase } from "./supabase";
import type { User } from "./types";

// Insert a profile row in `users` for the authenticated user (id = auth.uid()).
export async function ensureProfile(username: string): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = {
    id: user.id,
    username,
    email: user.email ?? "",
    farm_location: "Central Valley, California",
  };

  // Insert if missing (id matches auth.uid()).
  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return existing as User;

  const { data, error } = await supabase
    .from("users")
    .insert(profile)
    .select("*")
    .single();
  if (error) {
    console.error("Profile creation failed:", error.message);
    return null;
  }
  return data as User;
}

export async function loadProfile(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return (data as User) ?? null;
}

export async function updateFarmLocation(location: string): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ farm_location: location })
    .eq("id", (await supabase.auth.getUser()).data.user?.id);
  if (error) console.error("Update location failed:", error.message);
}
