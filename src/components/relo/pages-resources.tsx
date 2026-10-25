"use client";

import React, { useEffect } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, FileText, Lock, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button, Container, Logo } from "./chrome";
import { LiquidBackdrop } from "./ambient";
import { Reveal } from "./motion";

interface BasePageProps {
  navigate: (to: string) => void;
}

function ResourceHeader({ title, navigate }: { title: string; navigate: (to: string) => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-canvas/80 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo onClick={() => navigate("/")} />
          <span className="caption hidden sm:block border-l border-line pl-3 text-ink-3">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-ink transition-colors mr-2"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back home</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="obsidian h-9 px-4 rounded-xl text-[12.5px] font-bold shadow-md transition-transform hover:-translate-y-0.5 inline-flex items-center gap-1.5"
          >
            <span>Get started</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </Container>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   1. BLOG PAGE (The RELO Creator Blog)
   ═══════════════════════════════════════════════════════════════════════════ */

export function BlogPage({ navigate }: BasePageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const ARTICLES = [
    {
      title: "How to Turn 10,000 Reel Views into ₹50,000 in Digital Sales",
      category: "Monetization Playbook",
      readTime: "6 min read",
      date: "Oct 2026",
      snippet: "Why telling people to 'check link in bio' kills 85% of your sales conversions, and how instant automated DMs recover that lost intent immediately.",
    },
    {
      title: "Understanding Meta's 2026 Algorithm: Why Fast DM Replies Boost Reel Reach",
      category: "Algorithm Insights",
      readTime: "8 min read",
      date: "Oct 2026",
      snippet: "Instagram's recommendation engine now monitors conversation velocity. Learn how replying to comments within 90 seconds triggers broader Explore distribution.",
    },
    {
      title: "The Death of the 'Contact Tax': Why ManyChat's Pricing Model is Broken",
      category: "Industry Analysis",
      readTime: "5 min read",
      date: "Sep 2026",
      snippet: "How SaaS companies secretly tax your growth by treating Instagram followers like expensive email database records, and why flat-rate pricing wins.",
    },
    {
      title: "Anti-Spam Playbook: How to Safely Send 5,000+ Automated DMs Without Restrictions",
      category: "Security & Deliverability",
      readTime: "7 min read",
      date: "Sep 2026",
      snippet: "The exact randomized delay formulas (30-90s jitter), reply variations, and 24-hour window guidelines to keep your account 100% compliant.",
    },
  ];

  return (
    <div className="relative min-h-screen text-ink bg-canvas">
      <LiquidBackdrop variant="hero" grid />
      <ResourceHeader title="The Creator Blog" navigate={navigate} />

      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        <Container className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-signal/25 bg-signal-wash px-3.5 py-1 text-[12px] font-bold text-signal">
            <BookOpen className="size-3.5" />
            <span>Actionable Creator Playbooks</span>
          </div>

          <h1 className="mt-5 text-4xl sm:text-6xl font-black tracking-tight text-ink">
            The RELO Creator Blog
          </h1>

          <p className="mt-4 text-base sm:text-lg text-ink-2 max-w-xl mx-auto">
            Deep dives, data studies, and proven blueprints to grow your audience and scale your Instagram revenue.
          </p>

          <div className="mt-14 space-y-6 text-left">
            {ARTICLES.map((art) => (
              <div
                key={art.title}
                className="rounded-3xl border border-line bg-surface p-7 shadow-sm transition-all hover:border-signal/50 hover:shadow-lg cursor-pointer"
                onClick={() => navigate("/login")}
              >
                <div className="flex items-center justify-between text-[11.5px] font-bold uppercase tracking-wider text-signal font-mono">
                  <span>{art.category}</span>
                  <span className="text-ink-3">{art.readTime} · {art.date}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-ink mt-2 hover:text-signal transition-colors">
                  {art.title}
                </h3>
                <p className="text-[13.5px] text-ink-2 mt-2 leading-relaxed">
                  {art.snippet}
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-signal">
                  <span>Read full breakdown</span>
                  <ArrowRight className="size-3.5" />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. DOCUMENTATION & GUIDES
   ═══════════════════════════════════════════════════════════════════════════ */

export function DocsPage({ navigate }: BasePageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const GUIDES = [
    {
      title: "Quickstart: Connect Your Instagram in 60 Seconds",
      desc: "Step-by-step walkthrough to link your Instagram Creator or Business account via official Meta OAuth.",
    },
    {
      title: "Setting Up Your First Keyword Trigger",
      desc: "How to select a Reel, add trigger keywords, and configure dynamic public comments + private DM cards.",
    },
    {
      title: "Flow Canvas: Multi-Condition Decision Trees",
      desc: "Build visual logic trees that route users based on keyword matches, follower status, and prior purchases.",
    },
    {
      title: "Setting Up Your Link-in-Bio Storefront",
      desc: "Customize your mobile bio link, connect Razorpay/Stripe, and start selling digital products with 0% fee.",
    },
    {
      title: "24-Hour Broadcast Window Rules",
      desc: "Learn how Meta's 24-hour messaging window operates and how to legally broadcast to warm prospects.",
    },
    {
      title: "Exporting CSV Leads to CRM & Email Tools",
      desc: "Download clean CSV spreadsheets containing user handles, comment times, and conversation history.",
    },
  ];

  return (
    <div className="relative min-h-screen text-ink bg-canvas">
      <LiquidBackdrop variant="hero" grid />
      <ResourceHeader title="Documentation" navigate={navigate} />

      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        <Container className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-signal/25 bg-signal-wash px-3.5 py-1 text-[12px] font-bold text-signal">
            <FileText className="size-3.5" />
            <span>Developer & Creator Docs</span>
          </div>

          <h1 className="mt-5 text-4xl sm:text-6xl font-black tracking-tight text-ink">
            RELO Knowledge Base & Guides
          </h1>

          <p className="mt-4 text-base sm:text-lg text-ink-2 max-w-xl mx-auto">
            Everything you need to master Instagram DM automation and build robust revenue pipelines.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {GUIDES.map((guide, i) => (
              <div
                key={guide.title}
                className="rounded-2xl border border-line bg-surface p-6 shadow-sm hover:border-signal/50 transition-all cursor-pointer"
                onClick={() => navigate("/login")}
              >
                <span className="grid size-7 place-items-center rounded-lg bg-signal/15 text-signal font-bold text-xs">
                  0{i + 1}
                </span>
                <h3 className="mt-3 font-bold text-ink text-base">{guide.title}</h3>
                <p className="mt-2 text-[13px] text-ink-2 leading-relaxed">{guide.desc}</p>
                <div className="mt-3 text-[12px] font-bold text-signal inline-flex items-center gap-1">
                  <span>View Guide</span>
                  <ArrowRight className="size-3" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 rounded-2xl border border-line bg-surface p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <p className="font-bold text-ink text-sm">Need personalized onboarding assistance?</p>
              <p className="text-[12px] text-ink-3">Our team can set up your first 3 automation flows for you.</p>
            </div>
            <a
              href="mailto:support@thepilab.in?subject=RELO Onboarding Help"
              className="obsidian h-10 px-5 text-[13px] font-bold rounded-xl inline-flex items-center gap-1.5 shrink-0"
            >
              <span>Contact Support</span>
              <ArrowRight className="size-3.5" />
            </a>
          </div>
        </Container>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. OFFICIAL META API STATUS & SECURITY
   ═══════════════════════════════════════════════════════════════════════════ */

export function SecurityPage({ navigate }: BasePageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="relative min-h-screen text-ink bg-canvas">
      <LiquidBackdrop variant="hero" grid />
      <ResourceHeader title="Meta API & Security" navigate={navigate} />

      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        <Container className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-ok/30 bg-ok-wash px-3.5 py-1 text-[12px] font-bold text-ok">
            <ShieldCheck className="size-3.5" />
            <span>Official Meta Tech Provider Status</span>
          </div>

          <h1 className="mt-5 text-4xl sm:text-6xl font-black tracking-tight text-ink">
            Engineered for 100% Account Safety
          </h1>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-ink-2 max-w-2xl mx-auto">
            RELO operates strictly within Meta&apos;s published Graph API v21 specifications. We never use unauthorized scraping, browser extensions, or private endpoints that endanger your account.
          </p>

          {/* Security Guarantees */}
          <div className="mt-14 space-y-4 text-left">
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-signal/15 text-signal">
                  <Lock className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-ink text-base">Never Any Password Sharing</h3>
                  <p className="text-[13px] text-ink-2 mt-0.5">
                    You never enter your Instagram password on RELO. Connection is performed via Meta&apos;s official OAuth dialog where you review and grant specific permissions.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-signal/15 text-signal">
                  <Zap className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-ink text-base">Proprietary Anti-Spam Human Jitter</h3>
                  <p className="text-[13px] text-ink-2 mt-0.5">
                    Automations don&apos;t blast out in bursts. Every reply incorporates randomized 30-90s human pacing, and if you open Instagram to chat manually, that conversation pauses for 30 minutes.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-signal/15 text-signal">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-ink text-base">0% Data Broker Selling</h3>
                  <p className="text-[13px] text-ink-2 mt-0.5">
                    Your commenters and customer leads belong exclusively to you. We do not aggregate, sell, or rent user contact records to third-party ad networks or data brokers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="obsidian h-12 px-7 text-[15px] font-bold rounded-xl shadow-xl transition-transform hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              <span>Connect Securely with Meta</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </Container>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. PRODUCT DEEP-DIVE PAGES
   ═══════════════════════════════════════════════════════════════════════════ */

interface ProductDetailProps {
  feature: string;
  navigate: (to: string) => void;
}

const PRODUCT_FEATURES: Record<string, { title: string; desc: string; bullets: string[] }> = {
  "dm-automation": {
    title: "Instagram DM Automation",
    desc: "Instantly turn Reel comments, carousel replies, and story mentions into automated high-converting DMs.",
    bullets: [
      "Per-Reel keyword triggers (up to 12 keywords per Reel)",
      "Dynamic public reply variation so no two commenters get identical replies",
      "Native Instagram 3-button cards with tracked short links",
      "Human-paced anti-spam sending delay (30–90s jitter)",
    ],
  },
  "flow-canvas": {
    title: "Flow Canvas Blueprints",
    desc: "A fluid, visual drag-and-drop workflow builder designed for multi-step customer journeys.",
    bullets: [
      "Visual nodes for triggers, conditions, delays, and actions",
      "Follower qualification branches (different DM if they don't follow you yet)",
      "Pre-built conversion templates for fitness, coaches, e-commerce, and real estate",
      "Real-time node dropoff telemetry to identify conversion bottlenecks",
    ],
  },
  "link-in-bio": {
    title: "Link in Bio Builder",
    desc: "The only link-in-bio page built directly into your Instagram DM automation engine.",
    bullets: [
      "Mobile-optimized micro-storefront that loads in under 200ms",
      "Embed digital downloads, courses, and consult bookings",
      "Native UPI & Razorpay checkout integration with 0% platform transaction fee",
      "Syncs directly with your Reel keyword triggers",
    ],
  },
  "ai-faq": {
    title: "24/7 AI FAQ Assistant",
    desc: "Never miss a customer question again. AI automatically answers product questions from your offer catalog.",
    bullets: [
      "Trained on your pricing, refund terms, and product FAQs",
      "Strict anti-hallucination guardrails — hands off uncertain questions to you",
      "Tone customization (friendly, professional, energetic, emoji-rich)",
      "Seamless human takeover in the Instagram inbox",
    ],
  },
  "short-links": {
    title: "Tracked Short Links",
    desc: "Every button and link in your DMs is tracked with real edge analytics.",
    bullets: [
      "Unique click tracking per commenter and Reel",
      "Custom branded domains (links.yourbrand.com)",
      "Retargeting pixel support",
      "Accurate attribution from comment to final payment",
    ],
  },
  "broadcasts": {
    title: "Broadcasts (24h Window)",
    desc: "Re-engage warm prospects who interacted with your content inside Meta's 24-hour official window.",
    bullets: [
      "100% compliant with Meta Platform Terms",
      "Segment by Reel, keyword, or past purchase status",
      "Announce limited-time discounts or upcoming live masterclasses",
      "High open rates (80%+ compared to 20% in email)",
    ],
  },
  "audience-export": {
    title: "CSV Audience Export",
    desc: "Own your audience. Export every commenter and DM interaction with 1 click.",
    bullets: [
      "Export user handles, comment timestamps, and interaction counts",
      "Import directly into Klaviyo, Mailchimp, or Meta Custom Audiences",
      "No gated export limits or subscriber fees",
      "GDPR and DPDP compliant lead structure",
    ],
  },
};

export function ProductDetailPage({ feature, navigate }: ProductDetailProps) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [feature]);

  const slug = feature.toLowerCase().trim();
  const data = PRODUCT_FEATURES[slug] ?? PRODUCT_FEATURES["dm-automation"];

  return (
    <div className="relative min-h-screen text-ink bg-canvas">
      <LiquidBackdrop variant="hero" grid />
      <ResourceHeader title="Product" navigate={navigate} />

      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        <Container className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-signal/25 bg-signal-wash px-3.5 py-1 text-[12px] font-bold text-signal">
            <Sparkles className="size-3.5" />
            <span>RELO Core Feature</span>
          </div>

          <h1 className="mt-5 text-4xl sm:text-6xl font-black tracking-tight text-ink">
            {data.title}
          </h1>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-ink-2 max-w-2xl mx-auto">
            {data.desc}
          </p>

          <div className="mt-12 rounded-3xl border border-line bg-surface p-8 sm:p-10 text-left shadow-xl">
            <h3 className="text-xl font-bold text-ink mb-6">Capabilities Included with {data.title}:</h3>
            <div className="space-y-4">
              {data.bullets.map((b) => (
                <div key={b} className="flex items-start gap-3">
                  <span className="grid size-6 place-items-center rounded-full bg-ok-wash text-ok mt-0.5 shrink-0">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  <p className="text-[14px] text-ink font-medium leading-relaxed">{b}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-line flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-ink">Included in Creator Pro (₹199/mo)</p>
                <p className="text-[12px] text-ink-3">Also available in Free Starter with basic limits.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="obsidian h-11 px-6 text-[14px] font-bold rounded-xl inline-flex items-center gap-2"
              >
                <span>Try {data.title} Free</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
