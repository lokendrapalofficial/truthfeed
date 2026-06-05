"use client";

import React, { useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { X, Loader2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();

  if (!isOpen) return null;

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const { error: oAuthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oAuthError) {
        setError(oAuthError.message);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/50 transition-all duration-300">
      <div className="relative max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-8 transition-colors duration-300 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
              <span className="text-2xl">✅</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-serif">
              Briefing Dispatched
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Intelligence Briefing link sent. Check your email.
            </p>
            <button
              onClick={() => {
                setSuccess(false);
                setEmail("");
                onClose();
              }}
              className="mt-4 px-6 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Access TruthFeed Intelligence
              </h2>
              <p className="text-sm text-slate-555 dark:text-slate-400">
                Enter your email to receive your daily Intelligence Briefing.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-1.5 relative">
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm placeholder-slate-400 outline-none focus:border-slate-400 dark:focus:border-slate-650 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 transition-all duration-200 text-slate-900 dark:text-slate-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full h-11 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Check your inbox...</span>
                  </>
                ) : (
                  <span>Send Magic Link</span>
                )}
              </button>
            </form>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-x-0 border-t border-slate-200 dark:border-slate-800" />
              <span className="relative px-3 bg-white dark:bg-slate-900 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                OR
              </span>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {/* Google Icon SVG */}
              <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 0 12 0 7.35 0 3.37 2.67 1.42 6.56l3.86 3C6.2 6.84 8.87 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.03 3.67-5.02 3.67-8.64z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.28c-.24-.72-.38-1.48-.38-2.28s.14-1.56.38-2.28L1.42 6.72C.51 8.54 0 10.59 0 12.72s.51 4.18 1.42 6l3.86-3z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.76-2.91c-1.04.7-2.38 1.12-4.17 1.12-3.13 0-5.8-1.8-6.75-4.52l-3.86 3C3.37 21.33 7.35 24 12 24z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
