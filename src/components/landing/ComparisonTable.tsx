import React from "react";
import { Check, X, ShieldCheck, Sparkles } from "lucide-react";

export default function ComparisonTable() {
  const comparisonRows = [
    {
      feature: "Pricing Model",
      relo: "$10 One-Time Lifetime License",
      reloHighlight: true,
      manychat: "$180/year (Billed monthly/annually)",
      manychatNegative: true,
    },
    {
      feature: "Contact Growth Tax",
      relo: "Zero ($0.00). Unlimited contacts forever.",
      reloHighlight: true,
      manychat: "Scales up to $235/month as contacts grow",
      manychatNegative: true,
    },
    {
      feature: "Infrastructure Architecture",
      relo: "Cloudflare Workers Edge (<15ms response)",
      reloHighlight: true,
      manychat: "Centralized proprietary cloud servers",
      manychatNegative: false,
    },
    {
      feature: "Anti-Spam Human Jitter",
      relo: "Randomized 30–90s human delay + 3–8 Spintax",
      reloHighlight: true,
      manychat: "Identical canned replies (increases spam flag risks)",
      manychatNegative: true,
    },
    {
      feature: "Follow-Gate Verification",
      relo: "Follow check with 1500ms fail-open protection",
      reloHighlight: true,
      manychat: "Requires multi-step conversational chatbot flow",
      manychatNegative: false,
    },
    {
      feature: "Direct Message Format",
      relo: "Official Meta 3-Button Generic Template Cards",
      reloHighlight: true,
      manychat: "Standard text or costly bot modules",
      manychatNegative: false,
    },
    {
      feature: "Data Sovereignty & Privacy",
      relo: "100% Creator-owned Serverless SQLite (D1)",
      reloHighlight: true,
      manychat: "Hosted in vendor's multi-tenant database",
      manychatNegative: true,
    },
    {
      feature: "1-Click Leads CSV Export",
      relo: "Included free. Instant RFC 4180 streaming download",
      reloHighlight: true,
      manychat: "Restricted tiers or requires third-party connectors",
      manychatNegative: true,
    },
    {
      feature: "Server Maintenance",
      relo: "Zero maintenance. Runs 24/7 on Cloudflare edge",
      reloHighlight: true,
      manychat: "Subject to centralized server maintenance & third-party lag",
      manychatNegative: false,
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto font-sans">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-mono font-bold tracking-wide uppercase mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          The Side-by-Side Breakdown
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          RELO vs. The $180/Year ManyChat Tax
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-medium mt-2">
          Compare the engineering, pricing, and creator sovereignty side by side.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[620px]">
            <caption className="sr-only">
              Detailed feature and pricing comparison between RELO and ManyChat
            </caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-600">
                <th scope="col" className="py-4 px-6 w-1/3">Feature</th>
                <th scope="col" className="py-4 px-6 w-1/3 bg-emerald-50/80 text-emerald-900 border-x border-emerald-100">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    RELO ($10)
                  </div>
                </th>
                <th scope="col" className="py-4 px-6 w-1/3 text-slate-500">
                  ManyChat ($180+/yr)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
              {comparisonRows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <th scope="row" className="py-4 px-6 font-semibold text-slate-900 text-left font-sans">
                    {row.feature}
                  </th>
                  <td className="py-4 px-6 bg-emerald-50/30 font-bold text-slate-900 border-x border-emerald-100/60">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className={row.reloHighlight ? "text-emerald-900 font-bold" : ""}>
                        {row.relo}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    <div className="flex items-start gap-2">
                      {row.manychatNegative ? (
                        <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0 ml-1.5 mr-1" />
                      )}
                      <span className={row.manychatNegative ? "text-red-700 font-medium" : ""}>
                        {row.manychat}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-400 font-sans leading-relaxed">
          * ManyChat pricing reflects publicly available Pro tier starting at $15/month billed annually ($180/year for up to 500 contacts), scaling upward with contact volume. Verified September 2026.
        </div>
      </div>
    </section>
  );
}
