import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Bot, MessageSquare, Package, Zap, BarChart3, Globe, Shield, Users } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "Smart Automation",
    description: "Trigger flows from comments, DMs, and story mentions automatically.",
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50"
  },
  {
    icon: MessageSquare,
    title: "Unified Inbox",
    description: "Manage Instagram and WhatsApp conversations in one seamless interface.",
    color: "from-sky-500 to-pink-500",
    bg: "bg-sky-50"
  },
  {
    icon: Package,
    title: "Product Catalogs",
    description: "Showcase and sell products directly within the chat interface.",
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-50"
  },
  {
    icon: Zap,
    title: "Instant Broadcasts",
    description: "Send targeted campaigns to your audience with high open rates.",
    color: "from-green-500 to-emerald-500",
    bg: "bg-green-50"
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    description: "Track engagement, conversion rates, and team performance.",
    color: "from-sky-500 to-blue-500",
    bg: "bg-sky-50"
  },
  {
    icon: Globe,
    title: "Multi-Language",
    description: "Auto-translate conversations to support customers globally.",
    color: "from-rose-500 to-red-500",
    bg: "bg-rose-50"
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade encryption and role-based access control.",
    color: "from-slate-500 to-gray-500",
    bg: "bg-slate-50"
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Assign conversations and manage support tickets efficiently.",
    color: "from-teal-500 to-green-500",
    bg: "bg-teal-50"
  }
];

export function Features() {
  return (
    <section className="py-24 bg-slate-50/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-slate-900">
            Everything You Need to Scale
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Powerful features designed to help you automate, manage, and grow your social commerce business.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group overflow-hidden relative">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full ${feature.bg} opacity-0 group-hover:opacity-50 transition-opacity blur-2xl`} />
                
                <CardHeader>
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">{feature.title}</CardTitle>
                  <CardDescription className="text-base text-slate-600 mt-2">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}