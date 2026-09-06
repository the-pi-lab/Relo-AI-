import { Background } from "@/components/landing/Background";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function Changelog() {
  const changes = [
    {
      version: "v2.0.0",
      date: "October 24, 2023",
      title: "Major Platform Overhaul",
      type: "Major",
      items: [
        "Complete UI redesign with 3D elements",
        "Added WhatsApp Business API integration",
        "New Flow Builder with drag-and-drop interface",
        "Enhanced analytics dashboard"
      ]
    },
    {
      version: "v1.5.0",
      date: "September 15, 2023",
      title: "Performance Improvements",
      type: "Update",
      items: [
        "50% faster response times for AI agents",
        "Optimized database queries",
        "New team collaboration features",
        "Bug fixes for Instagram DM sync"
      ]
    },
    {
      version: "v1.0.0",
      date: "August 1, 2023",
      title: "Initial Launch",
      type: "Release",
      items: [
        "Public beta release",
        "Basic Instagram automation",
        "Email notifications",
        "User authentication system"
      ]
    }
  ];

  return (
    <div className="min-h-screen relative">
      <Background />
      <Navbar />
      <main className="pt-32 pb-16 container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1 text-sm border-blue-200 bg-blue-50 text-blue-700">
            Product Updates
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">
            Changelog
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Stay up to date with the latest improvements, features, and fixes.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          {changes.map((change, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-32 flex-shrink-0 pt-2">
                  <div className="text-sm font-semibold text-slate-500">{change.date}</div>
                  <div className="text-xs text-slate-400 mt-1">{change.version}</div>
                </div>
                <div className="flex-1 relative pb-8 border-l border-slate-200 pl-8 md:pl-12 last:border-0">
                  <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-blue-500 -translate-x-[6.5px] ring-4 ring-white" />
                  <Card className="border-slate-200/60 bg-white/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge variant={change.type === "Major" ? "default" : "secondary"}>
                          {change.type}
                        </Badge>
                        <h3 className="text-xl font-bold text-slate-900">{change.title}</h3>
                      </div>
                      <ul className="space-y-2">
                        {change.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-600">
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
