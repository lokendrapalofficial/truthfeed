"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@/lib/supabase";
import { getUserProfile, updateUserPreferences } from "@/app/actions/userActions";
import { Loader2 } from "lucide-react";

const INTERESTS = [
  "Geopolitics",
  "Tech Markets",
  "Global Sports",
  "Macro Economics",
  "Climate Policy",
  "Cryptocurrency",
  "Entertainment & Arts",
  "Health Science",
  "World Affairs",
];

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function checkAuthAndProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/");
        return;
      }
      
      setUser(session.user);

      // Check if user already has preferences in db
      const res = await getUserProfile(session.user.id);
      if (res.success && res.user?.preferences) {
        const prefs = res.user.preferences as string[];
        if (prefs && prefs.length >= 3) {
          router.push("/");
          return;
        }
      }
      setLoading(false);
    }
    
    checkAuthAndProfile();
  }, [router]);

  const toggleInterest = (interest: string) => {
    if (selected.includes(interest)) {
      setSelected(selected.filter((item) => item !== interest));
    } else {
      setSelected([...selected, interest]);
    }
  };

  const handleInitialize = async () => {
    if (selected.length < 3 || !user) return;
    setSubmitting(true);

    const res = await updateUserPreferences(user.id, selected);
    if (res.success) {
      router.push("/");
    } else {
      alert(`Failed to save preferences: ${res.error}`);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
          <span className="text-sm font-mono text-slate-400">Loading your desk configuration...</span>
        </div>
      </div>
    );
  }

  const isButtonDisabled = selected.length < 3 || submitting;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-8 md:p-12 space-y-8 transition-colors duration-300 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-slate-100 leading-tight">
            Configure Your Intelligence Desk
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Select 3-5 topics to personalize your daily briefing.
          </p>
        </div>

        {/* Interests Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 py-4">
          {INTERESTS.map((interest) => {
            const isSelected = selected.includes(interest);
            return (
              <div
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-4 py-2.5 rounded-full border text-center text-xs font-semibold select-none cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-sm"
                    : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {interest}
              </div>
            );
          })}
        </div>

        {/* Action button & Selection counter */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-center">
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
              {selected.length} of 3 minimum selected
            </span>
          </div>

          <button
            onClick={handleInitialize}
            disabled={isButtonDisabled}
            className={`w-full h-12 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              isButtonDisabled
                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800 cursor-not-allowed"
                : "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 active:scale-98 shadow-md"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Configuring desk settings...</span>
              </>
            ) : (
              <span>Initialize My Desk</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
