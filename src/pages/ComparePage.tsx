import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { PricingComparison } from "@/components/landing/PricingComparison";
import { HeroCanvas } from "@/components/landing/heroes/HeroCanvas";
import { DuelScene } from "@/components/landing/heroes/scenes";

export default function ComparePage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <LandingNavbar />
      <HeroCanvas
        eyebrow="Chat Flow AI vs ManyChat"
        title={<>Rent forever, or own for $10?</>}
        description="Monthly seats, contact taxes, and caps — against one lifetime payment and infrastructure you control. Scroll the full breakdown below."
        cta={
          <Button size="lg" onClick={() => navigate("/pricing")} className="h-13 px-8 font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-lg cursor-pointer">
            Get lifetime access <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        }
        scene={(p) => <DuelScene p={p} />}
      />
      <div className="relative z-20 bg-white border-t border-slate-200">
        <PricingComparison />
      </div>
      <LandingFooter />
    </div>
  );
}
