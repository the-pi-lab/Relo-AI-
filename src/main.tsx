import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "./styles/theme.css";
import "./index.css";
import Landing from "./pages/Landing";
import RouteFallback from "./components/RouteFallback";
import Login from "./pages/Login";
import Legal from "./pages/Legal";
import Demo from "./pages/Demo";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import Home from "./pages/dashboard/Home";
import AutomationsPage from "./pages/dashboard/AutomationsPage";
import LeadsPage from "./pages/dashboard/LeadsPage";
import InsightsPage from "./pages/dashboard/InsightsPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import CampaignsPage from "./pages/dashboard/CampaignsPage";
import ContentPage from "./pages/dashboard/ContentPage";
import LinkInBioPage from "./pages/dashboard/LinkInBioPage";
import ProductsPage from "./pages/dashboard/ProductsPage";
import { DashboardProvider } from "./pages/dashboard/DashboardContext";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";

/* React Flow is ~50kB gzip and only Studio users ever open the Canvas, so it
   stays out of the landing bundle entirely (plan.md §5: free-tier capacity). */
const CanvasStudioPage = lazy(() => import("./pages/dashboard/CanvasStudioPage"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/privacy" element={<Legal doc="privacy" />} />
          <Route path="/terms" element={<Legal doc="terms" />} />
          <Route
            path="/dashboard"
            element={
              <DashboardProvider>
                <DashboardLayout />
              </DashboardProvider>
            }
          >
            <Route index element={<Home />} />
            <Route path="automations" element={<AutomationsPage />} />
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route
              path="canvas"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <CanvasStudioPage />
                </Suspense>
              }
            />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="insights" element={<InsightsPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="link-in-bio" element={<LinkInBioPage />} />
            <Route path="content" element={<ContentPage />} />
            <Route path="settings" element={<SettingsPage />} />
            {/* In-app 404 keeps the sidebar instead of dumping the user on marketing */}
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
