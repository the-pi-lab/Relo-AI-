"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button, Container, Logo } from "./chrome";
import { CookieSettingsLink } from "./cookie-consent";
import { LiquidBackdrop } from "./ambient";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Legal documents and the error page.

   The policy pages carry real substance, so they get a real reading layout:
   a sticky contents rail on the left, a measured column on the right, and
   numbered sections separated by hairlines.
   ========================================================================== */

function DocNav({ navigate }: { navigate: (to: string) => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <Container className="flex h-16 items-center gap-3">
        <Logo onClick={() => navigate("/")} />
        <span className="caption ml-1 hidden sm:block">Legal</span>
        <div className="ml-auto flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            Back to site
          </Button>
        </div>
      </Container>
    </header>
  );
}

function DocFooter({ navigate }: { navigate: (to: string) => void }) {
  return (
    <footer className="border-t border-line bg-canvas/70 backdrop-blur-xl">
      <Container className="flex flex-col gap-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <Logo onClick={() => navigate("/")} />
        <nav
          aria-label="Legal"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-ink-3"
        >
          <button
            type="button"
            onClick={() => navigate("/privacy")}
            className="transition-colors hover:text-ink"
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => navigate("/terms")}
            className="transition-colors hover:text-ink"
          >
            Terms
          </button>
          <button
            type="button"
            onClick={() => navigate("/cookies")}
            className="transition-colors hover:text-ink"
          >
            Cookies
          </button>
          <button
            type="button"
            onClick={() => navigate("/data-deletion")}
            className="transition-colors hover:text-ink"
          >
            Data Deletion
          </button>
          <CookieSettingsLink />
          <a
            href="mailto:hello@thepilab.in"
            className="font-medium text-signal underline decoration-signal/35 underline-offset-2 transition-colors hover:decoration-signal"
          >
            hello@thepilab.in
          </a>
        </nav>
      </Container>
    </footer>
  );
}

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
  const [active, setActive] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const goTo = (i: number) => {
    setActive(i);
    document.getElementById(`doc-sec-${i}`)?.scrollIntoView({ block: "start" });
  };

  return (
    <div className="relative min-h-screen">
      <LiquidBackdrop variant="page" />
      <DocNav navigate={navigate} />

      <div className="border-b border-line">
        <Container className="py-14 md:py-20">
          <p className="caption">Legal · updated {updated}</p>
          <h1 className="h1 mt-5 max-w-3xl text-ink">{title}</h1>
          <p className="lead mt-5 max-w-3xl">{intro}</p>
        </Container>
      </div>

      <Container className="grid gap-12 py-14 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16 lg:py-20">
        {/* Contents rail. Sticky, because these are long documents. */}
        <nav aria-label="Contents" className="lg:sticky lg:top-24 lg:self-start">
          <p className="caption mb-4">Contents</p>
          <ol className="space-y-1">
            {sections.map((s, i) => (
              <li key={s.title}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={active === i ? "true" : undefined}
                  className={cn(
                    "flex w-full gap-3 rounded-md px-2.5 py-2 text-left text-[13px] leading-snug transition-colors duration-150 ease-out",
                    active === i
                      ? "bg-surface-2 font-semibold text-ink"
                      : "text-ink-3 hover:bg-surface-2 hover:text-ink"
                  )}
                >
                  <span className="font-mono text-[11px] text-ink-3 tnum">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.title}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0">
          {sections.map((s, i) => (
            <section
              key={s.title}
              id={`doc-sec-${i}`}
              aria-labelledby={`doc-h-${i}`}
              className="scroll-mt-24 border-t border-line py-10 first:border-t-0 first:pt-0"
            >
              <h2 id={`doc-h-${i}`} className="h3 text-ink">
                <span className="font-mono text-[13px] font-medium text-signal tnum">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="ml-3">{s.title}</span>
              </h2>

              <div className="mt-5 space-y-4">
                {s.body.map((p, j) => (
                  <p key={j} className="max-w-[68ch] text-[15px] leading-relaxed text-ink-2">
                    {p}
                  </p>
                ))}
              </div>

              {s.list && (
                <ul className="mt-6 max-w-[68ch] divide-y divide-line border-y border-line">
                  {s.list.map((li) => (
                    <li key={li} className="flex gap-3.5 py-3 text-[14.5px] leading-relaxed text-ink-2">
                      <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-signal" aria-hidden />
                      {li}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-surface p-5">
            <p className="text-[13.5px] text-ink-2">
              Something here unclear? A person reads every message.
            </p>
            <a
              href="mailto:hello@thepilab.in"
              className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-signal transition-colors hover:text-signal-hover"
            >
              hello@thepilab.in
              <ArrowRight className="size-3.5" aria-hidden />
            </a>
          </div>
        </div>
      </Container>

      <DocFooter navigate={navigate} />
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
      updated="October 24, 2026"
      intro="RELO automates conversations you already have permission to have, through Instagram's official API. This page explains in plain language what touches our servers, what never does, and how to take everything back in one move. It follows India's Digital Personal Data Protection Act, 2023, and we hold ourselves to that standard for everyone, everywhere."
      sections={[
        {
          title: "Who we are",
          body: [
            "RELO is built by The Pi Lab, a software studio based in India. We provide an Instagram automation platform that replies to comments, sends template DMs, and captures leads on behalf of creators. You can reach a human at hello@thepilab.in for anything privacy related. A person reads every message, not a ticket queue.",
            "Under the DPDP Act, The Pi Lab is the Data Fiduciary for your account information, billing records, and the lead data processed through your automations. When you collect leads from your own audience, you decide the purpose of that messaging. We hand you the tools to meet that responsibility: one-click export, deletion, and delivery logs.",
          ],
        },
        {
          title: "What we collect",
          body: [
            "We collect the minimum the product needs to function. When you connect an account, Meta shares your Instagram Professional account ID and display name. When someone triggers a flow, we store their username, which keyword they used, and which DM button they tapped.",
            "We also keep operational records: the automation settings you write, delivery logs, aggregate counters such as DMs sent, clicks and replies, and basic device or browser metadata for security and debugging.",
          ],
          list: [
            "Account: email, plan, connected Instagram account ID",
            "Leads: username, keyword matched, button tapped",
            "Content you write: replies, DM cards, follow-up texts, AI prompts",
            "Usage: delivery outcomes, timestamps, error logs",
          ],
        },
        {
          title: "What we never collect",
          body: [
            "We never ask for your Instagram or Facebook password. Connection happens entirely inside Meta's official OAuth screen and the credentials stay with Meta. We do not read direct-message history beyond the threads our automations send, we do not scrape profiles, and we do not sell, rent or trade data with brokers or advertising networks.",
            "The AI reply feature sends only the prompt and the short context you configure to the model provider. It never sends your full lead list, and never your followers' identities beyond what a single reply needs.",
          ],
        },
        {
          title: "How your data is used",
          body: [
            "Your data is used to run the service you switched on: matching keywords, sending your replies and DM cards, timing follow-ups, and showing you analytics. Lead records power your searchable audience, your CSV export, and campaign delivery inside Meta's 24-hour window.",
            "We use aggregated and de-identified counters to keep the engine healthy and to price plans honestly. We do not build advertising profiles and we do not train models on your content. Nothing collected for one reason is quietly used for another without asking you again.",
          ],
        },
        {
          title: "Consent, and taking it back",
          body: [
            "Under the DPDP Act we may process your personal data only with your consent, only for the purposes you were told about, and nothing beyond them. You give that consent when you create an account, connect a Meta account through their official screen, or switch on a feature that needs new data. Every request tells you what is collected and why. We do not bury consent in fine print and we do not make the product conditional on data it does not truly need.",
            "You can withdraw any consent as easily as you gave it. Disconnect the Meta account, delete an automation, wipe a lead list, or delete the whole workspace. Withdrawal stops all processing going forward, takes effect immediately, and costs you nothing.",
          ],
        },
        {
          title: "Your rights under the DPDP Act",
          body: [
            "Your leads are yours. Export the complete book to CSV with one click at any time, or remove a single lead from the Leads view. Deleting your workspace removes your account, automations, lead data and analytics within 30 days, except where tax law requires us to keep billing records.",
            "The Act gives you, as the Data Principal, rights we honour without a lawyer's letter: ask what we hold, get a portable copy, correct anything inaccurate, have it erased once the purpose is done, and nominate somebody to act for you if you cannot. Write to hello@thepilab.in from your account email and a verified request receives a substantive answer within 30 days.",
          ],
          list: [
            "Access: a readable summary of everything we hold about you",
            "Correction: fix inaccurate or incomplete data",
            "Erasure: delete data the purpose no longer needs",
            "Grievance redressal: a fast, documented answer to any complaint",
            "Nomination: choose another person to act for you if you cannot",
          ],
        },
      ]}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COOKIES
   ═══════════════════════════════════════════════════════════════════════════ */

export function CookiesPage({ navigate }: { navigate: (to: string) => void }) {
  return (
    <DocPage
      navigate={navigate}
      title="What this site stores on your device"
      updated="October 24, 2026"
      intro="This is the complete inventory, taken straight from the code, with nothing hidden behind the phrase and partners. RELO sets no cookies at all. What it does keep lives in your own browser's local storage, is readable only by this site, and can be erased in one move."
      sections={[
        {
          title: "The complete list",
          body: [
            "There are exactly four entries and they are all local storage, not cookies. This is the whole list. If your browser ever shows anything else on this domain, it came from your own typing or from an extension, not from us.",
          ],
          list: [
            "relo-theme: remembers whether you chose light, dark or system. Contains one word.",
            "relo-storage-notice: remembers that you read the notice so it stops appearing.",
            "relo.token.v1: your signed-in session, so a refresh does not sign you out. Removed when you sign out.",
            "relo.user.v1: the email and plan shown in the studio header. Removed when you sign out.",
          ],
        },
        {
          title: "What we never store",
          body: [
            "No analytics cookies, so we do not count you, profile you or watch you scroll. No advertising cookies, no retargeting pixels, no device fingerprinting. No social widgets reporting your visit to another company, and no third-party embeds of any kind.",
            "Even the fonts are self-hosted through the application bundle, so your browser never contacts Google Fonts or anybody else while you read. Your visit stays between you and this site.",
          ],
        },
        {
          title: "Dismissing the notice, and withdrawing consent",
          body: [
            "The notice has one button because there is only one kind of storage here. Dismissing it simply records that you read it, so it does not return.",
            "To change your mind, open Browser storage in the footer of any legal page, sign out from Settings, or clear this site's data in your browser. That erases all four entries above and signs you out.",
          ],
        },
      ]}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TERMS
   ═══════════════════════════════════════════════════════════════════════════ */

export function TermsPage({ navigate }: { navigate: (to: string) => void }) {
  return (
    <DocPage
      navigate={navigate}
      title="The rules of the house"
      updated="October 24, 2026"
      intro="These terms are the agreement between you and The Pi Lab for using RELO. They are kept short and readable on purpose. They set out what the service does, what you promise in return, and what happens when something goes wrong."
      sections={[
        {
          title: "Acceptance",
          body: [
            "By creating an account, connecting an Instagram account, or using any part of RELO, you agree to these terms. If you are agreeing on behalf of a company or agency, you confirm you have the authority to bind that entity. If you disagree with anything here, please do not use the service. We would rather lose a signup than argue later.",
            "You must be at least 16 years old, or the minimum digital consent age in your country, to use RELO.",
          ],
        },
        {
          title: "What the service does",
          body: [
            "RELO watches the comments on the Reels you choose, matches the keywords you define, publishes public replies and three-button template DM cards through Instagram's official API, captures leads, and lets you message reachable audiences inside Meta's 24-hour window. Studio-tier features, namely the node canvas, extra connected accounts and higher AI credit limits, are described on the pricing page.",
            "We may add, change or retire features as the product grows. If we retire something you rely on, we will give you at least 30 days of notice by email.",
          ],
        },
        {
          title: "Your account and Meta permissions",
          body: [
            "You need an Instagram Professional account, Creator or Business, connected through Meta's official OAuth flow. You are responsible for keeping your account secure, for the accuracy of the information you provide, and for everything done through your connection.",
            "You grant RELO the Meta permissions required to deliver the features you enable, and nothing broader. You can shrink or revoke those permissions at any time, understanding that revoked permissions stop the automations that depend on them.",
          ],
        },
        {
          title: "Acceptable use",
          body: [
            "RELO exists to make conversations more human, not less. You agree to use it lawfully and kindly, and specifically not for spam, harassment, hate speech, scams, misleading financial schemes, or anything that violates Meta's Platform Terms, Community Standards or applicable law.",
            "Human pacing, rate ceilings and delivery caps are built into the engine to protect your account. You agree not to circumvent them, not to resell raw API access, and not to run RELO on accounts you do not own or administer.",
          ],
          list: [
            "No bulk unsolicited DMs outside the audiences and windows Meta allows",
            "No impersonating people or brands, and no AI replies pretending to be a human you are not",
            "No harvesting leads for use outside RELO's own campaign tools",
            "One business per workspace unless you are on Studio or an agency plan",
          ],
        },
        {
          title: "Automation risk and your Meta account",
          body: [
            "RELO is an independent product built by The Pi Lab. We are not affiliated with, endorsed by or sponsored by Meta Platforms, Instagram, or any of their subsidiaries. All trademarks belong to their owners, and any reference to them describes compatibility, not partnership.",
            "Automating any Instagram activity carries inherent risk, and that risk is set by Meta rather than by us. Our pacing, rate ceilings and delivery caps are engineered to keep your account safe, but no tool can promise zero risk and we will never claim otherwise. You remain responsible for complying with Meta's Platform Terms and Community Standards, for what your automations send, and for the content you publish.",
          ],
        },
        {
          title: "Suspension and termination",
          body: [
            "You can stop using RELO and delete your workspace at any time from Settings. We may suspend or terminate an account that breaks these terms, especially for spam or Meta policy violations, with notice where the law and the situation allow it, and immediately where abuse threatens other users or the platform.",
            "If we terminate you for breach, no refund is due for the current period. If we retire the service entirely, we will give you at least 60 days to export your data.",
          ],
        },
      ]}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   NOT FOUND
   ═══════════════════════════════════════════════════════════════════════════ */

export function NotFoundPage({ navigate }: { navigate: (to: string) => void }) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col">
      <LiquidBackdrop variant="page" />
      <DocNav navigate={navigate} />

      <div className="flex flex-1 items-center">
        <Container className="py-20">
          <p className="font-mono text-[13px] font-semibold tracking-[0.12em] text-signal">
            404
          </p>
          <h1 className="h1 mt-5 max-w-2xl text-ink">
            This page is not here.
          </h1>
          <p className="lead mt-5 max-w-xl">
            The link you followed does not point at anything we built. The studio is
            still exactly where you left it.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button variant="signal" size="lg" onClick={() => navigate("/")}>
              Back home
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/login")}
            >
              Sign in
            </Button>
          </div>
        </Container>
      </div>

      <DocFooter navigate={navigate} />
    </div>
  );
}
