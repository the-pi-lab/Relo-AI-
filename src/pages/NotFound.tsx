import React from "react";
import { Link } from "react-router";
import { Home, Sparkles, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-sky-200 selection:text-sky-900 flex flex-col justify-between">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-500 p-[1px] shadow-sm">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-sky-600" />
            </div>
          </div>
          <span className="font-black text-lg tracking-tight text-slate-900">
            RELO <span className="text-sky-600">AI</span>
          </span>
        </Link>
      </header>

      {/* Main 404 Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 mb-2">
            <span className="font-black font-mono text-2xl">404</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Page Not Found
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              The page you are looking for does not exist, has been moved, or the link may be broken.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link to="/" className="w-full">
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl font-bold bg-white border-slate-200 hover:bg-slate-50 text-slate-700 min-h-[44px]"
              >
                <Home className="w-4 h-4 mr-1.5" />
                Return Home
              </Button>
            </Link>

            <Link to="/dashboard" className="w-full">
              <Button className="w-full h-11 rounded-xl font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-sm shadow-sky-600/20 min-h-[44px]">
                <LayoutDashboard className="w-4 h-4 mr-1.5" />
                Creator Studio
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/80 text-center text-xs text-slate-500">
        RELO • Official Meta Graph API v21.0
      </footer>
    </div>
  );
}
