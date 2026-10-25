"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Lock,
  ArrowRight,
  Info,
  Sparkles,
  HelpCircle,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "../chrome";
import { toast } from "sonner";
import * as api from "@/lib/relo/api";
import { isMetaConfigured } from "@/lib/relo/config";
import { cn } from "@/lib/utils";

interface ConnectInstagramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectInstagramModal({
  open,
  onOpenChange,
}: ConnectInstagramModalProps) {
  // 2-step direct Instagram verification checklist
  const [step1Checked, setStep1Checked] = useState(true);
  const [step2Checked, setStep2Checked] = useState(true);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const metaReady = isMetaConfigured();

  const handleConnect = () => {
    if (!metaReady) {
      toast.error("Instagram App ID is not configured yet in .env", {
        description: "Add NEXT_PUBLIC_META_APP_ID to your environment variables.",
      });
      return;
    }
    api.beginMetaOAuth();
  };

  const allChecked = step1Checked && step2Checked;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-line/70 bg-surface/98 p-0 shadow-[var(--sh-3)] backdrop-blur-2xl sm:max-w-[520px]">
        {/* Top Gradient Banner with Instagram Mark */}
        <div className="relative overflow-hidden border-b border-line/60 bg-surface-2/60 px-6 pt-7 pb-6">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-md shadow-pink-500/20">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-6 text-white"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-signal/10 px-2.5 py-0.5 text-[11px] font-semibold text-signal">
                <Sparkles className="size-3" />
                Instagram Business Login
              </div>
              <DialogTitle className="mt-1.5 text-[19px] font-bold tracking-tight text-ink">
                Connect your Instagram Account
              </DialogTitle>
              <DialogDescription className="mt-1 text-[13px] leading-relaxed text-ink-2">
                Verify these 2 quick checks in your Instagram app to ensure comment automation and DMs work smoothly.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Verification Checklist */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="caption font-mono text-[11px] uppercase tracking-wider text-ink-3">
              Pre-Flight Checklist (Direct Instagram)
            </span>
            <span className="text-[12px] font-semibold text-signal">
              {[step1Checked, step2Checked].filter(Boolean).length}/2 Ready
            </span>
          </div>

          {/* Step 1: Professional Account */}
          <div
            className={cn(
              "rounded-2xl border transition-all duration-150",
              step1Checked
                ? "border-line bg-surface-1"
                : "border-warn/40 bg-warn-wash/40"
            )}
          >
            <div className="flex items-start gap-3 p-4">
              <button
                type="button"
                onClick={() => setStep1Checked(!step1Checked)}
                className="mt-0.5 text-signal hover:opacity-80 transition-opacity"
              >
                {step1Checked ? (
                  <CheckCircle2 className="size-5 fill-signal text-surface" />
                ) : (
                  <Circle className="size-5 text-ink-3" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-semibold text-ink flex items-center gap-2">
                    <Smartphone className="size-4 text-ink-3" />
                    1. Professional Account (Creator/Business)
                  </span>
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10.5px] font-medium text-ink-3">
                    Required
                  </span>
                </div>
                <p className="mt-1 text-[12.5px] text-ink-2 leading-relaxed">
                  Meta&apos;s API only supports Creator or Business accounts. Personal profiles cannot receive webhook triggers.
                </p>

                <button
                  type="button"
                  onClick={() => setExpandedStep(expandedStep === 1 ? null : 1)}
                  className="mt-2 text-[12px] font-medium text-signal underline decoration-signal/30 underline-offset-2 hover:decoration-signal"
                >
                  {expandedStep === 1 ? "Hide instructions" : "How to switch in Instagram app →"}
                </button>

                {expandedStep === 1 && (
                  <div className="mt-2.5 rounded-xl border border-line bg-surface-2 p-3 text-[12px] text-ink-2 space-y-1">
                    <p>1. Open Instagram app → tap profile photo in bottom right.</p>
                    <p>2. Tap menu (≡) → <strong>Settings and privacy</strong>.</p>
                    <p>3. Tap <strong>Account type and tools</strong> → <strong>Switch to professional account</strong>.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Enable "Allow Access to Messages" */}
          <div
            className={cn(
              "rounded-2xl border transition-all duration-150",
              step2Checked
                ? "border-line bg-surface-1"
                : "border-warn/40 bg-warn-wash/40"
            )}
          >
            <div className="flex items-start gap-3 p-4">
              <button
                type="button"
                onClick={() => setStep2Checked(!step2Checked)}
                className="mt-0.5 text-signal hover:opacity-80 transition-opacity"
              >
                {step2Checked ? (
                  <CheckCircle2 className="size-5 fill-signal text-surface" />
                ) : (
                  <Circle className="size-5 text-ink-3" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-semibold text-ink flex items-center gap-2">
                    <ShieldCheck className="size-4 text-signal" />
                    2. Enable &quot;Allow Access to Messages&quot;
                  </span>
                  <span className="rounded bg-signal/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-signal">
                    Crucial for DMs
                  </span>
                </div>
                <p className="mt-1 text-[12.5px] text-ink-2 leading-relaxed">
                  Instagram requires this permission toggle ON before third-party tools can send automated DMs.
                </p>

                <button
                  type="button"
                  onClick={() => setExpandedStep(expandedStep === 2 ? null : 2)}
                  className="mt-2 text-[12px] font-medium text-signal underline decoration-signal/30 underline-offset-2 hover:decoration-signal"
                >
                  {expandedStep === 2 ? "Hide instructions" : "How to enable in Instagram →"}
                </button>

                {expandedStep === 2 && (
                  <div className="mt-2.5 rounded-xl border border-line bg-surface-2 p-3 text-[12px] text-ink-2 space-y-1">
                    <p>1. Open Instagram → <strong>Settings and privacy</strong>.</p>
                    <p>2. Tap <strong>Messages and story replies</strong> → <strong>Message controls</strong>.</p>
                    <p>3. Under <em>Connected tools</em>, toggle <strong>Allow access to messages</strong> to <strong>ON</strong>.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-line/60 bg-surface-2/40 p-6">
          <Button
            type="button"
            variant="signal"
            size="lg"
            className="w-full justify-center shadow-lg bg-gradient-to-r from-[#e1306c] via-[#fd1d1d] to-[#f77737] hover:opacity-95 text-white border-0 py-3 text-[15px] font-bold"
            onClick={handleConnect}
          >
            Log in with Instagram
            <ArrowRight className="size-4" />
          </Button>

          <div className="mt-3.5 flex items-center justify-center gap-2 text-[11.5px] text-ink-3">
            <Lock className="size-3.5 text-signal" />
            <span>Official Instagram Business Login · Zero Facebook page required</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Sleek floating setup pill that stays in the bottom-right corner of Studio
 * when no account is connected, letting the user trigger the connect modal with 1 click.
 */
export function FloatingConnectWidget({
  onOpenConnect,
  hasAccount,
}: {
  onOpenConnect: () => void;
  hasAccount: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (hasAccount || dismissed) return null;

  return (
    <aside
      aria-label="Setup Assistant"
      className="fixed bottom-6 right-6 z-30 flex items-center gap-3 rounded-2xl border border-signal/30 bg-surface-1/95 p-3.5 shadow-[0_12px_36px_-8px_rgba(232,70,30,0.22)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-sm"
    >
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-sm">
        <Sparkles className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-bold text-ink leading-snug">
          Connect your Instagram
        </p>
        <p className="text-[11px] text-ink-3 truncate">
          1 step to start automated comment replies
        </p>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="signal"
          size="sm"
          onClick={onOpenConnect}
          className="h-7 px-3 text-[12px]"
        >
          Verify &amp; Connect
        </Button>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="grid size-6 place-items-center rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
          title="Dismiss for this session"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </aside>
  );
}
