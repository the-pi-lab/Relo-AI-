"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, Heart, Lock, MessageSquare, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "../motion";

const STEPS = [
  {
    id: 1,
    title: "Respond to every comment",
    body: "Auto-respond to every Instagram comment in a DM. Keep your audience (and the algorithm) happy — and watch your revenue grow.",
    image: "/images/relo/creator-scroll-1.jpg",
    creatorName: "Aanya Verma",
    creatorRole: "Fashion & Lifestyle Creator",
    dmOverlay: {
      tag: "Instant Comment-to-DM",
      messages: [
        { type: "user", text: "Link please! 😍" },
        { type: "bot", text: "Hey! Just dropped your exclusive link in DMs ✨", cta: "View Lookbook" },
      ],
    },
  },
  {
    id: 2,
    title: "Only send links after they follow you",
    body: "Ensure your discounts, offers, or exclusives are going to only real, actual Instagram followers with Ask for a Follow automation.",
    image: "/images/relo/creator-scroll-2.jpg",
    creatorName: "Rohan Mehta",
    creatorRole: "D2C Brand Founder & Angel",
    dmOverlay: {
      tag: "Follower Gate Active",
      messages: [
        { type: "bot", text: "Wait! You're missing out 👇 Follow me first — then tap below to unlock the guide 🔒" },
        { type: "user-action", text: "I'm following now ✅" },
        { type: "bot", text: "Legend! You did it. Here's your masterclass link 🚀", cta: "Get Free Access" },
      ],
    },
  },
  {
    id: 3,
    title: "Create zero-friction data collection forms",
    body: "Collect user data like phone number and email directly in the chat — understand your customers and stay in touch through multiple channels.",
    image: "/images/relo/creator-scroll-3.jpg",
    creatorName: "Pooja Hegde",
    creatorRole: "Creative Director & Agency Lead",
    dmOverlay: {
      tag: "Direct Lead Capture",
      messages: [
        { type: "bot", text: "Where should we send your VIP discount code? 🎁" },
        { type: "form-input", placeholder: "Enter WhatsApp number..." },
        { type: "bot", text: "Saved! Check your WhatsApp for the code 🎉" },
      ],
    },
  },
  {
    id: 4,
    title: "Never leave a DM unanswered",
    body: "Do not waste hours responding to repeat questions every day — let 24/7 AI handle your most common queries with instant, accurate answers.",
    image: "/images/relo/creator-scroll-4.jpg",
    creatorName: "Karan Johar",
    creatorRole: "Podcaster & Community Host",
    dmOverlay: {
      tag: "24/7 AI FAQ Assistant",
      messages: [
        { type: "user", text: "Do you ship internationally? 🌍" },
        { type: "bot", text: "Yes! We ship worldwide with express courier tracking. Delivery takes 4-7 business days ✈️" },
      ],
    },
  },
];

export function StickyPotentialScroll() {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      const viewportCenter = window.innerHeight / 2;
      stepRefs.current.forEach((el, index) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
          setActiveStep(index);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const current = STEPS[activeStep];

  return (
    <section className="relative border-t border-line/70 py-20 lg:py-28">
      {/* Background Microdots */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2/60 px-3 py-1 text-[12px] font-semibold text-ink-2 backdrop-blur-md">
              <div className="flex -space-x-1.5">
                {["#FF5E7E", "#6A07E4", "#00B67A", "#FF9900"].map((color, i) => (
                  <span
                    key={i}
                    className="inline-block size-4 rounded-full border-2 border-surface"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span>Loved by 50K+ creators</span>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-ink sm:text-5xl">
              Unlock the full{" "}
              <span className="bg-gradient-to-r from-signal via-[#BC64FF] to-[#E22295] bg-clip-text text-transparent">
                potential
              </span>
            </h2>
          </Reveal>
        </div>

        {/* 2-Column Split: Left Steps + Right Sticky Visual Container */}
        <div className="mt-16 grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: 4 Interactive Step Triggers */}
          <div className="space-y-16 lg:col-span-5 lg:py-12">
            {STEPS.map((step, index) => {
              const isActive = activeStep === index;
              return (
                <div
                  key={step.id}
                  ref={(el) => {
                    stepRefs.current[index] = el;
                  }}
                  onClick={() => setActiveStep(index)}
                  className={cn(
                    "group cursor-pointer rounded-2xl border p-6 transition-all duration-300",
                    isActive
                      ? "border-signal/40 bg-surface shadow-[var(--sh-2)]"
                      : "border-transparent bg-transparent hover:border-line hover:bg-surface/40"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid size-7 place-items-center rounded-full font-mono text-[11px] font-bold transition-colors",
                        isActive ? "bg-signal text-white" : "border border-line bg-surface-2 text-ink-3"
                      )}
                    >
                      0{step.id}
                    </span>
                    <h3
                      className={cn(
                        "text-lg font-bold transition-colors",
                        isActive ? "text-ink" : "text-ink-2 group-hover:text-ink"
                      )}
                    >
                      {step.title}
                    </h3>
                  </div>

                  <p className="mt-3 text-[13.5px] leading-relaxed text-ink-3">
                    {step.body}
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    <span
                      className={cn(
                        "h-1 rounded-full transition-all duration-300",
                        isActive ? "w-12 bg-signal" : "w-4 bg-line group-hover:bg-line-strong"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Pinned Sticky Visual Canvas */}
          <div className="lg:sticky lg:top-28 lg:col-span-7">
            <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
              {/* Creator Photo with Crossfade */}
              <div className="relative aspect-[3/4] sm:aspect-[4/5] w-full overflow-hidden rounded-2xl bg-neutral-900">
                <Image
                  key={current.image}
                  src={current.image}
                  alt={current.creatorName}
                  fill
                  priority
                  className="object-cover object-center transition-opacity duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                {/* Creator Attribution Tag */}
                <div className="absolute bottom-4 left-4 z-10 text-white">
                  <p className="text-[14px] font-bold leading-tight">{current.creatorName}</p>
                  <p className="text-[11.5px] text-white/70">{current.creatorRole}</p>
                </div>

                {/* Floating DM Interaction Card on the Image */}
                <div className="absolute right-3 top-4 z-10 sm:right-6 sm:top-6 max-w-[270px] sm:max-w-[310px] space-y-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md border border-white/10">
                    <Sparkles className="size-3 text-signal-bright" />
                    {current.dmOverlay.tag}
                  </div>

                  <div className="rounded-2xl border border-white/20 bg-black/80 p-3.5 text-white backdrop-blur-xl shadow-2xl space-y-2.5">
                    {current.dmOverlay.messages.map((msg, idx) => (
                      <div key={idx} className="space-y-1">
                        {msg.type === "user" && (
                          <div className="ml-auto w-fit rounded-2xl rounded-tr-sm bg-signal px-3 py-1.5 text-[12px] font-medium text-white">
                            {msg.text}
                          </div>
                        )}
                        {msg.type === "user-action" && (
                          <div className="mx-auto w-fit rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-300">
                            {msg.text}
                          </div>
                        )}
                        {msg.type === "form-input" && (
                          <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-[11.5px] text-white/60">
                            {msg.placeholder}
                          </div>
                        )}
                        {msg.type === "bot" && (
                          <div className="mr-auto w-fit rounded-2xl rounded-tl-sm bg-white/15 px-3 py-2 text-[12px] font-medium text-white/95">
                            <p>{msg.text}</p>
                            {msg.cta && (
                              <button
                                type="button"
                                className="mt-2 block w-full rounded-lg bg-white py-1.5 text-center text-[11px] font-bold text-black shadow transition-opacity hover:opacity-90"
                              >
                                {msg.cta}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step Indicators Below Image */}
              <div className="mt-4 flex items-center justify-between px-1">
                <span className="text-[11.5px] font-semibold text-ink-3">
                  Step {activeStep + 1} of {STEPS.length}
                </span>
                <div className="flex gap-1.5">
                  {STEPS.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveStep(i)}
                      aria-label={`Go to step ${i + 1}`}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        activeStep === i ? "w-6 bg-signal" : "w-2 bg-line hover:bg-line-strong"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
