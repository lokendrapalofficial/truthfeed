"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Check, Award, Zap, Globe, Sliders, MessageSquare, Shield, CheckCircle } from "lucide-react";

export default function UpgradePage() {
  const freeFeatures = [
    "Standard news aggregator feeds",
    "Basic source credentials mapping",
    "Global category indexing",
    "Basic search and bookmark list",
  ];

  const proFeatures = [
    "Advanced fact-checking analytics (Consensus & Conflict scoring)",
    "AI-powered intelligence card briefings per article",
    "Multi-regional prioritization (India, US, UK, EU focus)",
    "Contribute and rate Community Notes",
    "Granular political bias filter tools",
    "Early access to next-gen NLP truth-synthesis models",
    "Priority fast RSS refresh queue",
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Newsroom</span>
          </Link>
          <span className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-widest font-mono flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-500 fill-amber-500/10" />
            Premium
          </span>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </nav>

      {/* Main Hero Header */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-850/30 px-3 py-1 rounded-full">
            TRUTHFEED PRO
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Elevate your information intelligence
          </h1>
          <p className="text-sm text-slate-550 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            Gain deep analysis, check cross-coverage consensus, and customize your newsroom feed priorities with our premium tier.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
          
          {/* Free Tier Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-750">
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Standard Desk</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Basic aggregations and search tool</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black font-mono">$0</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">/ forever</span>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-800/60" />
              <ul className="space-y-3">
                {freeFeatures.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-605 dark:text-slate-355">
                    <Check className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8">
              <Link
                href="/"
                className="block w-full text-center py-2.5 rounded-xl border border-slate-250 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                Current Plan
              </Link>
            </div>
          </div>

          {/* Pro Tier Card (Featured) */}
          <div className="bg-slate-900 dark:bg-slate-900 border-2 border-indigo-600 dark:border-indigo-550 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-lg relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 dark:bg-indigo-550/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* Popular Ribbon Tag */}
            <div className="absolute top-4 right-4 bg-indigo-600 dark:bg-indigo-500 text-white font-mono font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
              Popular Choice
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-lg font-bold text-white">Pro Intelligence</h2>
                  <Zap className="h-4 w-4 text-amber-450 fill-amber-450/10" />
                </div>
                <p className="text-xs text-slate-400">Advanced analysis and fact-checking power</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black font-mono text-white">$12</span>
                <span className="text-xs text-slate-400 font-medium">/ month</span>
              </div>
              <div className="h-px bg-slate-800" />
              <ul className="space-y-3">
                {proFeatures.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle className="h-4 w-4 text-indigo-400 fill-indigo-400/10 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8">
              <button
                type="button"
                onClick={() => alert("Thank you for your interest! Stripe billing integration will be available in the next release.")}
                className="w-full text-center py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer select-none"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>

        </div>

        {/* Feature Grid Briefing */}
        <div className="max-w-3xl mx-auto pt-10 space-y-6">
          <h3 className="text-center font-bold text-sm uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Why Upgrade?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="space-y-1.5 p-4">
              <div className="mx-auto h-9 w-9 bg-slate-100 dark:bg-slate-800/80 rounded-xl flex items-center justify-center text-indigo-500">
                <Globe className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-bold">Local Priorities</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Prioritize local regions (e.g. India news) in your main feed dashboard automatically.
              </p>
            </div>
            <div className="space-y-1.5 p-4">
              <div className="mx-auto h-9 w-9 bg-slate-100 dark:bg-slate-800/80 rounded-xl flex items-center justify-center text-indigo-500">
                <Sliders className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-bold">Consensus Ratings</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Quickly sort feeds by Verified bias or Conflict consensus scores.
              </p>
            </div>
            <div className="space-y-1.5 p-4">
              <div className="mx-auto h-9 w-9 bg-slate-100 dark:bg-slate-800/80 rounded-xl flex items-center justify-center text-indigo-500">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-bold">Fact Checking Desk</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Contribute community references to expose biased news headlines.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
