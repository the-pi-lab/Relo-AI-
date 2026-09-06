import { useState } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Calculator } from "lucide-react";
import { useNavigate } from "react-router";

export function LiveSavingsCalculator() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<number>(5000);

  // Calculate ManyChat Pricing Tier
  const getManyChatMonthly = (count: number) => {
    if (count <= 500) return 15;
    if (count <= 2500) return 25;
    if (count <= 5000) return 45;
    if (count <= 10000) return 65;
    if (count <= 25000) return 145;
    return 235;
  };

  const manyChatMonthly = getManyChatMonthly(contacts);
  const manyChatYearly = manyChatMonthly * 12;
  const chatFlowCost = 19;
  const savingsYear1 = manyChatYearly - chatFlowCost;
  const savingsYear3 = manyChatYearly * 3 - chatFlowCost;

  return (
    <section id="calculator" className="relative py-28 md:py-36 overflow-hidden bg-white">
      {/* Daylight Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-emerald-400/10 via-sky-400/15 to-blue-400/10 blur-[130px] pointer-events-none -z-10 rounded-full" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 mb-4 shadow-sm">
            <Calculator className="w-3.5 h-3.5 text-emerald-600" />
            <span>Interactive Cost Calculator</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-5">
            How Much Money Are You Burning on ManyChat?
          </h2>
          <p className="text-slate-600 text-base sm:text-lg font-medium">
            Slide to your expected contact/lead volume and watch your annual savings instantly.
          </p>
        </div>

        {/* Calculator Main Box */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-50/80 border border-slate-200 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left: Slider Controls */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-slate-700">
                  Your Audience / Active Contacts:
                </span>
                <span className="text-2xl font-black text-blue-600 bg-blue-50 border border-blue-200 px-4 py-1.5 rounded-xl font-mono">
                  {contacts.toLocaleString()} contacts
                </span>
              </div>

              {/* Slider */}
              <div className="py-6">
                <Slider
                  value={[contacts]}
                  onValueChange={(val) => setContacts(val[0])}
                  min={500}
                  max={50000}
                  step={500}
                  className="w-full cursor-pointer py-2"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono font-bold">
                  <span>500 (Beginner)</span>
                  <span>10,000 (Growing)</span>
                  <span>25,000+ (Viral)</span>
                  <span>50,000 (Pro)</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                {[1000, 5000, 15000, 35000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setContacts(preset)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      contacts === preset
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {preset.toLocaleString()} leads
                  </button>
                ))}
              </div>

            </div>

            {/* Right: The Brutal Comparison Card */}
            <div className="lg:col-span-6 p-6 sm:p-8 rounded-2xl bg-white border border-emerald-200 shadow-xl relative">
              
              <div className="grid grid-cols-2 gap-4 pb-6 border-b border-slate-100">
                
                {/* ManyChat Cost */}
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-1">
                    ManyChat Cost
                  </span>
                  <div className="flex items-baseline gap-1 text-slate-900">
                    <span className="text-2xl sm:text-3xl font-black text-rose-500 font-mono line-through">
                      ${manyChatYearly}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">/year</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 font-medium">
                    (${manyChatMonthly}/mo subscription)
                  </span>
                </div>

                {/* Chat Flow AI Cost */}
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Chat Flow AI
                  </span>
                  <div className="flex items-baseline gap-1 text-slate-900">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
                      \$10
                    </span>
                    <span className="text-xs text-emerald-700 font-bold">Once</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 mt-1 font-bold">
                    Lifetime software license
                  </span>
                </div>

              </div>

              {/* Huge Savings Counter */}
              <div className="py-6 flex flex-col items-center text-center">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Your 1-Year Cash Savings
                </span>
                <motion.div
                  key={savingsYear1}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl sm:text-5xl font-black text-emerald-600 font-mono tracking-tight"
                >
                  +${savingsYear1.toLocaleString()}
                </motion.div>
                <span className="text-xs text-slate-600 mt-2 font-medium">
                  3-Year Savings: <strong className="text-slate-900 font-bold">${savingsYear3.toLocaleString()}</strong> in pure profit kept in your pocket.
                </span>
              </div>

              {/* Action Button */}
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="w-full h-12 rounded-xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-xl shadow-emerald-600/20 border-0"
              >
                <span>Save ${savingsYear1.toLocaleString()} — Claim \$10 Lifetime</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
