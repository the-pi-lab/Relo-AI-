import { Server, ShieldCheck, Activity, Database, Cog } from "lucide-react";

/**
 * Honest architecture diagram: Meta → YOUR backend (3 layers) → DMs.
 * One Docker container plus Postgres — no central forwarder, no cluster
 * fiction. Deployable to Railway, Render, Fly.io, or any VPS.
 */
export function MultiBackendVisualizer() {
  return (
    <section id="multi-backend" className="relative py-28 md:py-36 overflow-hidden bg-slate-50/70 border-y border-slate-200">
      {/* Daylight Ambient Glow */}
      <div className="absolute top-1/3 left-1/3 w-[750px] h-[400px] bg-gradient-to-r from-sky-400/10 via-blue-400/15 to-emerald-400/15 blur-[140px] pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 mb-4 shadow-sm">
            <Cog className="w-3.5 h-3.5 text-blue-600" />
            <span>How It Runs</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-5">
            Your Backend Does the Work
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium">
            One container you own: webhooks in, deduplication and matching, queue, worker, DM out.
            Your tokens and keys <strong className="text-slate-900 font-bold">never leave your infrastructure</strong>.
          </p>
        </div>

        {/* Visual Network Architecture Diagram */}
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-xl relative">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Step 1: Meta Ingress */}
            <div className="lg:col-span-3 flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-emerald-400 p-[1px] mb-4 shadow-md">
                <div className="w-full h-full bg-white rounded-[15px] flex items-center justify-center font-black text-blue-600 text-xl">
                  IG
                </div>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Step 1: Event Source
              </span>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Meta Webhooks
              </h4>
              <p className="text-xs text-slate-600 font-medium">
                Someone comments or DMs. Meta delivers the event to your backend URL.
              </p>
            </div>

            {/* Middle: your backend */}
            <div className="lg:col-span-4 flex flex-col items-center text-center p-6 rounded-2xl bg-gradient-to-b from-blue-50 to-white border border-blue-200 shadow-md relative">
              <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-blue-600 text-[10px] font-extrabold text-white uppercase tracking-wider shadow-sm">
                You Own This
              </div>
              <div className="w-14 h-14 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center mb-4 text-blue-600">
                <Server className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                Your Backend
              </span>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Verify → Dedupe → Match → Queue
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Signature-checked, deduplicated, keyword-matched. Jobs run on Postgres — no Redis required, free-tier tuned.
              </p>
            </div>

            {/* Step 3: The 3 layers */}
            <div className="lg:col-span-5 space-y-3">

              {/* Layer 1 */}
              <div className="p-4 rounded-xl bg-white border border-sky-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Postgres</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">Your data</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Flows, jobs, dedupe ledger, DM logs</span>
                  </div>
                </div>
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>

              {/* Layer 2 */}
              <div className="p-4 rounded-xl bg-white border border-amber-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <Cog className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Queue + Worker</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">Embedded</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Backoff, retries, 750/hr rate guard</span>
                  </div>
                </div>
                <Activity className="w-4 h-4 text-blue-600" />
              </div>

              {/* Layer 3 */}
              <div className="p-4 rounded-xl bg-white border border-emerald-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">DM Sender + AI (optional)</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-800">BYO keys</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Official API sends, OpenAI/Gemini on your key</span>
                  </div>
                </div>
                <Activity className="w-4 h-4 text-slate-600" />
              </div>

            </div>

          </div>

          {/* Bottom Callout Banner */}
          <div className="mt-8 p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <span className="text-xs sm:text-sm text-slate-700 font-medium">
                <strong className="text-slate-900 font-bold">Irrelevant events never become jobs:</strong> 70 non-matching comments cost zero DM sends and zero AI calls.
              </span>
            </div>
            <span className="text-xs font-mono text-blue-700 font-bold shrink-0 px-3 py-1 rounded-lg bg-white border border-blue-200 shadow-sm">
              Measured: 9.3ms / webhook
            </span>
          </div>

        </div>

      </div>
    </section>
  );
}
