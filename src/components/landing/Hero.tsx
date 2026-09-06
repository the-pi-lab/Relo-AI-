import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Sparkles, PlayCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useRef } from "react";

export function Hero() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);

  return (
    <section ref={containerRef} className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      <motion.div 
        style={{ y }}
        className="container mx-auto px-4 text-center relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-blue-100 text-slate-600 text-sm font-medium mb-8 shadow-sm hover:bg-white transition-colors cursor-default"
        >
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span className="bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent font-bold">
            New: AI-Powered Automation Engine
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 text-slate-900 leading-tight"
        >
          Turn Conversations Into
          <br />
          <span className="bg-gradient-to-r from-blue-600 via-sky-600 to-sky-600 bg-clip-text text-transparent pb-2">
            Revenue Streams
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed"
        >
          Automate your Instagram & WhatsApp customer interactions with intelligent flows. 
          Scale your social commerce without losing the personal touch.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
        >
          <Button 
            size="lg" 
            onClick={() => navigate("/auth")} 
            className="h-14 px-8 text-lg rounded-full shadow-xl bg-sky-600 hover:bg-sky-700 text-white border-0 hover:scale-105 transition-all duration-300 hover:shadow-sky-600/25"
          >
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="h-14 px-8 text-lg rounded-full border-2 border-slate-200 bg-white/50 hover:bg-white hover:border-slate-300 text-slate-700 hover:scale-105 transition-all duration-300 backdrop-blur-sm"
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            View Demo
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500 mb-20"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Cancel anytime</span>
          </div>
        </motion.div>

        {/* Hero Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 100, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1, delay: 0.5, type: "spring", stiffness: 50 }}
          className="mx-auto max-w-6xl perspective-1000 relative"
        >
          {/* Floating Elements */}
          <motion.div 
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-12 top-1/4 z-20 hidden lg:block"
          >
            <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 max-w-[200px]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">New Order</div>
                  <div className="text-[10px] text-slate-500">Just now</div>
                </div>
              </div>
              <div className="text-xs text-slate-600">
                Order #2491 received from Instagram DM
              </div>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [10, -10, 10] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -right-12 top-1/3 z-20 hidden lg:block"
          >
            <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 max-w-[200px]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">AI Reply Sent</div>
                  <div className="text-[10px] text-slate-500">2 mins ago</div>
                </div>
              </div>
              <div className="text-xs text-slate-600">
                Automatically answered pricing query
              </div>
            </div>
          </motion.div>

          <div className="relative rounded-2xl border border-white/60 bg-white/60 backdrop-blur-xl p-2 shadow-2xl ring-1 ring-black/5">
            <div className="rounded-xl overflow-hidden bg-white shadow-inner border border-slate-200">
              <div className="h-12 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                </div>
                <div className="flex-1 text-center text-xs font-medium text-slate-400">ChatFlow Dashboard</div>
              </div>
              <div className="aspect-[16/9] bg-slate-50/50 p-8 grid grid-cols-12 gap-6">
                {/* Sidebar */}
                <div className="col-span-2 bg-white rounded-lg shadow-sm border border-slate-100 p-4 space-y-3 hidden md:block">
                  <div className="h-8 w-full bg-slate-100 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-slate-50 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-slate-50 rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-slate-50 rounded animate-pulse" />
                  <div className="mt-8 h-4 w-full bg-slate-50 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-slate-50 rounded animate-pulse" />
                </div>
                {/* Main Content */}
                <div className="col-span-12 md:col-span-10 space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 space-y-2">
                        <div className="h-4 w-1/3 bg-slate-100 rounded" />
                        <div className="h-8 w-1/2 bg-slate-200 rounded" />
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-slate-100 h-64 p-4 flex items-end justify-between gap-2">
                    {[40, 70, 45, 90, 65, 85, 55, 95, 75, 60, 80, 50].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        transition={{ duration: 1, delay: 0.5 + (i * 0.05) }}
                        viewport={{ once: true }}
                        className="w-full bg-gradient-to-t from-blue-600 to-sky-400 rounded-t-sm opacity-90 hover:opacity-100 transition-opacity"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}