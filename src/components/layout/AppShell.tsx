import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { cn } from "@/lib/utils";
import { providerDisplayName } from "@/lib/managed-providers";
import {
  Instagram,
  LayoutDashboard,
  LifeBuoy,
  Link2,
  LogOut,
  Menu,
  Server,
  Settings,
  Workflow,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { Logo } from "@/components/Logo";
import { StatusDot, type StatusTone } from "@/components/ui/status-badge";

const NAV = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: Workflow, label: "Automations", path: "/flows" },
  { icon: Link2, label: "Integrations", path: "/integrations" },
  { icon: Server, label: "Backend", path: "/backend" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: LifeBuoy, label: "Support", path: "/support" },
];

function backendTone(status: string | undefined): StatusTone {
  if (status === "connected") return "ok";
  if (status === "needs_attention" || status === "incompatible") return "warn";
  if (status === "offline") return "bad";
  return "idle";
}

function SidebarBody({
  user,
  onSignOut,
  onNavigate,
}: {
  user?: { name?: string; email?: string };
  onSignOut: () => void;
  onNavigate: (path: string) => void;
}) {
  const location = useLocation();
  const integrations = useQuery(api.integrations.list);
  const backend = useQuery(api.backendRegistry.myBackendStatus);

  const instagram = integrations?.find((i) => i.type === "instagram" && i.isActive);
  const backendLabel = !backend
    ? "No backend"
    : backend.status === "connected"
      ? (providerDisplayName(backend.provider) ?? "Connected")
      : backend.status.replace(/_/g, " ");

  return (
    <div className="flex flex-col h-full">
      <button
        className="flex items-center gap-2.5 px-5 pt-6 pb-2 text-left"
        onClick={() => onNavigate("/")}
      >
        <Logo size="sm" />
        <span className="font-semibold text-lg tracking-tight">ChatFlow AI</span>
      </button>

      {/* Workspace: Instagram account + backend status */}
      <div className="px-3 mt-4 space-y-1.5">
        <button
          onClick={() => onNavigate("/integrations")}
          className="w-full flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left hover:bg-muted/60 transition-colors"
        >
          <StatusDot tone={instagram ? "ok" : "idle"} />
          <span className="flex-1 min-w-0">
            <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">Instagram</span>
            <span className="block text-sm font-medium truncate">
              {instagram ? `@${instagram.platformUsername ?? instagram.platformUserId}` : "Not connected"}
            </span>
          </span>
          <Instagram className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
        <button
          onClick={() => onNavigate("/backend")}
          className="w-full flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left hover:bg-muted/60 transition-colors"
        >
          <StatusDot tone={backendTone(backend?.status)} />
          <span className="flex-1 min-w-0">
            <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">Backend</span>
            <span className="block text-sm font-medium truncate capitalize">{backendLabel}</span>
          </span>
          <Server className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => onNavigate(item.path)}
              className={cn(
                "w-full justify-start gap-3 font-medium",
                isActive
                  ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      <div className="p-3 border-t">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onSignOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  user,
  onSignOut,
  children,
}: {
  user?: { name?: string; email?: string };
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-[260px] fixed inset-y-0 z-40 border-r bg-card">
        <SidebarBody user={user} onSignOut={onSignOut} onNavigate={navigate} />
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="flex items-center gap-2 px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <Logo size="sm" />
          <span className="font-semibold tracking-tight">ChatFlow AI</span>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarBody user={user} onSignOut={onSignOut} onNavigate={go} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 md:ml-[260px] min-w-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 pt-[4.5rem] md:pt-8 pb-16">{children}</div>
      </main>
    </div>
  );
}
