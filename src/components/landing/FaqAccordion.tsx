import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Why is RELO only a $10 one-time fee instead of $15+/month?",
      a: "Traditional automation platforms like ManyChat run heavy, legacy server clusters and pass those idle server bills plus high venture-capital profit margins to you as monthly subscription rent and contact taxes. RELO is engineered on ultra-efficient serverless edge architecture (Cloudflare Workers + Cloudflare D1 SQLite) that runs for pennies. Because our infrastructure cost is virtually zero, we pass 100% of those savings directly to creators with a flat $10 lifetime license.",
    },
    {
      q: "How does RELO integrate with official Instagram & Meta developer tools?",
      a: "RELO connects directly through the official Meta Graph API v21.0 using standard Instagram Graph API permissions. We format DMs exclusively using Meta's documented Messenger Generic Templates, verify all webhook events with HMAC-SHA256 signatures, and apply randomized 30–90 second anti-spam human jitter. We never use unauthorized scraping or headless browser bots.",
    },
    {
      q: "What is Follow-Gate and how does the 1500ms fail-open protection work?",
      a: "Follow-Gate checks whether a commenter follows your Instagram account before unlocking private download links or resources, encouraging profile visitors to follow your page. If Meta's Graph API experiences temporary latency during a viral traffic surge, our built-in 1500ms fail-open timer automatically delivers the DM so prospective leads are never dropped.",
    },
    {
      q: "Do I need coding skills, technical expertise, or my own hosting servers?",
      a: "Zero coding and zero server setup required. You simply sign in with your email via passwordless 6-digit OTP, connect your Instagram account, and your recent Reels will appear automatically in the Creator Studio. From there, select a Reel, enter your trigger keyword, and save your automation.",
    },
    {
      q: "How does the Anti-Spam Spintax system protect my Instagram account?",
      a: "Instagram's automated moderation algorithms penalize accounts that post repetitive, identical comment replies. RELO enforces a mandatory 3 to 8 reply variation rule with nested Spintax rotation and dynamic @username mentions. Each public reply is randomized and natural, preventing spam flags.",
    },
    {
      q: "Can I export my captured leads to my own CRM or email list?",
      a: "Yes. 100% of your leads belong to you. Your Captured Leads dashboard stores each user's Instagram handle, follower status, and interaction timestamps. You can download an RFC 4180 CSV file with a single click anytime and import it into Beehiiv, ConvertKit, Klaviyo, or HubSpot.",
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto font-sans">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-mono font-bold tracking-wide uppercase mb-3">
          <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
          Frequently Asked Questions
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Everything Creators Need to Know
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-medium mt-2">
          Clear, straightforward answers about our zero-cost edge architecture and Meta compliance.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? "bg-white border-sky-200 shadow-md shadow-sky-100/50"
                  : "bg-white/80 border-slate-200/90 hover:border-slate-300"
              }`}
            >
              <button
                type="button"
                id={`faq-trigger-${i}`}
                aria-controls={`faq-panel-${i}`}
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-2xl"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ${
                    isOpen ? "rotate-180 text-sky-600" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${i}`}
                  className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100"
                >
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
