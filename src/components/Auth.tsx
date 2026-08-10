import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { ensureProfile } from "@/lib/auth";
import {
  Leaf,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User as UserIcon,
  MapPin,
  Sprout,
  Satellite,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export function Auth({ onAuthed }: { onAuthed: () => void }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState("Central Valley, California");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
        });
        if (err) throw err;
        if (data.user) {
          await ensureProfile(username || email.split("@")[0]);
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
      }
      onAuthed();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(friendly(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-bg min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-10 px-4 py-10 lg:flex-row lg:gap-16">
        {/* Brand panel */}
        <div className="hidden max-w-md flex-1 lg:block">
          <div className="animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-600/30">
                <Leaf className="h-6 w-6" strokeWidth={2.4} />
              </span>
              <div>
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
                  FarmIQ <span className="text-emerald-600">AI</span>
                </h1>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-400">
                  Agricultural Intelligence
                </p>
              </div>
            </div>
            <h2 className="mt-8 font-display text-3xl font-bold leading-tight text-ink-900">
              Precision agriculture,
              <br />
              powered by multimodal AI.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-600">
              Upload crop imagery, sync environmental telemetry, and get a
              multi-agent advisory report with precision irrigation plans and
              real-time weather alerts.
            </p>
            <div className="mt-8 space-y-3">
              {[
                { icon: Sprout, t: "Gemini multimodal crop & soil analysis" },
                { icon: Satellite, t: "7-day weather forecast & agronomic alerts" },
                { icon: ShieldCheck, t: "Your fields & analyses are private to you" },
              ].map((f) => {
                const I = f.icon;
                return (
                  <div key={f.t} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                      <I className="h-4 w-4" />
                    </span>
                    <span className="text-sm text-ink-700">{f.t}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Auth card */}
        <div className="w-full max-w-md flex-1">
          <div className="rounded-2xl border border-ink-100 bg-white p-7 shadow-card animate-scale-in sm:p-8">
            {/* Mobile brand */}
            <div className="mb-6 flex items-center gap-2.5 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
                <Leaf className="h-5 w-5" />
              </span>
              <span className="font-display text-lg font-extrabold text-ink-900">
                FarmIQ <span className="text-emerald-600">AI</span>
              </span>
            </div>

            <h2 className="font-display text-xl font-bold text-ink-900">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              {mode === "signin"
                ? "Sign in to access your farm intelligence dashboard."
                : "Start running AI crop analyses in minutes."}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <Field
                  label="Username"
                  icon={<UserIcon className="h-4 w-4" />}
                >
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="farmer_jane"
                    className={inputCls}
                    required
                  />
                </Field>
              )}

              <Field label="Email" icon={<Mail className="h-4 w-4" />}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@farm.com"
                  className={inputCls}
                  required
                />
              </Field>

              <Field label="Password" icon={<Lock className="h-4 w-4" />}>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={cn(inputCls, "pr-10")}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              {mode === "signup" && (
                <Field label="Farm Location" icon={<MapPin className="h-4 w-4" />}>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Central Valley, California"
                    className={inputCls}
                    required
                  />
                </Field>
              )}

              {error && (
                <div className="rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === "signin" ? (
                  <LogIn className="h-4 w-4" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {mode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-ink-500">
              {mode === "signin" ? "Don't have an account?" : "Already registered?"}{" "}
              <button
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError(null);
                }}
                className="font-semibold text-emerald-600 hover:text-emerald-700"
              >
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-medium text-ink-800 transition-colors placeholder:text-ink-300 hover:border-emerald-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100";

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

function friendly(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Invalid email or password.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "An account with this email already exists. Try signing in.";
  if (m.includes("rate limit")) return "Too many attempts. Please wait a moment and try again.";
  if (m.includes("password") && m.includes("6")) return "Password must be at least 6 characters.";
  return msg;
}
