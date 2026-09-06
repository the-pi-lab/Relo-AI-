import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

const comparisonRows = [
  { feature: "Pricing Model", manyChat: "$15–$235 / month", zorcha: "$29–$99 / month", chatFlow: "\$10 Once (Lifetime)" },
  { feature: "Contact Limits / Tax", manyChat: "Strictly Capped (Pay per 500)", zorcha: "Capped Tiers", chatFlow: "Unlimited Contacts (0 Tax)" },
  { feature: "3-Button Interactive Cards", manyChat: "Included (High tier)", zorcha: "Basic", chatFlow: "Included (1 to 3 Buttons)" },
  { feature: "Multi-Backend Power Pool", manyChat: "Impossible (Closed)", zorcha: "No", chatFlow: "Yes (Up to 3 Backends)" },
  { feature: "Anti-Spam Reply Variations", manyChat: "Limited", zorcha: "Basic", chatFlow: "Yes (3 to 8 Variations)" },
  { feature: "Meta Graph API Approval", manyChat: "Included", zorcha: "Included", chatFlow: "Included (1-Click Connect)" },
  { feature: "Data Ownership", manyChat: "They own your leads", zorcha: "They own your leads", chatFlow: "100% In Your Postgres" },
  { feature: "Human Takeover 30-Min Pause", manyChat: "Manual tags", zorcha: "No", chatFlow: "Automatic 30-Min Pause" },
];

const faqs = [
  {
    q: "Do I need coding or database skills to set this up?",
    a: "None at all! We provide 1-click templates for Railway and Render. You click 'Deploy', copy the generated URL, paste it into Chat Flow AI, and your bot is live.",
  },
  {
    q: "Will my Instagram account get banned or flagged?",
    a: "Never. Chat Flow AI uses your official Meta-approved Instagram Graph API permissions. We never use unauthorized scraping or browser automation. Everything adheres 100% to Meta's strict platform rules.",
  },
  {
    q: "How does the \$10 Lifetime License work?",
    a: "You pay once (\$10) for lifetime software access for 1 connected Instagram account. You bring your own free database (Render/Railway/Supabase), so we never charge you a monthly subscription fee ever again.",
  },
  {
    q: "Can I connect multiple backends for high-traffic Reels?",
    a: "Yes! You can connect up to 3 backends and assign individual Reels to different backends, tripling your free-tier processing capacity without paying for server upgrades.",
  },
];

export function PricingComparison() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section id="pricing" className="relative py-28 md:py-36 overflow-hidden bg-white">
      {/* Daylight Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-blue-400/10 via-sky-400/15 to-emerald-400/15 blur-[140px] pointer-events-none -z-10 rounded-full" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Honest Transparent Comparison</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-5">
            Side-By-Side: Chat Flow AI vs ManyChat
          </h2>
          <p className="text-slate-600 text-base sm:text-lg font-medium">
            Compare the features, privacy, and long-term costs of traditional chatbot SaaS vs Chat Flow AI.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="mb-20 rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <th className="p-5 font-bold">Feature</th>
                  <th className="p-5 font-bold text-rose-600">ManyChat</th>
                  <th className="p-5 font-bold text-slate-500">Zorcha</th>
                  <th className="p-5 font-bold text-blue-700 bg-blue-50/70 border-l border-blue-200">
                    Chat Flow AI ✨
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 font-bold text-slate-900">{row.feature}</td>
                    <td className="p-5 text-slate-500 font-medium">{row.manyChat}</td>
                    <td className="p-5 text-slate-500 font-medium">{row.zorcha}</td>
                    <td className="p-5 font-extrabold text-emerald-700 bg-blue-50/40 border-l border-blue-200">
                      {row.chatFlow}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing Card Banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-blue-50 via-white to-emerald-50 border-2 border-blue-200 shadow-[0_20px_60px_rgba(2,132,199,0.12)] relative overflow-hidden mb-24 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-600 text-white text-xs font-bold mb-4 shadow-sm">
            🔥 Founder Launch Special
          </div>
          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
            \$10 One-Time. Lifetime Software.
          </h3>
          <p className="text-slate-600 text-sm font-medium mb-6 max-w-md mx-auto">
            Zero monthly subscriptions. Zero contact penalties. Meta-Approved App ID included.
          </p>

          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="h-14 px-10 rounded-xl text-base font-bold bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-white shadow-xl shadow-blue-600/25 border-0 hover:scale-105 transition-all"
          >
            <span>Get Lifetime Access Now</span>
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Instant Access • 100% Meta Compliant</span>
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-black text-slate-900 mb-8 text-center flex items-center justify-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            <span>Frequently Asked Questions</span>
          </h3>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={faq.q}
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="p-5 rounded-2xl bg-white border border-slate-200 cursor-pointer hover:border-slate-300 shadow-sm transition-all"
              >
                <div className="flex items-center justify-between font-bold text-slate-900 text-sm sm:text-base">
                  <span>{faq.q}</span>
                  <span className="text-blue-600 font-extrabold ml-4 text-lg">
                    {openFaq === idx ? "−" : "+"}
                  </span>
                </div>
                {openFaq === idx && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-xs sm:text-sm text-slate-600 mt-3 pt-3 border-t border-slate-100 leading-relaxed font-medium"
                  >
                    {faq.a}
                  </motion.p>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
