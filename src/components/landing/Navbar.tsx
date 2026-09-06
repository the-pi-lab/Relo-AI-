import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";

export function Navbar() {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 bg-white/10 backdrop-blur-xl shadow-sm"
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/")}>
          <div className="transition-transform group-hover:scale-110 duration-300">
            <Logo size="md" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            ChatFlow AI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/about")} className="hidden md:flex hover:bg-white/20 text-slate-600 hover:text-slate-900">
            About
          </Button>
          <Button variant="ghost" onClick={() => navigate("/pricing")} className="hidden md:flex hover:bg-white/20 text-slate-600 hover:text-slate-900">
            Pricing
          </Button>
          <Button variant="ghost" onClick={() => navigate("/support")} className="hidden md:flex hover:bg-white/20 text-slate-600 hover:text-slate-900">
            Support
          </Button>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
          ) : isAuthenticated ? (
            <Button onClick={() => navigate("/dashboard")} className="shadow-lg bg-sky-600 hover:bg-sky-700 text-white transition-all hover:scale-105 hover:shadow-sky-600/20">
              Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate("/auth")} className="hidden sm:flex hover:bg-white/20 text-slate-600 hover:text-slate-900">
                Sign In
              </Button>
              <Button onClick={() => navigate("/auth")} className="shadow-lg bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white border-0 transition-all hover:scale-105 hover:shadow-blue-600/25">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}