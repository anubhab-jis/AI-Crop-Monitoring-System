import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Lock,
  Network,
  Fingerprint,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Cpu,
  Wifi,
  Database,
  Activity,
  RefreshCw,
} from "lucide-react";
import { Card, Button, SectionTitle, Badge, StatusDot } from "./ui";
import { cn } from "@/lib/utils";

interface SecurityCheck {
  id: string;
  label: string;
  description: string;
  icon: typeof Lock;
  status: string;
  detail: string;
}

interface AuditStep {
  id: string;
  label: string;
  icon: typeof Activity;
}

const SECURITY_CHECKS: SecurityCheck[] = [
  {
    id: "encryption",
    label: "API Token Encryption Status",
    description: "AES-256 encryption for all API tokens at rest",
    icon: Lock,
    status: "Active",
    detail: "Secure",
  },
  {
    id: "firewall",
    label: "IoT Gateway Firewall",
    description: "Stateful packet inspection on all gateway endpoints",
    icon: Network,
    status: "Protected",
    detail: "14 rules active",
  },
  {
    id: "integrity",
    label: "Data Transmission Integrity",
    description: "Payload verification across sensor mesh network",
    icon: Fingerprint,
    status: "SHA-256 Verified",
    detail: "0 tampered packets",
  },
];

const AUDIT_STEPS: AuditStep[] = [
  { id: "scan", label: "Scanning IoT device certificates", icon: Wifi },
  { id: "encrypt", label: "Verifying token encryption layers", icon: Lock },
  { id: "firewall", label: "Auditing gateway firewall rules", icon: Network },
  { id: "integrity", label: "Validating data integrity hashes", icon: Fingerprint },
  { id: "devices", label: "Checking sensor mesh connectivity", icon: Cpu },
  { id: "database", label: "Reviewing database access logs", icon: Database },
];

export function SecurityDiagnostics() {
  const [auditing, setAuditing] = useState(false);
  const [auditStep, setAuditStep] = useState(-1);
  const [auditDone, setAuditDone] = useState(false);

  const runAudit = () => {
    setAuditing(true);
    setAuditDone(false);
    setAuditStep(0);
  };

  useEffect(() => {
    if (!auditing) return;
    if (auditStep >= AUDIT_STEPS.length) {
      const t = setTimeout(() => {
        setAuditing(false);
        setAuditDone(true);
      }, 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setAuditStep((s) => s + 1), 750);
    return () => clearTimeout(t);
  }, [auditing, auditStep]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 animate-fade-in">
      {/* Left: security metrics */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="p-5">
          <SectionTitle
            title="IoT Network Security Status"
            subtitle="Real-time security posture of agricultural sensor network"
            icon={<ShieldCheck className="h-5 w-5" />}
            action={
              <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-100">
                <StatusDot color="bg-emerald-500" /> All Systems Secure
              </Badge>
            }
          />
          <div className="mt-5 space-y-4">
            {SECURITY_CHECKS.map((check, i) => {
              const Icon = check.icon;
              return (
                <div
                  key={check.id}
                  className="flex items-center gap-4 rounded-xl border border-ink-100 bg-ink-50/30 p-4 animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-ink-800">{check.label}</p>
                    <p className="text-xs text-ink-500">{check.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {check.status}
                    </span>
                    <span className="text-[11px] text-ink-400">{check.detail}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Audit runner */}
        <Card className="p-5">
          <SectionTitle
            title="System Security Audit"
            subtitle="Run a comprehensive live diagnostic of the IoT network"
            icon={<ShieldAlert className="h-5 w-5" />}
          />

          <div className="mt-4">
            {!auditing && !auditDone && (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-ink-200 bg-ink-50/30 py-8 text-center">
                <ShieldCheck className="h-8 w-8 text-ink-300" />
                <p className="text-sm text-ink-500">
                  Click below to run a simulated live security audit across all IoT endpoints.
                </p>
                <Button onClick={runAudit} size="lg">
                  <ShieldCheck className="h-4 w-4" /> Run System Security Audit
                </Button>
              </div>
            )}

            {auditing && (
              <div className="space-y-2.5">
                {AUDIT_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const done = i < auditStep;
                  const current = i === auditStep;
                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-4 py-3 transition-all",
                        done && "border-emerald-200 bg-emerald-50/40",
                        current && "border-sky-200 bg-sky-50/40",
                        !done && !current && "border-ink-100 bg-ink-50/20 opacity-50"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          done && "bg-emerald-100 text-emerald-600",
                          current && "bg-sky-100 text-sky-600",
                          !done && !current && "bg-ink-100 text-ink-400"
                        )}
                      >
                        {done ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : current ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          done ? "text-emerald-700" : current ? "text-sky-700" : "text-ink-400"
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {auditDone && !auditing && (
              <div className="animate-scale-in space-y-4">
                <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 py-8 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="h-8 w-8" />
                  </span>
                  <div>
                    <p className="font-display text-lg font-bold text-emerald-800">Audit Complete</p>
                    <p className="text-sm text-emerald-600">All 6 checks passed — network is fully secure.</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {AUDIT_STEPS.map((s) => (
                      <span
                        key={s.id}
                        className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
                      >
                        <CheckCircle2 className="h-3 w-3" /> {s.label.split(" ")[0]}
                      </span>
                    ))}
                  </div>
                </div>
                <Button onClick={runAudit} variant="secondary" className="w-full">
                  <RefreshCw className="h-4 w-4" /> Re-run Audit
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Right: system stats */}
      <div className="space-y-6">
        <Card className="p-5">
          <SectionTitle
            title="Network Overview"
            subtitle="IoT device mesh status"
            icon={<Activity className="h-5 w-5" />}
          />
          <div className="mt-4 space-y-3">
            {[
              { label: "Connected Sensors", value: "48 / 48", icon: Wifi, color: "text-emerald-600" },
              { label: "Gateway Uptime", value: "99.98%", icon: Activity, color: "text-sky-600" },
              { label: "Encrypted Channels", value: "12 / 12", icon: Lock, color: "text-emerald-600" },
              { label: "Firewall Blocks (24h)", value: "1,247", icon: Network, color: "text-amber-600" },
              { label: "Data Integrity Score", value: "100%", icon: Fingerprint, color: "text-emerald-600" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex items-center justify-between rounded-lg border border-ink-100 px-3.5 py-3 animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-ink-600">
                    <Icon className={cn("h-4 w-4", stat.color)} /> {stat.label}
                  </span>
                  <span className="font-display text-sm font-bold text-ink-900">{stat.value}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              <span className="font-display text-sm font-bold">Security Score</span>
            </div>
            <p className="mt-3 font-display text-5xl font-extrabold tabular-nums">A+</p>
            <p className="mt-1 text-sm text-emerald-100">
              All encryption, firewall, and integrity checks are passing.
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white" style={{ width: "98%" }} />
            </div>
            <p className="mt-1.5 text-xs text-emerald-100">98 / 100 points</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
