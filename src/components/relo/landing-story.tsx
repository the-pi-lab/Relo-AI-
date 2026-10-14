"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, type MotionValue } from "framer-motion";
import {
  Check,
  Timer,
  MessageSquareDashed,
  Hand,
  FileSpreadsheet,
  Repeat2,
  UserCheck,
  Zap,
  MousePointerClick,
  Inbox,
  MousePointer2,
} from "lucide-react";
import { Eyebrow, Reveal, SpotlightCard, CountUp } from "./chrome";
import { AsciiStrip, AsciiRain } from "./ascii";
import { ShaderCanvas, Starfield, DustMotes } from "./world";

/* ═══════════════════════════════════════════════════════════════════════
   THE SCROLL STORY — sticky three-act cinematic
   Act I  — a comment lands on the reel
   Act II — RELO locks onto the keyword, picks a human reply, waits
   Act III— the 3-button DM card lands; the lead is captured
   ═══════════════════════════════════════════════════════════════════════ */

export function StoryScroll() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end end"],
  });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.6 });

  return (
    <section id="story" ref={wrapRef} className="vignette-dark relative bg-night text-bone grain">
      {/* the buried core + glyph weather — the story happens inside the world */}
      <ShaderCanvas kind="nebula" opacity={0.55} />
      <Starfield density={50} opacity={0.4} />
      <AsciiRain density={16} opacity={0.2} />
      <DustMotes density={20} tone="bone" opacity={0.45} />
      <div className="dotgrid--bone absolute inset-0 opacity-50" aria-hidden />
      <div className="relative z-[2] mx-auto max-w-6xl px-5 sm:px-8">
        <div className="h-[300vh]">
          {/* sticky stage */}
          <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
            {/* heading */}
            <div className="pt-16 pb-4 sm:pb-6">
              <Eyebrow tone="dark">The loop</Eyebrow>
              <h2 className="font-display mt-3 max-w-3xl text-3xl font-bold leading-[1.04] tracking-tight sm:text-5xl">
                One reel. One comment.
                <br />
                <span className="serif-accent text-spectral">One customer.</span>
              </h2>
            </div>

            {/* stage */}
            <div className="relative mx-auto w-full max-w-4xl flex-1">
              <ActComment p={p} />
              <ActKeyword p={p} />
              <ActDm p={p} />
            </div>

            {/* progress rail */}
            <StoryRail p={p} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* crossfade helper: maps scroll progress to [opacity, y, scale] */
function useAct(p: MotionValue<number>, from: number, to: number) {
  const opacity = useTransform(p, [from, from + 0.06, to - 0.06, to], [0, 1, 1, 0]);
  const y = useTransform(p, [from, from + 0.08], [44, 0]);
  const scale = useTransform(p, [from, from + 0.08], [0.94, 1]);
  const exitY = useTransform(p, [to - 0.06, to], [0, -34]);
  const finalY = useTransform([y, exitY], ([a, b]) => (a as number) + (b as number));
  return { opacity, y: finalY, scale };
}

const ACT_FIT = "[@media(max-height:780px)]:scale-[0.85] [@media(max-height:640px)]:scale-[0.72] origin-center";

/* ── ACT I — the comment ─────────────────────────────────────────────── */

function ActComment({ p }: { p: MotionValue<number> }) {
  const a = useAct(p, 0.02, 0.3);
  return (
    <motion.div style={a} className="absolute inset-0 flex items-center justify-center">
      <div className={ACT_FIT + " w-full max-w-xl"}>
        {/* reel card */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-night-2/90 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-white/8 px-5 py-3.5">
            <div
              className="grid size-9 place-items-center rounded-full font-display text-sm font-bold text-[#12101f]"
              style={{ background: "linear-gradient(135deg,#a99dff,#f2c48d)" }}
            >
              a
            </div>
            <div>
              <p className="text-sm font-semibold">aarav.makes</p>
              <p className="font-mono text-[10px] tracking-widest text-bone-dim uppercase">Reel · original audio</p>
            </div>
            <span className="ml-auto rounded-full bg-ember/15 px-3 py-1 font-mono text-[10px] tracking-widest text-ember-hot uppercase">
              live
            </span>
          </div>
          <div className="relative grid h-32 place-items-center sm:h-40"
            style={{ background: "linear-gradient(135deg,#16142a 0%,#1d1936 55%,#120f22 100%)" }}>
            <div className="dotgrid absolute inset-0 opacity-30" aria-hidden />
            <p className="font-display relative px-8 text-center text-lg font-semibold text-bone/90 sm:text-xl">
              “3 Notion templates that replaced my ₹40,000 stack”
            </p>
          </div>
          {/* the comment arriving */}
          <div className="space-y-3 px-5 py-4">
            <motion.div
              initial={{ opacity: 0, x: -18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="flex items-start gap-2.5"
            >
              <div className="mt-0.5 size-7 shrink-0 rounded-full bg-sky/40" />
              <div className="rounded-2xl rounded-tl-md bg-white/[0.06] px-4 py-2.5">
                <p className="text-[13px] text-bone-dim">
                  <span className="font-semibold text-bone">@notionwithneha</span>{" "}
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  >
                    notion please 🔥
                  </motion.span>
                </p>
                <p className="mt-1 font-mono text-[10px] text-bone-dim/70">2m ago · 1,283 others commenting</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── ACT II — keyword lock + human timing ────────────────────────────── */

function ActKeyword({ p }: { p: MotionValue<number> }) {
  const a = useAct(p, 0.33, 0.62);
  const replies = [
    "Just sent it 📬 check your DMs!",
    "On its way — peek at your requests 💬",
    "Fired over! Grab it from your inbox ✨",
  ];
  const [ri, setRi] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setRi((i) => (i + 1) % replies.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div style={a} className="absolute inset-0 flex items-center justify-center">
      <div className={ACT_FIT + " w-full max-w-xl space-y-3"}>
        {/* keyword lock-on */}
        <div className="rounded-3xl border border-white/10 bg-night-2/90 p-4 sm:p-5">
          <p className="font-mono text-[10px] tracking-[0.2em] text-bone-dim uppercase">Trigger matched</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["notion", "template", "send"].map((k, i) => (
              <motion.span
                key={k}
                initial={{ scale: 0.6, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 * i, type: "spring", stiffness: 300, damping: 18 }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-[13px] ${
                  i === 0
                    ? "bg-ember on-ember shadow-[var(--shadow-ember)]"
                    : "bg-white/[0.07] text-bone-dim"
                }`}
              >
                {i === 0 && <Zap className="size-3" />}
                {k}
              </motion.span>
            ))}
            <span className="inline-flex items-center rounded-full border border-dashed border-white/15 px-3.5 py-1.5 font-mono text-[12px] text-bone-dim/70">
              whole-word · unicode-safe
            </span>
          </div>
        </div>

        {/* spintax shuffle */}
        <div className="rounded-3xl border border-white/10 bg-night-2/90 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] tracking-[0.2em] text-bone-dim uppercase">Public reply — spintax</p>
            <Repeat2 className="size-4 text-bone-dim" />
          </div>
          <div className="relative mt-3 h-9 overflow-hidden">
            {replies.map((r, i) => (
              <motion.p
                key={r}
                animate={{
                  opacity: ri === i ? 1 : 0,
                  y: ri === i ? 0 : ri > i || (ri === 0 && i === replies.length - 1) ? -28 : 28,
                }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.28, 1] }}
                className="absolute inset-0 flex items-center text-[15px] text-bone"
              >
                {r}
              </motion.p>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/[0.05] px-4 py-3">
            <Timer className="size-4 shrink-0 text-honey" />
            <p className="text-[13px] text-bone-dim">
              Holding <span className="font-semibold text-bone">30–90s</span> human jitter — never a bot-blitz.
            </p>
            <motion.span
              className="ml-auto font-mono text-xs text-honey"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            >
              00:38
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── ACT III — the DM card + lead capture ────────────────────────────── */

function ActDm({ p }: { p: MotionValue<number> }) {
  const a = useAct(p, 0.66, 0.97);
  return (
    <motion.div style={a} className="absolute inset-0 flex items-center justify-center">
      <div className={ACT_FIT + " w-full max-w-xl"}>
        {/* dm thread */}
        <div className="rounded-3xl border border-white/10 bg-night-2/90 p-4 sm:p-5">
          <p className="font-mono text-[10px] tracking-[0.2em] text-bone-dim uppercase">
            DM delivered · 38s after comment
          </p>
          <div className="mt-3 flex items-start gap-2.5">
            <div
              className="grid size-8 place-items-center rounded-full font-display text-xs font-bold text-[#12101f]"
              style={{ background: "linear-gradient(135deg,#a99dff,#f2c48d)" }}
            >
              a
            </div>
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.28, 1] }}
              className="max-w-[85%] rounded-2xl rounded-tl-md bg-white/[0.07] p-3"
            >
              <div
                className="mb-2.5 grid h-12 place-items-center rounded-xl border border-white/10"
                style={{ background: "linear-gradient(120deg,#1d1936,#2c2550)" }}
              >
                <span className="font-mono text-[10px] tracking-[0.25em] text-bone-dim uppercase">template pack</span>
              </div>
              <p className="text-[13px] font-semibold text-bone">The Creator OS — free pack</p>
              <p className="mt-0.5 text-[11px] text-bone-dim">3 templates · No email needed</p>
              <div className="mt-2.5 space-y-1.5">
                {["Download free pack", "See all templates", "Talk to me"].map((b, i) => (
                  <motion.div
                    key={b}
                    initial={{ opacity: 0, x: 14 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.45 + i * 0.14 }}
                    className="flex items-center justify-between rounded-lg bg-ember on-ember px-3.5 py-2 text-[12px] font-medium"
                  >
                    {b}
                    <MousePointerClick className="size-3.5 opacity-70" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* lead captured */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.9 }}
          className="mt-3 flex items-center gap-3 rounded-2xl border border-moss/40 bg-moss/15 px-5 py-3"
        >
          <span className="anim-blip grid size-7 place-items-center rounded-full bg-moss text-[#0b1f18]">
            <Check className="size-4" strokeWidth={3} />
          </span>
          <p className="text-sm text-bone">
            Lead captured — <span className="font-semibold">@notionwithneha</span>
          </p>
          <span className="ml-auto font-mono text-[11px] text-bone-dim">→ leads.csv</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* rail with mono step labels */
function StoryRail({ p }: { p: MotionValue<number> }) {
  const width = useTransform(p, [0, 1], ["2%", "100%"]);
  const steps = ["comment lands", "keyword matched", "DM delivered"];
  const [active, setActive] = useState(0);
  useEffect(() => {
    const unsub = p.on("change", (v) => {
      setActive(v < 0.33 ? 0 : v < 0.64 ? 1 : 2);
    });
    return () => unsub();
  }, [p]);

  return (
    <div className="relative pb-10 pt-8">
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full"
          style={{
            width,
            background: "linear-gradient(90deg, #7366ec, #a99dff 55%, #f2c48d)",
          }}
        />
      </div>
      <div className="mt-3 flex justify-between">
        {steps.map((s, i) => (
          <span
            key={s}
            className={`font-mono text-[10px] tracking-[0.18em] uppercase transition-colors duration-500 ${
              active === i ? "text-ember-hot" : "text-bone-dim/50"
            }`}
          >
            0{i + 1} · {s}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   THE PARALLAX CORRIDOR — you stop scrolling pages and start falling
   through one. Five artifacts of the machine float past at different
   depths; the far ones drift, blur and dim, the near ones rush you.
   This is the room people get lost in. */

interface CorridorPiece {
  id: string;
  /** horizontal resting spot, vw-ish fraction of container width */
  x: string;
  /** speed factor — 0.2 far … 1.4 near */
  depth: number;
  /** scroll window where this piece passes: [enter, exit] in progress */
  win: [number, number];
  blur: number;
  render: React.ReactNode;
}

export function ParallaxCorridor() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end end"],
  });
  const p = useSpring(scrollYProgress, { stiffness: 70, damping: 22, mass: 0.7 });

  /* the falling cursor motif — depth-driven */
  const cursorY = useTransform(p, [0, 1], [0, -60]);
  const cursorOp = useTransform(p, [0.1, 0.3, 0.85, 1], [0.9, 0.35, 0.35, 0.9]);

  const pieces: CorridorPiece[] = [
    {
      id: "reply",
      x: "8%",
      depth: 0.35,
      win: [0.05, 0.55],
      blur: 1.6,
      render: (
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 backdrop-blur-md">
          <p className="font-mono text-[9px] tracking-[0.24em] text-bone-dim uppercase">public reply</p>
          <p className="mt-1 text-[14px] text-bone">Just sent it 📬 check your DMs!</p>
        </div>
      ),
    },
    {
      id: "keyword",
      x: "62%",
      depth: 0.6,
      win: [0.14, 0.62],
      blur: 1.1,
      render: (
        <div className="rounded-2xl border border-ember/40 bg-ember/10 px-5 py-3 backdrop-blur-md">
          <p className="font-mono text-[9px] tracking-[0.24em] text-ember-hot uppercase">trigger</p>
          <p className="mt-1 font-mono text-[15px] font-bold text-bone">“notion” locked</p>
        </div>
      ),
    },
    {
      id: "timer",
      x: "24%",
      depth: 0.8,
      win: [0.24, 0.72],
      blur: 0.5,
      render: (
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 backdrop-blur-md">
          <p className="font-mono text-[9px] tracking-[0.24em] text-bone-dim uppercase">human jitter</p>
          <p className="mt-1 font-mono text-[15px] font-bold text-honey">00:38 · holding</p>
        </div>
      ),
    },
    {
      id: "dmcard",
      x: "52%",
      depth: 1.15,
      win: [0.34, 0.84],
      blur: 0,
      render: (
        <div className="w-64 rounded-3xl border border-white/12 bg-night-2/95 p-4 shadow-[0_30px_80px_-20px_rgba(4,3,9,0.9)] backdrop-blur-md">
          <div className="mb-2.5 grid h-16 place-items-center rounded-xl border border-white/10"
            style={{ background: "linear-gradient(120deg,#1d1936,#2c2550)" }}>
            <span className="font-mono text-[9px] tracking-[0.25em] text-bone-dim uppercase">template pack</span>
          </div>
          <p className="text-[13.5px] font-semibold text-bone">The Creator OS — free pack</p>
          {["Download free pack", "See all templates"].map((b, i) => (
            <div
              key={b}
              className="mt-2 flex items-center justify-between rounded-lg bg-ember on-ember px-3 py-2 text-[12px] font-medium"
              style={{ opacity: 1 - i * 0.12 }}
            >
              {b}
              <MousePointerClick className="size-3.5 opacity-70" />
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "lead",
      x: "70%",
      depth: 1.4,
      win: [0.46, 0.95],
      blur: 0,
      render: (
        <div className="flex items-center gap-3 rounded-2xl border border-moss/40 bg-moss/12 px-5 py-3 backdrop-blur-md">
          <span className="anim-blip grid size-7 place-items-center rounded-full bg-moss text-[#0b1f18]">
            <Check className="size-4" strokeWidth={3} />
          </span>
          <div>
            <p className="font-mono text-[9px] tracking-[0.24em] text-bone-dim uppercase">lead captured</p>
            <p className="text-[13.5px] font-semibold text-bone">@notionwithneha → leads.csv</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section ref={wrapRef} aria-label="Inside the loop" className="relative h-[280vh] bg-night grain">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* the tunnel lights */}
        <ShaderCanvas kind="iris" opacity={0.55} />
        <Starfield density={80} opacity={0.7} />
        <DustMotes density={26} tone="bone" opacity={0.55} />
        {/* depth rails — coordinates of the shaft you're falling through */}
        <div aria-hidden className="absolute inset-y-0 left-[7%] w-px bg-gradient-to-b from-transparent via-white/12 to-transparent" />
        <div aria-hidden className="absolute inset-y-0 right-[7%] w-px bg-gradient-to-b from-transparent via-white/12 to-transparent" />

        {/* the heading rides its own depth */}
        <CorridorHeading p={p} />

        {pieces.map((piece) => (
          <CorridorPieceView key={piece.id} p={p} piece={piece} />
        ))}

        {/* falling cursor motif */}
        <motion.div
          aria-hidden
          className="absolute bottom-[12%] left-1/2 -ml-3 text-moss"
          style={{ opacity: cursorOp, y: cursorY }}
        >
          <MousePointer2 className="size-6" />
        </motion.div>
      </div>
    </section>
  );
}

function CorridorHeading({ p }: { p: MotionValue<number> }) {
  const opacity = useTransform(p, [0.02, 0.14, 0.8, 0.95], [0, 1, 1, 0]);
  const scale = useTransform(p, [0.02, 0.2], [0.9, 1]);
  const y = useTransform(p, [0, 1], [40, -40]);
  return (
    <motion.div style={{ opacity, scale, y }} className="pointer-events-none relative z-[3] text-center">
      <p className="font-mono text-[10px] tracking-[0.4em] text-ember-hot uppercase">you are inside now</p>
      <h2 className="font-display mt-4 text-4xl font-extrabold tracking-tight text-bone sm:text-6xl">
        Fall into the <span className="serif-accent text-spectral">loop.</span>
      </h2>
      <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-bone-dim">
        Every piece of the machine drifts past you at its own depth. Nothing
        here is a screenshot — it&apos;s the room itself.
      </p>
    </motion.div>
  );
}

function CorridorPieceView({ p, piece }: { p: MotionValue<number>; piece: CorridorPiece }) {
  const [enter, exit] = piece.win;
  /* pieces rise from below at their own speed, hold, and leave above */
  const y = useTransform(
    p,
    [enter - 0.06, (enter + exit) / 2, exit + 0.08],
    ["58vh", `${(piece.depth - 1) * -6}vh`, "-64vh"],
    { clamp: false }
  );
  const opacity = useTransform(
    p,
    [enter - 0.02, enter + 0.05, exit - 0.05, exit + 0.02],
    [0, 1, 1, 0]
  );
  const scale = useTransform(p, [enter - 0.06, enter + 0.1, exit - 0.05, exit + 0.08], [0.8, 1, 1, 0.86]);
  const xDrift = useTransform(p, [enter, exit], ["0vw", `${piece.depth > 1 ? -3 : 2}vw`]);

  return (
    <motion.div
      aria-hidden
      className="absolute z-[2]"
      style={{
        y,
        opacity,
        scale,
        x: xDrift,
        left: piece.x,
        filter: piece.blur ? `blur(${piece.blur}px)` : undefined,
      }}
    >
      {piece.render}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   BENTO FEATURES — six cozy cards with living interiors
   ═══════════════════════════════════════════════════════════════════════ */

export function BentoFeatures() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="mx-auto max-w-2xl text-center">
        <Eyebrow className="justify-center">Built like a vault, feels like a toy</Eyebrow>
        <h2 className="font-display mt-4 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          Everything a selling account needs.{" "}
          <span className="serif-accent text-spectral">Nothing it doesn&apos;t.</span>
        </h2>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* human timing — dial */}
        <Reveal delay={0}>
          <SpotlightCard className="h-full rounded-3xl border border-line bg-card shadow-[var(--shadow-soft)] transition-transform duration-300 ">
            <div className="p-6"><DialCard /></div>
          </SpotlightCard>
        </Reveal>

        {/* spintax */}
        <Reveal delay={0.06}>
          <SpotlightCard className="h-full rounded-3xl border border-line bg-card shadow-[var(--shadow-soft)] transition-transform duration-300 ">
            <div className="p-6"><SpintaxCard /></div>
          </SpotlightCard>
        </Reveal>

        {/* DM card */}
        <Reveal delay={0.12}>
          <SpotlightCard className="h-full rounded-3xl border border-line bg-card shadow-[var(--shadow-soft)] transition-transform duration-300 ">
            <div className="p-6"><MiniDmCard /></div>
          </SpotlightCard>
        </Reveal>

        {/* follow gate */}
        <Reveal delay={0.06}>
          <SpotlightCard className="h-full rounded-3xl border border-line bg-card shadow-[var(--shadow-soft)] transition-transform duration-300 ">
            <div className="p-6"><GateCard /></div>
          </SpotlightCard>
        </Reveal>

        {/* human takeover */}
        <Reveal delay={0.12}>
          <SpotlightCard className="h-full rounded-3xl border border-line bg-card shadow-[var(--shadow-soft)] transition-transform duration-300 ">
            <div className="p-6"><TakeoverCard /></div>
          </SpotlightCard>
        </Reveal>

        {/* csv */}
        <Reveal delay={0.18}>
          <SpotlightCard className="h-full rounded-3xl border border-line bg-card shadow-[var(--shadow-soft)] transition-transform duration-300 ">
            <div className="p-6"><CsvCard /></div>
          </SpotlightCard>
        </Reveal>
      </div>
    </section>
  );
}

function CardHead({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Timer;
  title: string;
  desc: string;
}) {
  return (
    <div className="relative">
      <div
        className="grid size-10 place-items-center rounded-xl bg-ember-wash text-ember-hot"
        style={{ boxShadow: "0 0 18px -4px rgba(139,128,249,0.4)" }}
      >
        <Icon className="size-5" />
      </div>
      <h3 className="font-display mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-3">{desc}</p>
    </div>
  );
}

function DialCard() {
  return (
    <>
      <CardHead
        icon={Timer}
        title="Human-timing engine"
        desc="Webhooks ack'd in 15ms — then a deliberate 30–90s pause so every reply feels like you, awake."
      />
      <div className="relative mt-5 flex h-16 items-center">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <motion.span
            key={i}
            className="mx-1 rounded-full bg-ember/80"
            animate={{ height: [10, 38, 10] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
            style={{ width: 5, boxShadow: "0 0 12px rgba(139,128,249,0.5)" }}
          />
        ))}
        <span className="ml-auto font-mono text-[11px] text-ink-4">avg 38s</span>
      </div>
    </>
  );
}

function SpintaxCard() {
  const lines = ["Just sent it 📬", "On its way 💬", "Fired over ✨", "Check DMs 🚀"];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % lines.length), 1500);
    return () => clearInterval(t);
  }, []);
  return (
    <>
      <CardHead
        icon={MessageSquareDashed}
        title="Spintax replies"
        desc="3–8 rotating variations per reel. No repeated copy, no bot pattern for anyone to flag."
      />
      <div className="mt-5 space-y-2">
        {lines.map((l, idx) => (
          <div
            key={l}
            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-[13px] transition-all duration-500 ${
              idx === i
                ? "border-ember/40 bg-ember-wash text-ink"
                : "border-line bg-night-2/60 text-ink-4"
            }`}
          >
            <span className={`size-1.5 rounded-full ${idx === i ? "bg-ember" : "bg-ink-4/40"}`} />
            {l}
          </div>
        ))}
      </div>
    </>
  );
}

function MiniDmCard() {
  return (
    <>
      <CardHead
        icon={Zap}
        title="3-button DM cards"
        desc="Generic-template cards with up to three buttons — download, shop, talk. Every click tracked."
      />
      <div className="mt-5 rounded-2xl border border-line bg-night-2/60 p-3.5">
        <div
          className="mb-2.5 grid h-14 place-items-center rounded-lg border border-white/8"
          style={{ background: "linear-gradient(120deg,#1d1936,#2c2550)" }}
        >
          <span className="font-mono text-[9px] tracking-[0.25em] text-ink-3 uppercase">your art</span>
        </div>
        <p className="text-[13px] font-semibold">Creator OS — free pack</p>
        {["Download free pack", "See all templates"].map((b) => (
          <div key={b} className="mt-2 rounded-lg bg-ember px-3 py-2 text-center text-[12px] font-medium text-[#12101f]">
            {b}
          </div>
        ))}
      </div>
    </>
  );
}

function GateCard() {
  return (
    <>
      <CardHead
        icon={UserCheck}
        title="Follow-gate"
        desc="Reward followers, convert strangers. The DM only unlocks after they hit follow — your call."
      />
      <div className="mt-5 flex items-center justify-between rounded-2xl border border-line bg-night-2/60 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-full bg-moss/15 text-moss">
            <UserCheck className="size-4" />
          </span>
          <p className="text-[13px] font-medium">Must follow to receive</p>
        </div>
        <span className="flex h-6 w-11 items-center rounded-full bg-moss px-0.5">
          <motion.span
            className="size-5 rounded-full bg-white shadow"
            animate={{ x: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 22, repeat: Infinity, repeatDelay: 2.4, repeatType: "reverse" }}
          />
        </span>
      </div>
    </>
  );
}

function TakeoverCard() {
  return (
    <>
      <CardHead
        icon={Hand}
        title="Human takeover"
        desc="Reply yourself and RELO instantly pauses that thread for 30 minutes. You always get the last word."
      />
      <div className="mt-5 space-y-2">
        <div className="rounded-xl border border-line bg-night-2/60 px-3.5 py-2.5 text-[13px] text-ink-2">
          <span className="font-semibold">@meghnabuilds</span> — “do you ship toblr?”
        </div>
        <div className="anim-blip flex items-center gap-2 rounded-xl bg-honey/15 px-3.5 py-2.5 text-[12px] font-medium text-ink-2">
          <Hand className="size-3.5 text-honey" />
          Automation paused · you replied manually
        </div>
      </div>
    </>
  );
}

function CsvCard() {
  const rows = [
    ["@meghnabuilds", "follower", "✓ clicked"],
    ["@rohitcodes", "new", "—"],
    ["@priya.designs", "follower", "✓ clicked"],
  ];
  return (
    <>
      <CardHead
        icon={FileSpreadsheet}
        title="Leads, owned by you"
        desc="Every commenter becomes a searchable lead. One click exports the whole book to CSV."
      />
      <div className="mt-5 overflow-hidden rounded-2xl border border-line">
        <div className="flex items-center justify-between bg-ink px-3.5 py-2 font-mono text-[10px] tracking-widest text-night uppercase">
          leads.csv
          <Inbox className="size-3.5" />
        </div>
        {rows.map(([u, f, c], idx) => (
          <motion.div
            key={u}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.15 }}
            className="flex items-center justify-between border-t border-line bg-night-2/60 px-3.5 py-2.5 text-[12px]"
          >
            <span className="font-medium">{u}</span>
            <span className="text-ink-4">{f}</span>
            <span className={c.includes("✓") ? "text-moss" : "text-ink-4"}>{c}</span>
          </motion.div>
        ))}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   NUMBERS BAND — deep-void count-ups under a lunar strip
   ═══════════════════════════════════════════════════════════════════════ */

export function NumbersBand() {
  /* honest numbers — what the engine does by construction, not marketing */
  const stats = [
    { v: 90, suffix: "s", label: "max human-jitter delay", decimals: 0 },
    { v: 24, suffix: "h", label: "DM window tracked", decimals: 0 },
    { v: 3, suffix: "", label: "buttons per DM card", decimals: 0 },
    { v: 100, suffix: "%", label: "of your leads exportable", decimals: 0 },
  ];
  return (
    <section className="relative grain bg-night py-16 text-bone sm:py-20">
      <AsciiStrip tone="dark" />
      <p className="mt-10 text-center font-mono text-[9.5px] uppercase tracking-[0.3em] text-bone-dim/70">
        the engine, in numbers · how it is built, not what we promise
      </p>
      <div className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-y-10 px-5 sm:px-8 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} className="text-center">
            <p className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              <span className={i % 2 ? "text-spectral" : "text-spectral--mint"}>
                <CountUp to={s.v} suffix={s.suffix} decimals={s.decimals} />
              </span>
            </p>
            <p className="mt-2 font-mono text-[10px] tracking-[0.2em] text-bone-dim uppercase">{s.label}</p>
          </Reveal>
        ))}
      </div>
      <div className="mx-auto mt-12 max-w-6xl px-5 sm:px-8">
        <AsciiStrip tone="dark" />
      </div>
    </section>
  );
}
