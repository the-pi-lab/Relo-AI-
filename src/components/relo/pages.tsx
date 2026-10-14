"use client";

/**
 * RELO ESSENTIAL PAGES — privacy, terms, and the lost-in-space page.
 *
 * Same world as everywhere else: shader sky, ink stars, drifting dust,
 * grain, moon phases, a portal of glyphs. The law deserves a view too.
 */

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Mail, ShieldCheck, Instagram, Twitter, Youtube, Play, Cookie } from "lucide-react";
import { Logo, RButton, Reveal, Eyebrow } from "./chrome";
import { AsciiArt, AsciiFrame, portalScene, RAMPS } from "./ascii";
import { ShaderCanvas, Starfield, DustMotes, MoonPhases } from "./world";
import { ThemeToggle } from "@/lib/relo/theme";
import { CookieSettingsLink } from "./cookie-consent";

/* ── the sky every page shares ───────────────────────────────────────── */

function PageSky({ kind = "aurora" }: { kind?: "aurora" | "nebula" }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <ShaderCanvas kind={kind} opacity={0.9} />
      <Starfield density={80} opacity={0.7} />
      <DustMotes density={22} opacity={0.5} />
      <div className="dotgrid absolute -inset-10 opacity-40" />
    </div>
  );
}

/* ── capsule nav, shared by every page ───────────────────────────────── */

function PageNav({ navigate }: { navigate: (to: string) => void }) {
  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.28, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3"
    >
      <div className="glass flex w-full max-w-3xl items-center gap-3 rounded-full border border-line px-4 py-2 shadow-[0_10px_40px_-12px_rgba(4,3,9,0.5)]">
        <Logo onClick={() => navigate("/")} />
        <span className="ml-1 hidden font-mono text-[9.5px] uppercase tracking-[0.26em] text-ink-4 sm:block">
          the observatory
        </span>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <RButton variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="size-3.5" /> Home
          </RButton>
        </div>
      </div>
    </motion.header>
  );
}

/* ── footer with the legal links ─────────────────────────────────────── */

export function PageFooter({ navigate }: { navigate: (to: string) => void }) {
  return (
    <footer className="relative z-[2] border-t border-line">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-5 py-9 sm:flex-row sm:px-8">
        <Logo onClick={() => navigate("/")} />
        <div className="flex items-center gap-4 font-mono text-[11px] text-ink-4">
          <button onClick={() => navigate("/privacy")} className="cursor-pointer">
            Privacy
          </button>
          <span aria-hidden>·</span>
          <button onClick={() => navigate("/terms")} className="cursor-pointer">
            Terms
          </button>
          <span aria-hidden>·</span>
          <button onClick={() => navigate("/cookies")} className="cursor-pointer">
            Cookies
          </button>
          <span aria-hidden>·</span>
          <CookieSettingsLink />
          <span aria-hidden>·</span>
          <a href="mailto:hello@thepilab.in" className="inline-flex items-center gap-1.5">
            <Mail className="size-3" /> hello@thepilab.in
          </a>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          {[Instagram, Twitter, Youtube].map((Icon, i) => (
            <span
              key={i}
              aria-hidden
              className="grid size-9 place-items-center rounded-full border border-line text-ink-4"
            >
              <Icon className="size-4" />
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ── document shell: header + numbered sections + prose ─────────────── */

interface DocSection {
  title: string;
  body: string[];
  list?: string[];
}

function DocPage({
  navigate,
  eyebrow,
  title,
  accent,
  updated,
  intro,
  sections,
  figCaption,
}: {
  navigate: (to: string) => void;
  eyebrow: string;
  title: string;
  accent: string;
  updated: string;
  intro: string;
  sections: DocSection[];
  figCaption: string;
}) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="relative min-h-screen bg-paper">
      <PageSky />
      <PageNav navigate={navigate} />

      <main className="relative z-[2] mx-auto max-w-4xl px-5 pb-16 pt-32 sm:px-8 sm:pt-36">
        {/* header */}
        <Reveal>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="font-display mt-4 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            {title} <span className="serif-accent text-spectral">{accent}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-[15.5px] leading-[1.7] text-ink-2">{intro}</p>
          <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-4 tnum">
            last updated · {updated}
          </p>
        </Reveal>

        {/* the observatory plate — every document gets a view */}
        <Reveal delay={0.1} className="mt-10 max-w-md">
          <AsciiFrame fig="fig. 00" caption={figCaption} status="encrypted">
            <AsciiArt
              scene={portalScene}
              cols={56}
              aspect={0.78}
              ramp={RAMPS.classic}
              fontSize={6.5}
              melt={0.22}
              className="w-full"
              ariaLabel="A glowing portal drawn in ASCII characters"
            />
          </AsciiFrame>
        </Reveal>

        {/* sections */}
        <div className="mt-14 space-y-12">
          {sections.map((s, i) => (
            <Reveal key={s.title} delay={Math.min(0.08 * i, 0.3)}>
              <section aria-labelledby={`sec-${i}`}>
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-[12px] font-bold text-ember-hot tnum">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 id={`sec-${i}`} className="font-display text-[21px] font-bold tracking-tight">
                    {s.title}
                  </h2>
                </div>
                <div className="mt-4 space-y-3.5 pl-0 sm:pl-9">
                  {s.body.map((p, j) => (
                    <p key={j} className="max-w-2xl text-[14.5px] leading-[1.75] text-ink-2">
                      {p}
                    </p>
                  ))}
                  {s.list && (
                    <ul className="mt-2 space-y-2">
                      {s.list.map((li) => (
                        <li key={li} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-ink-2">
                          <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-ember" />
                          {li}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {i < sections.length - 1 && <div className="hairline-x mt-10" />}
              </section>
            </Reveal>
          ))}
        </div>

        {/* closing moon strip */}
        <div className="mt-16 flex flex-col items-center gap-4">
          <MoonPhases active={4} />
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone-dim/80">
            questions → hello@thepilab.in
          </p>
        </div>
      </main>

      <PageFooter navigate={navigate} />
    </div>
  );
}

/* ═══════════════ PRIVACY POLICY ═══════════════ */

export function PrivacyPage({ navigate }: { navigate: (to: string) => void }) {
  return (
    <DocPage
      navigate={navigate}
      eyebrow="Privacy policy"
      title="Your data stays"
      accent="yours."
      updated="October 11, 2025"
      intro="RELO automates conversations you already have permission to have — through Instagram's official API. This policy explains, in plain language, exactly what touches our servers, what never does, and how to take everything back with one click. It is written to comply with India\u2019s Digital Personal Data Protection Act, 2023 (the \u201cDPDP Act\u201d), and we hold ourselves to that standard for everyone, everywhere."
      figCaption="the token vault — every key sealed, none readable"
      sections={[
        {
          title: "Who we are",
          body: [
            "RELO is built by The π Lab (\u201cwe\u201d, \u201cus\u201d), a software studio based in India. We provide an Instagram automation platform that replies to comments, sends template DMs, and captures leads on behalf of creators. You can reach a human at hello@thepilab.in for anything privacy-related — a person reads every message, not a ticket queue.",
            "Under the DPDP Act, The \u03c0 Lab is the Data Fiduciary for your account information, billing records, and the lead data processed through your automations. When you collect leads from your own audience, you decide the purpose of that messaging \u2014 the Act calls you the one setting those purposes, and we hand you the tools (one-click export, deletion, delivery logs) to meet that responsibility.",
          ],
        },
        {
          title: "What we collect",
          body: [
            "We collect the minimum the product needs to function. When you connect an account, Meta shares your Instagram Professional account ID, display name, and follower relationship status for people who interact with your automations. When someone triggers a flow, we store their username, whether they follow you, which keyword they used, and which DM button they clicked.",
            "We also keep operational records — automation settings you write, delivery logs, aggregate counters (DMs sent, clicks, replies), and basic device/browser metadata for security and debugging. If you are in India, this section is the notice at the moment of collection that the DPDP Act asks for \u2014 delivered in plain language, listing every category, with nothing waiting in a footnote.",
          ],
          list: [
            "Account: email, plan, connected Instagram account ID",
            "Leads: username, follower status, keyword matched, button clicked, optional email you collect",
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
            "We use aggregated, de-identified counters (like total DMs sent across the platform) to keep the engine healthy and to price plans honestly. We do not build advertising profiles, and we do not use your content to train models. Your data is never repurposed: nothing collected for one reason is quietly used for another without asking you again.",
          ],
        },
        {
          title: "Consent, and taking it back",
          body: [
            "Under the DPDP Act we may process your personal data only with your consent, for the purposes you were told about, and nothing beyond them. You give that consent when you create an account, connect a Meta account through their official screen, or switch on a feature that needs new data. Every consent request tells you what is collected and why \u2014 we do not bundle consent into fine print, and we do not make the product conditional on data it does not truly need.",
            "You can withdraw any consent as easily as you gave it: disconnect the Meta account, delete an automation, wipe a lead list, or delete the whole workspace. Withdrawal stops all processing going forward, takes effect immediately, and costs you nothing. We will never nag, guilt-trip, or dark-pattern you into staying.",
          ],
        },
        {
          title: "Meta permissions and revocation",
          body: [
            "RELO operates entirely on the official Meta Graph API with scopes you can inspect during connection. You can revoke RELO's access at any time from Instagram → Settings → Website permissions → Apps and websites, or from the Connections screen in RELO. Revocation takes effect immediately: every automation stops, and your stored access token is destroyed on the next engine cycle.",
            "Disconnecting stops all processing. Your leads and settings stay in your workspace for 30 days in case you reconnect, after which they are permanently deleted unless you export them first.",
          ],
        },
        {
          title: "Storage and security",
          body: [
            "Access tokens are encrypted at rest with AES-256-GCM inside a dedicated vault service with key rotation; no employee can read them in plaintext. Data travels over TLS 1.3, secrets are never logged, and internal access to production data requires two-person approval and is fully audit-logged.",
            "Infrastructure runs on isolated, regularly patched services. Every major release passes a documented internal security review before it ships, and we keep an incident-response runbook with a 72-hour notification commitment to affected customers. No system is perfect \u2014 if something ever goes wrong, you will hear it from us first, in plain language, with what happened and what we did about it.",
          ],
        },
        {
          title: "Your rights under the DPDP Act",
          body: [
            "Your leads are yours — export the complete book to CSV with one click at any time, or delete a single lead from the Leads view. Deleting your workspace removes your account, automations, lead data, and analytics within 30 days, except where we must keep billing records for tax law.",
            "The Act gives you \u2014 the Data Principal \u2014 rights we honour without a lawyer\u2019s letter: ask what we hold, get a portable copy, correct anything inaccurate, have it erased when the purpose is done, and, once a framework is notified, nominate someone to exercise your rights if you cannot. Write to hello@thepilab.in from your account email; verified requests get a substantive answer within 30 days. If you are in the EEA or UK, you can additionally object to processing and complain to your local supervisory authority. Exercising your rights never changes your price or your features.",
          ],
          list: [
            "Access \u2014 a readable summary of everything we hold about you",
            "Correction \u2014 fix inaccurate or incomplete data",
            "Erasure \u2014 delete data the purpose no longer needs",
            "Grievance redressal \u2014 a fast, documented answer to any complaint (see below)",
            "Nomination \u2014 choose another individual to act for you if you cannot",
          ],
        },
        {
          title: "Children\u2019s data",
          body: [
            "RELO is a tool for working creators and businesses \u2014 it is not meant for children. You must be at least 18 to create an account, which is the age of consent under the DPDP Act. We do not knowingly process the data of anyone younger, we do not run tracking or targeted advertising directed at children, and we do not process a child\u2019s data in any way likely to harm their well-being.",
            "If you believe a child\u2019s data has reached us \u2014 say, through a comment on a creator\u2019s reel \u2014 write to hello@thepilab.in and we will delete it promptly after verifying the request.",
          ],
        },
        {
          title: "How long we keep things",
          body: [
            "We keep data only as long as the purpose you consented to needs it, plus a short grace window in case you change your mind. Lead data and workspace content live while your account is active; after you delete a workspace we hold everything for 30 days in case you reconnect, then erase it permanently. Billing records stay for 8 years because tax law requires it, and de-identified aggregate counters may be kept indefinitely because they describe no one.",
          ],
        },
        {
          title: "Third-party services and embeddings",
          body: [
            "The RELO website and app contain no third-party embeds \u2014 no social widgets, no analytics iframes, no advertising tags, and no fonts loaded from someone else\u2019s servers (typefaces are self-hosted, so your browser never phones Google just to render this page). Nothing on this site can report your visit to a company you never chose.",
            "Inside the product, exactly three processors touch data on our behalf, each bound by contract: Meta Platforms (delivering comments, replies, and DMs through the official Graph API), our AI model provider (only when you enable AI replies \u2014 it receives your prompt and short context and does not retain them for training), and our hosting provider (encrypted storage and compute). No one else. The full, current list is always available on request.",
          ],
        },
        {
          title: "Where data lives",
          body: [
            "Data is stored on infrastructure hosted in India where practical, with backups in the nearest compliant region. The DPDP Act permits transfers abroad except to countries the government restricts; we keep per-user data within compliant regions and will tell you before that ever changes. Meta processes message delivery under its own global terms, which you accepted when you created your Meta account.",
          ],
        },
        {
          title: "Cookies and local storage",
          body: [
            "The RELO app uses a single first-party session cookie to keep you signed in, and localStorage to remember your theme (night or daybreak), your cookie choice, and your demo-studio state on your own device. We do not use third-party advertising or tracking cookies — no pixels, no fingerprinting, no cross-site anything.",
            "The complete, boringly-honest inventory lives on the cookie policy page, and a \u201ccookie settings\u201d link in every footer lets you change your mind at any time.",
          ],
        },
        {
          title: "Grievance redressal",
          body: [
            "If anything here worries you, tell us first \u2014 most problems are one misunderstood automation away from a fix. Write to our Grievance Officer at hello@thepilab.in with the subject line \u201cPrivacy grievance\u201d; include the email on your account and what went wrong. You will get an acknowledgment within 48 hours and a substantive reply within 30 days, as the Act requires. If our answer does not satisfy you, you may escalate to the Data Protection Board of India once it is operational, or to your local supervisory authority if you are elsewhere.",
          ],
        },
        {
          title: "Changes to this policy",
          body: [
            "If we change how we handle data, we will update this page, bump the date above, and — for material changes — email every account holder at least 14 days before the change takes effect. Continued use after that window means you accept the updated policy; if you do not, you can export and delete your data before it applies.",
          ],
        },
      ]}
    />
  );
}

/* ═══════════════ COOKIE POLICY ═══════════════ */

export function CookiesPage({ navigate }: { navigate: (to: string) => void }) {
  return (
    <DocPage
      navigate={navigate}
      eyebrow="Cookie policy"
      title="Everything this site"
      accent="keeps."
      updated="October 11, 2025"
      intro="This page is the complete inventory of what RELO stores on your device — nothing hidden behind “and partners”. We use no third-party cookies, no trackers, and no embeds: everything listed below is first-party, readable only by this site, and erasable by you in one move. The banner you met on arrival is the only gatekeeper, and it plays no games."
      figCaption="the cookie jar — small, labelled, honest"
      sections={[
        {
          title: "What cookies and local storage are",
          body: [
            "A cookie is a tiny text file a website asks your browser to keep, so it can remember something between visits — that you are signed in, for instance. Local storage is the same idea kept inside your browser itself: no expiry, no network traffic, readable by the site and nothing else. Both are ordinary tools; what matters is what goes into them, and who else can read it. Here, the answer is nobody.",
          ],
        },
        {
          title: "The complete list — everything we store",
          body: [
            "There are exactly four things. This is the whole list; if your browser ever shows more on this site, it came from your own typing, not from us.",
          ],
          list: [
            "relo-session (first-party cookie) — keeps you signed in between visits; without it every page load would log you out. Deleted when you sign out.",
            "relo-theme (local storage) — remembers whether you chose the night sky or the daybreak. Contains one word.",
            "relo-cookie-consent (local storage) — remembers your answer to the cookie banner, so it never nags you twice. Contains your choice and the date you made it.",
            "relo-studio (local storage) — saves your demo workspace (sample automations, leads, flows) so the studio survives a refresh while you explore.",
          ],
        },
        {
          title: "What we never store, and never will",
          body: [
            "No analytics cookies — we do not count you, profile you, or watch you scroll. No advertising cookies, no retargeting pixels, no device fingerprinting. No social-media widgets quietly reporting your visit to another company. No third-party embeds of any kind — an iframe loading someone else's page inside ours is just a cookie with a passport, so there are none.",
            "Even our webfonts are self-hosted, so your browser never contacts Google Fonts or any other third party while you read. Your visit stays between you and this site — the way a conversation should.",
          ],
        },
        {
          title: "Third parties, precisely",
          body: [
            "So this page answers the question completely: no third party receives data from your visit to the website itself. Inside the product, three processors touch data only after you explicitly connect an account — Meta (delivering your automations via the official API), our AI model provider (only if you enable AI replies), and our hosting provider (storage and compute). Each is described in the privacy policy, and none of them sets cookies on this site.",
          ],
        },
        {
          title: "Your consent, and withdrawing it",
          body: [
            "Under the DPDP Act your consent must be free, specific, informed, unconditional, and as easy to withdraw as it was to give — so the banner offers exactly two buttons and no tricks: “Accept all cookies” and “Only what's necessary”. Both work identically here, because we set nothing beyond what is necessary anyway. Accepting exists so you can tell us you read and agreed; the choice is recorded so the banner does not return.",
            "To change your mind at any time: open “Cookie settings” in the footer of every legal page and choose again, or clear this site's data in your browser — that erases every item in the list above and signs you out. Withdrawing consent never breaks the parts of the site that do not need it: reading these pages works perfectly with everything wiped.",
          ],
        },
        {
          title: "Strictly necessary, all of it",
          body: [
            "Every item in our list qualifies as strictly necessary under every cookie law we know — there is no “marketing” drawer waiting behind a permission wall. The session cookie keeps you signed in; the theme key saves you a flash of the wrong sky; the consent key remembers your answer; the studio key holds the demo you asked to tour. That is the entire universe of what we keep on your device.",
          ],
        },
        {
          title: "Questions",
          body: [
            "Anything about this list can be asked at hello@thepilab.in — a person answers, usually within one business day. If you want the wider picture of how RELO handles personal data (not just what your browser keeps), the privacy policy is the fuller document.",
          ],
        },
      ]}
    />
  );
}

/* ═══════════════ TERMS OF SERVICE ═══════════════ */

export function TermsPage({ navigate }: { navigate: (to: string) => void }) {
  return (
    <DocPage
      navigate={navigate}
      eyebrow="Terms of service"
      title="The rules of"
      accent="the house."
      updated="October 11, 2025"
      intro="These terms are the agreement between you and The π Lab for using RELO. We have kept them short and readable on purpose — they set out what the service does, what you promise in return, and what happens when things go wrong."
      figCaption="the front door — read this before you step in"
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
            "RELO watches the comments on reels you choose, matches keywords you define, publishes public replies and 3-button template DM cards through Instagram's official API, captures leads, and lets you message reachable audiences inside Meta's 24-hour window. The scope of Studio-tier features — the node canvas, extra accounts, and higher AI credit limits — is described on the pricing page.",
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
            "RELO exists to make conversations more human, not less. You agree to use it lawfully and kindly, and specifically NOT to use it for spam, harassment, hate speech, scams, misleading financial schemes, or anything that violates Meta's Platform Terms, Community Standards, or applicable law.",
            "We built human-jitter timing, rate ceilings, and delivery caps into the engine to protect your account; you agree not to circumvent them, resell raw API access, or run RELO on accounts you do not own or administer.",
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
            "Honesty first: RELO is an independent product built by The π Lab. We are not affiliated with, endorsed by, or sponsored by Meta Platforms, Instagram, or any of their subsidiaries. All trademarks belong to their owners, and references to them describe compatibility, not partnership.",
            "Automating any Instagram activity carries inherent risk set by Meta — not by us. Our human-jitter timing, rate ceilings, and delivery caps are engineered to keep your account safe, but no tool can promise zero risk, and we will never claim otherwise. You remain responsible for complying with Meta's Platform Terms and Community Standards, for what your automations send, and for the content you publish. If Meta changes its rules, some features may need to change too — we will tell you what and why.",
          ],
        },
        {
          title: "Plans, billing, and AI credits",
          body: [
            "Paid plans bill monthly or annually in advance, in INR or USD as shown at checkout. You can cancel anytime; your plan stays active until the end of the paid period, and we do not pro-rate partial months. Annual plans come with two months free and can be refunded within 7 days of purchase if you have sent fewer than 100 DMs.",
            "AI credits refill with each billing cycle, do not roll over, and are consumed per AI-generated reply. Free-tier limits — one automated reel and three credits — are per workspace.",
          ],
        },
        {
          title: "Your content and your leads",
          body: [
            "You own everything you create: your reply copy, DM cards, flows built on the canvas, and every lead you collect. We claim no ownership over any of it. You grant us only the limited license needed to store, process, and transmit that content to deliver the service.",
            "If you delete your workspace, that content is gone for good after the 30-day grace window described in the privacy policy.",
          ],
        },
        {
          title: "Availability, beta features, and support",
          body: [
            "We target 99.5% monthly availability for the core engine, excluding scheduled maintenance and forces beyond our control (Meta API outages included). The node canvas and AI reply features are marked beta while they mature: they may change quickly, and their output should always get a human read before you rely on it.",
            "Support runs over email, with priority queues for Studio plans. We respond to every message — typical first reply within one business day.",
          ],
        },
        {
          title: "Suspension and termination",
          body: [
            "You can stop using RELO and delete your workspace at any time from Settings. We may suspend or terminate an account that breaks these terms — especially spam or Meta-policy violations — with notice where the law and the situation allow it, and immediately where abuse threatens other users or the platform.",
            "If we terminate you for breach, no refund is due for the current period. If we retire the service entirely, we will give you at least 60 days to export your data.",
          ],
        },
        {
          title: "Disclaimers and liability",
          body: [
            "RELO is provided \u201cas is\u201d. To the maximum extent permitted by law, we disclaim implied warranties of merchantability and fitness for a particular purpose. We do not guarantee specific business outcomes — follower growth, replies, or revenue are yours to earn.",
            "To the extent permitted by law, our total liability for any claim relating to the service is limited to the amount you paid us in the 12 months before the claim. Neither of us is liable for indirect or consequential damages. Nothing here limits liability that cannot be limited by law.",
          ],
        },
        {
          title: "Changes and contact",
          body: [
            "We may update these terms as the product and the law evolve. Material changes get 14 days of notice by email before they apply, and the date at the top of this page always shows when they were last revised.",
            "Questions, disputes, or legal notices go to hello@thepilab.in, or by post to The π Lab, Bengaluru, India. Indian law governs these terms, with courts in Bengaluru having exclusive jurisdiction — though we would always rather fix a problem over email first.",
          ],
        },
      ]}
    />
  );
}

/* ═══════════════ NOT FOUND — lost in space ═══════════════ */

export function NotFoundPage({ navigate }: { navigate: (to: string) => void }) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-paper px-5">
      <PageSky kind="nebula" />
      <PageNav navigate={navigate} />

      <div className="relative z-[2] flex flex-col items-center pb-16 pt-28 text-center">
        <Reveal>
          <Eyebrow className="justify-center">error 404 · off the star chart</Eyebrow>
          <h1 className="font-display mt-4 text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            This page drifted <span className="serif-accent text-spectral">out of orbit.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-ink-3">
            The coordinates you followed do not point at anything we built. The stars
            here are uncharted — let us walk you back to the observatory.
          </p>
        </Reveal>

        <Reveal delay={0.12} className="mt-10 w-[240px]">
          <AsciiFrame fig="fig. ∅" caption="uncharted coordinates" status="lost">
            <AsciiArt
              scene={portalScene}
              cols={56}
              aspect={0.78}
              ramp={RAMPS.classic}
              fontSize={6.5}
              melt={0.3}
              className="w-full"
              ariaLabel="A glowing portal drawn in ASCII characters"
            />
          </AsciiFrame>
        </Reveal>

        <Reveal delay={0.2} className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <RButton onClick={() => navigate("/")}>
            Back to the observatory <ArrowRight className="size-4" />
          </RButton>
          <RButton variant="outline" onClick={() => navigate("/studio?demo=1")}>
            <Play className="size-4" /> Tour the studio
          </RButton>
        </Reveal>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-[2]">
        <PageFooter navigate={navigate} />
      </div>
    </div>
  );
}
