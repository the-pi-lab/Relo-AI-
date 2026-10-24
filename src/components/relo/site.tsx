"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";

import { Logo } from "./chrome";
import { cn } from "@/lib/utils";
import footerCollageImg from "@/assets/footer-relo-collage.jpg";

const getSrc = (img: any): string => (typeof img === "string" ? img : img?.src ?? "");

/* ==========================================================================
   Shared marketing chrome: a floating frosted pill nav and a directory
   footer. Used by the landing page and every public page.
   ========================================================================== */

type Nav = (to: string) => void;

const NAV_LINKS = [
  { label: "About", to: "/about" },
  { label: "Product", to: "/product/dm-automation" },
  { label: "Resources", to: "/blog" },
  { label: "Pricing", to: "/pricing" },
];

export function SiteNav({ navigate, onPhoto = false }: { navigate: Nav; onPhoto?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const light = onPhoto && !scrolled;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:pt-5">
      <motion.nav
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "mx-auto flex h-14 max-w-[760px] items-center gap-2 rounded-2xl pl-4 pr-2 transition-all duration-500",
          light ? "frost-dark" : "frost"
        )}
        aria-label="Main"
      >
        <Logo onClick={() => navigate("/")} className={cn(light && "[&_span:last-child]:text-on-photo")} />
        <span className={cn("mx-3 hidden h-5 w-px sm:block", light ? "bg-white/30" : "bg-line-strong")} />
        <div className="hidden flex-1 items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <button
              key={l.label}
              type="button"
              onClick={() => navigate(l.to)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[13.5px] font-medium transition-colors",
                light ? "text-on-photo hover:bg-white/15" : "text-ink-2 hover:bg-surface-3/70 hover:text-ink"
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className={cn(
              "hidden h-10 rounded-xl px-4 text-[13.5px] font-semibold transition-colors sm:block",
              light ? "text-on-photo hover:bg-white/15" : "bg-surface/80 text-ink shadow-[var(--sh-1)] hover:bg-surface"
            )}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="group inline-flex h-10 items-center gap-2 rounded-xl bg-ink pl-4 pr-1.5 text-[13.5px] font-semibold text-ink-invert transition-transform hover:-translate-y-px"
          >
            Start free
            <span className="grid size-7 place-items-center rounded-lg bg-signal text-signal-ink transition-transform group-hover:translate-x-0.5">
              <ArrowRight className="size-3.5" />
            </span>
          </button>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className={cn("grid size-10 place-items-center rounded-xl md:hidden", light ? "text-on-photo" : "text-ink")}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="frost mx-auto mt-2 max-w-[760px] rounded-2xl p-2 md:hidden"
          >
            {[...NAV_LINKS, { label: "Sign in", to: "/login" }].map((l) => (
              <button
                key={l.label}
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate(l.to);
                }}
                className="block w-full rounded-xl px-4 py-3 text-left text-[15px] font-medium text-ink hover:bg-surface-3/60"
              >
                {l.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

const FOOTER_COLS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "DM automation", to: "/product/dm-automation" },
      { label: "Flow canvas", to: "/product/flow-canvas" },
      { label: "Link in bio", to: "/product/link-in-bio" },
      { label: "AI FAQ assistant", to: "/product/ai-faq" },
      { label: "Tracked short links", to: "/product/short-links" },
      { label: "Broadcasts", to: "/product/broadcasts" },
      { label: "Audience export", to: "/product/audience-export" },
    ],
  },
  {
    title: "Creators",
    links: [
      { label: "Fitness coaches", to: "/use-cases/fitness" },
      { label: "Astrology & tarot", to: "/use-cases/astrology" },
      { label: "Course creators", to: "/use-cases/courses" },
      { label: "D2C brands", to: "/use-cases/d2c" },
      { label: "Beauty & skincare", to: "/use-cases/beauty" },
      { label: "Real estate", to: "/use-cases/real-estate" },
      { label: "Agencies", to: "/use-cases/agencies" },
    ],
  },
  {
    title: "Compare",
    links: [
      { label: "vs ManyChat", to: "/compare/manychat" },
      { label: "vs LinkDM", to: "/compare/linkdm" },
      { label: "vs Chatfuel", to: "/compare/chatfuel" },
      { label: "vs LinktoDM", to: "/compare/linktodm" },
      { label: "vs SuperProfile", to: "/compare/superprofile" },
      { label: "vs InstantDM", to: "/compare/instantdm" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Careers", to: "/careers" },
      { label: "Affiliates", to: "/affiliates" },
      { label: "Pricing", to: "/pricing" },
      { label: "Blog", to: "/blog" },
      { label: "Docs", to: "/docs" },
      { label: "Security", to: "/security" },
    ],
  },
];

export function SiteFooter({ navigate }: { navigate: Nav }) {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-surface-2/60">
      <div className="wrap pb-10 pt-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_2fr]">
          <div>
            <Logo onClick={() => navigate("/")} size="lg" />
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-ink-2">
              Comment-to-DM automation for Instagram creators. Built in India by The Pi Lab, on
              Instagram's official API.
            </p>
            <a
              href="mailto:hello@thepilab.in"
              className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink hover:text-signal"
            >
              hello@thepilab.in <ArrowUpRight className="size-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-ink-3">{col.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <button
                        type="button"
                        onClick={() => navigate(l.to)}
                        className="text-left text-[13.5px] text-ink-2 transition-colors hover:text-signal"
                      >
                        {l.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* RELO Creator Collective Artwork Banner */}
        <div className="relative mt-16 overflow-hidden rounded-[28px] border border-line bg-surface shadow-[var(--sh-2)] transition-all duration-500 hover:shadow-[var(--sh-3)]">
          <img
            src={getSrc(footerCollageImg)}
            alt="RELO Creators community and workspace"
            loading="lazy"
            width={1024}
            height={576}
            className="w-full object-cover transition-transform duration-700 hover:scale-[1.01]"
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-[12.5px] text-ink-3">
          <p>© {new Date().getFullYear()} The Pi Lab. All rights reserved.</p>
          <div className="flex gap-5">
            {[
              { label: "Privacy", to: "/privacy" },
              { label: "Terms", to: "/terms" },
              { label: "Cookies", to: "/cookies" },
            ].map((l) => (
              <button key={l.label} type="button" onClick={() => navigate(l.to)} className="hover:text-ink">
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
