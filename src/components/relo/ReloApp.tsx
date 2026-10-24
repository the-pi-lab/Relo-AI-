"use client";

import { useEffect } from "react";

import { ReloProvider, useHashRoute, useRelo } from "@/lib/relo/store";
import { ThemeProvider } from "@/lib/relo/theme";
import { LandingPage } from "./landing";
import { LoginPage } from "./login";
import { PrivacyPage, TermsPage, CookiesPage, NotFoundPage } from "./pages";
import { ComparisonPage } from "./pages-compare";
import { UseCasePage } from "./pages-usecases";
import { AboutPage, CareersPage, AffiliatesPage, PricingPage } from "./pages-company";
import { BlogPage, DocsPage, SecurityPage, ProductDetailPage } from "./pages-resources";
import { CookieConsent } from "./cookie-consent";
import { StudioShell } from "./studio/StudioShell";
import { InsightsView } from "./studio/views-charts";
import { DashboardView } from "./studio/views-dashboard";
import { AutomationsView, LeadsView } from "./studio/views-automations";
import { CampaignsView, ProductsView } from "./studio/views-ops";
import { CanvasView, BioView } from "./studio/views-create";
import { ContentView, SettingsView } from "./studio/views-settings";

function StudioFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas">
      <div className="flex items-center gap-3 text-[13.5px] text-ink-3">
        <span className="size-2 animate-pulse rounded-full bg-signal" aria-hidden />
        Opening your studio
      </div>
    </div>
  );
}

function Router() {
  const [route, navigate] = useHashRoute();
  const { status, refreshAll } = useRelo();

  /* The studio is only rendered for a session the Worker will accept. While
     the stored token is being checked we show a holding screen rather than
     flashing the login form at a returning user. */
  useEffect(() => {
    if (route.name !== "studio") return;
    if (status === "signed-out") navigate("/login");
  }, [route.name, status, navigate]);

  useEffect(() => {
    const timer = window.setTimeout(() => window.scrollTo({ top: 0 }), 0);
    return () => window.clearTimeout(timer);
  }, [route]);

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
        return <DashboardView go={(view) => navigate(`/studio/${view}`)} />;
    }
  };

  const key = route.name === "studio" 
    ? `studio-${studioView}` 
    : route.name === "compare" 
    ? `compare-${route.competitor}`
    : route.name === "use-case"
    ? `use-case-${route.niche}`
    : route.name === "product"
    ? `product-${route.feature}`
    : route.name;

  const studioReady = status === "signed-in";

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2.5 focus:text-[13px] focus:font-semibold focus:text-ink-invert focus:outline-none"
      >
        Skip to content
      </a>

      <CookieConsent
        navigate={navigate}
        hidden={route.name === "studio"}
      />

      <main id="main-content" tabIndex={-1} key={key}>
        {route.name === "landing" && <LandingPage navigate={navigate} />}
        {route.name === "login" && <LoginPage navigate={navigate} />}
        {route.name === "privacy" && <PrivacyPage navigate={navigate} />}
        {route.name === "terms" && <TermsPage navigate={navigate} />}
        {route.name === "cookies" && <CookiesPage navigate={navigate} />}
        {route.name === "about" && <AboutPage navigate={navigate} />}
        {route.name === "careers" && <CareersPage navigate={navigate} />}
        {route.name === "affiliates" && <AffiliatesPage navigate={navigate} />}
        {route.name === "pricing" && <PricingPage navigate={navigate} />}
        {route.name === "blog" && <BlogPage navigate={navigate} />}
        {route.name === "docs" && <DocsPage navigate={navigate} />}
        {route.name === "security" && <SecurityPage navigate={navigate} />}
        {route.name === "compare" && <ComparisonPage competitor={route.competitor} navigate={navigate} />}
        {route.name === "use-case" && <UseCasePage niche={route.niche} navigate={navigate} />}
        {route.name === "product" && <ProductDetailPage feature={route.feature} navigate={navigate} />}
        {route.name === "notfound" && <NotFoundPage navigate={navigate} />}

        {route.name === "studio" &&
          (status === "loading" ? (
            <StudioFallback />
          ) : studioReady ? (
            <StudioShell
              view={studioView}
              go={(view) => navigate(`/studio/${view}`)}
              onRefresh={() => void refreshAll()}
            >
              {renderStudioView()}
            </StudioShell>
          ) : (
            <StudioFallback />
          ))}
      </main>
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
