import React, { useState } from "react";
import {
  Smartphone,
  Send,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function InteractiveSimulator() {
  const [commentText, setCommentText] = useState("GUIDE");
  const [simState, setSimState] = useState<"idle" | "processing" | "replied" | "dm_sent">("idle");
  const [activeReply, setActiveReply] = useState("");
  const [clickedAction, setClickedAction] = useState<string | null>(null);

  const spintaxSamples = [
    "Sent to your DMs @visitor! Check your inbox now 🔥",
    "Just dispatched your free blueprint link to your DMs @visitor! 🚀",
    "@visitor check your messages, the complete guide is waiting! 🙌",
    "Sent! Let me know what you think of the frameworks @visitor 💡",
  ];

  const handleSimulate = (keywordOverride?: string) => {
    const kw = (keywordOverride || commentText).trim();
    if (!kw) return;

    setSimState("processing");
    setClickedAction(null);

    // 1. Simulate fast webhook ACK & 400ms Spintax generation
    setTimeout(() => {
      const randomReply = spintaxSamples[Math.floor(Math.random() * spintaxSamples.length)];
      setActiveReply(randomReply);
      setSimState("replied");

      // 2. Simulate private DM dispatch with 3-button Generic Template card
      setTimeout(() => {
        setSimState("dm_sent");
      }, 700);
    }, 600);
  };

  const handleActionClick = (actionName: string) => {
    setClickedAction(actionName);
    setTimeout(() => {
      setClickedAction(null);
    }, 3000);
  };

  const handleReset = () => {
    setSimState("idle");
    setActiveReply("");
    setClickedAction(null);
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto font-sans">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-mono font-bold tracking-wide uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          Interactive Live Simulator
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Experience the Inflow Pipeline in Action
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-medium mt-2">
          Try it live: Comment a trigger keyword below and watch the edge engine verify,
          rotate Spintax comment replies, and deliver official 3-button template cards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-xl shadow-slate-200/60">
        {/* Left Column: Reel & Interactive Comment Box */}
        <div className="lg:col-span-6 space-y-6">
          {/* Mock Instagram Reel Card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 flex items-center justify-between border-b border-slate-200/80 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-emerald-400 p-[1px]">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-bold text-xs text-slate-800">
                    RL
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    relo_creator
                    <CheckCircle2 className="w-3 h-3 text-sky-600" />
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Original audio</span>
                </div>
              </div>

              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Active Reel
              </span>
            </div>

            {/* Video Thumbnail Preview */}
            <div className="relative aspect-[16/9] bg-slate-900 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80"
                alt="Instagram Reel"
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="text-xs font-semibold line-clamp-2 leading-relaxed">
                  How to scale your Instagram automations with zero recurring contact fees. Comment GUIDE for the free blueprint 👇
                </p>
              </div>
            </div>

            {/* Comment Section & Simulator Trigger */}
            <div className="p-4 bg-white border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold">Simulate Public Comment:</span>
                <span className="font-mono text-[11px] text-sky-600">Quick test chips:</span>
              </div>

              {/* Quick Keywords Chips */}
              <div className="flex flex-wrap gap-2">
                {["GUIDE", "SCALE", "BLUEPRINT", "VIP"].map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => {
                      setCommentText(kw);
                      handleSimulate(kw);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                      commentText === kw
                        ? "bg-sky-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    #{kw}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value.toUpperCase())}
                  placeholder="Type comment (e.g. GUIDE)"
                  className="h-11 text-xs font-mono font-bold uppercase rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSimulate();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => handleSimulate()}
                  disabled={simState === "processing"}
                  className="h-11 px-5 rounded-xl font-bold bg-sky-600 hover:bg-sky-500 text-white shrink-0 shadow-sm shadow-sky-600/20 min-h-[44px]"
                >
                  {simState === "processing" ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-1.5" />
                      Post Comment
                    </>
                  )}
                </Button>
              </div>

              {/* Simulation Status Feed */}
              {simState !== "idle" && (
                <div role="status" aria-live="polite" className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-bold">Edge Pipeline Demo:</span>
                    <span className="font-mono text-slate-500">Live Simulation</span>
                  </div>

                  {activeReply && (
                    <div className="text-slate-800 font-mono text-[11px] bg-white p-2 rounded border border-slate-200/80">
                      💬 <span className="font-bold text-sky-600">@relo_creator:</span> {activeReply}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Follow-Gate Verification Active
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg px-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Demo
            </button>
          </div>
        </div>

        {/* Right Column: Pixel-Accurate Mobile Instagram Phone Viewport */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-[320px] bg-slate-900 text-white rounded-[2.5rem] p-3 shadow-2xl border-4 border-slate-800">
            {/* Phone Speaker Notch */}
            <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3" />

            {/* Instagram Header */}
            <div className="flex items-center gap-2 px-2 pb-3 border-b border-slate-800 text-xs">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-400 to-emerald-400 flex items-center justify-center font-bold text-[10px] text-slate-950">
                CF
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-100 flex items-center gap-1">
                  relo_creator
                  <CheckCircle2 className="w-3 h-3 text-sky-400" />
                </span>
                <span className="text-[9px] text-slate-400 font-sans">Active now</span>
              </div>
            </div>

            {/* Chat Thread Simulator */}
            <div className="py-4 space-y-3 min-h-[380px] flex flex-col justify-end">
              {simState === "idle" && (
                <div className="text-center py-16 text-slate-500 space-y-2">
                  <Smartphone className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs font-medium">
                    Type a comment on the left to trigger the live DM automation flow.
                  </p>
                </div>
              )}

              {simState === "processing" && (
                <div role="status" aria-live="polite" className="flex items-center gap-2 p-3 bg-slate-800/80 rounded-2xl text-xs text-slate-300 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                  <span>Processing comment & anti-spam jitter...</span>
                </div>
              )}

              {(simState === "replied" || simState === "dm_sent") && (
                <div className="space-y-3 transition-all duration-500">
                  {/* Follow Gate Badge */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-[10px] text-emerald-300">
                    <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Follower Verified ✓ Unlocking Private Asset</span>
                  </div>

                  {/* 3-Button Generic Template Card */}
                  <div className="w-full bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-300">
                    {/* Card Thumbnail */}
                    <div className="aspect-[1.91/1] w-full bg-slate-950 overflow-hidden relative">
                      <img
                        src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80"
                        alt="Template Card"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono text-white">
                        Blueprint VIP
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-3 text-left">
                      <h4 className="font-bold text-xs text-white leading-snug">
                        2026 Instagram Growth Playbook
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-normal">
                        Your requested viral templates, edge automation formulas, and private community invite.
                      </p>
                    </div>

                    {/* 3 Official Action Buttons (WCAG AA focusable buttons with min touch target) */}
                    <div className="border-t border-slate-700/80 divide-y divide-slate-700/80">
                      <button
                        type="button"
                        onClick={() => handleActionClick("Download PDF Blueprint")}
                        className="w-full py-2.5 px-3 text-center text-xs font-bold text-sky-400 hover:bg-slate-700/50 focus-visible:bg-slate-700/60 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none transition-colors flex items-center justify-center min-h-[44px]"
                      >
                        {clickedAction === "Download PDF Blueprint" ? "✓ Opening PDF Link (Demo)" : "Download PDF Blueprint"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleActionClick("Watch Walkthrough Video")}
                        className="w-full py-2.5 px-3 text-center text-xs font-bold text-sky-400 hover:bg-slate-700/50 focus-visible:bg-slate-700/60 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none transition-colors flex items-center justify-center min-h-[44px]"
                      >
                        {clickedAction === "Watch Walkthrough Video" ? "✓ Loading Video (Demo)" : "Watch Walkthrough Video"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleActionClick("Join VIP Creator Circle")}
                        className="w-full py-2.5 px-3 text-center text-xs font-bold text-sky-400 hover:bg-slate-700/50 focus-visible:bg-slate-700/60 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none transition-colors flex items-center justify-center min-h-[44px]"
                      >
                        {clickedAction === "Join VIP Creator Circle" ? "✓ Redirecting (Demo)" : "Join VIP Creator Circle"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Phone Home Bar */}
            <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-2" />
          </div>
        </div>
      </div>
    </section>
  );
}
