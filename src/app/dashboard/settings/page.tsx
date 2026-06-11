"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, User, Mail, Globe, Award, FileText, LogOut, CheckCircle2 } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { getUserProfile, updateUserProfileSettings } from "@/app/actions/userActions";

const REGIONS = [
  { id: "GLOBAL", label: "Global" },
  { id: "US", label: "United States" },
  { id: "IN", label: "India" },
  { id: "UK", label: "United Kingdom" },
  { id: "EU", label: "Europe" },
];

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("GLOBAL");
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push("/");
          return;
        }

        const sUser = session.user;
        setUserId(sUser.id);
        setEmail(sUser.email || "");

        // Fetch custom profile settings from DB
        const res = await getUserProfile(sUser.id);
        if (res.success && res.user) {
          setName(res.user.name || sUser.user_metadata?.full_name || sUser.user_metadata?.name || "");
          setRegion(res.user.region || "GLOBAL");
          setIsPro(res.user.isPro || false);
        } else {
          setName(sUser.user_metadata?.full_name || sUser.user_metadata?.name || "");
        }
      } catch (err: any) {
        console.error("Failed to load user settings:", err);
        setError("Could not retrieve profile information.");
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [supabase, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      // 1. Update database user record
      const dbRes = await updateUserProfileSettings(userId, name, region);
      
      // 2. Update Supabase User Metadata (optional, but keeps session display names in sync)
      await supabase.auth.updateUser({
        data: { full_name: name }
      });

      if (dbRes.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(dbRes.error || "Failed to update database profile settings.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  // Generate initials for avatar from name
  const getInitials = (userName: string) => {
    if (!userName) return "U";
    return userName
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
          <span className="text-sm font-mono text-slate-400">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/60 transition-colors duration-300">
      {/* Settings Navigation Header */}
      <nav className="border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Newsroom</span>
          </Link>
          <span className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-widest font-mono">
            Settings
          </span>
        </div>
      </nav>

      {/* Main Form Container */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Account Preferences
          </h1>
          <p className="text-xs text-slate-550 dark:text-slate-400">
            Configure your personal profile details and content prioritization.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900/40 rounded-xl text-xs text-rose-600 dark:text-rose-450">
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-600 dark:text-emerald-450 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Changes successfully saved to database.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Profile */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <User className="h-4.5 w-4.5 text-slate-450 dark:text-slate-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Profile Information
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
              {/* Initials Avatar */}
              <div className="h-16 w-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
                {getInitials(name)}
              </div>

              <div className="w-full space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:border-slate-350 dark:focus:border-slate-700 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      id="email"
                      value={email}
                      readOnly
                      disabled
                      className="w-full h-10 pl-3.5 pr-20 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/40 text-xs text-slate-500 cursor-not-allowed outline-none select-none"
                    />
                    <div className="absolute right-3 inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-150 dark:border-emerald-900 px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wide">
                      <span className="h-1 w-1 rounded-full bg-emerald-500" />
                      Verified
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Feed Preferences */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Globe className="h-4.5 w-4.5 text-slate-450 dark:text-slate-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Feed Preferences
              </h2>
            </div>

            <div className="space-y-2">
              <label htmlFor="region" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Primary Region Focus
              </label>
              <select
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:border-slate-350 dark:focus:border-slate-700 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 dark:text-slate-550 leading-relaxed pl-1">
                Prioritize news relevant to your selected region.
              </p>
            </div>
          </div>

          {/* Section 3: Subscription */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Award className="h-4.5 w-4.5 text-slate-450 dark:text-slate-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Subscription Plan
              </h2>
            </div>

            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850">
              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-150 dark:border-indigo-850/40 px-2 py-0.5 rounded-full">
                  {isPro ? "Pro Member" : "Free Plan"}
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-500 leading-relaxed pt-1">
                  {isPro ? "Full access to advanced fact-check filters & intelligence card briefings." : "Access standard compare-view reports and basic news feeds."}
                </p>
              </div>

              {!isPro && (
                <button
                  type="button"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 rounded-lg text-xs font-bold tracking-wide transition-all shadow-sm shrink-0 select-none cursor-pointer"
                >
                  Upgrade to Pro
                </button>
              )}
            </div>
          </div>

          {/* Section 4: Legal & Account */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <FileText className="h-4.5 w-4.5 text-slate-450 dark:text-slate-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Legal & Account Actions
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              <Link
                href="/terms"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-605 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors w-fit pl-1"
              >
                <FileText className="h-4 w-4 text-slate-400" />
                <span>Terms & Conditions</span>
              </Link>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/35 px-4 py-2.5 rounded-xl cursor-pointer w-full justify-center transition-all active:scale-98"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Sign Out of Account</span>
                </button>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl text-xs font-bold tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer min-w-[130px] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
