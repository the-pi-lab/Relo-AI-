import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Briefcase,
  Check,
  ChevronDown,
  Layers,
  LayoutDashboard,
  MousePointerClick,
  Send,
  ShieldCheck,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { api, ApiError } from "@/lib/api";
import { useSeo } from "@/lib/seo";
import { useTilt } from "@/lib/useTilt";
import { useSpotlight, useCountUp } from "@/lib/motion";
import "./landing.css";

/* ── pricing data (from plan.md §3) ────────────────────────── */

type Currency = "INR" | "USD";

const PRICING: {
  name: string;
  tagline: string;
  monthly: { INR: number; USD: number };
  annual: { INR: number; USD: number };
  cta: string;
  highlight?: boolean;
  features: string[];
  missing?: string[];
}[] = [
  {
    name: "Free",
    tagline: "Taste the autopilot",
    monthly: { INR: 0, USD: 0 },
    annual: { INR: 0, USD: 0 },
    cta: "Start free",
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
    monthly: { INR: 149, USD: 9.99 },
    annual: { INR: 1499, USD: 99 },
    cta: "Start free, upgrade in-app",
    highlight: true,
    features: [
      "Unlimited automated reels",
      "3–8 spintax reply variations",
      "3 DM buttons, no RELO branding",
      "Follow-up DMs + campaigns",
      "AI product Q&A · 500 credits/mo",
      "Sent → Clicked analytics",
    ],
  },
  {
    name: "Studio",
    tagline: "For builders & agencies",
    monthly: { INR: 399, USD: 24.99 },
    annual: { INR: 3999, USD: 249 },
    cta: "Start free, upgrade in-app",
    features: [
      "Everything in Pro",
      "Canvas node builder (bring your own flows)",
      "3 connected IG accounts",
      "Priority queue · 5,000 AI credits/mo",
    ],
  },
];

const FAQS = [
  {
    q: "Is this allowed by Instagram?",
    a: "Yes — RELO is built entirely on the official Meta Graph API using your own connected account. No scraping, no unofficial tricks, no bots to ban.",
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

/* ── tiny reveal-on-scroll (one-shot, CSS-driven) ───────────── */

function useReveal() {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = root.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);
  return rootRef;
}

/* ── sections ──────────────────────────────────────────────── */

function Nav() {
  const go = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <header className="lm-nav">
      <div className="lm-nav__inner">
        <Link to="/" className="lm-logo" aria-label="RELO home">
          <span className="lm-logo__mark">R.</span>
          <span className="lm-logo__name">RELO</span>
        </Link>
        <nav className="lm-nav__links" aria-label="Primary">
          <button type="button" onClick={() => go("how")}>How it works</button>
          <button type="button" onClick={() => go("features")}>Features</button>
          <button type="button" onClick={() => go("pricing")}>Pricing</button>
          <button type="button" onClick={() => go("faq")}>FAQ</button>
        </nav>
        <div className="lm-nav__right">
          <ThemeToggle compact />
          <Link to="/demo" className="lm-btn lm-btn--ghost lm-btn--sm">View demo</Link>
          <Link to="/login" className="lm-btn lm-btn--ghost lm-btn--sm">Sign in</Link>
          <Link to="/login" className="lm-btn lm-btn--primary lm-btn--sm">Start free</Link>
        </div>
      </div>
    </header>
  );
}

/**
 * Hero product scene — real CSS 3D, not a fake glow.
 *
 * Three cards sit at different depths on a preserve-3d stage and the whole
 * scene tilts toward the cursor (useTilt). Children are positioned by the
 * existing .lm-visual layout; each layer just adds translateZ.
 */
function ProductVisual() {
  const { ref, style, pointer, active } = useTilt({ max: 9, scale: 1.015 });

  return (
    <div className="lm-visual" aria-hidden>
      <div ref={ref} className="lm-visual__stage" style={style}>
        {/* ambient depth plate behind everything */}
        <div className="lm-visual__plate" />

        <div className="lm-visual__comment lm-visual__z1">
          <span className="lm-visual__avatar">j</span>
          <div>
            <span className="lm-visual__user">john.dev</span>
            <p>Send me the guide please 🔥</p>
          </div>
        </div>

        <div className="lm-visual__arrow lm-visual__z2">
          <span className="lm-visual__arrowline" />
          <span className="lm-visual__chip">
            <Zap size={11} strokeWidth={2.6} /> keyword matched
          </span>
        </div>

        <div className="lm-visual__dm lm-visual__z3">
          <div className="lm-visual__dmhead">
            <span className="lm-visual__avatar lm-visual__avatar--brand">R.</span>
            <div>
              <span className="lm-visual__user">your.brand</span>
              <span className="lm-visual__active">Automated reply · 47s</span>
            </div>
          </div>
          <p className="lm-visual__dmtext">Hey john.dev! Your growth blueprint is ready 👇</p>
          <div className="lm-visual__card">
            <div className="lm-visual__cardimg" />
            <strong>Your Growth Blueprint</strong>
            <span>12 proven funnels + templates</span>
            <div className="lm-visual__btns">
              <b>Get it</b>
              <b>Reviews</b>
              <b>Chat</b>
            </div>
          </div>
          <span className="lm-visual__branding">
            <Sparkles size={10} strokeWidth={2.6} /> Automated by RELO AI
          </span>
        </div>

        {/* cursor spotlight — follows the pointer across the stage */}
        <div
          className={`lm-visual__glare${active ? " is-on" : ""}`}
          style={{
            background: `radial-gradient(420px circle at ${(pointer.x * 100).toFixed(1)}% ${(
              pointer.y * 100
            ).toFixed(1)}%, rgba(255,255,255,0.14), transparent 62%)`,
          }}
        />
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="lm-hero lm-hero--dark">
      <div className="lm-container lm-hero__grid">
        <div className="lm-hero__copy">
          <span className="lm-eyebrow" data-reveal>Instagram DM Automation</span>
          <h1 data-reveal>
            Turn Reel comments into <em>customers.</em>
          </h1>
          <p className="lm-hero__sub" data-reveal>
            RELO watches your comments, verifies followers, and delivers your offer as a
            tappable 3-button DM — human-timed, on the official Meta API. One flat
            subscription. No contact tax, ever.
          </p>
          <div className="lm-hero__actions" data-reveal>
            <Link to="/login" className="lm-btn lm-btn--primary lm-btn--lg">
              Start free <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
            <button
              type="button"
              className="lm-btn lm-btn--ghost lm-btn--lg"
              onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
            >
              See pricing
            </button>
            <Link to="/demo" className="lm-btn lm-btn--ghost lm-btn--lg">
              <LayoutDashboard size={16} strokeWidth={2.4} /> View a live demo
            </Link>
          </div>
          <ul className="lm-proof" data-reveal>
            <li><ShieldCheck size={13} /> Official Meta API</li>
            <li><BadgeCheck size={13} /> Follow-gate</li>
            <li><Timer size={13} /> 30–90s human jitter</li>
            <li><Layers size={13} /> Unlimited contacts</li>
          </ul>
        </div>
        <ProductVisual />
      </div>

      <StatBand />
    </section>
  );
}

/**
 * By-the-numbers strip. Every figure is a real product constant, not a
 * marketing invention — the count-up just draws the eye to it.
 */
function StatBand() {
  const stats = [
    { n: 15, suffix: "ms", label: "Webhook acknowledged" },
    { n: 24, suffix: "h", label: "Meta messaging window tracked" },
    { n: 3, suffix: "", label: "Buttons per DM card" },
    { n: 8, suffix: "", label: "Reply variations on Pro" },
  ];
  return (
    <div className="lm-stats" data-reveal>
      {stats.map((s) => (
        <StatCell key={s.label} {...s} />
      ))}
    </div>
  );
}

function StatCell({ n, suffix, label }: { n: number; suffix: string; label: string }) {
  const { ref, display } = useCountUp(n);
  return (
    <div className="lm-stat" ref={ref as React.RefObject<HTMLDivElement>}>
      <b>
        {display}
        <span>{suffix}</span>
      </b>
      <p>{label}</p>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: BadgeCheck,
      title: "Connect",
      body: "Sign in with an email code and link your Instagram Professional account through Meta. Tokens are encrypted, revocable, and yours.",
    },
    {
      icon: MousePointerClick,
      title: "Configure",
      body: "Pick a Reel, set trigger keywords (or catch-all), and design your 3-button card. Follow-gate decides who gets the goods.",
    },
    {
      icon: Send,
      title: "Autopilot",
      body: "Every matching comment gets a human-timed public reply and a DM with your offer. Leads are captured, filterable, and CSV-exportable.",
    },
  ];
  return (
    <section className="lm-section" id="how">
      <div className="lm-container">
        <span className="lm-eyebrow" data-reveal>How it works</span>
        <h2 className="lm-h2" data-reveal>Three steps. <em>Then silence.</em></h2>
        <div className="lm-steps">
          {steps.map((s, i) => (
            <article className="lm-step" key={s.title} data-reveal>
              <div className="lm-step__icon">
                <s.icon size={18} strokeWidth={2.2} />
              </div>
              <span className="lm-step__num">0{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const spotRef = useSpotlight<HTMLDivElement>();
  const features = [
    { icon: Zap, title: "Keyword triggers", body: "Unicode-aware whole-word matching with a catch-all mode — one comment is all it takes." },
    { icon: BadgeCheck, title: "Follow-gate", body: "Only followers receive your offer; everyone else gets a polite nudge to follow first." },
    { icon: Layers, title: "3-button cards", body: "Official Meta Generic Templates — image, title, and tappable buttons that feel native." },
    { icon: Timer, title: "Human-timed delivery", body: "Randomised 30–90s jitter makes every reply read like you, not a script." },
    { icon: BarChart3, title: "Sent → Clicked", body: "Track every DM from delivery to button tap. Clicks measured, not guessed." },
    { icon: Send, title: "Campaigns", body: "Re-engage everyone who commented on a Reel — inside Meta's messaging window, with a clear reachable count." },
  ];
  return (
    <section className="lm-section lm-section--tinted" id="features">
      <div className="lm-container">
        <span className="lm-eyebrow" data-reveal>Features</span>
        <h2 className="lm-h2" data-reveal>Everything a funnel needs. <em>Nothing it doesn't.</em></h2>
        <div className="lm-grid" ref={spotRef}>
          {features.map((f) => (
            <article className="lm-card" key={f.title} data-reveal data-spot>
              <div className="lm-card__icon"><f.icon size={17} strokeWidth={2.2} /></div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const [currency, setCurrency] = useState<Currency>("INR");
  const symbol = currency === "INR" ? "₹" : "$";

  const price = (amount: { INR: number; USD: number }) => {
    const v = amount[currency];
    return v === 0 ? "0" : currency === "INR" ? v.toLocaleString("en-IN") : String(v);
  };

  return (
    <section className="lm-section" id="pricing">
      <div className="lm-container">
        <div className="lm-pricing__head" data-reveal>
          <div>
            <span className="lm-eyebrow">Pricing</span>
            <h2 className="lm-h2">One flat fee. <em>Zero contact tax.</em></h2>
          </div>
          <div className="lm-currency" role="radiogroup" aria-label="Currency">
            {(["INR", "USD"] as Currency[]).map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={currency === c}
                className={currency === c ? "is-on" : ""}
                onClick={() => setCurrency(c)}
              >
                {c === "INR" ? "₹ India" : "$ Global"}
              </button>
            ))}
          </div>
        </div>
        <div className="lm-tiers">
          {PRICING.map((tier) => (
            <article className={`lm-tier${tier.highlight ? " lm-tier--hot" : ""}`} key={tier.name} data-reveal>
              {tier.highlight && <span className="lm-tier__flag">Most popular</span>}
              <h3>{tier.name}</h3>
              <p className="lm-tier__tagline">{tier.tagline}</p>
              <div className="lm-tier__price">
                <big>{symbol}{price(tier.monthly)}</big>
                <span>/mo</span>
              </div>
              {tier.monthly[currency] > 0 && (
                <p className="lm-tier__annual">
                  or {symbol}{price(tier.annual)}/yr — 2 months free
                </p>
              )}
              <ul>
                {tier.features.map((f) => (
                  <li key={f}><Check size={14} strokeWidth={2.6} /> {f}</li>
                ))}
                {tier.missing?.map((f) => (
                  <li key={f} className="is-off">✕ {f}</li>
                ))}
              </ul>
              <Link
                to="/login"
                className={`lm-btn ${tier.highlight ? "lm-btn--accent" : "lm-btn--ghost"} lm-btn--block`}
              >
                {tier.cta}
              </Link>
            </article>
          ))}
        </div>
        <p className="lm-pricing__note" data-reveal>
          Running more than 3 creators? Agency plans are built personally — white-label and
          volume pricing are a conversation, not a self-serve toggle.
        </p>
        <AgencyContact />
      </div>
    </section>
  );
}

/**
 * Agency contact flow (plan.md §3). Studio caps self-serve at 3 Instagram
 * accounts; past that the deal is personal, so we collect enough detail to
 * quote properly instead of bouncing them to a mailto.
 */
function AgencyContact() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [accounts, setAccounts] = useState("5");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setMessage(null);
    try {
      const { message: confirmation } = await api.agency.contact({
        email: email || undefined,
        accountCount: Number(accounts) || 5,
        notes: notes || undefined,
        plan: "custom",
      });
      setMessage(confirmation);
      setStatus("sent");
    } catch (err) {
      setMessage(
        err instanceof ApiError ? err.message : "Couldn't send that. Email hello@thepilab.in instead."
      );
      setStatus("error");
    }
  };

  return (
    <div className="lm-agency" data-reveal>
      {!open ? (
        <button type="button" className="lm-agency__cta" onClick={() => setOpen(true)}>
          <Briefcase size={16} aria-hidden />
          <span>
            <b>Running 4+ accounts?</b> Talk to us about agency pricing.
          </span>
          <ArrowRight size={16} aria-hidden />
        </button>
      ) : (
        <form className="lm-agency__form" onSubmit={submit}>
          <h3 className="lm-agency__title">Tell us what you're running</h3>
          <p className="lm-agency__blurb">
            A real person replies — usually within a business day.
          </p>

          <div className="lm-agency__grid">
            <label className="lm-agency__field">
              <span>Work email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.com"
                autoComplete="email"
              />
            </label>
            <label className="lm-agency__field">
              <span>How many accounts?</span>
              <input
                type="number"
                min={4}
                max={500}
                value={accounts}
                onChange={(e) => setAccounts(e.target.value)}
              />
            </label>
          </div>

          <label className="lm-agency__field">
            <span>What do you need? (optional)</span>
            <textarea
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="14 client pages, need white-label + shared reporting."
            />
          </label>

          {message && (
            <p className={`lm-agency__msg is-${status}`} role="status">
              {message}
            </p>
          )}

          <div className="lm-agency__actions">
            <button
              type="button"
              className="lm-btn lm-btn--ghost"
              onClick={() => {
                setOpen(false);
                setStatus("idle");
                setMessage(null);
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="lm-btn lm-btn--accent"
              disabled={status === "sending" || status === "sent"}
            >
              {status === "sending" ? "Sending…" : status === "sent" ? "Sent" : "Send enquiry"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Faq() {
  return (
    <section className="lm-section lm-section--tinted" id="faq">
      <div className="lm-container lm-container--narrow">
        <span className="lm-eyebrow" data-reveal>FAQ</span>
        <h2 className="lm-h2" data-reveal>Asked <em>every time.</em></h2>
        <div className="lm-faq">
          {FAQS.map((item) => (
            <details key={item.q} data-reveal>
              <summary>
                {item.q}
                <ChevronDown size={16} className="lm-faq__chev" aria-hidden />
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="lm-section lm-cta">
      <div className="lm-container lm-container--narrow lm-cta__inner" data-reveal>
        <h2 className="lm-h2">Your next customer <em>already commented.</em></h2>
        <p>Set up your first funnel in under five minutes. Free — no card needed.</p>
        <Link to="/login" className="lm-btn lm-btn--accent lm-btn--lg">
          Start free <ArrowRight size={16} strokeWidth={2.5} />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="lm-footer">
      <div className="lm-container lm-footer__inner">
        <div className="lm-logo lm-logo--sm">
          <span className="lm-logo__mark">R.</span>
          <span className="lm-logo__name">RELO</span>
        </div>
        <span>© 2026 RELO — built by The π Lab</span>
        <nav aria-label="Footer">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <a href="https://www.thepilab.in" target="_blank" rel="noreferrer">thepilab.in</a>
          <a href="https://www.linkedin.com/company/the-%CF%80-lab/" target="_blank" rel="noreferrer">LinkedIn</a>
        </nav>
      </div>
    </footer>
  );
}

/* ── root ──────────────────────────────────────────────────── */

export default function Landing() {
  const rootRef = useReveal();

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "RELO — Instagram Comment to DM Automation";
    return () => {
      document.title = prevTitle;
    };
  }, []);

  useSeo({
    title: "RELO — Instagram Comment to DM Automation | Official Meta Graph API",
    description:
      "RELO turns comments on your Instagram Reels into verified, clickable DMs automatically. Keyword triggers, 3-button cards, follow-gate and Sent-to-Clicked analytics on the official Meta Graph API. Free plan available.",
    path: "/",
  });

  return (
    <div className="lm-page" ref={rootRef}>
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
