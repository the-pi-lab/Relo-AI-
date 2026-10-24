"use client";

const getSrc = (img: any): string => (typeof img === "string" ? img : img?.src ?? "");


/**
 * RELO landing page — Zorcha-style daylight edition.
 * Full-bleed photo hero with live comment→DM cards, scroll-scrubbed
 * storytelling, 3D glass objects, tight bento features, pricing and FAQ.
 */

import React, { useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  Clock,
  Heart,
  Layers,
  Link2,
  MessageCircle,
  Minus,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { SiteFooter, SiteNav } from "./site";
import { Reveal, Tilt } from "./motion";
import { cn } from "@/lib/utils";
import * as api from "@/lib/relo/api";
import { DEMO_TOKEN, DEMO_USER } from "@/lib/relo/demo";
import { useRelo } from "@/lib/relo/store";

import heroImg from "@/assets/hero-crowd.jpg";
import bubble3d from "@/assets/3d-bubble.png";
import heart3d from "@/assets/3d-heart.png";
import fashionImg from "@/assets/creator-fashion.jpg";
import step1Img from "@/assets/step-keyword.jpg";
import step2Img from "@/assets/step-reply.jpg";
import step3Img from "@/assets/step-dm.jpg";
import fitnessImg from "@/assets/creator-fitness.jpg";
import foodImg from "@/assets/creator-food.jpg";
import rooftopImg from "@/assets/cta-rooftop.jpg";

interface LandingProps {
  navigate: (to: string) => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/* ── Content ─────────────────────────────────────────────────────────────── */

const TRUST = [
  "Instagram official Graph API",
  "Meta Tech Provider",
  "DPIIT #startupindia",
  "UPI & GST invoices",
  "Cloudflare edge delivery",
  "No password ever asked",
  "Human-paced sending",
];

const STEPS = [
  {
    n: "01",
    title: "Pick a Reel, set a keyword",
    body: "Choose any Reel and up to 12 trigger words. “LINK”, “PRICE”, “GUIDE” — whatever your audience types.",
    img: getSrc(step1Img),
    comment: "LINK please 🙏",
    user: "aanya.styles",
  },
  {
    n: "02",
    title: "RELO replies in public",
    body: "A randomized reply lands under the comment, so the thread keeps growing and no two replies look the same.",
    img: getSrc(step2Img),
    comment: "PLAN — need this!",
    user: "fit.with.rohan",
  },
  {
    n: "03",
    title: "Then sends the DM card",
    body: "A native Instagram card with a title, subtitle and up to three buttons, each a tracked short link.",
    img: getSrc(step3Img),
    comment: "RECIPE 😍",
    user: "meera.cooks",
  },
];

const FEATURES = [
  { icon: MessageCircle, title: "Keyword triggers per Reel", body: "Up to 12 keywords. Comment IDs are deduplicated, so nobody gets two DMs." },
  { icon: Send, title: "Public reply, then DM", body: "Reply variations rotate at send time so threads stay natural." },
  { icon: Layers, title: "DM cards, 3 buttons", body: "The native layout Instagram renders in a private reply." },
  { icon: Link2, title: "Tracked short links", body: "Every button is a RELO link with clicks in one funnel." },
  { icon: Clock, title: "Human-paced sending", body: "30–90s jitter. Reply manually and RELO pauses for 30 minutes." },
  { icon: Users, title: "1-click CSV export", body: "Every commenter becomes a lead row you own." },
  { icon: CalendarDays, title: "24h broadcasts", body: "Re-engage recent commenters inside Meta's window." },
  { icon: Sparkles, title: "AI FAQ answers", body: "Answers from your offers, hands off what it isn't sure of." },
  { icon: BarChart3, title: "Real telemetry", body: "Queue, replies, DMs and clicks read live from the edge." },
];

const PLANS = [
  {
    name: "Starter",
    price: "₹0",
    cadence: "forever",
    blurb: "Test one Reel end to end.",
    cta: "Start free",
    highlighted: false,
    features: ["1 Instagram account", "1 Reel automation", "2 reply variations", "DM cards with 2 buttons", "100 DMs / month", "Lead list & CSV export"],
  },
  {
    name: "Pro",
    price: "₹199",
    cadence: "/ month",
    blurb: "For creators posting every week.",
    cta: "Choose Pro",
    highlighted: true,
    features: ["Unlimited Reels & automations", "Unlimited contacts", "3–8 reply variations", "DM cards with 3 buttons", "24h broadcasts", "Link-in-bio & planner", "500 AI credits / month"],
  },
  {
    name: "Max",
    price: "₹499",
    cadence: "/ month",
    blurb: "High volume, priority speed & AI.",
    cta: "Choose Max",
    highlighted: false,
    features: ["Everything in Pro", "Flow canvas builder", "5,000 AI credits / month", "Webhooks & Zapier", "Priority edge routing", "VIP email support"],
  },
];

const FAQS = [
  { q: "Is RELO safe for my Instagram account?", a: "Yes. RELO is built only on Instagram's official Graph API. We never ask for your password, we pace every send with 30–90 seconds of human jitter, and we respect Meta's rate limits." },
  { q: "How is it cheaper than ManyChat?", a: "ManyChat's price climbs as your contacts grow. RELO is a flat ₹199/month for unlimited contacts, with no per-contact fee." },
  { q: "Can I pay with UPI and get a GST invoice?", a: "Yes. RELO is built in India by The Pi Lab. Pay by UPI, card or net banking and download GST-compliant invoices anytime." },
  { q: "How does the follower gate work?", a: "When armed, RELO asks the commenter to follow you first. Once they tap “I'm following”, the link card is delivered." },
  { q: "What if I reply to a DM myself?", a: "RELO pauses automation for that conversation for 30 minutes, so you're never interrupted by the bot." },
  { q: "Can I cancel anytime?", a: "Yes, in one click from settings. Automations stay live until the end of the billing cycle and your data is always exportable." },
];

/* ── Small pieces ───────────────────────────────────────────────────────── */

function CommentCard({ user, text, className }: { user: string; text: string; className?: string }) {
  return (
    <div className={cn("frost flex w-[280px] items-start gap-3 rounded-2xl p-3.5", className)}>
      <span className="ember-gradient mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-[12px] font-bold text-signal-ink">
        {user[0].toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] text-ink-3">{user}</p>
        <p className="text-[14px] font-medium text-ink">
          {text.split(" ").map((w, i) =>
            /^[A-Z]{3,}/.test(w) ? (
              <span key={i} className="mx-0.5 rounded-md border border-dashed border-signal/50 bg-signal-wash px-1.5 text-signal">
                {w}
              </span>
            ) : (
              <span key={i}> {w} </span>
            )
          )}
        </p>
        <p className="mt-1 text-[11px] font-semibold text-ink-3">Reply</p>
      </div>
      <Heart className="size-4 text-ink-3" />
    </div>
  );
}

function DmCard({ className }: { className?: string }) {
  return (
    <div className={cn("frost w-[230px] rounded-2xl p-3", className)}>
      <p className="text-[12.5px] leading-snug text-ink">Here's your link! Enjoy the guide 🧡</p>
      <div className="mt-2.5 space-y-1.5">
        {["Get the guide", "Shop the look"].map((b) => (
          <div key={b} className="rounded-lg bg-surface/90 py-1.5 text-center text-[11.5px] font-semibold text-ink shadow-[var(--sh-1)]">
            {b}
          </div>
        ))}
      </div>
    </div>
  );
}

function StepBadge({ n, label, dark }: { n: number; label: string; dark?: boolean }) {
  return (
    <div className="mb-2.5 flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-full bg-surface text-[13px] font-bold text-ink shadow-[var(--sh-2)]">
        {n}
      </span>
      <span className={cn("text-[15px] font-medium leading-tight", dark ? "text-on-photo" : "text-ink")}>{label}</span>
    </div>
  );
}

/* ── Hero ───────────────────────────────────────────────────────────────── */

function Hero({ navigate }: LandingProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { completeSignIn } = useRelo();
  const enterDemo = () => {
    api.saveSession(DEMO_TOKEN, DEMO_USER);
    completeSignIn(DEMO_USER);
    navigate("/studio");
  };
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.15]);
  const titleY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120]);
  const cardsY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 80]);
  const radius = useTransform(scrollYProgress, [0, 0.6], [28, 48]);

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[680px] p-2 sm:p-3">
      <motion.div style={{ borderRadius: radius }} className="relative h-full overflow-hidden bg-brand">
        <motion.img
          src={getSrc(heroImg)}
          alt="A creator smiling at his phone while fans film him"
          width={1920}
          height={1088}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          style={{ scale }}
          className="absolute inset-0 h-full w-full object-cover object-[50%_30%]"
        />
        <div className="photo-scrim absolute inset-0" />

        <motion.div style={{ y: titleY }} className="relative z-10 flex flex-col items-center px-5 pt-[16vh] text-center">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
            className="frost-dark mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium text-on-photo"
          >
            <span className="size-1.5 animate-pulse rounded-full bg-signal-bright" />
            Comment-to-DM for Instagram Reels
          </motion.p>
          <h1 className="hero-title text-on-photo max-w-[14ch]">
            {["Comments in.", "Customers out."].map((line, i) => (
              <span key={line} className="block overflow-hidden pb-1">
                <motion.span
                  className="block"
                  initial={{ y: "105%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1, delay: 0.25 + i * 0.12, ease: EASE }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: EASE }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="group inline-flex h-12 items-center gap-3 rounded-xl bg-surface pl-5 pr-2 text-[15px] font-semibold text-ink shadow-[var(--sh-3)] transition-transform hover:-translate-y-0.5"
            >
              Start for free
              <span className="grid size-8 place-items-center rounded-full bg-ink text-ink-invert transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="size-4" />
              </span>
            </button>
            <button
              type="button"
              onClick={enterDemo}
              className="frost-dark inline-flex h-12 items-center rounded-xl px-5 text-[15px] font-semibold text-on-photo transition-transform hover:-translate-y-0.5"
            >
              View live demo
            </button>
          </motion.div>
        </motion.div>

        {/* Live interaction cards */}
        <motion.div style={{ y: cardsY }} className="pointer-events-none absolute inset-x-0 bottom-[4%] z-10 hidden lg:[@media(min-height:780px)]:block">
          <div className="wrap relative h-[230px]">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.9, ease: EASE }}
              className="absolute left-[2%] top-[40px]"
            >
              <StepBadge n={1} label="When someone comments on your Reel…" dark />
              <CommentCard user="john.doe.18" text="Send me the LINK for the guide" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 1.15, ease: EASE }}
              className="absolute right-[2%] top-[20px]"
            >
              <StepBadge n={2} label="RELO DMs them instantly" dark />
              <DmCard />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 1.3, ease: EASE }}
              className="absolute bottom-0 left-1/2 hidden -translate-x-1/2 text-center xl:[@media(min-height:900px)]:block"
            >
              <div className="frost-dark rounded-2xl px-7 py-2">
                <p className="font-heading text-on-photo text-[64px] font-bold leading-none tracking-[-0.05em]">₹0</p>
              </div>
              <p className="mx-auto mt-2 w-fit rounded-full bg-surface px-4 py-1 text-[13px] font-semibold text-ink">
                per-contact fees
              </p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ── Trust marquee ──────────────────────────────────────────────────────── */

function TrustMarquee() {
  const row = [...TRUST, ...TRUST];
  return (
    <section aria-label="Trust" className="overflow-hidden border-y border-line py-5">
      <div className="marquee flex w-max gap-10">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap text-[14px] font-semibold text-ink-2">
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-signal" />
              {t}
            </span>
            <span className="size-1 rounded-full bg-line-strong" />
          </span>
        ))}
      </div>
    </section>
  );
}

/* ── Scroll-revealed statement with floating 3D ─────────────────────────── */

function Word({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <motion.span style={{ opacity }} className="mr-[0.25em] inline-block">
      {word}
    </motion.span>
  );
}

function Statement() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.4"] });
  const rotA = useTransform(scrollYProgress, [0, 1], [-18, 14]);
  const yA = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const rotB = useTransform(scrollYProgress, [0, 1], [16, -10]);
  const yB = useTransform(scrollYProgress, [0, 1], [-30, 70]);
  const text =
    "Every comment is someone raising their hand. RELO answers in seconds — a public reply, then a DM card with the link they asked for.";
  const words = text.split(" ");

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <motion.img
        src={getSrc(bubble3d)}
        alt=""
        aria-hidden
        loading="lazy"
        width={1024}
        height={1024}
        style={{ rotate: rotA, y: yA }}
        className="pointer-events-none absolute -left-16 top-10 w-[220px] opacity-95 md:left-[3%] md:w-[300px]"
      />
      <motion.img
        src={getSrc(heart3d)}
        alt=""
        aria-hidden
        loading="lazy"
        width={1024}
        height={1024}
        style={{ rotate: rotB, y: yB }}
        className="pointer-events-none absolute -right-14 bottom-6 w-[200px] md:right-[4%] md:w-[270px]"
      />
      <div ref={ref} className="wrap relative">
        <p className="eyebrow mb-6 text-center">Why RELO</p>
        <p className="font-heading mx-auto max-w-4xl text-center text-[clamp(1.9rem,1rem+3vw,3.6rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-ink">
          {words.map((w, i) => (
            <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
          ))}
        </p>
      </div>
    </section>
  );
}

/* ── How it works: sticky scroll ────────────────────────────────────────── */

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const [active, setActive] = useState(0);
  useMotionValueEvent(smooth, "change", (v) => {
    const i = Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length)));
    setActive((prev) => (prev === i ? prev : i));
  });
  const bar = useTransform(smooth, [0, 1], ["0%", "100%"]);
  const rotY = useTransform(smooth, [0, 0.5, 1], [-14, 0, 14]);

  return (
    <section id="how-it-works" ref={ref} className="relative" style={{ height: `${STEPS.length * 90 + 40}vh` }}>
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="wrap grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="section-title mt-3 text-ink">Three moves. Zero manual DMs.</h2>
            <div className="mt-8 h-1 w-full overflow-hidden rounded-full bg-surface-3">
              <motion.div style={{ width: bar }} className="ember-gradient h-full rounded-full" />
            </div>
            <ol className="mt-8 space-y-3">
              {STEPS.map((s, i) => (
                <li
                  key={s.n}
                  className={cn(
                    "rounded-2xl border p-5 transition-all duration-500",
                    i === active ? "border-line bg-surface shadow-[var(--sh-2)]" : "border-transparent opacity-45"
                  )}
                >
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-[12px] font-medium text-signal">{s.n}</span>
                    <div>
                      <h3 className="text-[18px] font-bold tracking-[-0.02em] text-ink">{s.title}</h3>
                      <motion.p
                        initial={false}
                        animate={{ height: i === active ? "auto" : 0, opacity: i === active ? 1 : 0 }}
                        className="overflow-hidden text-[14.5px] leading-relaxed text-ink-2"
                      >
                        <span className="block pt-1.5">{s.body}</span>
                      </motion.p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative hidden justify-center lg:flex" style={{ perspective: 1400 }}>
            <motion.div
              style={{ rotateY: rotY }}
              className="relative aspect-[3/4] w-[380px] overflow-hidden rounded-[36px] shadow-[var(--sh-3)] [transform-style:preserve-3d] [clip-path:inset(0_round_36px)]"
            >
              {STEPS.map((s, i) => (
                <motion.img
                  key={s.n}
                  src={getSrc(s.img)}
                  alt=""
                  loading="lazy"
                  width={864}
                  height={1152}
                  initial={false}
                  animate={{ opacity: i === active ? 1 : 0, scale: i === active ? 1 : 1.08 }}
                  transition={{ duration: 0.8, ease: EASE }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-brand/60 via-transparent to-transparent" />
              <motion.div
                key={`c-${active}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
                className="absolute bottom-5 left-4 right-4 space-y-2.5"
              >
                <CommentCard user={STEPS[active].user} text={STEPS[active].comment} className="w-full" />
                {active >= 1 && (
                  <div className="frost ml-auto w-fit rounded-2xl rounded-br-md px-3.5 py-2 text-[13px] text-ink">
                    Sent you the details in DM ✨
                  </div>
                )}
                {active >= 2 && <DmCard className="ml-auto" />}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Creators strip ─────────────────────────────────────────────────────── */

function Creators({ navigate }: LandingProps) {
  const items = [
    { img: getSrc(fitnessImg), label: "Fitness coaches", kw: "PLAN", to: "/use-cases/fitness" },
    { img: getSrc(fashionImg), label: "Beauty & fashion", kw: "SHOP", to: "/use-cases/beauty" },
    { img: getSrc(foodImg), label: "Course & recipe creators", kw: "RECIPE", to: "/use-cases/courses" },
  ];
  return (
    <section className="py-20 md:py-24">
      <div className="wrap">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Built for creators</p>
            <h2 className="section-title mt-3 max-w-[16ch] text-ink">Whatever you post, RELO closes the loop.</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate("/use-cases/fitness")}
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-ink hover:text-signal"
          >
            Explore use cases <ArrowRight className="size-4" />
          </button>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={it.label} delay={i * 0.08}>
              <Tilt strength={6}>
                <button
                  type="button"
                  onClick={() => navigate(it.to)}
                  className="group relative block aspect-[4/5] w-full overflow-hidden rounded-[28px] text-left"
                >
                  <img
                    src={getSrc(it.img)}
                    alt={it.label}
                    loading="lazy"
                    width={864}
                    height={1152}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand/75 via-brand/5 to-transparent" />
                  <span className="frost absolute right-4 top-4 rounded-full px-3 py-1 text-[12px] font-bold text-signal">
                    “{it.kw}”
                  </span>
                  <div className="absolute inset-x-5 bottom-5 flex items-end justify-between">
                    <p className="font-heading text-on-photo text-[24px] font-semibold leading-tight tracking-[-0.03em]">
                      {it.label}
                    </p>
                    <span className="grid size-10 place-items-center rounded-full bg-surface text-ink transition-transform group-hover:-rotate-45">
                      <ArrowRight className="size-4" />
                    </span>
                  </div>
                </button>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Features bento ─────────────────────────────────────────────────────── */

function Features() {
  return (
    <section id="features" className="py-20 md:py-24">
      <div className="wrap">
        <Reveal className="text-center">
          <p className="eyebrow">Everything included</p>
          <h2 className="section-title mx-auto mt-3 max-w-[18ch] text-ink">Small tool. Serious growth engine.</h2>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-4 md:grid-rows-[auto_auto_auto]">
          <Reveal className="md:col-span-2 md:row-span-2">
            <div className="relative h-full min-h-[360px] overflow-hidden rounded-[28px] bg-brand p-8">
              <div className="brand-aurora absolute inset-0" />
              <img
                src={getSrc(heart3d)}
                alt=""
                aria-hidden
                loading="lazy"
                width={1024}
                height={1024}
                className="float-y absolute -bottom-8 -right-6 w-[62%] max-w-[340px] drop-shadow-2xl"
              />
              <div className="relative max-w-[18rem]">
                <p className="eyebrow text-signal-bright">Flat pricing</p>
                <p className="font-heading mt-3 text-[40px] font-bold leading-none tracking-[-0.04em] text-brand-ink">
                  Unlimited contacts. ₹199.
                </p>
                <p className="mt-4 text-[14.5px] leading-relaxed text-brand-ink/70">
                  No growth tax as your audience scales. Pay by UPI, get a GST invoice.
                </p>
              </div>
            </div>
          </Reveal>
          {FEATURES.slice(0, 6).map((f, i) => (
            <FeatureTile key={f.title} f={f} i={i} />
          ))}
          <Reveal className="md:col-span-2">
            <div className="relative flex h-full min-h-[180px] items-center overflow-hidden rounded-[28px] border border-line bg-surface p-7">
              <div className="relative z-10 max-w-[60%]">
                <h3 className="text-[19px] font-bold tracking-[-0.02em] text-ink">{FEATURES[7].title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{FEATURES[7].body}</p>
              </div>
              <img
                src={getSrc(bubble3d)}
                alt=""
                aria-hidden
                loading="lazy"
                width={1024}
                height={1024}
                className="float-y-slow absolute -right-4 top-1/2 w-[210px] -translate-y-1/2"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function FeatureTile({ f, i }: { f: (typeof FEATURES)[number]; i: number }) {
  const Icon = f.icon;
  return (
    <Reveal delay={(i % 2) * 0.06}>
      <div className="group h-full rounded-[24px] border border-line bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--sh-2)]">
        <span className="grid size-10 place-items-center rounded-xl bg-signal-wash text-signal transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110">
          <Icon className="size-[18px]" />
        </span>
        <h3 className="mt-5 text-[16px] font-bold tracking-[-0.015em] text-ink">{f.title}</h3>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{f.body}</p>
      </div>
    </Reveal>
  );
}

/* ── Pricing ────────────────────────────────────────────────────────────── */

function Pricing({ navigate }: LandingProps) {
  return (
    <section id="pricing" className="py-20 md:py-24">
      <div className="wrap">
        <Reveal className="text-center">
          <p className="eyebrow">Pricing</p>
          <h2 className="section-title mx-auto mt-3 max-w-[16ch] text-ink">One flat price. Grow as big as you like.</h2>
        </Reveal>
        <div className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-3">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.08}>
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-[28px] p-7",
                  p.highlighted ? "bg-brand text-brand-ink shadow-[var(--sh-3)] md:-translate-y-3" : "border border-line bg-surface"
                )}
              >
                {p.highlighted && <div className="brand-aurora absolute inset-0 rounded-[28px] opacity-70" />}
                <div className="relative flex flex-1 flex-col">
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-bold">{p.name}</p>
                    {p.highlighted && (
                      <span className="rounded-full bg-signal px-2.5 py-0.5 text-[11px] font-bold text-signal-ink">Popular</span>
                    )}
                  </div>
                  <p className="mt-5 flex items-baseline gap-1.5">
                    <span className="font-heading text-[48px] font-bold leading-none tracking-[-0.05em]">{p.price}</span>
                    <span className={cn("text-[13px]", p.highlighted ? "text-brand-ink/60" : "text-ink-3")}>{p.cadence}</span>
                  </p>
                  <p className={cn("mt-2 text-[13.5px]", p.highlighted ? "text-brand-ink/70" : "text-ink-2")}>{p.blurb}</p>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[13.5px]">
                        <Check className={cn("mt-0.5 size-4 shrink-0", p.highlighted ? "text-signal-bright" : "text-signal")} />
                        <span className={p.highlighted ? "text-brand-ink/90" : "text-ink-2"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className={cn(
                      "mt-7 h-11 rounded-xl text-[14px] font-semibold transition-transform hover:-translate-y-px",
                      p.highlighted ? "bg-signal text-signal-ink" : "bg-ink text-ink-invert"
                    )}
                  >
                    {p.cta}
                  </button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-center text-[13px] text-ink-3">
          Prices in INR, GST extra.{" "}
          <button type="button" onClick={() => navigate("/pricing")} className="font-semibold text-ink underline-offset-4 hover:underline">
            Compare all plans
          </button>
        </p>
      </div>
    </section>
  );
}

/* ── FAQ ────────────────────────────────────────────────────────────────── */

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-20 md:py-24">
      <div className="wrap grid gap-12 lg:grid-cols-[0.9fr_1.4fr]">
        <Reveal>
          <p className="eyebrow">FAQ</p>
          <h2 className="section-title mt-3 text-ink">Questions, answered.</h2>
          <p className="mt-4 max-w-sm text-[15px] text-ink-2">
            Still unsure? Write to{" "}
            <a href="mailto:hello@thepilab.in" className="font-semibold text-ink hover:text-signal">
              hello@thepilab.in
            </a>
          </p>
        </Reveal>
        <div className="divide-y divide-line border-y border-line">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left"
                >
                  <span className="text-[16.5px] font-semibold tracking-[-0.015em] text-ink">{f.q}</span>
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full transition-colors",
                      isOpen ? "bg-signal text-signal-ink" : "bg-surface-3 text-ink"
                    )}
                  >
                    {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
                  </span>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl pb-5 text-[14.5px] leading-relaxed text-ink-2">{f.a}</p>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Closing CTA ────────────────────────────────────────────────────────── */

function Closing({ navigate }: LandingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  return (
    <section className="p-2 pb-16 sm:p-3 sm:pb-20">
      <div ref={ref} className="relative overflow-hidden rounded-[32px] bg-brand">
        <motion.img
          src={getSrc(rooftopImg)}
          alt="Creators meeting on a rooftop at dusk"
          loading="lazy"
          width={1920}
          height={1088}
          style={{ y, scale: 1.25 }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand/85 via-brand/35 to-brand/20" />
        <div className="relative flex min-h-[560px] flex-col items-center justify-end px-6 pb-16 text-center">
          <Reveal>
            <h2 className="hero-title text-on-photo mx-auto max-w-[13ch] text-[clamp(2.6rem,1rem+5vw,5.4rem)]">
              Where attention becomes income.
            </h2>
            <p className="text-on-photo mx-auto mt-5 max-w-md text-[16px] opacity-85">
              Set up your first Reel automation in under five minutes. Free forever on one Reel.
            </p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="group mx-auto mt-8 inline-flex h-12 items-center gap-3 rounded-xl bg-surface pl-5 pr-2 text-[15px] font-semibold text-ink shadow-[var(--sh-3)] transition-transform hover:-translate-y-0.5"
            >
              Start for free
              <span className="grid size-8 place-items-center rounded-full bg-signal text-signal-ink">
                <ArrowRight className="size-4" />
              </span>
            </button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export function LandingPage({ navigate }: LandingProps) {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });
  return (
    <div className="relative bg-canvas">
      <motion.div style={{ scaleX: progress }} className="ember-gradient fixed inset-x-0 top-0 z-[60] h-[3px] origin-left" />
      <SiteNav navigate={navigate} onPhoto />
      <Hero navigate={navigate} />
      <TrustMarquee />
      <Statement />
      <HowItWorks />
      <Creators navigate={navigate} />
      <Features />
      <Pricing navigate={navigate} />
      <Faq />
      <Closing navigate={navigate} />
      <SiteFooter navigate={navigate} />
    </div>
  );
}
