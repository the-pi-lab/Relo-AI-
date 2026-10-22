"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { Button, Container, Logo, Pill } from "./chrome";
import { ThemeToggle } from "@/lib/relo/theme";
import { cn } from "@/lib/utils";
import { BrandAurora, LiquidBackdrop } from "./ambient";
import { ReadingProgress, Reveal, Tilt } from "./motion";

/* ==========================================================================
   Marketing surface.

   The page has one material (liquid glass), one light field (amethyst + cyan),
   one editorial voice (grotesque with a single italic serif accent), and one
   motion rhythm. Product UI is the only "illustration": no fake logos, no
   invented dashboards, no floating objects that do not exist in RELO.
   ========================================================================== */

const NAV = [
  { id: "how", label: "How it works" },
  { id: "capabilities", label: "What it does" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "Questions" },
];

/* ── Header ─────────────────────────────────────────────────────────────── */

function Header({ navigate }: { navigate: (to: string) => void }) {
  const [open, setOpen] = useState(false);
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const jump = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  };

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4">
      <Container className="!px-0">
        <div
          className={cn(
            "glass-chip flex h-14 items-center gap-2 rounded-full px-3 pl-4 transition-[background-color,box-shadow,border-color] duration-300 sm:px-4 sm:pl-5",
            lifted
              ? "bg-canvas/70 shadow-[0_18px_50px_-28px_rgb(0_0_0/0.55)]"
              : "bg-canvas/35"
          )}
        >
          <Logo onClick={() => navigate("/")} />

          <nav aria-label="Sections" className="ml-6 hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => jump(n.id)}
                className="group relative rounded-full px-3 py-2 text-[13px] font-medium text-ink-2 transition-colors duration-200 hover:text-ink"
              >
                {n.label}
                <span
                  aria-hidden
                  className="absolute inset-x-3 bottom-1 h-px origin-left scale-x-0 bg-gradient-to-r from-signal to-brand-line transition-transform duration-300 group-hover:scale-x-100"
                />
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle className="hidden sm:inline-flex" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/login")}
              className="hidden rounded-full sm:inline-flex"
            >
              Sign in
            </Button>
            <Button
              variant="signal"
              size="sm"
              onClick={() => navigate("/login")}
              className="rounded-full px-4"
            >
              Start free
            </Button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="grid size-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-white/5 hover:text-ink lg:hidden"
            >
              {open ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong mt-2 rounded-3xl p-2 lg:hidden"
            >
              <div className="flex flex-col">
                {NAV.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => jump(n.id)}
                    className="rounded-2xl px-4 py-3 text-left text-[14px] font-medium text-ink-2 transition-colors hover:bg-white/5 hover:text-ink"
                  >
                    {n.label}
                  </button>
                ))}
                <div className="mt-2 flex items-center justify-between border-t border-line/70 px-2 pt-3">
                  <ThemeToggle />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setOpen(false);
                      navigate("/login");
                    }}
                  >
                    Sign in
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </header>
  );
}

/* ── The hero visual: the actual thing the product sends ────────────────── */

function CommentToDm() {
  const reduce = useReducedMotion();

  return (
    <div className="relative mx-auto max-w-[520px]">
      {/* The only glow in the hero comes from the product itself. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 rounded-[48px] bg-[radial-gradient(closest-side,var(--glow-1),transparent_72%)] opacity-70"
      />

      {/* A real number from the product, pinned to the surface. */}
      <div className="glass-chip absolute -right-2 top-20 z-20 hidden rounded-full px-3 py-2 lg:flex lg:flex-col lg:items-start">
        <span className="font-mono text-[13px] font-semibold text-ink tnum">30–90s</span>
        <span className="caption mt-0.5 !text-[9.5px]">human pause</span>
      </div>

      <Tilt strength={5.5}>
        <div className="glass-strong relative rounded-[30px] p-2">
          <div className="overflow-hidden rounded-[23px] border border-line/70 bg-surface/80">
            {/* window bar */}
            <div className="flex items-center gap-2.5 border-b border-line/70 px-4 py-3">
              <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-ink">
                <span className="relative flex size-2" aria-hidden>
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-ok" />
                </span>
                Comment engine
              </span>
              <span className="ml-auto rounded-full border border-ok/25 bg-ok-wash px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ok">
                armed
              </span>
            </div>

            {/* the trigger */}
            <div className="px-4 pb-3 pt-4">
              <div className="flex gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-line to-signal text-[10px] font-bold text-signal-ink ring-1 ring-signal/30">
                  PS
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink">
                    priya.shops
                    <span className="ml-2 font-normal text-ink-3">2m</span>
                  </p>
                  <p className="mt-0.5 text-[14px] text-ink-2">
                    price please. is it still available?
                  </p>
                </div>
              </div>

              {/* the matched keyword */}
              <div className="ml-11 mt-3 inline-flex items-center gap-2 rounded-full border border-signal/25 bg-signal-wash px-2.5 py-1">
                <span className="size-1.5 rounded-full bg-signal shadow-[0_0_10px_var(--signal)]" aria-hidden />
                <span className="caption !text-signal">keyword matched</span>
                <span className="font-mono text-[11.5px] font-semibold text-signal">
                  &quot;price&quot;
                </span>
              </div>
            </div>

            {/* the pause, shown honestly */}
            <div className="flex items-center gap-3 px-4 pb-4">
              <span className="relative ml-[13px] h-7 w-px bg-gradient-to-b from-signal/60 to-line" aria-hidden>
                <motion.span
                  className="absolute left-1/2 top-0 size-1.5 -translate-x-1/2 rounded-full bg-signal"
                  animate={reduce ? undefined : { y: [0, 22, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
              </span>
              <span className="font-mono text-[10.5px] text-ink-3">
                waiting 30 to 90s so it reads like you
              </span>
            </div>

            {/* the card RELO sends */}
            <div className="border-t border-line/70 bg-surface-2/55 px-4 py-4">
              <p className="caption mb-2.5">Direct message · sent</p>
              <div className="rounded-2xl border border-line/80 bg-surface/75 p-4 shadow-[var(--sh-1)]">
                <p className="text-[14px] font-semibold text-ink">
                  Still available. Here is the lot.
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
                  Three sizes left. Tap whichever you want and I will hold it for you.
                </p>
                <div className="mt-3.5 space-y-2">
                  <div className="flex h-9 items-center justify-center rounded-lg bg-signal text-[13px] font-semibold text-signal-ink shadow-[0_8px_24px_-12px_var(--signal)]">
                    Reserve mine
                  </div>
                  <div className="flex h-9 items-center justify-center rounded-lg border border-line-strong bg-surface/55 text-[13px] font-semibold text-ink">
                    See all sizes
                  </div>
                  <div className="flex h-9 items-center justify-center rounded-lg border border-line-strong bg-surface/55 text-[13px] font-semibold text-ink">
                    Ask a question
                  </div>
                </div>
              </div>
              <p className="mt-3 font-mono text-[10.5px] text-ink-3">
                lead captured &middot; 14:32 &middot; source: reel
              </p>
            </div>
          </div>
        </div>
      </Tilt>
    </div>
  );
}

/* ── Hero ───────────────────────────────────────────────────────────────── */

function Hero({ navigate }: { navigate: (to: string) => void }) {
  return (
    <section className="relative overflow-hidden pb-16 pt-14 sm:pt-20 lg:pb-24 lg:pt-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 liquid-grid opacity-40" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[640px] w-[980px] max-w-none -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--glow-2),transparent_70%)] opacity-80"
      />

      <Container className="relative grid items-center gap-14 lg:grid-cols-[1.04fr_0.96fr] lg:gap-10">
        <div>
          <Reveal blur>
            <div className="glass-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5">
              <span className="size-1.5 rounded-full bg-signal shadow-[0_0_10px_var(--signal)]" aria-hidden />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-2">
                Instagram comment-to-DM engine
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.08} blur>
            <h1 className="display mt-7 max-w-[12.5ch] text-ink">
              Your Reel comments
              <span className="mt-1 block">
                answer <span className="editorial text-gradient">themselves.</span>
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="lead mt-7 max-w-[38rem] text-[1.08rem] leading-[1.7]">
              Someone comments a keyword on your Reel. RELO replies in public, then
              sends a three-button DM with your offer inside. You approve the words
              once and it keeps working while you film the next one.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                variant="signal"
                size="lg"
                onClick={() => navigate("/login")}
                className="group rounded-full px-6"
              >
                Start free
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/studio?demo=1")}
                className="rounded-full border-line/70 bg-surface/30 backdrop-blur-md"
              >
                Open the studio
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.32}>
            <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-3">
              <span>No card needed</span>
              <span aria-hidden className="text-line-strong">
                /
              </span>
              <span>Runs on Instagram&apos;s official API</span>
              <span aria-hidden className="text-line-strong">
                /
              </span>
              <span>Disconnect any time</span>
            </p>
          </Reveal>

          <Reveal delay={0.38}>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-3 border-t border-line/70 pt-5">
              {[
                { value: "30–90s", label: "human pause" },
                { value: "3", label: "buttons per DM" },
                { value: "24h", label: "window respected" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-mono text-[18px] font-semibold tracking-tight text-ink tnum">
                    {s.value}
                  </p>
                  <p className="caption mt-1 !text-[9.5px]">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.2} y={36}>
          <div className="lg:pl-2">
            <CommentToDm />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ── How it works ───────────────────────────────────────────────────────── */

const STEPS = [
  {
    n: "01",
    title: "Connect the account",
    body: "You sign in on Instagram's own screen and RELO receives a scoped token. Your password never touches us, and revoking the token stops everything instantly.",
  },
  {
    n: "02",
    title: "Pick a Reel and a keyword",
    body: "Choose one of your Reels and the word your audience already types: price, link, size, kit. Write up to eight reply variations so nobody gets a copy-paste answer.",
  },
  {
    n: "03",
    title: "Let it work",
    body: "Matching comments get a public reply and a three-button DM card. A deliberate pause of 30 to 90 seconds keeps the pace human. Every tap lands in your lead list.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="section relative scroll-mt-28">
      <Container>
        <Reveal>
          <div className="max-w-3xl">
            <p className="caption">How it works</p>
            <h2 className="h2 mt-4 text-ink">
              Three steps, then it runs{" "}
              <span className="editorial text-gradient">without you.</span>
            </h2>
            <p className="lead mt-4 max-w-2xl">
              Nothing here needs a developer, and nothing needs to stay open in a
              browser tab.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1} y={34}>
          <div className="glass-panel mt-12 rounded-[30px] p-2">
            <div className="h-px bg-gradient-to-r from-transparent via-signal/50 to-transparent" />
            <div className="grid divide-y divide-line/70 md:grid-cols-3 md:divide-x md:divide-y-0">
              {STEPS.map((s, i) => (
                <div key={s.n} className="group relative p-6 md:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-signal">
                      {s.n}
                    </span>
                    <span
                      aria-hidden
                      className="h-px flex-1 bg-gradient-to-r from-line/80 to-transparent"
                    />
                  </div>
                  <h3 className="h3 mt-6 text-ink">{s.title}</h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
                    {s.body}
                  </p>
                  <span
                    aria-hidden
                    className="absolute bottom-5 right-6 size-1.5 rounded-full bg-gradient-to-br from-signal to-brand-line opacity-60 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <span className="sr-only">Step {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ── Capabilities ───────────────────────────────────────────────────────── */

const CAPABILITIES = [
  {
    title: "Replies that do not sound automated",
    body: "A randomised pause and up to eight rotating variations per Reel, so two commenters never receive the same sentence.",
  },
  {
    title: "Three-button DM cards",
    body: "Every reply carries a card with up to three buttons. Whichever one they tap becomes a tracked lead with its source attached.",
  },
  {
    title: "The 24-hour rule, respected",
    body: "Meta only allows a DM within 24 hours of someone's last message. RELO shows you exactly who is still reachable before any campaign goes out.",
  },
  {
    title: "A lead list you actually own",
    body: "Search it, filter it, export it as CSV. Nothing is held hostage behind a per-contact fee.",
  },
  {
    title: "Campaigns for the people who have gone quiet",
    body: "Broadcast to everyone still inside the window, with the same human pacing applied to every message.",
  },
  {
    title: "Tokens encrypted at rest",
    body: "Access tokens are encrypted before they are stored. One disconnect ends every automation on that account.",
  },
];

function Capabilities() {
  return (
    <section id="capabilities" className="section relative scroll-mt-28">
      <Container className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <p className="caption">What it does</p>
            <h2 className="h2 mt-4 max-w-[13ch] text-ink">
              Built for accounts that{" "}
              <span className="editorial text-gradient">sell.</span>
            </h2>
            <p className="lead mt-4 max-w-md">
              Six things, done properly. No dashboard full of features nobody opens
              twice.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-8 flex flex-wrap gap-2">
              <div className="glass-chip rounded-2xl px-4 py-3">
                <p className="font-mono text-[22px] font-semibold leading-none text-ink tnum">
                  30–90s
                </p>
                <p className="caption mt-1.5 !text-[9.5px]">reply delay</p>
              </div>
              <div className="glass-chip rounded-2xl px-4 py-3">
                <p className="font-mono text-[22px] font-semibold leading-none text-ink tnum">
                  ₹0
                </p>
                <p className="caption mt-1.5 !text-[9.5px]">per contact</p>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.12} y={30}>
          <div className="glass-panel rounded-[30px] p-2">
            <ul className="divide-y divide-line/70">
              {CAPABILITIES.map((c, i) => (
                <li
                  key={c.title}
                  className="group relative flex gap-4 rounded-2xl px-4 py-6 transition-colors duration-300 hover:bg-surface-2/45 sm:gap-6 sm:px-6"
                >
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-8 w-px -translate-y-1/2 bg-gradient-to-b from-signal to-brand-line opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <span className="mt-1 font-mono text-[11px] text-ink-3 tnum">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="h4 text-ink">{c.title}</h3>
                    <p className="mt-2 max-w-xl text-[13.8px] leading-relaxed text-ink-2">
                      {c.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ── Pricing ────────────────────────────────────────────────────────────── */

type Tier = {
  name: string;
  monthly: { inr: string; usd: string };
  annual: { inr: string; usd: string } | null;
  blurb: string;
  includes: string[];
  excludes?: string[];
  featured?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Free",
    monthly: { inr: "0", usd: "0" },
    annual: null,
    blurb: "Prove it on a single Reel.",
    includes: [
      "1 automated Reel",
      "2 reply variations",
      "2 buttons plus a RELO credit",
      "3 AI credits each month",
      "Lead capture and CSV export",
    ],
    excludes: ["Follow-ups and campaigns", "AI product answers"],
  },
  {
    name: "Pro",
    monthly: { inr: "149", usd: "9.99" },
    annual: { inr: "1,499", usd: "99" },
    blurb: "For creators who sell from the comments.",
    includes: [
      "Unlimited automated Reels",
      "3 to 8 rotating reply variations",
      "3 buttons, no RELO branding",
      "Follow-up DMs and campaigns",
      "AI product answers, 500 credits monthly",
      "Analytics down to the tap",
    ],
    featured: true,
  },
  {
    name: "Studio",
    monthly: { inr: "399", usd: "24.99" },
    annual: { inr: "3,999", usd: "249" },
    blurb: "For builders running several accounts.",
    includes: [
      "Everything in Pro",
      "Canvas flow builder",
      "3 connected Instagram accounts",
      "Priority queue, 5,000 AI credits monthly",
    ],
  },
];

function Pricing({ navigate }: { navigate: (to: string) => void }) {
  const [cur, setCur] = useState<"inr" | "usd">("inr");
  const [annual, setAnnual] = useState(false);

  const price = (t: Tier) => {
    const v = annual && t.annual ? t.annual[cur] : t.monthly[cur];
    return cur === "inr" ? `₹${v}` : `$${v}`;
  };
  const period = (t: Tier) => (annual && t.annual ? "/year" : "/month");

  return (
    <section id="pricing" className="section relative scroll-mt-28">
      <Container>
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
            <div className="max-w-2xl">
              <p className="caption">Pricing</p>
              <h2 className="h2 mt-4 text-ink">
                One flat fee, no{" "}
                <span className="editorial text-gradient">per-contact tax.</span>
              </h2>
              <p className="lead mt-4">
                Start free and upgrade from inside the studio once the DMs are
                paying for it. Every lead stays yours either way.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                role="radiogroup"
                aria-label="Currency"
                className="glass-chip inline-flex items-center gap-0.5 rounded-full p-0.5"
              >
                {(["inr", "usd"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={cur === c}
                    onClick={() => setCur(c)}
                    className={cn(
                      "relative rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors duration-200",
                      cur === c ? "text-signal-ink" : "text-ink-3 hover:text-ink"
                    )}
                  >
                    {cur === c && (
                      <motion.span
                        layoutId="currency-pill"
                        className="absolute inset-0 rounded-full bg-signal"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{c === "inr" ? "₹ INR" : "$ USD"}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setAnnual((v) => !v)}
                aria-pressed={annual}
                className={cn(
                  "relative overflow-hidden rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors duration-200",
                  annual
                    ? "border-signal/40 text-signal-ink"
                    : "border-line/80 text-ink-3 hover:border-line-strong hover:text-ink"
                )}
              >
                {annual && (
                  <motion.span
                    layoutId="annual-pill"
                    className="absolute inset-0 bg-signal"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">Annual, two months free</span>
              </button>
            </div>
          </div>
        </Reveal>

        <div className="mt-14 grid items-start gap-5 lg:grid-cols-3">
          {TIERS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08} y={30}>
              <div
                className={cn(
                  "relative h-full",
                  t.featured && "lg:-mt-4"
                )}
              >
                {t.featured && (
                  <div
                    aria-hidden
                    className="absolute -inset-px rounded-[26px] bg-gradient-to-b from-signal/70 via-brand-line/35 to-transparent"
                  />
                )}
                <div
                  className={cn(
                    "relative flex h-full flex-col rounded-[25px] p-7",
                    t.featured ? "glass-strong" : "glass-card"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <h3 className="h4 text-ink">{t.name}</h3>
                    {t.featured && <Pill tone="signal">Most chosen</Pill>}
                  </div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-ink-3">
                    {t.blurb}
                  </p>

                  <p className="mt-7 flex items-baseline gap-1.5">
                    <span className="font-mono text-[40px] font-semibold leading-none tracking-tight text-ink tnum">
                      {price(t)}
                    </span>
                    <span className="text-[13px] text-ink-3">{period(t)}</span>
                  </p>
                  {annual && t.annual && (
                    <p className="mt-2 text-[12.5px] text-ink-3">
                      Equivalent to {cur === "inr" ? "₹124" : "$8.25"} a month
                    </p>
                  )}

                  <ul className="mt-7 space-y-3 border-t border-line/70 pt-7">
                    {t.includes.map((f) => (
                      <li
                        key={f}
                        className="flex gap-3 text-[14px] leading-relaxed text-ink-2"
                      >
                        <svg
                          viewBox="0 0 16 16"
                          className="mt-1 size-3.5 shrink-0 text-signal"
                          aria-hidden
                        >
                          <path
                            d="M3 8.5 6.2 11.5 13 4.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {f}
                      </li>
                    ))}
                    {t.excludes?.map((f) => (
                      <li
                        key={f}
                        className="flex gap-3 text-[14px] leading-relaxed text-ink-3"
                      >
                        <span
                          className="mt-[9px] h-px w-3.5 shrink-0 bg-line-strong"
                          aria-hidden
                        />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 pt-2">
                    <Button
                      variant={t.featured ? "signal" : "outline"}
                      size="lg"
                      className="w-full rounded-full"
                      onClick={() => navigate("/login")}
                    >
                      {t.name === "Free" ? "Start free" : `Choose ${t.name}`}
                    </Button>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="mt-10 max-w-3xl text-[13px] leading-relaxed text-ink-3">
            Prices are in Indian rupees and US dollars and exclude GST where it
            applies. Running more than three accounts? Write to{" "}
            <a
              href="mailto:hello@thepilab.in"
              className="font-medium text-signal underline decoration-signal/35 underline-offset-2 transition-colors hover:decoration-signal"
            >
              hello@thepilab.in
            </a>{" "}
            and we will quote it directly.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}

/* ── FAQ ────────────────────────────────────────────────────────────────── */

const FAQS = [
  {
    q: "Is this allowed by Instagram?",
    a: "RELO is built entirely on Instagram's official API using an account you connect yourself. There is no scraping and no unofficial client. Automation still carries the risk Meta sets for every tool, which is why replies go out at human pace with hard ceilings built in.",
  },
  {
    q: "How quickly do the DMs go out?",
    a: "The comment is acknowledged the moment it arrives, then RELO waits a deliberate 30 to 90 seconds before sending. A bot that fires instantly is the fastest way to get an account flagged.",
  },
  {
    q: "What is the 24-hour window?",
    a: "Instagram only permits an account to DM somebody within 24 hours of that person's last message. Before any campaign, RELO lists exactly who is still inside the window and quietly skips everybody else.",
  },
  {
    q: "Do I need a professional account?",
    a: "Yes. Meta requires a Creator or Business account for API access. Switching takes about a minute inside the Instagram app and costs nothing.",
  },
  {
    q: "What happens to my data?",
    a: "Your access token is encrypted at rest and can be revoked whenever you like. Your leads belong to you, and you can export the whole list as CSV or delete it outright.",
  },
  {
    q: "Can I see it working before I pay?",
    a: "Yes. The studio opens straight into a demo workspace with automations, leads and analytics already populated, so you can try every screen without connecting an account.",
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="section relative scroll-mt-28">
      <Container className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
        <Reveal>
          <div>
            <p className="caption">Questions</p>
            <h2 className="h2 mt-4 max-w-[14ch] text-ink">
              Questions, answered{" "}
              <span className="editorial text-gradient">plainly.</span>
            </h2>
            <p className="lead mt-4">
              If something is missing, email{" "}
              <a
                href="mailto:hello@thepilab.in"
                className="font-medium text-signal underline decoration-signal/35 underline-offset-2 hover:decoration-signal"
              >
                hello@thepilab.in
              </a>
              .
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1} y={28}>
          <div className="glass-panel overflow-hidden rounded-[28px] px-5 sm:px-7">
            <div className="divide-y divide-line/70">
              {FAQS.map((f, i) => {
                const isOpen = open === i;
                return (
                  <div key={f.q}>
                    <h3>
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? null : i)}
                        aria-expanded={isOpen}
                        className="group flex w-full items-center gap-4 py-5 text-left transition-colors duration-200 hover:text-signal"
                      >
                        <span
                          className={cn(
                            "flex-1 text-[15.5px] font-semibold transition-colors",
                            isOpen ? "text-signal" : "text-ink"
                          )}
                        >
                          {f.q}
                        </span>
                        <span
                          className={cn(
                            "grid size-7 shrink-0 place-items-center rounded-full border transition-all duration-300",
                            isOpen
                              ? "rotate-180 border-signal/40 bg-signal-wash text-signal"
                              : "border-line/80 text-ink-3 group-hover:border-line-strong group-hover:text-ink"
                          )}
                        >
                          <ChevronDown className="size-3.5" aria-hidden />
                        </span>
                      </button>
                    </h3>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="max-w-2xl pb-6 pr-10 text-[14.5px] leading-relaxed text-ink-2">
                            {f.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ── Closing band ───────────────────────────────────────────────────────── */

function Closing({ navigate }: { navigate: (to: string) => void }) {
  return (
    <section className="relative px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[32px] border border-white/10 bg-brand px-6 py-20 text-brand-ink sm:px-10 md:py-28 lg:px-16">
        <BrandAurora />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(90deg,rgb(16_5_32/0.72)_0%,rgb(16_5_32/0.36)_46%,transparent_78%)]"
        />
        <div className="relative z-10 max-w-3xl">
          <Reveal>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
              The next thousand
            </p>
            <h2 className="h1 mt-4">
              The next thousand customers are already in your{" "}
              <span className="editorial">comments.</span>
            </h2>
            <p className="mt-6 max-w-xl text-[15.5px] leading-relaxed text-white/70">
              RELO answers every one of them while you film the next Reel. Set it up
              once and it keeps going at 2am without you.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button
                variant="signal"
                size="lg"
                onClick={() => navigate("/login")}
                className="group rounded-full px-6"
              >
                Start free
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
              </Button>
              <button
                type="button"
                onClick={() => navigate("/studio?demo=1")}
                className="glass-chip inline-flex h-11 items-center justify-center rounded-full px-5 text-[14.5px] font-semibold text-brand-ink transition-colors duration-200 hover:bg-white/10"
              >
                Open the studio
              </button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────────────────────────── */

function Footer({ navigate }: { navigate: (to: string) => void }) {
  return (
    <footer className="relative z-10 mt-4 border-t border-line/60">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo onClick={() => navigate("/")} />
            <p className="mt-5 max-w-sm text-[13.5px] leading-relaxed text-ink-3">
              RELO turns Instagram Reel comments into verified, three-button DMs
              through Instagram&apos;s official API. Built by The Pi Lab.
            </p>
            <div className="mt-6">
              <ThemeToggle />
            </div>
          </div>

          <div>
            <p className="caption">Product</p>
            <ul className="mt-4 space-y-2.5 text-[13.5px]">
              {NAV.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById(n.id)?.scrollIntoView({ block: "start" })
                    }
                    className="text-ink-2 transition-colors hover:text-ink"
                  >
                    {n.label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => navigate("/studio?demo=1")}
                  className="text-ink-2 transition-colors hover:text-ink"
                >
                  Demo studio
                </button>
              </li>
            </ul>
          </div>

          <div>
            <p className="caption">Company</p>
            <ul className="mt-4 space-y-2.5 text-[13.5px]">
              <li>
                <button
                  type="button"
                  onClick={() => navigate("/privacy")}
                  className="text-ink-2 transition-colors hover:text-ink"
                >
                  Privacy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate("/terms")}
                  className="text-ink-2 transition-colors hover:text-ink"
                >
                  Terms
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate("/cookies")}
                  className="text-ink-2 transition-colors hover:text-ink"
                >
                  Cookies
                </button>
              </li>
              <li>
                <a
                  href="mailto:hello@thepilab.in"
                  className="text-ink-2 transition-colors hover:text-ink"
                >
                  hello@thepilab.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line/70 pt-6 text-[12.5px] text-ink-3 md:flex-row md:items-center md:justify-between">
          <p>&copy; 2026 The Pi Lab. All rights reserved.</p>
          <p className="max-w-xl md:text-right">
            RELO is an independent product. It is not affiliated with, endorsed by
            or sponsored by Meta or Instagram.
          </p>
        </div>
      </Container>
    </footer>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

/* ReloApp owns the single <main id="main-content"> for the whole app, so the
   page body here is a plain element. A nested <main> would duplicate the id
   and break the skip link's target. */
export function LandingPage({ navigate }: { navigate: (to: string) => void }) {
  return (
    <div className="relative isolate overflow-clip bg-canvas">
      <LiquidBackdrop variant="hero" />
      <ReadingProgress />
      <Header navigate={navigate} />
      <div className="relative z-10">
        <Hero navigate={navigate} />
        <HowItWorks />
        <Capabilities />
        <Pricing navigate={navigate} />
        <Faq />
        <Closing navigate={navigate} />
        <Footer navigate={navigate} />
      </div>
    </div>
  );
}
