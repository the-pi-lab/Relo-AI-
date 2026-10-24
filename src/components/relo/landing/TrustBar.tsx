"use client";

import React from "react";
import { Award, CheckCircle2, ShieldCheck, Star } from "lucide-react";

export function TrustBar() {
  return (
    <section className="relative border-y border-line/60 bg-surface/40 py-6 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-around gap-6 px-4 text-center sm:px-6">
        {/* Trustpilot */}
        <div className="flex items-center gap-2.5 opacity-90 transition-opacity hover:opacity-100">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#00B67A]/15 text-[#00B67A]">
            <Star className="size-4 fill-current" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1 text-[13px] font-bold text-ink">
              <span>Trustpilot</span>
              <span className="text-[11px] font-normal text-ink-3">★★★★★</span>
            </div>
            <p className="text-[11px] text-ink-3">4.9/5 from 1,200+ creators</p>
          </div>
        </div>

        {/* Meta Tech Provider */}
        <div className="flex items-center gap-2.5 opacity-90 transition-opacity hover:opacity-100">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#0081FB]/15 text-[#0081FB]">
            <ShieldCheck className="size-4" strokeWidth={2.2} />
          </div>
          <div className="text-left">
            <p className="text-[13px] font-bold text-ink">Meta Tech Provider</p>
            <p className="text-[11px] text-ink-3">Official Instagram Graph API</p>
          </div>
        </div>

        {/* G2 Leader */}
        <div className="flex items-center gap-2.5 opacity-90 transition-opacity hover:opacity-100">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#FF492C]/15 text-[#FF492C]">
            <Award className="size-4" />
          </div>
          <div className="text-left">
            <p className="text-[13px] font-bold text-ink">G2 High Performer</p>
            <p className="text-[11px] text-ink-3">Leader in Social Commerce</p>
          </div>
        </div>

        {/* DPIIT #startupindia */}
        <div className="flex items-center gap-2.5 opacity-90 transition-opacity hover:opacity-100">
          <div className="flex size-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-500">
            <CheckCircle2 className="size-4" />
          </div>
          <div className="text-left">
            <p className="text-[13px] font-bold text-ink">DPIIT #startupindia</p>
            <p className="text-[11px] text-ink-3">Govt. Recognized Enterprise</p>
          </div>
        </div>
      </div>
    </section>
  );
}
