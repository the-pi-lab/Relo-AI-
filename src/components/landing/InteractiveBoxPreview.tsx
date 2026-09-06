import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageCircle, ExternalLink, UserPlus, Heart, Send } from "lucide-react";

export function InteractiveBoxPreview() {
  const [buttonCount, setButtonCount] = useState<1 | 2 | 3>(3);
  const [followGate, setFollowGate] = useState<boolean>(false);
  const [isFollower, setIsFollower] = useState<boolean>(true);
  const [userComment, setUserComment] = useState<string>("PROMPT");

  return (
    <section id="interactive-demo" className="relative py-28 md:py-36 overflow-hidden bg-white">
      {/* Daylight Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-sky-400/10 via-emerald-400/15 to-blue-400/10 blur-[130px] pointer-events-none -z-10 rounded-full" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Interactive Simulator</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-5">
            Test The Official &ldquo;Custom Box&rdquo; In Action
          </h2>
          <p className="text-slate-600 text-base sm:text-lg font-medium">
            See exactly how your audience experiences your high-converting Instagram Interactive Cards.
          </p>
        </div>

        {/* Demo Playground Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Controls Column (Left) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-lg">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-blue-600" />
                <span>Simulate Automation Settings</span>
              </h3>

              {/* Keyword Config */}
              <div className="space-y-2 mb-6">
                <label className="text-xs font-bold text-slate-700">
                  Target Keyword to Trigger:
                </label>
                <div className="flex gap-2">
                  {["PROMPT", "GUIDE", "WORKSHOP", "VIP"].map((kw) => (
                    <button
                      key={kw}
                      onClick={() => setUserComment(kw)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        userComment === kw
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Action Buttons */}
              <div className="space-y-2 mb-6">
                <label className="text-xs font-bold text-slate-700">
                  Number of Interactive Buttons (1 to 3):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      onClick={() => setButtonCount(num as 1 | 2 | 3)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        buttonCount === num
                          ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {num} {num === 1 ? "Button" : "Buttons"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Follow-Gate Toggle */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Require Follow (Follow-Gate)</span>
                    <span className="text-[11px] text-slate-500 font-medium">Prompt non-followers to follow before link</span>
                  </div>
                  <button
                    onClick={() => {
                      setFollowGate(!followGate);
                      if (!followGate) setIsFollower(false);
                      else setIsFollower(true);
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      followGate ? "bg-blue-600" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        followGate ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {followGate && (
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-bold">Commenter Follow Status:</span>
                    <button
                      onClick={() => setIsFollower(!isFollower)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                        isFollower
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                          : "bg-amber-50 text-amber-700 border border-amber-300"
                      }`}
                    >
                      {isFollower ? "Following ✅" : "Not Following ❌"}
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Mobile Screen Simulator (Right) */}
          <div className="lg:col-span-7 flex justify-center">
            
            {/* Ceramic & Titanium Phone Frame */}
            <div className="w-full max-w-[340px] rounded-[44px] p-3 bg-gradient-to-b from-slate-200 via-slate-100 to-slate-200 border-4 border-slate-300 shadow-[0_25px_60px_rgba(0,0,0,0.12)]">
              
              {/* Screen Interior: Clean Light Instagram DM */}
              <div className="w-full min-h-[540px] rounded-[34px] bg-white flex flex-col justify-between overflow-hidden border border-slate-200 relative">
                
                {/* Instagram DM Header */}
                <div className="px-4 py-3 bg-white/95 backdrop-blur-md border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-emerald-400 p-[1px]">
                      <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-[10px] font-bold text-blue-600">
                        CF
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900 leading-tight">Chat Flow AI</span>
                      <span className="text-[9px] text-emerald-600 font-bold">Active now</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Heart className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Chat Messages Body */}
                <div className="p-4 space-y-4 overflow-y-auto flex-1 bg-slate-50/50">
                  
                  {/* Timestamp */}
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 font-semibold">Today • 4:20 PM</span>
                  </div>

                  {/* Comment Trigger Simulation Banner */}
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-center shadow-xs">
                    <span className="text-[10px] text-slate-600 font-medium">
                      User commented: <strong className="text-slate-900 font-bold">&ldquo;{userComment}&rdquo;</strong> on your Reel
                    </span>
                  </div>

                  {/* Case 1: Follow-Gate Triggered for Non-Follower */}
                  {followGate && !isFollower ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 rounded-2xl rounded-tl-sm bg-blue-50 border border-blue-200 text-xs text-slate-900 max-w-[85%] shadow-sm"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-blue-700 mb-1">
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Almost there!</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mb-2.5 leading-relaxed font-medium">
                        Thanks for commenting! Please follow <strong className="text-slate-900">@chatflow_ai</strong> first, then comment again and I&apos;ll send your exclusive link right over! 🔥
                      </p>
                      <button
                        onClick={() => setIsFollower(true)}
                        className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-[11px] font-bold text-white shadow-sm transition-all text-center"
                      >
                        Click here once followed 👆
                      </button>
                    </motion.div>
                  ) : (
                    /* Case 2: The Official Interactive Button Card ("Custom Box") */
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-2xl rounded-tl-sm bg-white border border-slate-200 overflow-hidden shadow-md max-w-[92%]"
                      >
                        {/* Card Image Banner */}
                        <div className="h-24 bg-gradient-to-br from-blue-600 via-sky-600 to-emerald-500 relative flex items-center justify-center p-3 text-center">
                          <span className="text-xs font-black text-white uppercase tracking-wider drop-shadow-sm">
                            2026 INSTAGRAM MASTERCLASS
                          </span>
                          <span className="absolute bottom-1 right-2 text-[8px] bg-white/90 border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-mono font-bold">
                            FREE
                          </span>
                        </div>

                        {/* Card Text Content */}
                        <div className="p-3">
                          <h4 className="text-xs font-bold text-slate-900 mb-1">
                            Here is your {userComment} Access Link! 🚀
                          </h4>
                          <p className="text-[10px] text-slate-500 leading-tight font-medium">
                            Tap the button below to claim your free templates, guides, and bonuses.
                          </p>
                        </div>

                        {/* Interactive Buttons Stack */}
                        <div className="p-2 pt-0 space-y-1.5">
                          
                          {/* Button 1 */}
                          <div className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-bold text-[11px] text-center flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
                            <span>👉 Open Masterclass Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>

                          {/* Button 2 */}
                          {buttonCount >= 2 && (
                            <div className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] text-center flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200">
                              <span>🔥 Claim 50% Coupon</span>
                            </div>
                          )}

                          {/* Button 3 */}
                          {buttonCount >= 3 && (
                            <div className="w-full py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] text-center flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-200">
                              <span>💬 WhatsApp VIP Support</span>
                            </div>
                          )}

                        </div>

                      </motion.div>
                    </AnimatePresence>
                  )}

                </div>

                {/* Input Bar */}
                <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
                  <div className="flex-1 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] text-slate-400 font-medium">
                    Message…
                  </div>
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white">
                    <Send className="w-3.5 h-3.5" />
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
