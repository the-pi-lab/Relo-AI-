import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useAction, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  Server,
  ServerOff,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/state";
import { PageHeader } from "@/components/layout/PageHeader";
import { listProviders, providerDisplayName } from "@/lib/managed-providers";
import { useLiveBackendStatus } from "@/hooks/use-live-backend-status";

const STATUS_META: Record<string, { label: string; className: string }> = {
  connected: { label: "Connected", className: "bg-green-100 text-green-800 border-green-200" },
  pending: { label: "Checking…", className: "bg-slate-100 text-slate-700 border-slate-200" },
  needs_attention: { label: "Needs attention", className: "bg-amber-100 text-amber-800 border-amber-200" },
  offline: { label: "Offline", className: "bg-red-100 text-red-800 border-red-200" },
  incompatible: { label: "Incompatible version", className: "bg-red-100 text-red-800 border-red-200" },
};

type Mode = "managed" | "byo";

export default function Backend() {
  const { isLoading, isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();
  const backend = useQuery(api.backendRegistry.myBackendStatus);
  const registerBackend = useAction(api.backendActions.registerBackend);
  const verifyBackend = useAction(api.backendActions.verifyBackend);
  const disconnectBackend = useAction(api.backendActions.disconnectBackend);

  const [mode, setMode] = useState<Mode>("managed");
  const [providerId, setProviderId] = useState("railway");
  const [backendUrl, setBackendUrl] = useState("");
  const [backendAuthToken, setBackendAuthToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const { live: liveStatus } = useLiveBackendStatus(backend?.backendUrl);

  if (isLoading) {
    return <LoadingState message="Loading your backend…" />;
  }

  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const describeResult = (result: unknown): void => {
    const r = result as { status: string; error?: string; pushed?: number; skipped?: number; migrated?: number };
    if (r.status === "connected") {
      const parts = [`${r.pushed ?? 0} flows synced`];
      if ((r.migrated ?? 0) > 0) parts.push(`${r.migrated} tokens migrated`);
      if ((r.skipped ?? 0) > 0) parts.push(`${r.skipped} flows skipped (need keywords + message)`);
      toast.success(`Backend connected — ${parts.join(", ")}.`);
      return;
    }
    if (r.status === "offline") toast.error(r.error || "Backend is unreachable.");
    else toast.warning(r.error || `Backend status: ${r.status}.`);
  };

  const handleConnect = async () => {
    const url = backendUrl.trim().replace(/\/+$/, "");
    if (!url || !backendAuthToken) {
      toast.error("Enter both your backend URL and auth token.");
      return;
    }
    setSubmitting(true);
    try {
      describeResult(
        await registerBackend({
          backendUrl: url,
          backendAuthToken,
          provider: mode === "managed" ? providerId : "custom",
        })
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to connect backend.");
    } finally {
      // Never keep the token in the browser longer than necessary.
      setBackendAuthToken("");
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      describeResult(await verifyBackend({}));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectBackend({});
      toast.success("Backend disconnected. Central execution resumes for stored tokens.");
      setConfirmDisconnect(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to disconnect.");
    }
  };

  const copyWebhookUrl = async () => {
    if (!backend?.backendUrl) return;
    try {
      await navigator.clipboard.writeText(`${backend.backendUrl}/webhooks/instagram`);
      toast.success("Webhook URL copied — paste it in your Meta app dashboard.");
    } catch {
      toast.error("Copy failed — select the URL manually.");
    }
  };

  const copyMonitorUrl = async () => {
    if (!backend?.backendUrl) return;
    try {
      await navigator.clipboard.writeText(`${backend.backendUrl}/health`);
      toast.success("Monitor URL copied — add it to UptimeRobot.");
    } catch {
      toast.error("Copy failed — select the URL manually.");
    }
  };

  const providers = listProviders();
  const selected = providers.find((p) => p.id === providerId) ?? providers[0];
  const statusMeta = backend ? STATUS_META[backend.status] ?? STATUS_META.pending : null;
  const providerName = providerDisplayName(backend?.provider);

  const connectForm = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="backend-url">Backend URL</Label>
        <Input
          id="backend-url"
          placeholder="https://your-backend.onrender.com"
          value={backendUrl}
          onChange={(e) => setBackendUrl(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="backend-token">Backend auth token (BACKEND_AUTH_TOKEN)</Label>
        <Input
          id="backend-token"
          type="password"
          placeholder="Paste once — it is sealed server-side and never shown again"
          value={backendAuthToken}
          onChange={(e) => setBackendAuthToken(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
        <p>
          Your token is encrypted on our server immediately and is only used to push
          automation config to your backend. Meta tokens and AI keys never pass through here.
        </p>
      </div>
      <Button onClick={handleConnect} disabled={submitting}>
        {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Server className="h-4 w-4 mr-2" />}
        Connect &amp; Verify
      </Button>
    </div>
  );

  return (
    <AppShell user={user ?? undefined} onSignOut={handleSignOut}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <PageHeader
          title="Your Backend"
          description="Where your Instagram automation actually runs. You own it — Chat Flow AI only sends configuration."
        />
      </motion.div>

          {/* Connected state */}
          {backend && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <Card className="shadow-md mb-6">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center shadow-md">
                        <Server className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Backend connected</CardTitle>
                        <CardDescription>
                          {backend.backendUrl}
                          {providerName ? ` · ${providerName}` : ""}
                        </CardDescription>
                      </div>
                    </div>
                    {statusMeta && (
                      <Badge variant="outline" className={statusMeta.className}>
                        {backend.status === "connected" ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : backend.status === "needs_attention" || backend.status === "incompatible" ? (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        ) : null}
                        {statusMeta.label}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground text-xs mb-1">Version</p>
                        <p className="font-semibold">{backend.backendVersion ?? "Unknown"}</p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground text-xs mb-1">Last seen</p>
                        <p className="font-semibold">
                          {backend.lastSeenAt ? new Date(backend.lastSeenAt).toLocaleString() : "—"}
                        </p>
                      </div>
                    </div>
                    {backend.lastError && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        {backend.lastError}
                      </div>
                    )}
                    <div className="rounded-lg border p-3 text-sm">
                      <p className="text-muted-foreground text-xs mb-1">Meta webhook URL (paste in your Meta app dashboard)</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 truncate bg-muted px-2 py-1 rounded text-xs">
                          {backend.backendUrl}/webhooks/instagram
                        </code>
                        <Button variant="outline" size="sm" onClick={copyWebhookUrl}>
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                      </div>
                    </div>
                    <div className="rounded-lg border p-3 text-sm">
                      <p className="text-muted-foreground text-xs mb-1">Uptime monitor (optional, for sleeping free tiers)</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 truncate bg-muted px-2 py-1 rounded text-xs">
                          {backend.backendUrl}/health
                        </code>
                        <Button variant="outline" size="sm" onClick={copyMonitorUrl}>
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Add this URL to UptimeRobot (HTTP monitor, 5-min interval). Only needed if your
                        provider sleeps idle services — and note a 24/7 ping consumes Render&apos;s 750h
                        monthly free budget, so enable it only if you actually see missed events.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleVerify} disabled={verifying}>
                        {verifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                        Verify &amp; Sync
                      </Button>
                      <Button variant="destructive" onClick={() => setConfirmDisconnect(true)}>
                        <Unplug className="h-4 w-4 mr-2" /> Disconnect
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* AI provider (optional) — keys live only on the customer backend */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}>
            <Card className="shadow-md mb-6">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-md">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">AI Provider — optional</CardTitle>
                    <CardDescription>
                      {liveStatus !== null && liveStatus !== "error"
                        ? `Using ${liveStatus.ai.provider}${liveStatus.ai.configured ? ` (${liveStatus.ai.model})` : " — key missing"}`
                        : "Keyword-only automation works without any AI"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <ol className="list-decimal list-inside space-y-2">
                  <li>
                    On your backend, set <code>AI_PROVIDER=openai</code> or <code>gemini</code> plus the
                    matching key (<code>OPENAI_API_KEY</code> / <code>GEMINI_API_KEY</code>) and model, then redeploy/restart.
                  </li>
                  <li>Per automation, enable “AI-generated reply” in Flows and add instructions.</li>
                  <li>Keyword-only flows never call AI — no cost, no key needed.</li>
                </ol>
                <div className="flex items-start gap-2 text-xs">
                  <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>API keys stay in your backend environment. They are never shown here and never pass through Chat Flow AI.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Not connected: mode picker + guide + form */}
          {!backend && (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <Card
                    className={`cursor-pointer transition-colors ${mode === "managed" ? "border-blue-500 shadow-md" : "hover:border-slate-300"}`}
                    onClick={() => setMode("managed")}
                  >
                    <CardHeader>
                      <CardTitle className="text-base">Guided setup — Recommended</CardTitle>
                      <CardDescription>Pick a provider, follow the steps, then connect. About 10 minutes.</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card
                    className={`cursor-pointer transition-colors ${mode === "byo" ? "border-blue-500 shadow-md" : "hover:border-slate-300"}`}
                    onClick={() => setMode("byo")}
                  >
                    <CardHeader>
                      <CardTitle className="text-base">I already have a URL</CardTitle>
                      <CardDescription>Your backend is deployed — paste the URL and token to connect.</CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </motion.div>

              {mode === "managed" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {providers.map((p) => (
                      <Card
                        key={p.id}
                        className={`cursor-pointer transition-colors ${p.id === selected.id ? "border-blue-500 shadow-md" : "hover:border-slate-300"}`}
                        onClick={() => setProviderId(p.id)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            {p.id === selected.id && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                            {p.name}
                          </CardTitle>
                          <CardDescription className="text-xs">{p.tagline}</CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>

                  <Card className="shadow-md bg-muted/50 mb-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Deploy on {selected.name}</CardTitle>
                      <CardDescription>{selected.bestFor}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="rounded-lg border bg-card p-3">
                          <p className="font-semibold text-foreground mb-1">Database</p>
                          <p>{selected.postgres}</p>
                        </div>
                        <div className="rounded-lg border bg-card p-3">
                          <p className="font-semibold text-foreground mb-1">Sleep behavior</p>
                          <p>{selected.sleeps}</p>
                        </div>
                        <div className="rounded-lg border bg-card p-3">
                          <p className="font-semibold text-foreground mb-1">Cost</p>
                          <p>{selected.cost}</p>
                        </div>
                      </div>
                      <ol className="list-decimal list-inside space-y-2">
                        {selected.steps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                      <div>
                        <p className="font-semibold text-foreground mb-2">Env vars to set</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selected.envVars.map((v) => (
                            <code key={v} className="bg-card border rounded px-2 py-0.5 text-xs">{v}</code>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selected.links.map((l) => (
                          <Button key={l.url} variant="outline" size="sm" asChild>
                            <a href={l.url} target="_blank" rel="noreferrer">
                              {l.label} <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                <Card className="shadow-md mb-6">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center shadow-md">
                        <ServerOff className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          {mode === "managed" ? "Deployed? Connect it here" : "Connect your backend"}
                        </CardTitle>
                        <CardDescription>Bring your own infrastructure — secrets stay yours.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {backend === undefined ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Checking backend status…
                      </div>
                    ) : (
                      connectForm
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}

      <AlertDialog open={confirmDisconnect} onOpenChange={setConfirmDisconnect}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect backend?</AlertDialogTitle>
            <AlertDialogDescription>
              Automation will fall back to central execution for any stored tokens. Tokens already
              handed to your backend stay there until rotated — disconnect cannot pull secrets back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect}>Disconnect</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
