import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useNavigate } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/state";
import { PageHeader } from "@/components/layout/PageHeader";
import { AttentionList } from "@/components/dashboard/AttentionList";
import { BackendStatus } from "@/components/dashboard/BackendStatus";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useLiveBackendStatus } from "@/hooks/use-live-backend-status";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { isLoading, isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();
  const stats = useQuery(api.analytics.getDashboardStats);
  const flows = useQuery(api.flows.list);
  const integrations = useQuery(api.integrations.list);
  const backend = useQuery(api.backendRegistry.myBackendStatus);
  const license = useQuery(api.licenses.myLicense);
  const { live } = useLiveBackendStatus(backend?.backendUrl);

  if (isLoading) {
    return <LoadingState message="Loading your dashboard…" />;
  }

  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const instagramConnected = (integrations ?? []).some(
    (i) => i.type === "instagram" && i.isActive
  );

  return (
    <AppShell user={user ?? undefined} onSignOut={handleSignOut}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PageHeader
          title={`Welcome back, ${user?.name?.split(" ")[0] || "User"}`}
          description="Is everything running? This page answers that."
        />
      </motion.div>

      <AttentionList
        instagramConnected={instagramConnected}
        backend={backend ?? null}
        live={live}
        flows={flows}
        licensed={license !== null && license !== undefined}
      />

      <StatsGrid stats={stats} live={live} />

      <BackendStatus />

      <QuickActions />

      <RecentActivity stats={stats} />
    </AppShell>
  );
}
