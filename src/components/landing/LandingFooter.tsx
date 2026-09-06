import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router";

export function LandingFooter() {
  const navigate = useNavigate();

  return (
    <footer className="relative bg-slate-50 border-t border-slate-200 pt-16 pb-12 overflow-hidden text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-200">
          
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-emerald-400 p-[1px] shadow-sm">
                <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <span className="font-extrabold text-base text-slate-900 tracking-tight">
                Chat Flow <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-sm leading-relaxed font-medium">
              The only self-hosted Instagram DM automation engine built to liberate creators from expensive SaaS subscriptions. Bring your own database, keep 100% of your data.
            </p>
            <span className="inline-block text-[11px] text-emerald-800 font-bold font-mono bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
              ● All Systems Operational (v2.0)
            </span>
          </div>

          {/* Navigation */}
          <div>
            <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">Product</h5>
            <ul className="space-y-2 font-medium">
              <li><a href="#features" className="hover:text-blue-600 transition-colors">Features</a></li>
              <li><a href="#calculator" className="hover:text-blue-600 transition-colors">Savings Calculator</a></li>
              <li><a href="#multi-backend" className="hover:text-blue-600 transition-colors">Multi-Backend Pool</a></li>
              <li><a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing (\$10 Lifetime)</a></li>
              <li><button onClick={() => navigate("/auth")} className="hover:text-blue-600 transition-colors">Login / Register</button></li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">Compliance &amp; Legal</h5>
            <ul className="space-y-2 font-medium">
              <li><a href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
              <li><a href="/support" className="hover:text-blue-600 transition-colors">Support &amp; Docs</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px] font-medium">
          <p>© {new Date().getFullYear()} Chat Flow AI. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Not affiliated with or endorsed by Instagram or Meta Platforms, Inc.
          </p>
        </div>

      </div>
    </footer>
  );
}
