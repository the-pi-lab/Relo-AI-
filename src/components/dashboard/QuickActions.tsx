import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ArrowRight, Instagram, Plus, Server } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";

const ACTIONS = [
  {
    title: "Create automation",
    description: "Trigger → conditions → DM, in about a minute",
    icon: Plus,
    path: "/flows",
  },
  {
    title: "Connect Instagram",
    description: "Authorize your Business or Creator account",
    icon: Instagram,
    path: "/integrations",
  },
  {
    title: "Connect backend",
    description: "Deploy once, then paste your URL and token",
    icon: Server,
    path: "/backend",
  },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {ACTIONS.map((action, index) => (
        <motion.div
          key={action.path}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: Math.min(index * 0.06, 0.2) }}
        >
          <Card
            className="cursor-pointer hover:border-foreground/25 transition-colors"
            onClick={() => navigate(action.path)}
          >
            <div className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <action.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  {action.title}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {action.description}
                </CardDescription>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
