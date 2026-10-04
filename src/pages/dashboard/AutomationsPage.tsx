import { useEffect } from "react";
import { AlertCircle, RefreshCw, Sliders, Plus } from "lucide-react";
import ReelsGrid from "@/components/dashboard/ReelsGrid";
import AutomationEditor from "@/components/dashboard/AutomationEditor";
import { useDashboard } from "./DashboardContext";

export default function AutomationsPage() {
  const {
    selectedAccountId,
    currentAccount,
    reels,
    isLoadingReels,
    reelsError,
    loadReels,
    selectedReel,
    editingAutomation,
    selectReelForAutomation,
    clearEditor,
    saveAutomation,
    deleteAutomation,
    isDemo,
  } = useDashboard();

  useEffect(() => {
    loadReels();
  }, [loadReels]);

  if (selectedReel) {
    return (
      <AutomationEditor
        reel={selectedReel}
        accountId={selectedAccountId}
        plan={currentAccount?.plan ?? "free"}
        existingAutomation={editingAutomation}
        onSave={saveAutomation}
        onDelete={editingAutomation ? deleteAutomation : undefined}
        onCancel={clearEditor}
      />
    );
  }

  return (
    <div className="pg-page">
      <div className="pg-head">
        <div>
          <span className="hm-eyebrow">Automations</span>
          <h1 className="hm-title">
            Pick a reel.
            <br />
            <em>Arm the funnel.</em>
          </h1>
          <p className="pg-sub">
            Your latest Reels, pulled live from Instagram. Click any card to configure keywords,
            Spintax replies, and your DM card.
          </p>
        </div>
        <button
          type="button"
          className="sh-btn sh-btn--ghost sh-btn--sheen"
          onClick={loadReels}
          disabled={isLoadingReels}
        >
          <RefreshCw
            size={15}
            style={isLoadingReels ? { animation: "spin 1.2s linear infinite" } : undefined}
            aria-hidden
          />
          Sync Reels
        </button>
      </div>

      {reelsError && (
        <div className="sh-alert" role="alert" style={{ marginBottom: 18 }}>
          <AlertCircle size={16} aria-hidden />
          <span>{reelsError}</span>
        </div>
      )}

      <ReelsGrid reels={reels} isLoading={isLoadingReels} onSelectReel={selectReelForAutomation} />

      {!isLoadingReels && reels.length === 0 && !reelsError && !isDemo && (
        <div className="st-card st-empty" style={{ marginTop: 20 }}>
          <div className="st-empty__icon">
            <Plus aria-hidden />
          </div>
          <h3>No reels yet</h3>
          <p>Publish a Reel on Instagram and it appears here, ready for automation.</p>
        </div>
      )}

      {!isDemo && (
        <p className="pg-note">
          <Sliders size={12} aria-hidden /> Free tier includes 1 automated reel for a lifetime —
          choose the reel you'll promote the most.
        </p>
      )}
    </div>
  );
}
