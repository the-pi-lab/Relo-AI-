import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";

export function LandingNavbar() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3.5 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3.5 rounded-2xl bg-white/85 backdrop-blur-xl border border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {/* Logo */}
        <div 
          onClick={() => navigate("/")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-emerald-400 p-[1px] shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-600 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                Chat Flow <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">AI</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                v2.0
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              Self-Hosted Instagram Automation
            </span>
          </div>
        </div>

        {/* Center Links — every item is a separate page */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <button onClick={() => navigate("/features")} className="hover:text-blue-600 transition-colors cursor-pointer">Features</button>
          <button onClick={() => navigate("/calculator")} className="hover:text-blue-600 transition-colors cursor-pointer">Savings Calculator</button>
          <button onClick={() => navigate("/backends")} className="hover:text-blue-600 transition-colors cursor-pointer">Your Backend</button>
          <button onClick={() => navigate("/compare")} className="hover:text-blue-600 transition-colors cursor-pointer">vs ManyChat</button>
          <button onClick={() => navigate("/pricing")} className="hover:text-blue-600 transition-colors cursor-pointer">Pricing</button>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Meta Approved</span>
          </div>

          <Button
            size="sm"
            onClick={() => navigate("/auth")}
            className="rounded-xl px-4 h-10 font-bold bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-white shadow-lg shadow-blue-600/20 border-0 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span>Get $10 Lifetime</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
