import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { FeatureBento } from "@/components/landing/FeatureBento";
import { HeroCanvas } from "@/components/landing/heroes/HeroCanvas";
import { OrbitScene } from "@/components/landing/heroes/scenes";

export default function FeaturesPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <LandingNavbar />
      <HeroCanvas
        eyebrow="Features"
        title={<>Six systems. One automation engine.</>}
        description="Comment triggers that understand language, one-reply enforcement, zero-waste AI, follower gating, full audit logs — all running on infrastructure you own."
        cta={
          <Button size="lg" onClick={() => navigate("/auth")} className="h-13 px-8 font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-lg cursor-pointer">
            Start free <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        }
        scene={(p) => <OrbitScene p={p} />}
      />
      <FeatureBento />
      <LandingFooter />
    </div>
  );
}
