import { Play, Sparkles, Plus, CheckCircle2, MessageCircle, Heart, ExternalLink } from "lucide-react";
import type { InstagramReelMedia } from "@/types/contracts";

interface ReelsGridProps {
  reels: InstagramReelMedia[];
  isLoading: boolean;
  onSelectReel: (reel: InstagramReelMedia) => void;
}

export default function ReelsGrid({ reels, isLoading, onSelectReel }: ReelsGridProps) {
  if (isLoading) {
    return (
      <div className="st-grid" role="status" aria-label="Loading reels">
        {Array.from({ length: 8 }, (_, i) => (
          <div className="st-reel-skel" key={i}>
            <div className="st-skel" style={{ flex: 1, borderRadius: 12 }} />
            <div className="st-skel" style={{ width: "75%", height: 12 }} />
            <div className="st-skel" style={{ width: "45%", height: 12 }} />
          </div>
        ))}
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="st-card st-empty">
        <div className="st-empty__icon">
          <Play aria-hidden />
        </div>
        <h3>No recent Reels detected</h3>
        <p>
          Publish a new Instagram Reel from your connected account and it will appear here,
          ready for one-click comment-to-DM automation.
        </p>
      </div>
    );
  }

  return (
    <div className="st-grid">
      {reels.map((reel, i) => (
        <article className="st-card st-card--hover st-reel" key={reel.id} style={{ ["--i" as string]: String(i % 8) }}>
          <div className="st-reel__thumb">
            <img
              src={reel.thumbnailUrl || reel.mediaUrl}
              alt={reel.caption ? reel.caption.slice(0, 80) : "Instagram Reel"}
              loading="lazy"
              decoding="async"
            />
            <div className="st-reel__shade" aria-hidden />

            {reel.hasActiveAutomation ? (
              <span className="st-reel__badge st-reel__badge--on">
                <CheckCircle2 style={{ width: 12, height: 12 }} aria-hidden />
                Funnel live
              </span>
            ) : (
              <span className="st-reel__badge st-reel__badge--off">No automation</span>
            )}

            <a
              href={reel.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="st-reel__ext"
              title="View on Instagram"
              aria-label="View on Instagram"
            >
              <ExternalLink aria-hidden />
            </a>

            <div className="st-reel__metrics">
              <span>
                {reel.commentsCount !== undefined && (
                  <>
                    <MessageCircle aria-hidden />
                    {reel.commentsCount.toLocaleString()}
                  </>
                )}
                {reel.likeCount !== undefined && (
                  <>
                    <Heart aria-hidden />
                    {reel.likeCount.toLocaleString()}
                  </>
                )}
              </span>
              <time dateTime={reel.timestamp}>
                {new Date(reel.timestamp).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </div>
          </div>

          <div className="st-reel__body">
            <p className="st-reel__caption">{reel.caption || "Untitled Reel (no caption)"}</p>
            <button
              type="button"
              onClick={() => onSelectReel(reel)}
              className={`st-btn st-btn--sm st-btn--sheen ${
                reel.hasActiveAutomation ? "st-btn--ghost" : "st-btn--accent"
              }`}
            >
              {reel.hasActiveAutomation ? (
                <>
                  <Sparkles aria-hidden />
                  Edit Funnel
                </>
              ) : (
                <>
                  <Plus aria-hidden />
                  Automate Reel
                </>
              )}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
