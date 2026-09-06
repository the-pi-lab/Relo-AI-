import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Instagram, MessageSquare } from "lucide-react";

export function Integrations() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-slate-900">
            Seamless Integrations
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Connect your favorite platforms and manage everything from one dashboard.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="h-full border-0 shadow-xl bg-gradient-to-br from-white to-sky-50 overflow-hidden group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-600 via-pink-600 to-orange-500 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Instagram className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">Instagram</CardTitle>
                <CardDescription className="text-base text-slate-600 mt-2">
                  Auto-respond to comments, DMs, and story mentions. Turn engagement into sales with smart automation flows that work 24/7.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="h-full border-0 shadow-xl bg-gradient-to-br from-white to-green-50 overflow-hidden group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">WhatsApp Business</CardTitle>
                <CardDescription className="text-base text-slate-600 mt-2">
                  Automate customer support, send product catalogs, and manage orders directly through WhatsApp with official API integration.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
