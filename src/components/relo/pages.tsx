"use client";

import React, { useEffect } from "react";
import { ArrowRight, Mail, Play } from "lucide-react";
import { Logo, RButton, SectionHead } from "./chrome";
import { ThemeToggle } from "@/lib/relo/theme";
import { CookieSettingsLink } from "./cookie-consent";

/* ──────────────────────────────────────────────────────────────────────
   Shared page shell — header + footer only. No shader sky, no ASCII,
   no gradient text, no scroll reveals.
   ───────────────────────────────────────────────────────────────────── */

function PageNav({ navigate }: { navigate: (to: string) => void }) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex justify-center px-4 pt-3">
      <div className="flex w-full max-w-5xl items-center gap-3 rounded-lg border border-border bg-surface px-3.5 py-2">
        <Logo onClick={() => navigate("/")} />
        <span className="ml-2 hidden text-xs font-semibold uppercase tracking-wider text-text-3 sm:block">
          relo
        </span>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <RButton variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowRight className="size-3.5" /> Home
          </RButton>
        </div>
      </div>
    </header>
  );
}

export function PageFooter({ navigate }: { navigate: (to: string) => void }) {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:px-6 sm:justify-between">
        <div className="flex items-center gap-2">
          <Logo onClick={() => navigate("/")} />
          <span className="text-xs font-semibold text-text">RELO</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-text-3 uppercase tracking-wider">
          <button onClick={() => navigate("/privacy")} className="hover:text-text transition-colors">
            Privacy
          </button>
          <span aria-hidden>·</span>
          <button onClick={() => navigate("/terms")} className="hover:text-text transition-colors">
            Terms
          </button>
          <span aria-hidden>·</span>
          <button onClick={() => navigate("/cookies")} className="hover:text-text transition-colors">
            Cookies
          </button>
          <span aria-hidden>·</span>
          <CookieSettingsLink />
          <span aria-hidden>·</span>
          <a href="mailto:hello@thepilab.in" className="text-accent hover:text-accent-hover underline underline-offset-2">
            hello@thepilab.in
          </a>
        </div>
      </div>
    </footer>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Document page — headline, meta line, numbered sections, plain body.
   ───────────────────────────────────────────────────────────────────── */

interface DocSection {
  title: string;
  body: string[];
  list?: string[];
}

function DocPage({
  navigate,
  title,
  updated,
  intro,
  sections,
}: {
  navigate: (to: string) => void;
  title: string;
  updated: string;
  intro: string;
  sections: DocSection[];
}) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="relative min-h-screen bg-surface">
      <PageNav navigate={navigate} />

      <main className="relative z-10 mx-auto max-w-3xl px-5 pb-16 pt-32 sm:px-8 sm:pt-40">
        <h1 className="h1 text-text">{title}</h1>
        <p className="mt-4 lead">{intro}</p>
        <p className="mt-4 caption">{updated}</p>

        <div className="mt-12 space-y-10 border-t border-border pt-8">
          {sections.map((s, i) => (
            <section key={s.title} aria-labelledby={`sec-${i}`}>
              <div className="flex items-baseline gap-3">
                <span className="text-xs font-bold text-accent tracking-wider uppercase tnum">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 id={`sec-${i}`} className="h3 text-text">
                  {s.title}
                </h2>
              </div>
              <div className="mt-4 space-y-5">
                {s.body.map((p, j) => (
                  <p key={j} className="text-sm text-text-2 leading-relaxed">{p}</p>
                ))}
                {s.list && (
                  <ul className="mt-3 space-y-3 pl-6">
                    {s.list.map((li) => (
                      <li key={li} className="flex items-start gap-3 text-sm text-text-2 leading-relaxed">
                        <span className="mt-[3px] size-1.5 shrink-0 rounded-full bg-accent" />
                        {li}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {i < sections.length - 1 && <div className="hairline-x mt-10" />}
            </section>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center gap-3 border-t border-border pt-10">
          <p className="text-xs text-text-3 uppercase tracking-wider">
            questions → hello@thepilab.in
          </p>
        </div>
      </main>

      <PageFooter navigate={navigate} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRIVACY
   ═══════════════════════════════════════════════════════════════════════════ */

export function PrivacyPage({ navigate }: { navigate: (to: string) => void }) {
  return (
    <DocPage
      navigate={navigate}
      title="Your data stays yours"
      updated="October 11, 2025"
      intro="RELO automates conversations you already have permission to have — through Instagram's official API. This policy explains, in plain language, what touches our servers, what never does, and how to take everything back with one click. It complies with India's Digital Personal Data Protection Act, 2023, and we hold ourselves to that standard for everyone, everywhere."
      sections={[
        {
          title: "Who we are",
          body: [
            "RELO is built by The π Lab, a software studio based in India. We provide an Instagram automation platform that replies to comments, sends template DMs, and captures leads on behalf of creators. You can reach a human at hello@thepilab.in for anything privacy-related — a person reads every message, not a ticket queue.",
            "Under the DPDP Act, The π Lab is the Data Fiduciary for your account information, billing records, and the lead data processed through your automations. When you collect leads from your own audience, you decide the purpose of that messaging. We hand you the tools — one-click export, deletion, delivery logs — to meet that responsibility.",
          ],
        },
        {
          title: "What we collect",
          body: [
            "We collect the minimum the product needs to function. When you connect an account, Meta shares your Instagram Professional account ID, display name, and follower relationship status for people who interact with your automations. When someone triggers a flow, we store their username, whether they follow you, which keyword they used, and which DM button they clicked.",
            "We also keep operational records — automation settings you write, delivery logs, aggregate counters (DMs sent, clicks, replies), and basic device or browser metadata for security and debugging.",
          ],
          list: [
            "Account: email, plan, connected Instagram account ID",
            "Leads: username, follower status, keyword matched, button clicked",
            "Content you write: replies, DM cards, follow-up texts, AI prompts",
            "Usage: delivery outcomes, timestamps, error logs",
          ],
        },
        {
          title: "What we never collect",
          body: [
            "We never ask for your Instagram or Facebook password — connection happens entirely inside Meta's official OAuth screen, and the credentials stay with Meta. We do not read your direct-message history beyond the threads our automations send, we do not scrape profiles, and we do not sell, rent, or trade any data with data brokers or advertising networks.",
            "Our AI reply feature sends only the prompt and short context you configure to the model provider — never your full lead list, never your followers' identities beyond what the reply needs.",
          ],
        },
        {
          title: "How your data is used",
          body: [
            "Your data is used to run the service you turned on: matching keywords, sending your replies and DM cards, timing follow-ups, and showing you analytics. Lead records power your searchable audience, your CSV export, and campaign delivery inside Meta's 24-hour window.",
            "We use aggregated, de-identified counters to keep the engine healthy and to price plans honestly. We do not build advertising profiles, and we do not use your content to train models. Nothing collected for one reason is quietly used for another without asking you again.",
          ],
        },
        {
          title: "Consent, and taking it back",
          body: [
            "Under the DPDP Act we may process your personal data only with your consent, for the purposes you were told about, and nothing beyond them. You give that consent when you create an account, connect a Meta account through their official screen, or switch on a feature that needs new data. Every consent request tells you what is collected and why. We do not bundle consent into fine print, and we do not make the product conditional on data it does not truly need.",
            "You can withdraw any consent as easily as you gave it: disconnect the Meta account, delete an automation, wipe a lead list, or delete the whole workspace. Withdrawal stops all processing going forward, takes effect immediately, and costs you nothing. We will never nag or dark-pattern you into staying.",
          ],
        },
        {
          title: "Your rights under the DPDP Act",
          body: [
            "Your leads are yours — export the complete book to CSV with one click at any time, or delete a single lead from the Leads view. Deleting your workspace removes your account, automations, lead data, and analytics within 30 days, except where we must keep billing records for tax law.",
            "The Act gives you — the Data Principal — rights we honour without a lawyer's letter: ask what we hold, get a portable copy, correct anything inaccurate, have it erased when the purpose is done, and nominate someone to act for you if you cannot. Write to hello@thepilab.in from your account email; verified requests get a substantive answer within 30 days.",
          ],
          list: [
            "Access — a readable summary of everything we hold about you",
            "Correction — fix inaccurate or incomplete data",
            "Erasure — delete data the purpose no longer needs",
            "Grievance redressal — a fast, documented answer to any complaint",
            "Nomination — choose another individual to act for you if you cannot",
          ],
        },
      ]}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COOKIES
   ════════════════════════════════════════════════════════════════════════════ */

export function CookiesPage({ navigate }: { navigate: (to: string) => void }) {
  return (
    <DocPage
      navigate={navigate}
      title="What this site stores on your device"
      updated="October 11, 2025"
      intro="This page is the complete inventory of what RELO keeps on your device — nothing hidden behind “and partners”. We use no third-party cookies, no trackers, and no embeds. Everything listed below is first-party, readable only by this site, and erasable by you in one move."
      sections={[
        {
          title: "The complete list",
          body: [
            "There are exactly four things. This is the whole list; if your browser ever shows more on this site, it came from your own typing, not from us.",
          ],
          list: [
            "relo-session (first-party cookie) — keeps you signed in between visits. Deleted when you sign out.",
            "relo-theme (local storage) — remembers whether you chose night or day. Contains one word.",
            "relo-cookie-consent (local storage) — remembers your answer to the cookie banner.",
            "relo-studio (local storage) — saves your demo workspace so the studio survives a refresh.",
          ],
        },
        {
          title: "What we never store",
          body: [
            "No analytics cookies — we do not count you, profile you, or watch you scroll. No advertising cookies, no retargeting pixels, no device fingerprinting. No social-media widgets reporting your visit to another company. No third-party embeds of any kind.",
            "Even our fonts are self-hosted, so your browser never contacts Google Fonts or any other third party while you read. Your visit stays between you and this site.",
          ],
        },
        {
          title: "Your consent, and withdrawing it",
          body: [
            "The banner offers exactly two buttons and no tricks: “Accept all cookies” and “Only what is necessary”. Both work identically here, because we set nothing beyond what is necessary anyway. Accepting exists so you can tell us you read and agreed; the choice is recorded so the banner does not return.",
            "To change your mind at any time, open “Cookie settings” in the footer of every legal page and choose again, or clear this site's data in your browser. That erases every item above and signs you out.",
          ],
        },
      ]}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TERMS
   ════════════════════════════════════════════════════════════════════════════ */

export function TermsPage({ navigate }: { navigate: (to: string) => void }) {
  return (
    <DocPage
      navigate={navigate}
      title="The rules of the house"
      updated="October 11, 2025"
      intro="These terms are the agreement between you and The π Lab for using RELO. We have kept them short and readable on purpose. They set out what the service does, what you promise in return, and what happens when things go wrong."
      sections={[
        {
          title: "Acceptance",
          body: [
            "By creating an account, connecting an Instagram account, or using any part of RELO, you agree to these terms. If you are agreeing on behalf of a company or agency, you confirm you have the authority to bind that entity. If you do not agree with anything here, please do not use the service — we would rather lose a signup than argue later.",
            "You must be at least 16 years old, or the minimum digital-consent age in your country, to use RELO.",
          ],
        },
        {
          title: "What the service does",
          body: [
            "RELO watches the comments on reels you choose, matches keywords you define, publishes public replies and 3-button template DM cards through Instagram's official API, captures leads, and lets you message reachable audiences inside Meta's 24-hour window. Studio-tier features — the node canvas, extra accounts, and higher AI credit limits — are described on the pricing page.",
            "We may add, change, or retire features as the product grows. If we retire something you rely on, we will give you at least 30 days of notice by email.",
          ],
        },
        {
          title: "Your account and Meta permissions",
          body: [
            "You need an Instagram Professional (Creator or Business) account connected through Meta's official OAuth flow. You are responsible for keeping your account secure, for the accuracy of the information you provide, and for everything done through your connection.",
            "You grant RELO the Meta permissions required to deliver the features you enable — nothing broader. You can shrink or revoke those permissions at any time, understanding that revoked permissions stop the automations that need them.",
          ],
        },
        {
          title: "Acceptable use",
          body: [
            "RELO exists to make conversations more human, not less. You agree to use it lawfully and kindly, and specifically not to use it for spam, harassment, hate speech, scams, misleading financial schemes, or anything that violates Meta's Platform Terms, Community Standards, or applicable law.",
            "We built human-jitter timing, rate ceilings, and delivery caps into the engine to protect your account. You agree not to circumvent them, resell raw API access, or run RELO on accounts you do not own or administer.",
          ],
          list: [
            "No bulk unsolicited DMs outside the audiences and windows Meta allows",
            "No impersonating people or brands, and no AI replies pretending to be a human you are not",
            "No harvesting leads for use outside RELO's campaign tools",
            "One business per workspace unless you are on Studio or an agency plan",
          ],
        },
        {
          title: "Automation risk and your Meta account",
          body: [
            "RELO is an independent product built by The π Lab. We are not affiliated with, endorsed by, or sponsored by Meta Platforms, Instagram, or any of their subsidiaries. All trademarks belong to their owners, and references to them describe compatibility, not partnership.",
            "Automating any Instagram activity carries inherent risk set by Meta — not by us. Our human-jitter timing, rate ceilings, and delivery caps are engineered to keep your account safe, but no tool can promise zero risk, and we will never claim otherwise. You remain responsible for complying with Meta's Platform Terms and Community Standards, for what your automations send, and for the content you publish.",
          ],
        },
        {
          title: "Suspension and termination",
          body: [
            "You can stop using RELO and delete your workspace at any time from Settings. We may suspend or terminate an account that breaks these terms — especially spam or Meta-policy violations — with notice where the law and the situation allow it, and immediately where abuse threatens other users or the platform.",
            "If we terminate you for breach, no refund is due for the current period. If we retire the service entirely, we will give you at least 60 days to export your data.",
          ],
        },
      ]}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   NOT FOUND
   ════════════════════════════════════════════════════════════════════════════ */

export function NotFoundPage({ navigate }: { navigate: (to: string) => void }) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="relative min-h-screen bg-surface flex flex-col">
      <PageNav navigate={navigate} />
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 pt-32 text-center sm:px-8">
        <h1 className="h1 text-text">This page is not here.</h1>
        <p className="mt-4 text-sm text-text-2 leading-relaxed max-w-md mx-auto">
          The coordinates you followed do not point at anything we built. Let us walk
          you back to the studio.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <RButton onClick={() => navigate("/")}>
            Back home <span className="text-accent-hover">→</span>
          </RButton>
          <RButton variant="outline" onClick={() => navigate("/studio?demo=1")}>
            <Play className="size-4" /> Tour the studio
          </RButton>
        </div>
      </main>
      <PageFooter navigate={navigate} />
    </div>
  );
}
