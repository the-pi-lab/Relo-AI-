import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { MultiBackendVisualizer } from "@/components/landing/MultiBackendVisualizer";
import { HeroCanvas } from "@/components/landing/heroes/HeroCanvas";
import { StackScene } from "@/components/landing/heroes/scenes";

export default function BackendsPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <LandingNavbar />
      <HeroCanvas
        eyebrow="Your backend"
        title={<>Three layers. One container you own.</>}
        description="Postgres for data, a queue plus worker for automation, webhooks for Meta events. Deploy to Railway, Render, Fly.io, or any VPS — tokens never leave your hands."
        cta={
          <Button size="lg" onClick={() => navigate("/auth")} className="h-13 px-8 font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-lg cursor-pointer">
            Connect your backend <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        }
        scene={(p) => <StackScene p={p} />}
      />
      <MultiBackendVisualizer />
      <LandingFooter />
    </div>
  );
}
