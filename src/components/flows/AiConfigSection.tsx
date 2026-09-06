import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface AiConfigSectionProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  prompt: string;
  onPromptChange: (prompt: string) => void;
}

/**
 * Per-flow AI toggle. AI is strictly optional: keyword-only flows work
 * without any provider. When enabled, the customer's backend generates the
 * reply with THEIR provider/key (set as backend env vars — keys never pass
 * through this UI), falling back to the template message on AI failure.
 */
export function AiConfigSection({ enabled, onEnabledChange, prompt, onPromptChange }: AiConfigSectionProps) {
  return (
    <div className="space-y-3 border p-3 rounded-md bg-secondary/20">
      <div className="flex items-center space-x-2">
        <Switch id="ai-enabled" checked={enabled} onCheckedChange={onEnabledChange} />
        <div className="flex-1">
          <Label htmlFor="ai-enabled" className="font-medium cursor-pointer">
            AI-generated reply (optional)
          </Label>
          <p className="text-xs text-muted-foreground">
            Requires a provider key on your backend. Off = template message only, no AI cost.
          </p>
        </div>
      </div>
      {enabled && (
        <div className="space-y-2">
          <Label htmlFor="ai-prompt">AI instructions</Label>
          <Textarea
            id="ai-prompt"
            placeholder="e.g., Reply warmly in Hinglish, mention the 20% launch discount, keep it under 3 sentences."
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            rows={3}
            maxLength={2000}
          />
          <p className="text-xs text-muted-foreground">
            If AI fails, the template DM message is sent instead — never a failed delivery.
          </p>
        </div>
      )}
    </div>
  );
}
