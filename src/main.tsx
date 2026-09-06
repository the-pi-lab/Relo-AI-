import { Toaster } from "@/components/ui/sonner";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { InstrumentationProvider } from "@/instrumentation.tsx";
import AuthPage from "@/pages/Auth.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";
import Landing from "./pages/Landing.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Integrations from "./pages/Integrations.tsx";
import Backend from "./pages/Backend.tsx";
import NotFound from "./pages/NotFound.tsx";
import Settings from "./pages/Settings.tsx";
import Flows from "./pages/Flows.tsx";
import Pricing from "./pages/Pricing.tsx";
import Support from "./pages/Support.tsx";
import FeaturesPage from "./pages/FeaturesPage.tsx";
import CalculatorPage from "./pages/CalculatorPage.tsx";
import BackendsPage from "./pages/BackendsPage.tsx";
import ComparePage from "./pages/ComparePage.tsx";
import Changelog from "./pages/Changelog.tsx";
import About from "./pages/About.tsx";
import Careers from "./pages/Careers.tsx";
import Privacy from "./pages/Privacy.tsx";
import "./types/global.d.ts";

const convexUrl = (import.meta.env.VITE_CONVEX_URL as string) || "https://chatflow-ai-demo.convex.cloud";
const convex = new ConvexReactClient(convexUrl);
console.log("Convex URL:", convexUrl);

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VlyToolbar />
    <InstrumentationProvider>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <RouteSyncer />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<AuthPage redirectAfterAuth="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/backend" element={<Backend />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/flows" element={<Flows />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/support" element={<Support />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/backends" element={<BackendsPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="/about" element={<About />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </InstrumentationProvider>
  </StrictMode>,
);