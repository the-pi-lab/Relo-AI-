import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { Check, Zap, KeyRound, Shield } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Background } from "@/components/landing/Background";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

// One-time payment link (Gumroad/Stripe/etc). Unset in dev — the UI then
// directs users to redeem a key in Settings instead of faking a checkout.
const BUY_URL = import.meta.env.VITE_BUY_URL as string | undefined;

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleBuy = () => {
    if (BUY_URL) {
      window.open(BUY_URL, "_blank", "noopener");
      return;
    }
    toast.info("Checkout link is not configured yet — redeem your key in Settings.");
    navigate(isAuthenticated ? "/settings" : "/auth");
  };

  const plans = [
    {
      name: "Evaluation",
      price: "$0",
      period: "free forever",
      description: "Try the product on your own terms",
      icon: Zap,
      features: [
        "Instagram automation",
        "1 active automation flow",
        "Keyword + AI-ready flows",
        "Comment → DM automation",
        "Modest central limits",
        "Community support",
      ],
      cta: "Start Evaluating",
      popular: false,
      onCta: () => navigate("/auth"),
    },
    {
      name: "Lifetime License",
      price: "$10",
      period: "one-time",
      description: "Pay once, use forever",
      icon: KeyRound,
      features: [
        "Everything in Evaluation",
        "Unlimited active flows",
        "No central message caps",
        "Bring your own backend",
        "Bring your own AI keys",
        "Lifetime software updates",
      ],
      cta: "Get Lifetime Access",
      popular: true,
      onCta: handleBuy,
    },
  ];

  return (
    <div className="min-h-screen relative font-sans">
      <Background />
      <Navbar />

      <main className="pt-32 pb-20">
        <section className="container mx-auto px-4 text-center mb-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-slate-900">
              Pay Once, <span className="bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">Use Forever</span>
            </h1>
            <p className="text-xl text-slate-600 mb-6 leading-relaxed">
              No subscriptions. You bring your own backend and AI keys — we never bill you for infrastructure again.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-100 text-green-700 text-sm font-medium shadow-sm">
              <Shield className="h-4 w-4" />
              <span>100% Meta-Compliant & Safe Inbound-Only Automation</span>
            </div>
          </motion.div>
        </section>

        <section className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className={`h-full relative overflow-hidden transition-all duration-300 hover:-translate-y-2 flex flex-col ${
                  plan.popular
                    ? "border-2 border-sky-500 shadow-2xl shadow-sky-500/20 bg-white/90 backdrop-blur-xl"
                    : "border border-slate-200 shadow-xl hover:shadow-2xl bg-white/80 backdrop-blur-lg"
                }`}>
                  {plan.popular && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-gradient-to-l from-sky-600 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                        BEST VALUE
                      </div>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-sky-100 text-sky-600">
                      <plan.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">{plan.name}</CardTitle>
                    <CardDescription className="text-slate-500">{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col pt-0">
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                        <span className="text-slate-500 text-sm font-medium">/ {plan.period}</span>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8 flex-1">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="mt-1 rounded-full p-0.5 bg-sky-100 text-sky-600">
                            <Check className="h-3 w-3" />
                          </div>
                          <span className="text-sm text-slate-600">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className={`w-full h-12 rounded-xl font-semibold shadow-lg transition-all duration-300 ${
                        plan.popular
                          ? "bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white border-0 hover:shadow-sky-500/25"
                          : "bg-white text-slate-900 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                      onClick={plan.onCta}
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm text-slate-500 mt-10 max-w-2xl mx-auto">
            Hosting, database, AI, and Meta API usage run on infrastructure you control and are
            billed by those providers — never by us, and never as a subscription.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
