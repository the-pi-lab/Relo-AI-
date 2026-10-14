"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useHashRoute, ReloProvider, useRelo } from "@/lib/relo/store";
import { ThemeProvider } from "@/lib/relo/theme";
import { LandingPage } from "./landing";
import { LoginPage } from "./login";
import { PrivacyPage, TermsPage, CookiesPage, NotFoundPage } from "./pages";
import { CookieConsent } from "./cookie-consent";
import { StudioShell } from "./studio/StudioShell";
import { HomeView, InsightsView } from "./studio/views-charts";
import { AutomationsView, LeadsView } from "./studio/views-automations";
import { CampaignsView, ProductsView } from "./studio/views-ops";
import { CanvasView, BioView } from "./studio/views-create";
import { ContentView, SettingsView } from "./studio/views-settings";

function Router() {
  const [route, navigate] = useHashRoute();
  const { user, signIn } = useRelo();

  /* guard: studio requires a session (any demo sign-in works instantly) */
  useEffect(() => {
    if (route.name === "studio" && !user) {
      navigate("/login");
    }
  }, [route.name, user, navigate]);

  /* demo=1 shortcut from the landing CTA */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash.includes("demo=1") && !user) {
      signIn("demo@relo.app", true);
      navigate("/studio");
    }
     
  }, []);

  /* landing should always scroll from top when revisited */
  useEffect(() => {
    if (route.name === "landing") {
      window.scrollTo({ top: 0 });
    }
  }, [route.name]);

  /* content pages always open at the top, after the view mounts */
  useEffect(() => {
    if (route.name === "privacy" || route.name === "terms" || route.name === "cookies" || route.name === "notfound" || route.name === "login") {
      const id = window.setTimeout(() => window.scrollTo({ top: 0 }), 0);
      return () => window.clearTimeout(id);
    }
  }, [route.name]);

  const studioView = route.name === "studio" ? route.view : "home";

  const renderStudioView = () => {
    switch (studioView) {
      case "automations":
        return <AutomationsView />;
      case "campaigns":
        return <CampaignsView />;
      case "canvas":
        return <CanvasView />;
      case "leads":
        return <LeadsView />;
      case "insights":
        return <InsightsView />;
      case "products":
        return <ProductsView />;
      case "bio":
        return <BioView />;
      case "content":
        return <ContentView />;
      case "settings":
        return <SettingsView />;
      default:
        return <HomeView go={(v) => navigate(`/studio/${v}`)} />;
    }
  };

  const key = route.name === "studio" ? `studio-${studioView}` : route.name;

  return (
    <>
      {/* keyboard users first — one hop past the sky, straight to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-[13px] focus:font-semibold focus:text-bone focus:outline focus:outline-2 focus:outline-ember"
      >
        Skip to content
      </a>
      <div className="grain-fixed" aria-hidden />
      {/* custom cursor removed for lag-free devices — the native pointer is
          hidden ONLY over ASCII art (see globals.css .ascii-live) */}
      <CookieConsent navigate={navigate} />
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          id="main-content"
          tabIndex={-1}
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.28, 1] }}
        >
          {route.name === "landing" && <LandingPage navigate={navigate} />}
          {route.name === "login" && (
            <LoginPage navigate={navigate} onAuth={(email, demo) => signIn(email, demo)} />
          )}
          {route.name === "privacy" && <PrivacyPage navigate={navigate} />}
          {route.name === "terms" && <TermsPage navigate={navigate} />}
          {route.name === "cookies" && <CookiesPage navigate={navigate} />}
          {route.name === "notfound" && <NotFoundPage navigate={navigate} />}
          {route.name === "studio" && user && (
            <StudioShell view={studioView} go={(v) => navigate(`/studio/${v}`)}>
              {renderStudioView()}
            </StudioShell>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export function ReloApp() {
  return (
    <ThemeProvider>
      <ReloProvider>
        <Router />
      </ReloProvider>
    </ThemeProvider>
  );
}
