"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Heart, MessageCircle, Sparkles, Star, Zap } from "lucide-react";
import { Button, Container, Logo } from "./chrome";
import { LiquidBackdrop } from "./ambient";
import { Reveal } from "./motion";

interface UseCaseProps {
  niche: string;
  navigate: (to: string) => void;
}

interface NicheData {
  title: string;
  badge: string;
  headline: string;
  subheadline: string;
  triggerKeyword: string;
  commentExample: string;
  commentUser: string;
  dmResponse: string;
  dmButtonText: string;
  metricLabel: string;
  metricValue: string;
  caseStudyName: string;
  caseStudyQuote: string;
  strategies: { title: string; desc: string }[];
}

const NICHES: Record<string, NicheData> = {
  fitness: {
    title: "Fitness & Nutrition Coaches",
    badge: "Health & Fitness Playbook",
    headline: "Turn Workout Comments into Paid Clients in Seconds",
    subheadline: "Stop sending PDF diet charts manually at 2 AM. When viewers comment 'WORKOUT' or 'PLAN', deliver your meal guide instantly into their DMs.",
    triggerKeyword: "WORKOUT",
    commentExample: "Bro can you send me the 7-day fat loss diet chart please? 💪",
    commentUser: "rohit_gains",
    dmResponse: "Hey Rohit! 🔥 Here's the 7-Day High Protein Fat Loss Guide you asked for. Download it below & let me know your goal weight!",
    dmButtonText: "Download Fat Loss PDF 📥",
    metricLabel: "Lead-to-Client Rate",
    metricValue: "4.8X",
    caseStudyName: "Coach Ananya (140K Followers)",
    caseStudyQuote: "I used to lose 70% of potential personal training leads because I took 6 hours to reply. With RELO, they get the guide in 45 seconds while their workout motivation is at its peak. My client roster is fully booked for 3 months.",
    strategies: [
      { title: "Free Workout Routine Lead Magnets", desc: "Offer your chest/leg split PDF on Reels with 'Comment WORKOUT to get the free program'." },
      { title: "Nutrition Consultation Bookings", desc: "Automate calendly link delivery when people ask for 1-on-1 coaching rates in story replies." },
      { title: "24-Hour Broadcast Re-engagement", desc: "Follow up with anyone who downloaded your guide within 24 hours to offer a free form-check audit." },
    ],
  },
  astrology: {
    title: "Tarot & Astrology Creators",
    badge: "Spiritual & Tarot Playbook",
    headline: "Automate Kundli & Tarot Bookings from Viral Reels",
    subheadline: "Your predictions go viral every weekend. Automate appointment bookings and personal reading payments without spending hours in manual DM chats.",
    triggerKeyword: "TAROT",
    commentExample: "This resonated so deeply! How can I book a personal reading with you? ✨",
    commentUser: "kavita.mystic",
    dmResponse: "Blessed day Kavita ✨ The universe guided you here. Tap below to pick your slot for an in-depth 2026 Career & Love reading with me.",
    dmButtonText: "Book Reading Slot 🔮",
    metricLabel: "Slot Booking Speed",
    metricValue: "12 Mins",
    caseStudyName: "Astro Meera (85K Followers)",
    caseStudyQuote: "I booked out 60 reading slots in a single afternoon after one Reel hit the explore page. RELO collected the birth details and sent the booking link while I was meditating.",
    strategies: [
      { title: "Personal Reading Slot Distribution", desc: "Comment 'READING' triggers your Calendly/Topmate link with payment confirmation." },
      { title: "Daily Horoscope & Zodiac Guides", desc: "Send weekly astrological transit PDFs to warm followers automatically." },
      { title: "Custom Crystal & Remedy Store", desc: "Direct commenters to recommended birthstones with tracked short links." },
    ],
  },
  courses: {
    title: "Online Course Creators & Educators",
    badge: "EdTech & Info-Product Playbook",
    headline: "Sell Out Webinars & Courses on Autopilot",
    subheadline: "Convert high-intent Reel viewers into registered webinar attendees. Deliver lecture notes, cheat sheets, and early-bird discount codes instantly.",
    triggerKeyword: "CLASS",
    commentExample: "Can you share the Figma UI/UX roadmap mentioned in this reel?",
    commentUser: "sid_designs",
    dmResponse: "Hey Sid! Here is the complete 2026 UI/UX Roadmap & Resource Sheet. We also have a live masterclass this Saturday!",
    dmButtonText: "Join Free UI Masterclass 🚀",
    metricLabel: "Webinar Attendance",
    metricValue: "68% Open Rate",
    caseStudyName: "Kunal Verma (Dev Educator, 220K Followers)",
    caseStudyQuote: "Our webinar registrations tripled within 48 hours of switching to RELO. Instead of telling people to 'link in bio', we just ask them to comment 'CODE'. Zero friction, massive conversions.",
    strategies: [
      { title: "Cheat Sheet & Resource Delivery", desc: "Deliver cheat sheets and code snippets via DM within 30-90 seconds." },
      { title: "Flash Discount Codes", desc: "Offer 2-hour limited promo codes to commenters on launch day Reels." },
      { title: "Automated Student FAQ", desc: "Use the AI FAQ Assistant to answer syllabus and pricing queries automatically." },
    ],
  },
  d2c: {
    title: "E-Commerce & D2C Brands",
    badge: "Commerce & Brand Playbook",
    headline: "Turn Instagram Comments into Add-to-Carts",
    subheadline: "Shoppers comment 'PRICE' or 'LINK' on product showcases. Send them direct product links with pre-applied discount codes into their DMs.",
    triggerKeyword: "BUY",
    commentExample: "Is this oversized hoodie still in stock in size L? Where to buy?",
    commentUser: "arjun_style",
    dmResponse: "Hey Arjun! Yes, the Noir Heavyweight Hoodie is in stock in Size L. Here's a 15% VIP discount code for you: 'RELO15'.",
    dmButtonText: "Shop with 15% OFF 🛍️",
    metricLabel: "Cart Abandonment Drop",
    metricValue: "-42%",
    caseStudyName: "Verve Streetwear (D2C Brand)",
    caseStudyQuote: "RELO converted our Instagram from a branding showcase into our #1 revenue channel. 38% of people who get our DM link complete the purchase on Shopify.",
    strategies: [
      { title: "Instant Size & Price Reveal", desc: "Send direct product links when shoppers ask for price or size details." },
      { title: "Exclusive Drop VIP Access", desc: "Give early access links only to followers who comment on launch teasers." },
      { title: "Influencer Collab Tracking", desc: "Track conversions per creator with unique short links." },
    ],
  },
  beauty: {
    title: "Beauty & Skincare Influencers",
    badge: "Beauty & Lifestyle Playbook",
    headline: "Monetize Shade Recommendations & Affiliate Links",
    subheadline: "Followers want your exact lipstick shade or skincare routine. Automate affiliate product delivery with 0 missed commissions.",
    triggerKeyword: "GLOW",
    commentExample: "Girl that highlighter is insane! Which shade are you wearing??",
    commentUser: "tanya_glam",
    dmResponse: "Hey Tanya! ✨ I'm wearing the Rare Beauty liquid luminizer in shade 'Mesmerize'. Here are the exact links + my Nykaa discount code!",
    dmButtonText: "Get My Exact Shade 💄",
    metricLabel: "Affiliate Revenue Lift",
    metricValue: "+210%",
    caseStudyName: "Simran Kaur (Beauty Creator, 310K)",
    caseStudyQuote: "I was losing lakhs in affiliate commissions because Instagram links in stories expire in 24 hours. Now with RELO, every comment on my Reels gets my tracked links forever.",
    strategies: [
      { title: "Exact Shade & Product Links", desc: "Send direct affiliate links with Nykaa/Amazon codes automatically." },
      { title: "Morning & Night Routine PDFs", desc: "Bundle recommendations into a curated skincare routine guide." },
      { title: "Brand Sponsorship Proof", desc: "Export CSV lead numbers to show cosmetic brands your exact comment conversion rates." },
    ],
  },
  "real-estate": {
    title: "Real Estate Agents & Brokers",
    badge: "High-Ticket Real Estate Playbook",
    headline: "Capture High-Net-Worth Property Leads in Minutes",
    subheadline: "When prospective buyers see luxury property walkthroughs, they want floor plans and pricing. Deliver the brochure instantly to capture high-intent numbers.",
    triggerKeyword: "VILLA",
    commentExample: "What is the starting price for these 3BHK luxury apartments in Whitefield?",
    commentUser: "vikram_singh",
    dmResponse: "Hello Vikram ji! The 3BHK villas start at ₹2.4 Cr with private terrace. You can view the full floor plan and layout brochure below.",
    dmButtonText: "Download Brochure & Floorplan 📑",
    metricLabel: "Site Visit Bookings",
    metricValue: "3.4X",
    caseStudyName: "Apex Luxury Properties (Bengaluru)",
    caseStudyQuote: "In real estate, lead response time is everything. Getting the brochure to prospective buyers within 1 minute increased our site visit conversion rate by over 300%.",
    strategies: [
      { title: "Floor Plan & Pricing PDFs", desc: "Comment 'BROCHURE' delivers the project layout and unit availability." },
      { title: "VIP Site Visit Scheduling", desc: "Send direct booking links for weekend site walkthroughs." },
      { title: "Lead Qualification via DMs", desc: "Ask 2 quick questions to qualify buyer budget before sales team calls." },
    ],
  },
  agencies: {
    title: "Creative Growth & Marketing Agencies",
    badge: "Agency & Multi-Client Playbook",
    headline: "Scale DM Automation Across 20+ Client Accounts",
    subheadline: "Manage Instagram automations for all your agency clients under one unified dashboard with white-label client performance reporting.",
    triggerKeyword: "GROWTH",
    commentExample: "How can our brand set up this automated DM workflow for our next product launch?",
    commentUser: "brand_founder",
    dmResponse: "Hey there! We set up end-to-end DM automations for top D2C brands. Tap below to see our agency case study deck and schedule a discovery call.",
    dmButtonText: "View Agency Case Studies 📈",
    metricLabel: "Client Retention",
    metricValue: "96%",
    caseStudyName: "ScaleUp Media (Managing 18 Creators & Brands)",
    caseStudyQuote: "RELO's multi-account workspace and flat pricing allows us to package DM automation as a premium ₹35,000/mo retainer service with 90% profit margins.",
    strategies: [
      { title: "Multi-Account Workspace", desc: "Manage all creator and brand accounts from one central login." },
      { title: "White-Label Reporting", desc: "Export clean CSV and telemetry data for monthly client progress reports." },
      { title: "Template Duplication", desc: "Clone high-converting flow canvases across multiple client accounts with 1 click." },
    ],
  },
};

export function UseCasePage({ niche, navigate }: UseCaseProps) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [niche]);

  const slug = niche.toLowerCase().trim();
  const data = NICHES[slug] ?? NICHES["fitness"];

  return (
    <div className="relative min-h-screen text-ink bg-canvas">
      <LiquidBackdrop variant="hero" grid />

      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-line/60 bg-canvas/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo onClick={() => navigate("/")} />
            <span className="caption hidden sm:block border-l border-line pl-3 text-ink-3">
              Use Cases
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
              <span>Use This Blueprint</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </Container>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-14 pb-16 text-center">
        <Container className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-signal/25 bg-signal-wash px-3.5 py-1 text-[12px] font-bold text-signal shadow-sm">
            <Sparkles className="size-3.5" />
            <span>{data.badge}</span>
          </div>

          <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.035em] text-ink leading-[1.1]">
            {data.headline}
          </h1>

          <p className="mt-4 text-base sm:text-lg md:text-xl leading-relaxed text-ink-2 max-w-2xl mx-auto">
            {data.subheadline}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="obsidian h-12 px-7 text-[15px] font-bold rounded-xl shadow-xl transition-transform hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              <span>Deploy {data.triggerKeyword} Template (Free)</span>
              <ArrowRight className="size-4" />
            </button>
          </div>

          {/* Interactive Simulation of Comment -> DM Sequence */}
          <div className="mt-14 rounded-3xl border border-line bg-surface/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl text-left">
            <div className="flex items-center justify-between border-b border-line pb-4 mb-6">
              <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-signal">
                Live Blueprint Simulation
              </span>
              <span className="text-[11.5px] text-ink-3">
                Trigger keyword: <span className="font-bold text-signal">{data.triggerKeyword}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Step 1: Public Reel Comment */}
              <div>
                <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-[11px] font-bold text-ink-2 border border-line">
                  <span className="grid size-4 place-items-center rounded-full bg-signal text-[9.5px] font-black text-white">
                    1
                  </span>
                  Follower comments on your Reel
                </div>

                <div className="rounded-2xl border border-line bg-canvas p-4 shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 text-[11px] font-black text-white">
                      {data.commentUser[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center justify-between text-[12px] font-bold text-ink">
                        <span>{data.commentUser}</span>
                        <Heart className="size-3.5 text-rose-500 fill-rose-500" />
                      </p>
                      <p className="mt-1 text-[13px] text-ink-2 font-medium">
                        {data.commentExample}
                      </p>
                      <p className="mt-1 text-[10.5px] text-ink-3">2m ago · Reply</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pl-4 border-l-2 border-signal/50">
                  <p className="text-[11.5px] font-bold text-signal">
                    ⚡ RELO AI auto-replies to comment with dynamic human jitter:
                  </p>
                  <p className="text-[12px] text-ink-3 italic mt-0.5">
                    &quot;Sent it to your DMs! Check your message requests ❤️&quot;
                  </p>
                </div>
              </div>

              {/* Step 2: Instant Automated DM */}
              <div>
                <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-[11px] font-bold text-ink-2 border border-line">
                  <span className="grid size-4 place-items-center rounded-full bg-signal text-[9.5px] font-black text-white">
                    2
                  </span>
                  Delivered into Private DM (100% Automated)
                </div>

                <div className="rounded-2xl border border-line bg-surface p-4 shadow-xl">
                  <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-line text-[11px] text-ink-3">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>Delivered via RELO Instagram Graph API v21</span>
                  </div>
                  <p className="text-[13px] text-ink font-medium leading-relaxed">
                    {data.dmResponse}
                  </p>
                  <div className="mt-3">
                    <div 
                      onClick={() => navigate("/login")}
                      className="flex h-10 items-center justify-center rounded-xl bg-signal text-white font-bold text-[12.5px] shadow-md cursor-pointer transition-transform hover:scale-[1.02]"
                    >
                      {data.dmButtonText}
                    </div>
                  </div>
                  <p className="mt-2 text-right text-[10px] text-ink-3 font-semibold">Seen · Delivered</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Strategies Grid */}
      <section className="py-16 border-t border-line bg-surface/40">
        <Container className="max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-ink tracking-tight">
              3 High-Converting Workflows for {data.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.strategies.map((strat, i) => (
              <div key={strat.title} className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
                <span className="grid size-7 place-items-center rounded-lg bg-signal/15 text-signal font-bold text-xs">
                  0{i + 1}
                </span>
                <h3 className="mt-4 font-bold text-ink text-base">{strat.title}</h3>
                <p className="mt-2 text-[13px] text-ink-2 leading-relaxed">{strat.desc}</p>
              </div>
            ))}
          </div>

          {/* Testimonial / Case Study Card */}
          <div className="mt-14 rounded-3xl border border-line bg-surface p-8 shadow-xl">
            <div className="flex items-center gap-1 text-amber-500 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-base sm:text-lg text-ink font-medium leading-relaxed italic">
              &quot;{data.caseStudyQuote}&quot;
            </p>
            <div className="mt-4 pt-4 border-t border-line flex items-center justify-between">
              <div>
                <p className="font-bold text-ink text-sm">{data.caseStudyName}</p>
                <p className="text-[12px] text-ink-3">Verified RELO Creator</p>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black text-signal">{data.metricValue}</span>
                <p className="text-[11px] text-ink-3 font-semibold uppercase">{data.metricLabel}</p>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="obsidian h-12 px-8 text-[15px] font-bold rounded-xl shadow-xl transition-transform hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              <span>Get Started with the {data.title} Blueprint</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </Container>
      </section>
    </div>
  );
}
