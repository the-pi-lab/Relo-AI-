"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowDown,
  Check,
  ChevronDown,
  ShieldCheck,
  Lock,
  Instagram,
  Twitter,
  Youtube,
  Sparkles,
  Play,
  Send,
  MousePointerClick,
  Timer,
  Activity,
  Download,
  Zap,
  CircleCheck,
  Mail,
} from "lucide-react";
import { Logo, RButton, Reveal, WordReveal, Magnetic, Eyebrow, TiltCard } from "./chrome";
import {
  AsciiArt,
  AsciiWordmark,
  AsciiRain,
  AsciiFrame,
  orbitScene,
  RAMPS,
} from "./ascii";
import { BentoFeatures, NumbersBand, StoryScroll, ParallaxCorridor } from "./landing-story";
import {
  ShaderCanvas,
  Starfield,
  DustMotes,
  MouseParallax,
  MoonPhases,
  Preloader,
} from "./world";
import { ThemeToggle } from "@/lib/relo/theme";
import { CookieSettingsLink } from "./cookie-consent";

/* ══════════════════════════ NAV — the floating capsule ════════════════ */

function Nav({ navigate }: { navigate: (to: string) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => {
    setOpen(false);
    if (window.location.hash && window.location.hash !== "#/") {
      navigate("/");
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 120);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.header
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.28, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3"
    >
      <div
        className={`flex w-full max-w-4xl items-center gap-2 rounded-full border px-3 py-2 transition-all duration-500 sm:gap-3 sm:px-4 ${
          scrolled
            ? "glass border-line-strong shadow-[0_10px_40px_-12px_rgba(4,3,9,0.8)]"
            : "border-transparent bg-transparent"
        }`}
      >
        <Logo onClick={() => go("top")} />
        <nav className="ml-3 hidden items-center gap-0.5 md:flex" aria-label="Primary">
          {[
            ["story", "How it works"],
            ["features", "Features"],
            ["pricing", "Pricing"],
            ["faq", "FAQ"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => go(id)}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-[13.5px] font-medium text-ink-3 transition-colors hover:bg-ink/[0.06] hover:text-ink"
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <RButton variant="ghost" size="sm" className="whitespace-nowrap" onClick={() => navigate("/studio?demo=1")}>
            <Play className="size-3.5" /> Live demo
          </RButton>
          <RButton variant="ember" size="sm" className="whitespace-nowrap" onClick={() => navigate("/login")}>
            Sign in <ArrowRight className="size-3.5" />
          </RButton>
        </div>
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            className="grid size-10 place-items-center rounded-full border border-line-strong text-ink"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
          >
            <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass absolute inset-x-4 top-[72px] overflow-hidden rounded-3xl border border-line md:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {[
                ["story", "How it works"],
                ["features", "Features"],
                ["pricing", "Pricing"],
                ["faq", "FAQ"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => go(id)}
                  className="block w-full rounded-xl px-3 py-2.5 text-left text-[15px] font-medium text-ink-2 hover:bg-ink/[0.06]"
                >
                  {label}
                </button>
              ))}
              <div className="flex gap-2 pt-2">
                <RButton variant="ghost" size="sm" className="flex-1" onClick={() => navigate("/studio?demo=1")}>
                  Live demo
                </RButton>
                <RButton variant="ember" size="sm" className="flex-1" onClick={() => navigate("/login")}>
                  Sign in
                </RButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

/* ══════════════════════════ THE AUTOPILOT CONSOLE ═════════════════════
   The showpiece: not a picture of the machine — the machine itself,
   running in front of you. Real type, real states, zero canvas cost.
   Three instruments share one glass cockpit:
     · Feed   — comments landing, keywords locking, replies with jitter
     · Card   — the 3-button DM as it arrives in someone's requests
     · Leads  — the ledger, filling itself                      */

type ConsoleTab = "feed" | "card" | "leads";

interface FeedEvent {
  id: number;
  user: string;
  hue: number;
  comment: string;
  keyword: string;
  reply: string;
  jitter: number; /* seconds the engine held, shown counting down */
  button: string;
}

const FEED_SCRIPT: Omit<FeedEvent, "id" | "jitter">[] = [
  { user: "notionwithneha", hue: 262, comment: "omg can you send me that notion template??", keyword: "template", reply: "Just sent it 📬 check your requests!", button: "Download free pack" },
  { user: "arjun.exe", hue: 152, comment: "the second slide 🔥 is the pack free?", keyword: "pack", reply: "On its way 💬 tap the button in your DMs", button: "Download free pack" },
  { user: "priya.designs", hue: 320, comment: "how do i get access to this?", keyword: "access", reply: "Fired over ✨ it's waiting in your inbox", button: "Get the template" },
  { user: "thequirkydev", hue: 200, comment: "send send send 📨", keyword: "send", reply: "Check DMs 🚀 delivered a second ago", button: "Download free pack" },
  { user: "meghnabuilds", hue: 24, comment: "wait this is exactly what i needed", keyword: "needed", reply: "Just sent it 📬 let me know what you think!", button: "See all templates" },
];

const LEAD_ROWS = [
  { user: "notionwithneha", when: "12s", clicked: true, hue: 262 },
  { user: "arjun.exe", when: "38s", clicked: true, hue: 152 },
  { user: "priya.designs", when: "1m", clicked: false, hue: 320 },
  { user: "thequirkydev", when: "2m", clicked: true, hue: 200 },
  { user: "meghnabuilds", when: "3m", clicked: false, hue: 24 },
];

function Avatar({ hue, size = 30, initial = "?" }: { hue: number; size?: number; initial?: string }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-display font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(135deg, hsl(${hue} 68% 62%), hsl(${(hue + 46) % 360} 62% 46%))`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
      }}
      aria-hidden
    >
      {initial.slice(0, 1).toUpperCase()}
    </span>
  );
}

function HeroConsole() {
  const [tab, setTab] = useState<ConsoleTab>("feed");
  const [step, setStep] = useState(0); /* micro-stage of the live sequence */
  const [cursor, setCursor] = useState(0); /* which script line is live */
  const [hold, setHold] = useState(72); /* jitter countdown, seconds-ish */

  /* the machine's heartbeat: land → lock → hold → reply → DM → lead */
  useEffect(() => {
    if (tab !== "feed") return; /* the console rests while you inspect other instruments */
    const STAGES = 6;
    const iv = setInterval(() => {
      setStep((s) => {
        const next = s + 1;
        if (next >= STAGES) {
          setCursor((c) => (c + 1) % FEED_SCRIPT.length);
          return 0;
        }
        return next;
      });
      if (step === 2) setHold(38 + Math.floor(Math.random() * 50));
    }, 1150);
    return () => clearInterval(iv);
  }, [tab, step]);

  const live = FEED_SCRIPT[cursor];
  const history = Array.from({ length: 4 }, (_, i) => FEED_SCRIPT[(cursor - 1 - i + FEED_SCRIPT.length * 2) % FEED_SCRIPT.length]);

  return (
    <div
      className="relative overflow-hidden rounded-[26px] border border-line"
      style={{
        background: "var(--plate-bg)",
        boxShadow: "var(--shadow-lift), 0 0 90px -30px var(--ember-wash)",
      }}
    >
      {/* the cockpit glass — a faint spectral wash, not a screenshot */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 60% at 85% -10%, var(--ember-wash), transparent 60%), radial-gradient(70% 50% at 0% 110%, rgba(99,221,182,0.05), transparent 60%)",
        }}
      />
      <div className="dotgrid--bone absolute inset-0 opacity-25" aria-hidden />

      {/* ── status header ── */}
      <div className="relative flex items-center gap-3 border-b border-line px-5 py-3.5">
        <span className="relative flex size-2 shrink-0">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-moss opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-moss" />
        </span>
        <p className="font-mono text-[10.5px] font-bold tracking-[0.22em] text-ink uppercase">
          Autopilot <span className="text-ember">· live</span>
        </p>
        <span className="ml-auto hidden font-mono text-[10px] tracking-[0.14em] text-ink-4 sm:block tnum">
          eng v2.4.1 · @aarav.makes
        </span>
      </div>

      {/* ── instrument tabs ── */}
      <div className="relative flex gap-1 border-b border-line px-4 pt-3">
        {(
          [
            ["feed", "Live feed", Activity],
            ["card", "DM card", Send],
            ["leads", "Leads", Download],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`relative flex items-center gap-1.5 rounded-t-lg px-3.5 py-2 text-[12.5px] font-medium transition-colors ${
              tab === id ? "text-ink" : "text-ink-4 "
            }`}
          >
            <Icon className="size-3.5" />
            {label}
            {tab === id && (
              <motion.span
                layoutId="console-tab"
                className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-ember"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── instrument bodies ── */}
      <div className="relative min-h-[318px] px-4 py-4 sm:px-5">
        <AnimatePresence mode="wait">
          {tab === "feed" && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex min-h-full flex-col gap-2.5"
            >
              {/* the live one — big, breathing */}
              <motion.div
                layout
                className="rounded-2xl border border-ember/35 bg-ember-wash/60 p-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar hue={live.hue} initial={live.user} />
                  <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
                    @{live.user}
                  </p>
                  {/* the jitter clock — the engine's signature move */}
                  <span className="flex items-center gap-1.5 rounded-full border border-honey/40 bg-honey/10 px-2.5 py-1 font-mono text-[10px] font-bold text-honey tnum">
                    <Timer className="size-3" />
                    {step >= 2 ? `00:${String(hold).padStart(2, "0")}` : "armed"}
                  </span>
                </div>
                <p className="mt-2 text-[13.5px] leading-snug text-ink-2">“{live.comment}”</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <motion.span
                    animate={step >= 1 ? { scale: [1, 1.14, 1] } : {}}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold transition-colors ${
                      step >= 1
                        ? "bg-ember text-[var(--on-ember)]"
                        : "border border-dashed border-line-strong text-ink-4"
                    }`}
                  >
                    <Zap className="size-3" /> #{live.keyword} locked
                  </motion.span>
                  <AnimatePresence>
                    {step >= 3 && (
                      <motion.span
                        key="replied"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-moss/15 px-2.5 py-1 text-[10.5px] font-semibold text-moss"
                      >
                        <CircleCheck className="size-3" /> replied — “{live.reply}”
                      </motion.span>
                    )}
                    {step >= 4 && (
                      <motion.span
                        key="dm"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-sky/15 px-2.5 py-1 text-[10.5px] font-semibold text-sky"
                      >
                        <Send className="size-3" /> 3-button DM delivered
                      </motion.span>
                    )}
                    {step >= 5 && (
                      <motion.span
                        key="lead"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-honey/15 px-2.5 py-1 text-[10.5px] font-bold text-honey"
                      >
                        ★ lead captured → leads.csv
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* the ones before — fading into the ledger */}
              {history.map((h, i) => (
                <motion.div
                  key={`${cursor}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1 - i * 0.22, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="flex items-center gap-2.5 rounded-xl border border-line bg-card-soft/70 px-3 py-2"
                >
                  <Avatar hue={h.hue} size={22} initial={h.user} />
                  <p className="min-w-0 flex-1 truncate text-[12px] text-ink-3">
                    <span className="font-semibold text-ink-2">@{h.user}</span> — {h.comment}
                  </p>
                  <span className="hidden shrink-0 items-center gap-1 font-mono text-[9.5px] text-moss sm:flex">
                    <CircleCheck className="size-3" /> DM sent
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {tab === "card" && (
            <motion.div
              key="card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center"
            >
              {/* the DM as it lands on a phone */}
              <div className="rounded-[26px] border border-line bg-card-soft p-3.5 shadow-[var(--shadow-soft)]">
                <div className="flex items-center gap-2.5 pb-3">
                  <span className="grid size-8 place-items-center rounded-full bg-ember font-display text-[12px] font-extrabold text-[var(--on-ember)]">
                    R
                  </span>
                  <div>
                    <p className="text-[12.5px] font-bold text-ink">RELO · @aarav.makes</p>
                    <p className="font-mono text-[9.5px] tracking-[0.14em] text-ink-4 uppercase">
                      just now · automated
                    </p>
                  </div>
                </div>
                <div
                  className="grid h-24 place-items-center rounded-xl border border-line"
                  style={{ background: "linear-gradient(120deg, var(--card), var(--card-soft))" }}
                >
                  <div className="text-center">
                    <p className="font-mono text-[9px] tracking-[0.3em] text-ink-4 uppercase">your art</p>
                    <p className="mt-1 font-display text-[13px] font-bold text-ink-2">The Creator OS — free pack</p>
                  </div>
                </div>
                <p className="mt-3 text-[13px] font-semibold text-ink">Grab the free Creator OS pack 🎁</p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-ink-3">
                  12 templates + the exact comment scripts I use. No email needed.
                </p>
                <div className="mt-3 space-y-2">
                  {["Download free pack", "See all templates"].map((b, i) => (
                    <motion.div
                      key={b}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.12 }}
                      
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[12.5px] font-semibold ${
                        i === 0 ? "bg-ember text-[var(--on-ember)]" : "border border-ember/40 text-ember"
                      }`}
                    >
                      {b}
                      <MousePointerClick className="size-3.5 opacity-75" />
                    </motion.div>
                  ))}
                  <p className="pt-1 text-center font-mono text-[9.5px] tracking-[0.18em] text-ink-4 uppercase">
                    78% tap the first button
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {tab === "leads" && (
            <motion.div
              key="leads"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex min-h-full flex-col"
            >
              <div className="flex items-center justify-between rounded-xl bg-ink px-3.5 py-2 font-mono text-[10px] tracking-[0.2em] text-night uppercase">
                leads.csv
                <span className="tnum">1,284 rows</span>
              </div>
              <div className="mt-2 flex-1 space-y-1.5 overflow-hidden">
                {LEAD_ROWS.map((l, i) => (
                  <motion.div
                    key={l.user}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-center gap-3 rounded-xl border border-line bg-card-soft/70 px-3 py-2.5"
                  >
                    <Avatar hue={l.hue} size={26} initial={l.user} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-ink">@{l.user}</p>
                      <p className="font-mono text-[9.5px] text-ink-4">commented {l.when} ago</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 font-mono text-[9.5px] font-bold uppercase ${
                        l.clicked ? "bg-moss/15 text-moss" : "bg-ink/5 text-ink-4"
                      }`}
                    >
                      {l.clicked ? "✓ clicked" : "sent"}
                    </span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between rounded-xl border border-dashed border-line-strong px-3.5 py-2.5">
                <p className="text-[11.5px] text-ink-3">Export the whole book — yours, not ours.</p>
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold text-ember">
                  <Download className="size-3.5" /> CSV
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── bottom ledger rail ── */}
      <div className="relative flex items-center gap-5 border-t border-line px-5 py-3">
        {[
          ["DMs today", "1,284"],
          ["click rate", "61%"],
          ["avg hold", "38s"],
        ].map(([k, v], i) => (
          <div key={k} className={i > 0 ? "hidden sm:block" : ""}>
            <p className="font-mono text-[9px] tracking-[0.2em] text-ink-4 uppercase">{k}</p>
            <p className="font-display text-[15px] font-extrabold text-ink tnum">{v}</p>
          </div>
        ))}
        <span className="ml-auto hidden font-mono text-[9.5px] tracking-[0.16em] text-ink-4 uppercase sm:block">
          replying while you read this
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════ THE PORTAL GATE (HERO) ════════════════════
   Seven layers of the same room:
   aurora → stars → moon-glow → star-chart → words → the window → chips.
   Scroll and the layers part at different speeds — you fall in. */

function Hero({ navigate }: { navigate: (to: string) => void }) {
  const { scrollY } = useScroll();
  const textY = useTransform(scrollY, [0, 700], [0, -110]);
  const textOp = useTransform(scrollY, [0, 480], [1, 0]);
  const artY = useTransform(scrollY, [0, 700], [0, 70]);
  const artScale = useTransform(scrollY, [0, 700], [1, 0.94]);
  const auroraY = useTransform(scrollY, [0, 700], [0, 140]);
  const gridY = useTransform(scrollY, [0, 700], [0, 60]);

  const [statusIdx, setStatusIdx] = useState(0);
  const STATUS = [
    "00:38 — holding for human jitter",
    "replying to @notionwithneha",
    "DM card armed — 3 buttons live",
    "lead captured → leads.csv",
    "next comment in 00:12",
  ];
  useEffect(() => {
    const t = setInterval(() => setStatusIdx((i) => (i + 1) % STATUS.length), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="top" className="vignette relative min-h-[100svh] overflow-hidden pb-20 pt-36 sm:pt-40">
      {/* L0 — the aurora, furthest light in the room */}
      <motion.div style={{ y: auroraY }} className="absolute inset-0">
        <ShaderCanvas kind="aurora" opacity={0.95} />
      </motion.div>
      {/* L1 — the stars. one of them will fall while you read */}
      <Starfield density={96} opacity={0.85} />
      {/* L2 — the far moon, a warm memory of daylight */}
      <MouseParallax depth={-14} className="absolute inset-0">
        <div
          aria-hidden
          className="anim-breathe absolute -top-44 left-[68%] size-64 rounded-full opacity-70 blur-2xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(242,196,141,0.30), rgba(242,196,141,0.06) 60%, transparent)",
          }}
        />
      </MouseParallax>
      {/* L3 — the star chart */}
      <motion.div style={{ y: gridY }} className="absolute inset-0">
        <MouseParallax depth={7}>
          <div className="dotgrid absolute -inset-10 opacity-60" aria-hidden />
        </MouseParallax>
      </motion.div>
      {/* drifting iris light — one more depth of the same room */}
      <MouseParallax depth={24} className="absolute inset-0">
        <div
          aria-hidden
          className="anim-drift absolute top-1/3 -left-28 size-80 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(139,128,249,0.22), transparent)" }}
        />
      </MouseParallax>
      <DustMotes density={28} opacity={0.6} />

      <div className="relative z-[2] mx-auto max-w-6xl px-5 sm:px-8">
        {/* the words */}
        <motion.div style={{ y: textY, opacity: textOp }} className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="flex justify-center"
          >
            <Eyebrow className="justify-center">Instagram autopilot · official Meta API</Eyebrow>
          </motion.div>

          <h1 className="font-display mt-6 text-[11.5vw] font-extrabold leading-[0.98] tracking-[-0.035em] sm:text-7xl lg:text-[5.4rem]">
            <WordReveal text="Comments in." delay={0.25} />
            <br />
            <WordReveal text="Customers out." delay={0.6} accentWords={["customers"]} />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="serif-accent mx-auto mt-6 max-w-xl text-[19px] leading-[1.65] text-ink-3 sm:text-[21px]"
          >
            You just walked through a door. On the other side, your Reel comments
            reply like humans and every commenter gets a 3-button DM — set once,
            sell forever.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.15 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3.5"
          >
            <Magnetic>
              <RButton size="lg" onClick={() => navigate("/login")}>
                Start free · no card needed <ArrowRight className="size-4" />
              </RButton>
            </Magnetic>
            <Magnetic strength={0.25}>
              <RButton variant="outline" size="lg" onClick={() => navigate("/studio?demo=1")}>
                <Play className="size-4" /> Tour the live demo
              </RButton>
            </Magnetic>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[11px] tracking-wide text-ink-4"
          >
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-moss" /> AES-256 token vault
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="size-3.5 text-moss" /> Meta-official · no scraping
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-honey" /> 30–90s human jitter
            </span>
          </motion.div>
        </motion.div>

        {/* the cockpit — the machine itself, running in front of you */}
        <motion.div
          style={{ y: artY, scale: artScale, transformPerspective: 1200 }}
          initial={{ opacity: 0, y: 60, rotateX: 6 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.2, delay: 0.7, ease: [0.22, 1, 0.28, 1] }}
          className="relative mx-auto mt-16 max-w-[660px]"
        >
          <MouseParallax depth={-10}>
            <div className="relative">
              {/* the plate label — keeps the observatory's museum voice */}
              <div className="absolute -top-3 left-6 z-10 flex items-center gap-2 rounded-full border border-line px-3 py-1 shadow-[var(--shadow-soft)]" style={{ background: "var(--plate-bg)" }}>
                <span className="font-mono text-[9px] tracking-[0.26em] text-ember-hot uppercase tnum">fig. 01</span>
                <span className="font-mono text-[9px] tracking-[0.18em] text-ink-3 uppercase">the autopilot, live</span>
              </div>
              <HeroConsole />
            </div>
          </MouseParallax>

          {/* floating annotation chips — the nearest parallax plane, pinned
              just off the plate's edges where the room is empty */}
          <MouseParallax depth={24} className="absolute inset-0">
            <FloatChip
              className="top-[16%] -left-44"
              label="keyword matched"
              value="“notion”"
              delay={1.6}
            />
            <FloatChip
              className="top-[52%] -right-36"
              label="DM card"
              value="3 buttons armed"
              delay={1.9}
              tone="ember"
            />
            <FloatChip
              className="bottom-[10%] -left-40"
              label="lead captured"
              value="new commenter → CSV"
              delay={2.2}
              tone="moss"
            />
          </MouseParallax>

          {/* live status rail — the machine mutters in its sleep */}
          <div className="glass mt-3 flex h-9 items-center gap-3 overflow-hidden rounded-full border border-line px-4">
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-moss opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-moss" />
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={statusIdx}
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.28, 1] }}
                className="truncate font-mono text-[10.5px] tracking-[0.12em] text-ink-3 tnum"
              >
                {STATUS[statusIdx]}
              </motion.span>
            </AnimatePresence>
            <span className="ml-auto hidden font-mono text-[10px] text-ink-4 sm:block tnum">eng. v2.4.1</span>
          </div>
        </motion.div>
      </div>

      {/* scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        className="mt-14 flex justify-center"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-2 font-mono text-[10px] tracking-[0.28em] text-ink-4 uppercase"
        >
          scroll — fall in <ArrowDown className="size-3.5" />
        </motion.div>
      </motion.div>
    </section>
  );
}

function FloatChip({
  label,
  value,
  className,
  delay,
  tone = "bone",
}: {
  label: string;
  value: string;
  className?: string;
  delay: number;
  tone?: "bone" | "ember" | "moss";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 220, damping: 20 }}
      className={`absolute z-10 hidden xl:block ${className ?? ""}`}
    >
      <div
        className={`anim-float rounded-xl border px-3 py-2 shadow-[var(--shadow-lift)] ${
          tone === "ember"
            ? "border-ember/40 bg-ember-wash"
            : tone === "moss"
              ? "border-moss/40 bg-moss/15"
              : "border-line-strong bg-card/95"
        }`}
        style={{ animationDelay: `${delay}s` }}
      >
        <p className="font-mono text-[8.5px] tracking-[0.2em] text-ink-3 uppercase">{label}</p>
        <p className="mt-0.5 font-mono text-[11px] font-bold text-ink tnum">{value}</p>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════ SECTION RIFT ══════════════════════════════
   A breath between worlds: lunar phases, coordinates, hairlines. */

function SectionRift({
  label,
  active,
  flip = false,
}: {
  label: string;
  active?: number;
  flip?: boolean;
}) {
  return (
    <div className="relative mx-auto flex max-w-6xl items-center gap-5 px-5 py-14 sm:px-8" aria-hidden>
      <div className="hairline-x flex-1" />
      <div className={`flex items-center gap-4 ${flip ? "flex-row-reverse" : ""}`}>
        <MoonPhases active={active} />
        <span className="font-mono text-[9.5px] tracking-[0.34em] text-ink-4 uppercase">{label}</span>
      </div>
      <div className="hairline-x flex-1" />
    </div>
  );
}

/* ══════════════════════════ MARQUEE ══════════════════════════ */

function Marquee() {
  const items = [
    "official Meta Graph API · nothing scraped",
    "keyword → DM in seconds, not hours",
    "30–90s human-jitter timing on every reply",
    "3-button DM cards, no password ever asked",
    "leads export to CSV · one click, yours",
    "tokens sealed with AES-256 encryption",
    "24-hour window tracked before you send",
    "set it once · it answers while you film",
  ];
  const row = [...items, ...items];
  return (
    <section aria-label="How RELO works" className="border-y border-line bg-night-2/60 py-5 overflow-hidden">
      <div
        className="flex w-max gap-10"
        style={{ animation: "marquee-x 36s linear infinite" }}
      >
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap font-mono text-[12px] text-ink-3">
            {t}
            <span className="text-honey">✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════ PRICING ══════════════════════════ */

const TIERS = [
  {
    name: "Free",
    tagline: "Taste the autopilot",
    inr: 0,
    usd: 0,
    annualInr: 0,
    annualUsd: 0,
    features: [
      "1 automated reel",
      "2 comment reply variations",
      "2 DM buttons + “Automated by RELO”",
      "3 AI credits / month",
      "Lead capture + CSV export",
    ],
    missing: ["Follow-ups & campaigns", "AI product Q&A"],
  },
  {
    name: "Pro",
    tagline: "For creators who sell",
    inr: 149,
    usd: 9.99,
    annualInr: 1499,
    annualUsd: 99,
    hot: true,
    features: [
      "Unlimited automated reels",
      "3–8 spintax reply variations",
      "3 DM buttons, no RELO branding",
      "Follow-up DMs + campaigns",
      "AI product Q&A · 500 credits/mo",
      "Sent → clicked analytics",
    ],
  },
  {
    name: "Studio",
    tagline: "For builders & agencies",
    inr: 399,
    usd: 24.99,
    annualInr: 3999,
    annualUsd: 249,
    features: [
      "Everything in Pro",
      "Canvas node builder (your own flows)",
      "3 connected IG accounts",
      "Priority queue · 5,000 AI credits/mo",
    ],
  },
];

function Pricing({ navigate }: { navigate: (to: string) => void }) {
  const [cur, setCur] = useState<"INR" | "USD">("INR");
  const fmt = (v: number) =>
    cur === "INR" ? `₹${v.toLocaleString("en-IN")}` : `$${v.toLocaleString("en-US")}`;

  return (
    <section id="pricing" className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="font-display mt-4 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            One flat fee. <span className="serif-accent text-spectral">Zero contact tax.</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-3">
            Start free, upgrade in-app when the DMs start paying for it. No per-contact
            pricing, no surprise overages — your leads are yours.
          </p>
        </div>
        <div className="flex rounded-full border border-line-strong bg-card p-1" role="radiogroup" aria-label="Currency">
          {(["INR", "USD"] as const).map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={cur === c}
              onClick={() => setCur(c)}
              className={`relative rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                cur === c ? "text-[var(--primary-foreground)]" : "text-ink-3 "
              }`}
            >
              {cur === c && (
                <motion.span
                  layoutId="cur-pill"
                  className="absolute inset-0 rounded-full bg-ink"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative">{c === "INR" ? "₹ India" : "$ Global"}</span>
            </button>
          ))}
        </div>
      </Reveal>

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {TIERS.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.08}>
            <TiltCard max={5}>
              <motion.article
                
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className={`relative h-full rounded-[26px] ${
                  t.hot
                    ? "p-[1.5px]"
                    : ""
                }`}
                style={
                  t.hot
                    ? {
                        background:
                          "linear-gradient(150deg, rgba(169,157,255,0.9), rgba(139,128,249,0.25) 40%, rgba(242,196,141,0.7))",
                        boxShadow: "0 20px 60px -18px rgba(139,128,249,0.45)",
                      }
                    : undefined
                }
              >
                <div
                  className={`h-full rounded-[24.5px] p-7 ${
                    t.hot ? "bg-card-soft" : "border border-line bg-card shadow-[var(--shadow-soft)]"
                  }`}
                >
                  {t.hot && (
                    <span
                      className="on-ember absolute -top-3 left-6 rounded-full px-3 py-1 font-mono text-[10px] font-bold tracking-[0.16em] uppercase"
                      style={{ background: "linear-gradient(90deg, #a99dff, #f2c48d)" }}
                    >
                      most popular
                    </span>
                  )}
                  <h3 className="font-display text-xl font-bold">{t.name}</h3>
                  <p className="mt-1 text-[13px] text-ink-3">{t.tagline}</p>
                  <div className="mt-5 flex items-baseline gap-1.5">
                    <span className="font-display text-[2.6rem] font-extrabold leading-none tracking-tight">
                      {fmt(t.inr === 0 ? 0 : cur === "INR" ? t.inr : t.usd)}
                    </span>
                    <span className="text-sm text-ink-4">/mo</span>
                  </div>
                  {(cur === "INR" ? t.annualInr : t.annualUsd) > 0 && (
                    <p className="mt-1.5 font-mono text-[11px] text-ink-4">
                      or {fmt(cur === "INR" ? t.annualInr : t.annualUsd)}/yr — 2 months free
                    </p>
                  )}
                  <ul className="mt-6 space-y-2.5">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-ink-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-moss" strokeWidth={2.6} /> {f}
                      </li>
                    ))}
                    {t.missing?.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-ink-4 line-through decoration-ink-4/50">
                        <Check className="mt-0.5 size-4 shrink-0" strokeWidth={2.6} /> {f}
                      </li>
                    ))}
                  </ul>
                  <RButton
                    variant={t.hot ? "ember" : "ghost"}
                    className="mt-7 w-full"
                    onClick={() => navigate("/login")}
                  >
                    Start free{t.hot ? ", upgrade in-app" : ""}
                  </RButton>
                </div>
              </motion.article>
            </TiltCard>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-10">
        <p className="mx-auto max-w-2xl text-center text-[13.5px] leading-relaxed text-ink-3">
          Running more than 3 creators? Agency plans are built personally — white-label
          and volume pricing are a conversation, not a self-serve toggle.{" "}
          <a href="mailto:hello@thepilab.in" className="font-medium text-ember-hot underline-offset-4 ">
            hello@thepilab.in
          </a>
        </p>
        <p className="mx-auto mt-4 max-w-xl text-center font-mono text-[10px] leading-relaxed tracking-wide text-ink-4/80">
          prices exclude GST where applicable · plan features may evolve with 30 days
          of email notice · cancel anytime, no lock-in
        </p>
      </Reveal>
    </section>
  );
}

/* ══════════════════════════ FAQ ══════════════════════════ */

const FAQS = [
  {
    q: "Is this allowed by Instagram?",
    a: "RELO is built entirely on the official Meta Graph API using your own connected account — no scraping, no unofficial tricks. Automation still carries whatever risk Meta's own rules set for every tool, which is exactly why RELO sends at human pace with built-in ceilings instead of blitzing.",
  },
  {
    q: "How fast do the DMs go out?",
    a: "We acknowledge Meta's webhook in under 15ms, then deliberately wait 30–90 seconds so the reply feels human — never a bot-blitz that gets accounts flagged.",
  },
  {
    q: "What is the 24-hour window?",
    a: "Meta only lets an account DM a user within 24 hours of that user's last message. RELO shows you exactly which leads are still reachable before any campaign — so you're never in the dark.",
  },
  {
    q: "Do I need an Instagram Professional account?",
    a: "Yes. Meta requires an Instagram Professional (Creator or Business) account for API access. Switching is free and takes about a minute in the Instagram app.",
  },
  {
    q: "What happens to my data?",
    a: "Your access tokens are encrypted with AES-256-GCM and can be revoked anytime. Your leads are yours — export the full list to CSV with one click, or delete everything.",
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 pb-24 sm:px-8 sm:pb-32">
      <Reveal className="text-center">
        <Eyebrow className="justify-center">FAQ</Eyebrow>
        <h2 className="font-display mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Asked <span className="serif-accent text-spectral">every time.</span>
        </h2>
      </Reveal>
      <div className="mt-12 space-y-3">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <Reveal key={f.q} delay={i * 0.04}>
              <div
                className={`overflow-hidden rounded-2xl border transition-colors duration-300 ${
                  isOpen ? "border-ember/40 bg-card" : "border-line bg-card/60 "
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center gap-4 px-5 py-4.5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-mono text-[11px] text-ember-hot">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-display flex-1 text-[16px] font-semibold">{f.q}</span>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.35 }}>
                    <ChevronDown className="size-4 text-ink-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.28, 1] }}
                    >
                      <p className="px-5 pb-5 pl-[52px] text-[14.5px] leading-relaxed text-ink-3">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ══════════════════════════ FOOTER — the deep end ════════════════════ */

function FooterCta({ navigate }: { navigate: (to: string) => void }) {
  return (
    <>
      <section className="vignette-dark relative grain overflow-hidden bg-night text-bone">
        {/* the buried core — the floor of the world glows from below */}
        <ShaderCanvas kind="nebula" opacity={0.9} />
        <AsciiRain density={22} opacity={0.3} />
        <Starfield density={60} opacity={0.5} />
        <div className="dotgrid--bone absolute inset-0 opacity-30" aria-hidden />
        <div className="relative z-[2] mx-auto max-w-4xl px-5 py-24 text-center sm:px-8 sm:py-32">
          <Reveal>
            <Eyebrow tone="dark" className="justify-center">Your move</Eyebrow>
            <h2 className="font-display mt-5 text-5xl font-extrabold tracking-tight text-balance sm:text-7xl">
              Make your comments{" "}
              <span className="serif-accent text-spectral">pay rent.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-bone-dim">
              Your next 1,000 customers are already commenting. RELO answers every
              single one — while you film the next reel.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3.5">
              <Magnetic>
                <RButton size="lg" variant="bone" onClick={() => navigate("/login")}>
                  Start free <ArrowRight className="size-4" />
                </RButton>
              </Magnetic>
              <Magnetic strength={0.25}>
                <RButton
                  size="lg"
                  variant="outline"
                  className="border-line-strong text-bone hover:border-bone-dim/60 hover:text-bone"
                  onClick={() => navigate("/studio?demo=1")}
                >
                  <Play className="size-4" /> Tour the studio
                </RButton>
              </Magnetic>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="mt-16">
            <div className="mx-auto max-w-2xl opacity-90">
              <AsciiWordmark text="RELO" cols={110} fontSize={9} melt={0.4} sweep />
            </div>
            <MoonPhases className="mt-4 justify-center" />
            <p className="mt-3 font-mono text-[10px] tracking-[0.34em] text-bone-dim/70 uppercase">
              comments in · customers out
            </p>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-line bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-10 sm:px-8">
          <Logo />
          <p className="text-center text-[12.5px] text-ink-4 sm:ml-4 sm:text-left">
            Built by <span className="font-medium text-ink-3">The π Lab</span> — software
            that behaves like magic. Comment engine adapted from OpenReply (MIT).
          </p>
          <p className="mx-auto max-w-xl text-center font-mono text-[10px] leading-relaxed tracking-wide text-ink-4/80">
            RELO is an independent product — not affiliated with, endorsed by, or sponsored
            by Meta Platforms or Instagram. The studio tour runs on sample data; nothing
            you see in it is a promise of results. Automate responsibly, per Meta&apos;s rules.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-[11.5px] text-ink-4">
            <button onClick={() => navigate("/privacy")} className="cursor-pointer">
              Privacy
            </button>
            <button onClick={() => navigate("/terms")} className="cursor-pointer">
              Terms
            </button>
            <button onClick={() => navigate("/cookies")} className="cursor-pointer">
              Cookies
            </button>
            <CookieSettingsLink />
            <a href="mailto:hello@thepilab.in" className="inline-flex items-center gap-1.5">
              <Mail className="size-3" /> Contact
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
    </>
  );
}

/* ══════════════════════════ ORBIT INTERLUDE ══════════════════════════
   A breath between sections — a small planet keeping its moons, drifting
   in the dark. The moment the visitor realises this isn't a normal page. */

function OrbitInterlude() {
  return (
    <section aria-label="The RELO world" className="vignette-dark relative grain overflow-hidden bg-night">
      <ShaderCanvas kind="iris" opacity={0.5} />
      <Starfield density={70} opacity={0.6} />
      <AsciiRain density={14} opacity={0.2} />
      <DustMotes density={20} tone="bone" opacity={0.45} />
      <div className="relative z-[2] mx-auto grid max-w-6xl items-center gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] sm:py-28">
        <Reveal>
          <Eyebrow tone="dark">somewhere quiet</Eyebrow>
          <h2 className="font-display mt-4 text-3xl font-bold leading-[1.08] tracking-tight text-balance sm:text-[2.6rem]">
            Your account is a small planet.
            <br />
            <span className="serif-accent text-spectral">We keep it in orbit.</span>
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-bone-dim">
            While you sleep, RELO circles your comments — answering, sorting,
            delivering, remembering. Every moon is a conversation that turned
            into a customer without you lifting a finger.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 font-mono text-[10.5px] tracking-[0.18em] text-bone-dim/80 uppercase">
            <span><span className="text-ember-hot">●</span> autopilot core</span>
            <span><span className="text-honey">●</span> human-timed replies</span>
            <span><span className="text-moss">●</span> your audience, in orbit</span>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <MouseParallax depth={-16}>
            <AsciiFrame fig="fig. 02" caption="the relo system, overnight" status="3 moons">
              <AsciiArt
                scene={orbitScene}
                cols={92}
                aspect={1.55}
                ramp={RAMPS.soft}
                fontSize={8.5}
                melt={0.3}
                className="w-full"
                ariaLabel="A ringed planet with three moons, drawn in ASCII"
              />
            </AsciiFrame>
          </MouseParallax>
        </Reveal>
      </div>
    </section>
  );
}

/* ══════════════════════════ PAGE ══════════════════════════ */

export function LandingPage({ navigate }: { navigate: (to: string) => void }) {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 26 });

  return (
    <div className="relative">
      {/* one breath before the door opens */}
      <Preloader />

      {/* scroll progress — a moonbeam across the top */}
      <motion.div
        className="fixed inset-x-0 top-0 z-[70] h-[2.5px] origin-left"
        style={{
          scaleX: progress,
          background: "linear-gradient(90deg, #7366ec, #a99dff 45%, #f2c48d)",
        }}
        aria-hidden
      />
      <Nav navigate={navigate} />
      <main>
        <Hero navigate={navigate} />
        <Marquee />
        <StoryScroll />
        <SectionRift label="descent 01 · the loop holds" active={2} />
        <ParallaxCorridor />
        <SectionRift label="descent 02 · instruments" active={5} flip />
        <BentoFeatures />
        <OrbitInterlude />
        <NumbersBand />
        <SectionRift label="descent 03 · the ledger" active={7} />
        <Pricing navigate={navigate} />
        <Faq />
        <FooterCta navigate={navigate} />
      </main>
    </div>
  );
}
