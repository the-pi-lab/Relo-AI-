import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowRight, CheckCircle2, KeyRound, Mail, ShieldCheck, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugCode, setDebugCode] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await api.auth.sendOtp(email.trim());
      if (res.debugCode) {
        setDebugCode(res.debugCode);
        setCode(res.debugCode); // Auto-fill in dev mode
      }
      setStep("OTP");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send verification code. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.trim().length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await api.auth.verifyOtp(email.trim(), code.trim());
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get("redirect") || "/dashboard";
      navigate(redirect);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid or expired verification code. Please request a new one.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-sky-200 selection:text-sky-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-500 p-[1px] shadow-sm">
              <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-sky-600" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tight text-slate-900">
                RELO <span className="text-sky-600">AI</span>
              </span>
              <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 w-fit">
                Creator Studio
              </span>
            </div>
          </Link>
        </div>
        <h2 className="text-center text-2xl font-black tracking-tight text-slate-900">
          {step === "EMAIL" ? "Sign in to your Studio" : "Check your email"}
        </h2>
        <p className="mt-1.5 text-center text-sm text-slate-600 font-medium">
          {step === "EMAIL"
            ? "Passwordless access for verified creators"
            : `We sent a 6-digit verification code to ${email}`}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">
          {error && (
            <div role="alert" className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{error}</p>
              </div>
            </div>
          )}

          {debugCode && (
            <div className="mb-6 p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 font-mono flex items-center justify-between">
              <span>Dev Mode OTP Code:</span>
              <strong className="text-sky-700 text-sm">{debugCode}</strong>
            </div>
          )}

          {step === "EMAIL" ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label htmlFor="creator-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Creator Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <Input
                    id="creator-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="creator@yourbrand.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-sky-500 rounded-xl text-slate-900 font-medium"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 min-h-[44px]"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <>
                    Send Login Code
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label htmlFor="otp-code" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <Input
                    id="otp-code"
                    type="text"
                    required
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-sky-500 rounded-xl text-slate-900 font-mono text-center text-xl font-bold tracking-widest"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full h-11 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <>
                    Verify & Enter Studio
                    <CheckCircle2 className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep("EMAIL");
                    setCode("");
                    setError(null);
                  }}
                  className="text-slate-500 hover:text-slate-800 font-semibold transition-colors min-h-[36px]"
                >
                  ← Use different email
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setError(null);
                    setIsLoading(true);
                    try {
                      const res = await api.auth.sendOtp(email.trim());
                      if (res.debugCode) {
                        setDebugCode(res.debugCode);
                        setCode(res.debugCode);
                      }
                    } catch (err) {
                      const message = err instanceof Error ? err.message : "Failed to resend code.";
                      setError(message);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="text-sky-600 hover:text-sky-700 font-bold transition-colors min-h-[36px]"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Zero passwords. Industry-standard AES-256-GCM token encryption.
          </div>
        </div>
      </div>
    </div>
  );
}
