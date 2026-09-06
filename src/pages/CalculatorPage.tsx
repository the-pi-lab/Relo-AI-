import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LiveSavingsCalculator } from "@/components/landing/LiveSavingsCalculator";
import { HeroCanvas } from "@/components/landing/heroes/HeroCanvas";
import { BarsScene } from "@/components/landing/heroes/scenes";

export default function CalculatorPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <LandingNavbar />
      <HeroCanvas
        eyebrow="Savings calculator"
        title={<>Subscriptions stack up. $10 doesn&apos;t.</>}
        description="Drag the numbers below and watch years of ManyChat bills tower over a single lifetime payment. Your infrastructure costs stay exactly what the providers charge — nothing more."
        cta={
          <Button size="lg" onClick={() => navigate("/pricing")} className="h-13 px-8 font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-lg cursor-pointer">
            See lifetime pricing <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        }
        scene={(p) => <BarsScene p={p} />}
      />
      <div className="relative z-20 bg-white border-t border-slate-200">
        <LiveSavingsCalculator />
      </div>
      <LandingFooter />
    </div>
  );
}
