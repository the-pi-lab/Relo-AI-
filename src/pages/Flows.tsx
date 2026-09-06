import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery, useAction } from "convex/react";
import { motion } from "framer-motion";
import {
  Bot,
  Loader2,
  Plus,
  RefreshCw,
  Video
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/state";
import { EmptyState } from "@/components/ui/state";
import { PageHeader } from "@/components/layout/PageHeader";
import { GuidedFlowBuilder } from "@/components/flows/GuidedFlowBuilder";
import { FlowCard } from "@/components/flows/FlowCard";

export default function Flows() {
  const { isLoading, isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();
  const flows = useQuery(api.flows.list);
  const reels = useQuery(api.media.listReels);
  const syncMedia = useAction(api.media.syncInstagramMedia);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefillPostId, setPrefillPostId] = useState("all");
  const [isSyncing, setIsSyncing] = useState(false);

  if (isLoading) {
    return <LoadingState message="Loading automations…" />;
  }

  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleSyncReels = async () => {
    setIsSyncing(true);
    try {
      await syncMedia();
      toast.success("Instagram reels synced successfully!");
    } catch {
      toast.error("Failed to sync reels. Make sure Instagram is connected.");
    } finally {
      setIsSyncing(false);
    }
  };

  const openBuilder = (postId = "all") => {
    setPrefillPostId(postId);
    setDialogOpen(true);
  };

  const getFlowsForReel = (postId: string) => {
    return flows?.filter((flow) => flow.trigger.postId === postId) || [];
  };

  return (
    <AppShell user={user ?? undefined} onSignOut={handleSignOut}>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PageHeader
            title="Automations"
            description="Comment-to-DM flows that run on your backend"
          />
        </motion.div>
        <Button onClick={() => openBuilder()}>
          <Plus className="h-4 w-4 mr-2" />
          Create automation
        </Button>
      </div>

      <GuidedFlowBuilder
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reels={reels ?? undefined}
        defaultPostId={prefillPostId}
      />

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All automations</TabsTrigger>
          <TabsTrigger value="reels">
            <Video className="h-4 w-4 mr-2" />
            Per-reel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {flows === undefined ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading automations…
            </div>
          ) : flows.length === 0 ? (
            <EmptyState
              icon={Bot}
              title="No automations yet"
              description="Create your first automation: pick a trigger, set keywords, write the DM. About a minute."
              action={
                <Button onClick={() => openBuilder()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first automation
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flows.map((flow, index) => (
                <FlowCard key={flow._id} flow={flow} index={index} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reels">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => void handleSyncReels()} disabled={isSyncing} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
              Sync Instagram reels
            </Button>
          </div>

          {!reels || reels.length === 0 ? (
            <EmptyState
              icon={Video}
              title="No reels found"
              description="Connect your Instagram account and sync your reels to scope automations to specific posts."
              action={
                <Button onClick={() => void handleSyncReels()} disabled={isSyncing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                  Sync reels
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reels.map((reel, index) => {
                const reelFlows = getFlowsForReel(reel.mediaId);
                return (
                  <motion.div
                    key={reel.mediaId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
                  >
                    <Card>
                      <CardContent className="pt-4">
                        <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-3">
                          {reel.thumbnailUrl ? (
                            <img
                              src={reel.thumbnailUrl}
                              alt={reel.caption}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <CardTitle className="text-sm mb-2 line-clamp-2">
                          {reel.caption || "No caption"}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                          <span>{reel.likeCount} likes</span>
                          <span>{reel.commentsCount} comments</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {reelFlows.length} automation{reelFlows.length !== 1 ? "s" : ""}
                            </span>
                            <Button size="sm" variant="outline" onClick={() => openBuilder(reel.mediaId)}>
                              <Plus className="h-3 w-3 mr-1" />
                              Add flow
                            </Button>
                          </div>
                          {reelFlows.length > 0 && (
                            <div className="space-y-1">
                              {reelFlows.map((flow) => (
                                <div
                                  key={flow._id}
                                  className="flex items-center justify-between p-2 rounded bg-muted/60 text-xs"
                                >
                                  <span className="truncate flex-1">{flow.name}</span>
                                  <Badge
                                    variant={flow.status === "active" ? "default" : "secondary"}
                                  >
                                    {flow.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
