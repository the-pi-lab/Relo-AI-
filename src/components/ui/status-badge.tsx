import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type StatusTone = "ok" | "warn" | "bad" | "idle" | "info";

const TONES: Record<StatusTone, string> = {
  ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warn: "bg-amber-50 text-amber-800 border-amber-200",
  bad: "bg-red-50 text-red-700 border-red-200",
  idle: "bg-slate-100 text-slate-600 border-slate-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
};

const DOTS: Record<StatusTone, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  bad: "bg-red-500",
  idle: "bg-slate-400",
  info: "bg-blue-500",
};

export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", TONES[tone], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", DOTS[tone])} />
      {children}
    </Badge>
  );
}

/** Standalone status dot for sidebar pills and compact rows. */
export function StatusDot({ tone, className }: { tone: StatusTone; className?: string }) {
  return <span className={cn("h-2 w-2 rounded-full shrink-0", DOTS[tone], className)} />;
}
