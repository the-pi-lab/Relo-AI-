"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, Heart, Sparkles } from "lucide-react";
import { Logo } from "../chrome";

interface FooterDirectoryProps {
  onStartFree: () => void;
  onNavigate: (href: string) => void;
}

const FOOTER_SECTIONS = [
  {
    title: "Company",
    links: [
      { label: "About RELO", href: "#/about" },
      { label: "Careers", href: "#/careers" },
      { label: "Pricing (₹199/mo)", href: "#pricing" },
      { label: "Security & Privacy", href: "#/privacy" },
      { label: "Terms of Service", href: "#/terms" },
      { label: "Contact Us", href: "mailto:hello@thepilab.in" },
    ],
  },
  {
    title: "Product",
    links: [
      { label: "Instagram DM Automation", href: "#features" },
      { label: "Flow Canvas Blueprints", href: "#features" },
      { label: "Link in Bio Builder", href: "#features" },
      { label: "24/7 AI FAQ Assistant", href: "#features" },
      { label: "Tracked Short Links", href: "#features" },
      { label: "Broadcasts (24h Window)", href: "#features" },
      { label: "CSV Audience Export", href: "#features" },
    ],
  },
  {
    title: "Use Cases",
    links: [
      { label: "Fitness & Nutrition Coaches", href: "#/use-cases/fitness" },
      { label: "Tarot & Astrology Creators", href: "#/use-cases/astrology" },
      { label: "Online Course Creators", href: "#/use-cases/courses" },
      { label: "E-commerce & D2C Brands", href: "#/use-cases/d2c" },
      { label: "Beauty & Skincare Influencers", href: "#/use-cases/beauty" },
      { label: "Real Estate Agents", href: "#/use-cases/real-estate" },
      { label: "Creative Growth Agencies", href: "#/use-cases/agencies" },
    ],
  },
  {
    title: "Compare",
    links: [
      { label: "vs ManyChat (No Per-Contact Tax)", href: "#pricing" },
      { label: "vs LinkDM", href: "#pricing" },
      { label: "vs Chatfuel", href: "#pricing" },
      { label: "vs LinktoDM", href: "#pricing" },
      { label: "vs SuperProfile", href: "#pricing" },
      { label: "vs InstantDM", href: "#pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Become an Affiliate (30%)", href: "#/affiliates" },
      { label: "Official Meta API Status", href: "#security" },
      { label: "The RELO Creator Blog", href: "#/blog" },
      { label: "Documentation & Guides", href: "#faq" },
      { label: "Help & VIP Support", href: "mailto:hello@thepilab.in" },
    ],
  },
];

export function FooterDirectory({ onStartFree, onNavigate }: FooterDirectoryProps) {
  return (
    <footer className="relative border-t border-line bg-canvas pt-16 pb-12 overflow-hidden">
      {/* ── High-Impact "Where Attention Becomes Income" CTA Banner ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mb-20 text-center">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-8 sm:p-14 shadow-2xl">
          {/* Subtle Glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 size-96 rounded-full opacity-20 blur-3xl"
            style={{ background: "var(--signal)" }}
          />

          {/* Giant Watermark Text behind creators */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-black text-[100px] sm:text-[180px] md:text-[220px] tracking-tighter opacity-[0.035] text-ink"
          >
            RELO
          </div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-signal/25 bg-signal-wash px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-signal">
              <Sparkles className="size-3" /> The Creator Collective
            </span>

            <h2 className="mt-5 text-3xl font-extrabold tracking-[-0.035em] text-ink sm:text-5xl">
              Where you win the{" "}
              <span className="bg-gradient-to-r from-signal via-[#BC64FF] to-[#E22295] bg-clip-text text-transparent">
                Attention Game
              </span>
            </h2>

            <p className="mt-4 text-base sm:text-lg leading-relaxed text-ink-2">
              Join thousands of creators and brands using RELO to automate engagement, 
              build real connections, and monetize their audience.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3">
              <button
                type="button"
                onClick={onStartFree}
                className="obsidian h-12 px-7 text-[15px] font-bold rounded-xl shadow-xl transition-transform hover:-translate-y-0.5 inline-flex items-center gap-2"
              >
                <span>Start for free</span>
                <ArrowRight className="size-4" />
              </button>
              <p className="flex items-center gap-1 text-[11.5px] font-medium text-ink-3">
                Made with <Heart className="size-3 text-rose-500 fill-rose-500" /> in India
              </p>
            </div>
          </div>

          {/* The Artistic Collective Photo (User's benchmark photo) */}
          <div className="relative mt-12 mx-auto max-w-4xl overflow-hidden rounded-2xl border border-line shadow-2xl">
            <div className="relative aspect-[16/9] w-full">
              <Image
                src="/images/relo/footer-collective.jpg"
                alt="The RELO Creator Collective"
                fill
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 5-Column Directory Navigation Grid ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-10 border-t border-line/70">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5 text-left">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-3">
              <h4 className="text-[12.5px] font-extrabold uppercase tracking-wider text-ink">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      onClick={(e) => {
                        if (link.href.startsWith("#/")) {
                          e.preventDefault();
                          onNavigate(link.href.replace("#", ""));
                        }
                      }}
                      className="text-[13px] text-ink-2 transition-colors hover:text-signal"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Copyright & Compliance Bar */}
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-line/70 pt-8 text-[11.5px] text-ink-3">
          <div className="flex items-center gap-3">
            <Logo onClick={() => onNavigate("/")} />
            <span className="text-ink-3">·</span>
            <span>© {new Date().getFullYear()} RELO AI (The Pi Lab). All rights reserved.</span>
          </div>
          <p className="font-mono text-[10.5px]">
            Official Meta Tech Provider · Instagram is a registered trademark of Meta Platforms, Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}
