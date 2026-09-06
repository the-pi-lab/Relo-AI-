import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { ArrowLeft, ArrowRight, Check, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { AiConfigSection } from "./AiConfigSection";
import { cn } from "@/lib/utils";

export interface BuilderReel {
  mediaId: string;
  caption?: string;
}

interface GuidedFlowBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reels?: BuilderReel[];
  defaultPostId?: string;
}

const STEPS = ["Trigger", "Conditions", "Action", "AI (optional)", "Review"] as const;

type TriggerKind = "instagram_comment" | "instagram_dm";

/**
 * Guided automation creation: Trigger → Conditions → Action → AI → Review.
 * Only offers what the customer backend actually executes (comment / DM
 * triggers). Plain language throughout — no infra concepts leak into the UI.
 */
export function GuidedFlowBuilder({ open, onOpenChange, reels, defaultPostId = "all" }: GuidedFlowBuilderProps) {
  const createFlow = useMutation(api.flows.create);
  const updateFlow = useMutation(api.flows.update);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<TriggerKind>("instagram_comment");
  const [keywords, setKeywords] = useState("");
  const [postId, setPostId] = useState<string>(defaultPostId);
  const [requireFollow, setRequireFollow] = useState(false);
  const [dmMessage, setDmMessage] = useState("");
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [saving, setSaving] = useState(false);

  // Fresh state on every open (incl. per-reel pre-fill).
  useEffect(() => {
    if (open) {
      setStep(0);
      setName("");
      setTrigger("instagram_comment");
      setKeywords("");
      setPostId(defaultPostId);
      setRequireFollow(false);
      setDmMessage("");
      setAiEnabled(false);
      setAiPrompt("");
      setSaving(false);
    }
  }, [open, defaultPostId]);

  const keywordList = keywords.split(",").map((k) => k.trim()).filter(Boolean);
  const stepValid =
    step === 0 ||
    (step === 1 && keywordList.length > 0) ||
    (step === 2 && dmMessage.trim().length > 0) ||
    step === 3 ||
    step === 4;

  const buildPayload = () => ({
    name: name.trim() || `Flow — ${keywordList.slice(0, 2).join(", ")}`,
    description: undefined as string | undefined,
    ai: { enabled: aiEnabled, prompt: aiPrompt.trim() || undefined },
    trigger: {
      type: trigger,
      keywords: keywordList,
      postId: trigger === "instagram_comment" && postId !== "all" ? postId : undefined,
      requireFollow,
    },
    actions: [{ type: "send_dm", config: { message: dmMessage.trim() } }],
  });

  const save = async (activate: boolean) => {
    setSaving(true);
    try {
      const id = await createFlow(buildPayload() as Parameters<typeof createFlow>[0]);
      if (activate) {
        try {
          await updateFlow({ id, status: "active" });
          toast.success("Automation created and activated!");
        } catch {
          toast.warning("Saved as draft — activation needs a free slot or lifetime license.");
        }
      } else {
        toast.success("Automation saved as draft.");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create automation.");
    } finally {
      setSaving(false);
    }
  };

  const triggerLabel = trigger === "instagram_comment" ? "Instagram comment" : "Instagram DM";
  const scopeLabel =
    trigger === "instagram_dm" ? "any DM" : postId === "all" ? "any post or reel" : "one specific post";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create automation</DialogTitle>
          <DialogDescription>Five quick steps — about a minute.</DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <ol className="flex items-center gap-1 py-2" aria-label="Progress">
          {STEPS.map((label, i) => (
            <li key={label} className="flex-1">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                className={cn(
                  "w-full rounded-md px-1 py-1.5 text-[11px] font-medium text-center transition-colors",
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                      ? "bg-muted text-foreground hover:bg-muted/70"
                      : "bg-muted/50 text-muted-foreground"
                )}
              >
                {i + 1}. {label}
              </button>
            </li>
          ))}
        </ol>

        <div className="py-2">
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">WHEN should this run?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTrigger("instagram_comment")}
                  className={cn(
                    "rounded-lg border p-4 text-left transition-colors",
                    trigger === "instagram_comment" ? "border-primary bg-primary/5" : "hover:border-muted-foreground/40"
                  )}
                >
                  <MessageCircle className="h-5 w-5 mb-2" />
                  <p className="font-medium text-sm">Instagram comment</p>
                  <p className="text-xs text-muted-foreground mt-1">Someone comments on your post or reel</p>
                </button>
                <button
                  type="button"
                  onClick={() => setTrigger("instagram_dm")}
                  className={cn(
                    "rounded-lg border p-4 text-left transition-colors",
                    trigger === "instagram_dm" ? "border-primary bg-primary/5" : "hover:border-muted-foreground/40"
                  )}
                >
                  <Send className="h-5 w-5 mb-2" />
                  <p className="font-medium text-sm">Instagram DM</p>
                  <p className="text-xs text-muted-foreground mt-1">Someone sends you a direct message</p>
                </button>
              </div>
              <div className="space-y-2 pt-1">
                <Label htmlFor="flow-name">Name it (optional)</Label>
                <Input
                  id="flow-name"
                  placeholder="e.g., Link giveaway"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium">IF the message matches…</p>
              <div className="space-y-2">
                <Label htmlFor="flow-keywords">Keywords (comma-separated) *</Label>
                <Input
                  id="flow-keywords"
                  placeholder="e.g., link, price, info"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Runs when the comment or DM contains any of these words.</p>
              </div>
              {trigger === "instagram_comment" && (
                <div className="space-y-2">
                  <Label>Which posts?</Label>
                  <Select value={postId} onValueChange={setPostId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All posts and reels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All posts and reels</SelectItem>
                      {reels?.map((reel) => (
                        <SelectItem key={reel.mediaId} value={reel.mediaId}>
                          {(reel.caption ?? "Untitled").substring(0, 40)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(!reels || reels.length === 0) && (
                    <p className="text-xs text-muted-foreground">Sync reels on the Automations page to pick a specific post.</p>
                  )}
                </div>
              )}
              <div className="flex items-center space-x-2 border p-3 rounded-md bg-secondary/20">
                <Switch id="flow-follow" checked={requireFollow} onCheckedChange={setRequireFollow} />
                <div className="flex-1">
                  <Label htmlFor="flow-follow" className="font-medium cursor-pointer">Only for followers</Label>
                  <p className="text-xs text-muted-foreground">Others get a polite follow prompt first.</p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm font-medium">THEN send this DM…</p>
              <div className="space-y-2">
                <Label htmlFor="flow-message">DM message *</Label>
                <Textarea
                  id="flow-message"
                  placeholder="Hi {username}! Here's your link: https://…"
                  value={dmMessage}
                  onChange={(e) => setDmMessage(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{username}"} to greet them by name. Always required — it is also the fallback if AI fails.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Optionally, let AI write it…</p>
              <AiConfigSection
                enabled={aiEnabled}
                onEnabledChange={setAiEnabled}
                prompt={aiPrompt}
                onPromptChange={setAiPrompt}
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Review — does this look right?</p>
              <div className="rounded-lg border divide-y text-sm">
                <div className="p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">When</p>
                  <p className="font-medium">{triggerLabel} arrives</p>
                </div>
                <div className="p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">If</p>
                  <p className="font-medium">contains {keywordList.map((k) => `“${k}”`).join(", ")}</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    on {scopeLabel}
                    {requireFollow ? " · follower only" : ""}
                  </p>
                </div>
                <div className="p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">Then</p>
                  <p className="font-medium break-words">{aiEnabled ? "AI-generated reply" : dmMessage.trim()}</p>
                  {aiEnabled && <p className="text-muted-foreground text-xs mt-1">Falls back to your template message on AI failure.</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex w-full items-center justify-between gap-2">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {step < 4 ? (
              <Button disabled={!stepValid} onClick={() => setStep((s) => s + 1)}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" disabled={saving} onClick={() => void save(false)}>
                  Save draft
                </Button>
                <Button disabled={saving} onClick={() => void save(true)}>
                  <Check className="h-4 w-4 mr-1" /> Create & activate
                </Button>
              </div>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
