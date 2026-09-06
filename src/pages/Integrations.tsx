import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation, useAction } from "convex/react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Instagram,
  Unplug
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/state";
import { PageHeader } from "@/components/layout/PageHeader";
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
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

export default function Integrations() {
  const { isLoading, isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();
  const integrations = useQuery(api.integrations.list);
  const disconnect = useMutation(api.integrations.disconnect);
  const getAuthUrl = useAction(api.oauth.getAuthUrl);
  const backend = useQuery(api.backendRegistry.myBackendStatus);
  const [disconnectingId, setDisconnectingId] = useState<Id<"integrations"> | null>(null);

  if (isLoading) {
    return <LoadingState message="Loading integrations…" />;
  }

  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const instagramIntegration = integrations?.find(i => i.type === "instagram");

  // Instagram-only product (WhatsApp was removed in v2).
  const handleConnect = async () => {
    const platform = "instagram";
    // Open popup window immediately to prevent browser blocking
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      "",
      `${platform}_oauth`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
    );
    
    if (!popup) {
      toast.error("Popup blocked. Please allow popups for this site.");
      return;
    }

    popup.document.write(`
      <html>
        <head><title>Redirecting...</title></head>
        <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f2f5;">
          <div style="text-align: center;">
            <div style="margin-bottom: 16px; width: 24px; height: 24px; border: 3px solid #ccc; border-top-color: #000; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            <div>Initializing secure connection...</div>
          </div>
          <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        </body>
      </html>
    `);
    
    try {
      // Get the correct auth URL from backend (uses SITE_URL)
      const authUrl = await getAuthUrl({ platform });
      popup.location.href = authUrl;
    } catch (error) {
      popup.close();
      console.error("Failed to get auth URL:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to initialize connection. Check your environment variables."
      );
      return;
    }
    
    // Listen for OAuth callback
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "oauth-success" && event.data?.platform === platform) {
        if (backend?.status === "connected") {
          toast.success("Instagram connected — token handed to your backend.");
        } else {
          toast.success("Instagram connected! Connect your backend to run automation on your own infrastructure.");
        }
        window.removeEventListener("message", handleMessage);
        // Refresh integrations list
        window.location.reload();
      } else if (event.data?.type === "oauth-error" && event.data?.platform === platform) {
        toast.error(`Failed to connect ${platform}: ${event.data.error}`);
        window.removeEventListener("message", handleMessage);
      }
    };
    
    window.addEventListener("message", handleMessage);
    
    // Clean up listener after 5 minutes
    setTimeout(() => {
      window.removeEventListener("message", handleMessage);
    }, 5 * 60 * 1000);
  };

  const handleDisconnect = async (integrationId: Id<"integrations">, platform: string) => {
    try {
      await disconnect({ id: integrationId });
      toast.success(`${platform} disconnected successfully`);
      setDisconnectingId(null);
    } catch (error) {
      toast.error(`Failed to disconnect ${platform}`);
      console.error(error);
    }
  };

  return (
    <AppShell user={user ?? undefined} onSignOut={handleSignOut}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PageHeader
          title="Integrations"
          description="Connect your Instagram account to start automating"
        />
      </motion.div>
      <div className="mt-6">

        {/* Integration Cards */}
        <div className="space-y-4">
          {/* Instagram Integration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-pink-500 flex items-center justify-center shadow-md">
                      <Instagram className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Instagram</CardTitle>
                      <CardDescription>
                        Auto-respond to comments and DMs
                      </CardDescription>
                    </div>
                  </div>
                  {instagramIntegration?.isActive ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Not Connected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {instagramIntegration?.isActive ? (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Username:</strong> @{instagramIntegration.platformUsername || "N/A"}</p>
                      <p><strong>Account ID:</strong> {instagramIntegration.platformUserId}</p>
                    </div>
                    <Button 
                      variant="destructive" 
                      onClick={() => setDisconnectingId(instagramIntegration._id)}
                      className="w-full sm:w-auto"
                    >
                      <Unplug className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleConnect()}
                    className="w-full sm:w-auto"
                  >
                    <Instagram className="h-4 w-4 mr-2" />
                    Connect Instagram
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

        </div>

        {/* Setup Instructions */}
        {/* Help Section - Only show if user is having issues */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <Card className="shadow-md bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">How to Connect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Connecting your account:</h4>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Click the "Connect" button above for Instagram</li>
                  <li>Log in to your Facebook account (if not already logged in)</li>
                  <li>Select the Instagram Business Account you want to connect</li>
                  <li>Grant the required permissions</li>
                  <li>You'll be redirected back and your account will be connected!</li>
                </ol>
                <p className="mt-2">If you have connected your own backend, the token is handed to it automatically — nothing is stored centrally.</p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Requirements:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Instagram:</strong> Must be an Instagram Business or Creator account</li>
                  <li>Your account must be linked to a Facebook Page</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Having trouble?</h4>
                <p>If you're unable to connect, please ensure:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>You have admin access to the Facebook Page</li>
                  <li>Your Instagram account is converted to a Business account</li>
                  <li>Popups are enabled in your browser</li>
                  <li>You're logged into the correct Facebook account</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={!!disconnectingId} onOpenChange={() => setDisconnectingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Integration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop all automation flows using this integration. You can reconnect at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (disconnectingId) {
                  const integration = integrations?.find(i => i._id === disconnectingId);
                  handleDisconnect(disconnectingId, integration?.type || "integration");
                }
              }}
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}