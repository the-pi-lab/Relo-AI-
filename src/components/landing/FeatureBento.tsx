import { motion } from "framer-motion";
import { MessageSquare, ShieldCheck, Cpu, UserCheck, Image, Database, Zap, Lock } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Comment Triggers That Understand Language",
    badge: "Unicode-Aware Matching",
    description: "Whole-word keyword matching across scripts with Latin diacritic folding — “preço” matches “preco”. Scope to one post or every reel.",
    color: "bg-gradient-to-b from-blue-50/70 to-white",
    border: "border-blue-200",
    iconColor: "text-blue-600 bg-blue-50",
  },
  {
    icon: ShieldCheck,
    title: "One Reply Per Comment, Enforced",
    badge: "No Double DMs",
    description: "Meta allows exactly one private reply per comment. Overlapping automations skip gracefully with a logged reason instead of burning API calls.",
    color: "bg-gradient-to-b from-emerald-50/70 to-white",
    border: "border-emerald-200",
    iconColor: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: Cpu,
    title: "AI Only Where It Pays",
    badge: "Zero-Waste AI",
    description: "Keyword flows never touch an API. Enable AI per automation with your own OpenAI or Gemini key — failures fall back to your template, never to silence.",
    color: "bg-gradient-to-b from-sky-50/70 to-white",
    border: "border-sky-200",
    iconColor: "text-sky-600 bg-sky-50",
  },
  {
    icon: UserCheck,
    title: "Follower Gating Without Traps",
    badge: "Fail-Open By Design",
    description: "Ask for a follow before the link goes out. Unverifiable follow status never blocks a real follower; every decision is logged.",
    color: "bg-gradient-to-b from-amber-50/70 to-white",
    border: "border-amber-200",
    iconColor: "text-amber-600 bg-amber-50",
  },
  {
    icon: Image,
    title: "Every Send Logged",
    badge: "Full Audit Trail",
    description: "Sent, skipped, rate-limited, or failed — each outcome lands in dm_logs with its reason. Public replies send independently of DMs.",
    color: "bg-gradient-to-b from-teal-50/70 to-white",
    border: "border-teal-200",
    iconColor: "text-teal-600 bg-teal-50",
  },
  {
    icon: Database,
    title: "Zero Contact Tax & 100% Privacy",
    badge: "You Own Everything",
    description: "Whether you have 100 or 100,000 leads, your software cost stays $10 once. All contacts stay inside your personal Postgres database.",
    color: "bg-gradient-to-b from-slate-50 to-white",
    border: "border-slate-200",
    iconColor: "text-slate-700 bg-slate-100",
  },
];

export function FeatureBento() {
  return (
    <section id="features" className="relative py-28 md:py-36 overflow-hidden bg-slate-50/60 border-t border-slate-200">
      {/* Daylight Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[500px] bg-gradient-to-r from-blue-400/10 via-sky-400/15 to-emerald-400/10 blur-[150px] pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 mb-4 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>Engineered For Maximum Conversion</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-5">
            Everything ManyChat Lacks. Built In.
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium">
            Crafted specifically for creators, coaches, and brands who want maximum follower growth,
            100% deliverability, and zero monthly bills.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className={`p-7 rounded-3xl ${feature.color} border ${feature.border} shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between group`}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-12 h-12 rounded-2xl border border-slate-200/80 flex items-center justify-center ${feature.iconColor} shadow-sm group-hover:rotate-6 transition-transform`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-xs">
                    {feature.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center gap-2 text-xs font-bold text-blue-700">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>Included in \$10 Lifetime License</span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
