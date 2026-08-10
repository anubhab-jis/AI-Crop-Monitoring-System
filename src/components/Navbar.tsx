import { useState } from "react";
import {
  LayoutDashboard,
  ScanSearch,
  Map,
  TrendingUp,
  Leaf,
  Activity,
  Satellite,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import type { View, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StatusDot } from "./ui";

const TABS: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "new-analysis", label: "New Analysis", icon: ScanSearch },
  { id: "field-map", label: "Field Map / Zones", icon: Map },
  { id: "economics", label: "Resource Economics", icon: TrendingUp },
  { id: "security", label: "Security & Diagnostics", icon: ShieldCheck },
];

export function Navbar({
  view,
  onNavigate,
  user,
  onSignOut,
}: {
  view: View;
  onNavigate: (v: View) => void;
  user: User | null;
  onSignOut: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  const go = (v: View) => {
    onNavigate(v);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100/80 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <button
          onClick={() => go("dashboard")}
          className="group flex items-center gap-2.5"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm shadow-emerald-600/30 transition-transform group-hover:scale-105">
            <Leaf className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-[15px] font-extrabold tracking-tight text-ink-900">
              FarmIQ <span className="text-emerald-600">AI</span>
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-ink-400 sm:block">
              Agricultural Intelligence
            </span>
          </span>
        </button>

        {/* Desktop tabs */}
        <nav className="hidden items-center gap-1 rounded-xl bg-ink-50/80 p-1 md:flex">
          {TABS.map((t) => {
            const active = view === t.id || (view === "report" && t.id === "dashboard");
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                className={cn(
                  "relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-200",
                  active
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-ink-500 hover:text-ink-800"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2.2} />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          {/* Live status (desktop only) */}
          <div className="hidden items-center gap-2 xl:flex">
            <div className="flex items-center gap-1.5 rounded-lg border border-ink-100 bg-white/70 px-2.5 py-1.5">
              <StatusDot color="bg-emerald-500" />
              <span className="text-[11px] font-semibold text-ink-700">AI Active</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-ink-100 bg-white/70 px-2.5 py-1.5">
              <Satellite className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[11px] font-semibold text-ink-700">Sync Online</span>
              <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
            </div>
          </div>

          {/* User menu */}
          {user && (
            <div className="relative hidden md:block">
              <button
                onClick={() => setUserMenu((s) => !s)}
                className="flex items-center gap-2 rounded-lg border border-ink-100 bg-white/70 px-2.5 py-1.5 transition-colors hover:border-emerald-200"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                  {user.username?.[0]?.toUpperCase() ?? "U"}
                </span>
                <span className="max-w-[100px] truncate text-xs font-semibold text-ink-700">
                  {user.username}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
              </button>
              {userMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-56 animate-scale-in rounded-xl border border-ink-100 bg-white p-2 shadow-card-hover">
                    <div className="rounded-lg px-3 py-2">
                      <p className="text-sm font-semibold text-ink-800">{user.username}</p>
                      <p className="truncate text-xs text-ink-400">{user.email}</p>
                      {user.farm_location && (
                        <p className="mt-1 truncate text-xs text-ink-400">{user.farm_location}</p>
                      )}
                    </div>
                    <div className="my-1 h-px bg-ink-100" />
                    <button
                      onClick={() => {
                        setUserMenu(false);
                        onSignOut();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((s) => !s)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-100 bg-white text-ink-600 transition-colors hover:bg-emerald-50 hover:text-emerald-600 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="animate-fade-in-fast border-t border-ink-100 bg-white md:hidden">
          <nav className="mx-auto max-w-7xl space-y-1 px-4 py-3 sm:px-6">
            {TABS.map((t) => {
              const active = view === t.id || (view === "report" && t.id === "dashboard");
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => go(t.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                    active
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                      : "text-ink-600 hover:bg-ink-50"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {t.label}
                </button>
              );
            })}

            {/* Live status chips */}
            <div className="flex flex-wrap gap-2 px-1 pt-3">
              <div className="flex items-center gap-1.5 rounded-lg border border-ink-100 bg-white px-2.5 py-1.5">
                <StatusDot color="bg-emerald-500" />
                <span className="text-[11px] font-semibold text-ink-700">AI Model: Active</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-ink-100 bg-white px-2.5 py-1.5">
                <Satellite className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-[11px] font-semibold text-ink-700">Satellite: Online</span>
              </div>
            </div>

            {/* User block */}
            {user && (
              <div className="mt-3 rounded-xl border border-ink-100 bg-ink-50/40 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    {user.username?.[0]?.toUpperCase() ?? "U"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-800">{user.username}</p>
                    <p className="truncate text-xs text-ink-400">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    onSignOut();
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 ring-1 ring-rose-100 transition-colors hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
