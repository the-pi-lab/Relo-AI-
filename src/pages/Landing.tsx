import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { CinematicCanvas } from "@/components/landing/3d/CinematicCanvas";
import { CinematicScroller } from "@/components/landing/CinematicScroller";
import { LiveSavingsCalculator } from "@/components/landing/LiveSavingsCalculator";
import { MultiBackendVisualizer } from "@/components/landing/MultiBackendVisualizer";
import { InteractiveBoxPreview } from "@/components/landing/InteractiveBoxPreview";
import { FeatureBento } from "@/components/landing/FeatureBento";
import { PricingComparison } from "@/components/landing/PricingComparison";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-sky-500 selection:text-white relative overflow-x-hidden font-sans">
      {/* 1. Fixed Full-Screen 3D WebGL Canvas (otsuka-air / void.sbs style) */}
      <CinematicCanvas />

      {/* 2. Top Light Glass Frosted Navbar */}
      <LandingNavbar />

      <main className="relative z-10">
        {/* 3. The 4-Act 3D Cinematic Story Flow (Floating, Tumble & Settle Physics) */}
        <CinematicScroller />

        {/* 4. Interactive ManyChat Cost Savings Calculator */}
        <div className="relative z-20 bg-white/95 backdrop-blur-xl border-t border-slate-200">
          <LiveSavingsCalculator />
        </div>

        {/* 5. Live Interactive "Custom Box" 3-Button Mobile Simulator */}
        <div className="relative z-20 bg-[#fafafa] border-t border-slate-200">
          <InteractiveBoxPreview />
        </div>

        {/* 6. Multi-Backend Power Pool Architecture Visualizer */}
        <div className="relative z-20 bg-white border-t border-slate-200">
          <MultiBackendVisualizer />
        </div>

        {/* 7. Core Feature Bento Grid */}
        <div className="relative z-20 bg-[#fafafa] border-t border-slate-200">
          <FeatureBento />
        </div>

        {/* 8. ManyChat vs Zorcha vs Chat Flow AI Side-by-Side & $19 Lifetime */}
        <div className="relative z-20 bg-white border-t border-slate-200">
          <PricingComparison />
        </div>
      </main>

      {/* 9. Light Porcelain Footer */}
      <div className="relative z-20">
        <LandingFooter />
      </div>
    </div>
  );
}