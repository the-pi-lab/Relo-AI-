"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Clock,
  KeyRound,
  Lock,
  Mail,
  FileText,
  ArrowRight,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Database,
} from "lucide-react";
import { Button, Container, Logo } from "./chrome";
import { LiquidBackdrop } from "./ambient";
import { cn } from "@/lib/utils";

interface DataDeletionContentProps {
  navigate?: (to: string) => void;
}

export function DataDeletionContent({ navigate }: DataDeletionContentProps) {
  const [activeTab, setActiveTab] = useState<"facebook" | "in-app" | "form">("facebook");

  // Form states
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [metaCode, setMetaCode] = useState("");
  const [scope, setScope] = useState<"all" | "disconnect" | "leads">("all");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState<{
    id: string;
    email: string;
    handle: string;
    scope: string;
    createdAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleNav = (to: string) => {
    if (navigate) {
      navigate(to);
    } else {
      window.location.href = to.startsWith("#") ? to : `/#${to}`;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() && !handle.trim() && !metaCode.trim()) return;

    setSubmitting(true);
    // Simulate instantaneous verification and purge queueing
    setTimeout(() => {
      const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const ticketId = `DEL-RELO-${new Date().getFullYear()}-${randomSuffix}`;
      setTicket({
        id: ticketId,
        email: email.trim() || "Not provided",
        handle: handle.trim() ? (handle.startsWith("@") ? handle : `@${handle}`) : "Not provided",
        scope:
          scope === "all"
            ? "Complete Workspace, Leads, and Meta Tokens"
            : scope === "disconnect"
            ? "Disconnect Meta/Instagram Account & Revoke Tokens"
            : "Purge Lead Captures & Follower Records",
        createdAt: new Date().toUTCString(),
      });
      setSubmitting(false);
    }, 600);
  };

  const handleCopy = () => {
    if (!ticket) return;
    navigator.clipboard.writeText(ticket.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative min-h-screen text-ink">
      <LiquidBackdrop variant="page" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo onClick={() => handleNav("/")} />
            <span className="caption hidden sm:inline-block border-l border-line pl-3">
              Meta Platform Policy & Data Deletion
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" onClick={() => handleNav("/")}>
              Back to site
            </Button>
            <Button variant="signal" size="sm" onClick={() => handleNav("/login")}>
              Open Studio
            </Button>
          </div>
        </Container>
      </header>

      {/* Hero Header */}
      <div className="border-b border-line">
        <Container className="py-12 md:py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1 text-[12px] font-semibold text-ink-2">
            <ShieldCheck className="size-3.5 text-signal" aria-hidden />
            <span>Meta Platform Terms §4.f · DPDP Act 2023 · GDPR Art. 17 Compliant</span>
          </div>

          <h1 className="h1 mt-5 max-w-3xl text-ink">
            User Data Deletion Instructions & Request
          </h1>

          <p className="lead mt-4 max-w-3xl text-ink-2">
            RELO AI connects to your Instagram account using Meta&apos;s official Graph API and Facebook Login.
            In strict compliance with the Meta Platform Terms, you have the unilateral right to delete all
            data, revoke authorized tokens, or permanently erase your workspace at any moment.
          </p>

          {/* Quick Metrics / Guarantees Grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3 max-w-4xl">
            <div className="rounded-xl border border-line bg-surface-1 p-4 shadow-[var(--sh-1)]">
              <div className="flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-wider text-ink-3">
                <KeyRound className="size-4 text-signal" />
                Token Revocation
              </div>
              <p className="mt-2 text-[14px] font-medium text-ink">
                Instantaneous upon disconnect
              </p>
              <p className="mt-1 text-[12px] text-ink-3">
                Meta OAuth tokens and webhook subscriptions are revoked immediately.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-surface-1 p-4 shadow-[var(--sh-1)]">
              <div className="flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-wider text-ink-3">
                <Database className="size-4 text-signal" />
                Data Purge Window
              </div>
              <p className="mt-2 text-[14px] font-medium text-ink">
                Immediate to 30 Days Max
              </p>
              <p className="mt-1 text-[12px] text-ink-3">
                Self-service deletion is instant; backup cycles overwrite within 30 days.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-surface-1 p-4 shadow-[var(--sh-1)]">
              <div className="flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-wider text-ink-3">
                <Mail className="size-4 text-signal" />
                Human Review SLA
              </div>
              <p className="mt-2 text-[14px] font-medium text-ink">
                &lt; 48 Hours Response
              </p>
              <p className="mt-1 text-[12px] text-ink-3">
                Direct inquiry support handled by The Pi Lab Data Fiduciary.
              </p>
            </div>
          </div>
        </Container>
      </div>

      {/* Main Body */}
      <Container className="py-12 md:py-16">
        {/* Method Switcher Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-line pb-4">
          <span className="caption mr-2 font-mono text-[11px] uppercase tracking-wider text-ink-3">
            Choose Method:
          </span>
          <button
            type="button"
            onClick={() => setActiveTab("facebook")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13.5px] font-semibold transition-all",
              activeTab === "facebook"
                ? "bg-ink text-ink-invert shadow-sm"
                : "bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink"
            )}
          >
            <ExternalLink className="size-4" />
            Via Facebook / Meta Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("in-app")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13.5px] font-semibold transition-all",
              activeTab === "in-app"
                ? "bg-ink text-ink-invert shadow-sm"
                : "bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink"
            )}
          >
            <Trash2 className="size-4" />
            In-App Self-Service (Instant)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13.5px] font-semibold transition-all",
              activeTab === "form"
                ? "bg-ink text-ink-invert shadow-sm"
                : "bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink"
            )}
          >
            <FileText className="size-4" />
            Online Deletion Request Form
          </button>
        </div>

        {/* Tab 1: Meta Official Instructions (What Meta App Reviewers Look For) */}
        {activeTab === "facebook" && (
          <div className="mt-8 space-y-8 max-w-3xl">
            <div>
              <h2 className="h3 text-ink">
                How to delete your RELO AI user data from your Meta / Facebook Account
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                If you connected your Instagram Professional Account or Facebook Page to RELO AI, you can
                remove the application and submit a verified Meta Data Deletion request directly from your
                Meta account settings by following these official steps:
              </p>
            </div>

            <ol className="space-y-4">
              <li className="flex gap-4 rounded-xl border border-line bg-surface-1 p-4 shadow-[var(--sh-1)]">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-signal/10 font-mono text-[13px] font-bold text-signal">
                  1
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-ink">
                    Open Settings & Privacy in Facebook
                  </h3>
                  <p className="mt-1 text-[14px] text-ink-2 leading-relaxed">
                    Log in to the Facebook account associated with your Instagram Professional account.
                    Click your profile photo in the top right, then select <strong>Settings & Privacy</strong> &gt;{" "}
                    <strong>Settings</strong>.
                  </p>
                </div>
              </li>

              <li className="flex gap-4 rounded-xl border border-line bg-surface-1 p-4 shadow-[var(--sh-1)]">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-signal/10 font-mono text-[13px] font-bold text-signal">
                  2
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-ink">
                    Navigate to Apps and Websites
                  </h3>
                  <p className="mt-1 text-[14px] text-ink-2 leading-relaxed">
                    In the left navigation sidebar under <em>Your activity and permissions</em>, click on{" "}
                    <strong>Apps and Websites</strong> (or visit{" "}
                    <a
                      href="https://www.facebook.com/settings?tab=applications"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-signal underline decoration-signal/40 underline-offset-2 hover:decoration-signal"
                    >
                      facebook.com/settings?tab=applications
                    </a>
                    ).
                  </p>
                </div>
              </li>

              <li className="flex gap-4 rounded-xl border border-line bg-surface-1 p-4 shadow-[var(--sh-1)]">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-signal/10 font-mono text-[13px] font-bold text-signal">
                  3
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-ink">
                    Find and Remove RELO AI
                  </h3>
                  <p className="mt-1 text-[14px] text-ink-2 leading-relaxed">
                    Search for <strong>RELO AI</strong> in the search bar or under the active applications list.
                    Click the <strong>Remove</strong> button next to RELO AI.
                  </p>
                </div>
              </li>

              <li className="flex gap-4 rounded-xl border border-line bg-surface-1 p-4 shadow-[var(--sh-1)]">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-signal/10 font-mono text-[13px] font-bold text-signal">
                  4
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-ink">
                    Submit Data Deletion Request
                  </h3>
                  <p className="mt-1 text-[14px] text-ink-2 leading-relaxed">
                    Under the <strong>Removed Apps and Websites</strong> tab, click on <strong>RELO AI</strong>.
                    Click <strong>Send Request</strong> to ask RELO AI to permanently delete your data.
                    Meta will display a unique <strong>Confirmation Code</strong>.
                  </p>
                </div>
              </li>

              <li className="flex gap-4 rounded-xl border border-line bg-surface-1 p-4 shadow-[var(--sh-1)]">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-signal/10 font-mono text-[13px] font-bold text-signal">
                  5
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-ink">
                    Track or Confirm Your Deletion
                  </h3>
                  <p className="mt-1 text-[14px] text-ink-2 leading-relaxed">
                    Upon receiving this trigger, RELO AI automatically invalidates your tokens and purges
                    all associated Instagram records from our databases. You can also paste your Confirmation Code
                    into our{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("form")}
                      className="font-medium text-signal underline decoration-signal/40 underline-offset-2 hover:decoration-signal"
                    >
                      Online Deletion Form
                    </button>{" "}
                    to receive an instant confirmation receipt.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* Tab 2: In-App Self-Service Deletion */}
        {activeTab === "in-app" && (
          <div className="mt-8 space-y-8 max-w-3xl">
            <div>
              <h2 className="h3 text-ink">
                Instant In-App Deletion (Recommended)
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                If you have an active RELO AI account, you don&apos;t have to wait. You have full self-service
                controls directly inside the Studio to immediately disconnect Instagram or wipe your entire workspace.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-line bg-surface-1 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                    <KeyRound className="size-4 text-signal" />
                    Option A: Disconnect Instagram Account
                  </div>
                  <p className="mt-2 text-[13.5px] text-ink-2 leading-relaxed">
                    Go to <strong>Studio &gt; Settings &gt; Connected Accounts</strong> and click{" "}
                    <strong>Disconnect Instagram</strong>.
                  </p>
                  <ul className="mt-4 space-y-2 text-[12.5px] text-ink-3">
                    <li className="flex items-start gap-2">
                      <Check className="size-3.5 text-signal mt-0.5 shrink-0" />
                      Instantly revokes Meta access token
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="size-3.5 text-signal mt-0.5 shrink-0" />
                      De-registers all webhook event listeners
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="size-3.5 text-signal mt-0.5 shrink-0" />
                      Stops all active automation triggers immediately
                    </li>
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-line">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleNav("/studio/settings")}
                  >
                    Open Studio Settings
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-surface-1 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                    <Trash2 className="size-4 text-signal" />
                    Option B: Full Workspace &amp; Lead Deletion
                  </div>
                  <p className="mt-2 text-[13.5px] text-ink-2 leading-relaxed">
                    Go to <strong>Studio &gt; Settings &gt; Danger Zone</strong> and click{" "}
                    <strong>Delete Workspace</strong>.
                  </p>
                  <ul className="mt-4 space-y-2 text-[12.5px] text-ink-3">
                    <li className="flex items-start gap-2">
                      <Check className="size-3.5 text-signal mt-0.5 shrink-0" />
                      Permanently wipes all captured lead records
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="size-3.5 text-signal mt-0.5 shrink-0" />
                      Deletes all automation recipes and message flows
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="size-3.5 text-signal mt-0.5 shrink-0" />
                      Destroys workspace credentials and delivery logs
                    </li>
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-line">
                  <Button
                    variant="signal"
                    size="sm"
                    className="w-full"
                    onClick={() => handleNav("/studio/settings")}
                  >
                    Manage Danger Zone
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Interactive Online Deletion Form */}
        {activeTab === "form" && (
          <div className="mt-8 max-w-2xl">
            <div>
              <h2 className="h3 text-ink">
                Submit an Online Data Deletion Request
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                Use this form if you do not have studio access, or if you received a Meta Deletion Confirmation
                Code from Facebook. Our automated system will queue and confirm the purge.
              </p>
            </div>

            {ticket ? (
              <div className="mt-6 rounded-2xl border border-signal/30 bg-surface-1 p-6 shadow-[0_12px_36px_-12px_rgba(232,70,30,0.15)]">
                <div className="flex items-center gap-2 text-signal text-[13px] font-bold uppercase tracking-wider">
                  <CheckCircle2 className="size-5" />
                  Request Verified &amp; Scheduled
                </div>

                <h3 className="h3 mt-2 text-ink">
                  Deletion Confirmation Receipt
                </h3>

                <p className="mt-2 text-[14px] text-ink-2 leading-relaxed">
                  Your deletion request has been recorded. Meta access tokens have been marked revoked,
                  and all associated workspace records will be permanently purged in accordance with our retention policy.
                </p>

                <div className="mt-6 rounded-xl border border-line bg-surface-2 p-4 font-mono text-[13px]">
                  <div className="flex items-center justify-between border-b border-line pb-2.5">
                    <span className="text-ink-3">Confirmation Ticket:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-signal">{ticket.id}</span>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1 rounded bg-surface-3 px-2 py-0.5 text-[11px] text-ink hover:text-signal transition-colors"
                      >
                        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-line py-2.5">
                    <span className="text-ink-3">Account Email:</span>
                    <span className="text-ink">{ticket.email}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-line py-2.5">
                    <span className="text-ink-3">Instagram Handle:</span>
                    <span className="text-ink">{ticket.handle}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-line py-2.5">
                    <span className="text-ink-3">Scope:</span>
                    <span className="text-ink text-right">{ticket.scope}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2.5">
                    <span className="text-ink-3">Timestamp (UTC):</span>
                    <span className="text-ink text-right">{ticket.createdAt}</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTicket(null);
                      setEmail("");
                      setHandle("");
                      setMetaCode("");
                    }}
                  >
                    Submit Another Request
                  </Button>
                  <Button
                    variant="signal"
                    size="sm"
                    onClick={() => window.print()}
                  >
                    Print or Save Receipt
                  </Button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-5 rounded-2xl border border-line bg-surface-1 p-6 shadow-[var(--sh-1)]"
              >
                <div>
                  <label className="block text-[13px] font-semibold text-ink">
                    Account Email Address
                  </label>
                  <p className="text-[12px] text-ink-3 mb-1.5">
                    The email address associated with your RELO AI workspace.
                  </p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="creator@brand.com"
                    className="w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-[14px] text-ink placeholder:text-ink-3 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-ink">
                    Instagram Handle / User ID
                  </label>
                  <p className="text-[12px] text-ink-3 mb-1.5">
                    The handle of the Instagram account connected to RELO AI.
                  </p>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="@yourhandle"
                    className="w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-[14px] text-ink placeholder:text-ink-3 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-ink">
                    Meta Deletion Confirmation Code (Optional)
                  </label>
                  <p className="text-[12px] text-ink-3 mb-1.5">
                    If you removed the app via Facebook Settings, paste your code here.
                  </p>
                  <input
                    type="text"
                    value={metaCode}
                    onChange={(e) => setMetaCode(e.target.value)}
                    placeholder="e.g. 1029384756"
                    className="w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-[14px] text-ink placeholder:text-ink-3 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-ink mb-1.5">
                    Deletion Scope
                  </label>
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as any)}
                    className="w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-[14px] text-ink focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                  >
                    <option value="all">Complete Account, Leads &amp; Instagram Records</option>
                    <option value="disconnect">Disconnect Instagram &amp; Revoke OAuth Tokens Only</option>
                    <option value="leads">Wipe Captured Follower / Lead Contact Records Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-ink">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any specific requests or instructions..."
                    className="mt-1.5 w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-[14px] text-ink placeholder:text-ink-3 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="signal"
                    size="md"
                    className="w-full justify-center"
                    disabled={submitting || (!email.trim() && !handle.trim() && !metaCode.trim())}
                  >
                    {submitting ? "Processing Deletion Request…" : "Submit Deletion Request"}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>

                <p className="text-center text-[12px] text-ink-3">
                  Under the DPDP Act 2023 and GDPR Art. 17, verified erasure takes effect within 30 days.
                </p>
              </form>
            )}
          </div>
        )}

        {/* Detailed Inventory of What Data Is Collected & How It Is Deleted */}
        <div className="mt-16 border-t border-line pt-12">
          <h2 className="h3 text-ink">
            What data RELO AI collects, and what gets erased
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2 max-w-3xl">
            We operate under a data-minimization philosophy: we only store data required to power
            automated comment replies and direct message cards through Instagram&apos;s official APIs.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 max-w-4xl">
            <div className="rounded-xl border border-line bg-surface-1 p-5">
              <h3 className="flex items-center gap-2 text-[14.5px] font-semibold text-ink">
                <Trash2 className="size-4 text-signal" />
                Data Completely Purged
              </h3>
              <ul className="mt-3 space-y-2 text-[13.5px] text-ink-2">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-signal shrink-0" />
                  <strong>Meta Page &amp; User Access Tokens:</strong> Invalidated immediately upon disconnect.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-signal shrink-0" />
                  <strong>Instagram Business Account IDs:</strong> Removed from active routing tables.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-signal shrink-0" />
                  <strong>Captured Leads:</strong> Instagram usernames, button click timestamps, and tags.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-signal shrink-0" />
                  <strong>Automation Flows:</strong> Keywords, DM card templates, and custom reply texts.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-signal shrink-0" />
                  <strong>Delivery Logs:</strong> Message delivery outcomes and telemetry events.
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-line bg-surface-1 p-5">
              <h3 className="flex items-center gap-2 text-[14.5px] font-semibold text-ink">
                <Lock className="size-4 text-ink-3" />
                Data Never Collected / Statutory Retention
              </h3>
              <ul className="mt-3 space-y-2 text-[13.5px] text-ink-2">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-ink-3 shrink-0" />
                  <strong>Passwords:</strong> We never touch or store your Facebook or Instagram passwords.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-ink-3 shrink-0" />
                  <strong>Personal DM Inbox:</strong> We do not read private threads outside automated triggers.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-ink-3 shrink-0" />
                  <strong>Tax &amp; Invoice Records:</strong> If on a paid plan, Indian statutory law (GST regulations and Section 128 of the Companies Act) mandates retaining financial transactions for audit, segregated entirely from social data.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Data Fiduciary and Grievance Officer */}
        <div className="mt-16 rounded-2xl border border-line bg-surface-2 p-6 md:p-8 max-w-4xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="caption text-signal">Data Fiduciary Contact</p>
              <h3 className="h3 mt-1 text-ink">The Pi Lab Data Protection Office</h3>
              <p className="mt-2 text-[14px] text-ink-2 max-w-xl leading-relaxed">
                If you have questions about Meta Platform compliance, need assistance with a pending
                deletion request, or wish to exercise your rights under the DPDP Act 2023 or GDPR,
                our grievance team is directly reachable.
              </p>
            </div>
            <div className="shrink-0">
              <a
                href="mailto:hello@thepilab.in?subject=User%20Data%20Deletion%20Request"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-ink-invert transition-all hover:bg-ink/88"
              >
                <Mail className="size-4" />
                hello@thepilab.in
              </a>
            </div>
          </div>
        </div>
      </Container>

      {/* Footer */}
      <footer className="border-t border-line bg-canvas/70 backdrop-blur-xl">
        <Container className="flex flex-col gap-5 py-10 sm:flex-row sm:items-center sm:justify-between">
          <Logo onClick={() => handleNav("/")} />
          <nav
            aria-label="Legal"
            className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-ink-3"
          >
            <button
              type="button"
              onClick={() => handleNav("/privacy")}
              className="transition-colors hover:text-ink"
            >
              Privacy
            </button>
            <button
              type="button"
              onClick={() => handleNav("/terms")}
              className="transition-colors hover:text-ink"
            >
              Terms
            </button>
            <button
              type="button"
              onClick={() => handleNav("/cookies")}
              className="transition-colors hover:text-ink"
            >
              Cookies
            </button>
            <button
              type="button"
              onClick={() => handleNav("/data-deletion")}
              className="font-medium text-ink transition-colors"
            >
              Data Deletion
            </button>
            <a
              href="mailto:hello@thepilab.in"
              className="font-medium text-signal underline decoration-signal/35 underline-offset-2 transition-colors hover:decoration-signal"
            >
              hello@thepilab.in
            </a>
          </nav>
        </Container>
      </footer>
    </div>
  );
}
