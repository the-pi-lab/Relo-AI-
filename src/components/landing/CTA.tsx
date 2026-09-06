import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";

export function CTA() {
  const navigate = useNavigate();

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="rounded-3xl bg-white p-8 md:p-16 text-center relative overflow-hidden shadow-xl border border-slate-200">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-100 rounded-full blur-3xl -translate-y-1/2" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-100 rounded-full blur-3xl translate-y-1/2" />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-slate-900">
                Ready to Automate Your Business?
              </h2>
              <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
                Join thousands of businesses using ChatFlow AI to scale their social commerce and improve customer satisfaction.
              </p>
              <div className="flex flex-col items-center gap-6">
                <Button
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="h-14 px-8 text-lg rounded-full bg-sky-600 text-white hover:bg-sky-700 border-0 hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-sm text-slate-500 font-medium">
                  No credit card required • 14-day free trial
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
