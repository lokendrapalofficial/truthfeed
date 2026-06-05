"use client";

import React from "react";

export default function DossierSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 select-none">
      {/* 1. Monospace terminal pulsing title */}
      <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-slate-400 dark:text-slate-500">
        <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping shrink-0" />
        <span className="animate-pulse">COMPILING INTELLIGENCE DOSSIER...</span>
      </div>

      {/* 2. Scorecard Skeleton */}
      <div className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl p-5 shadow-sm space-y-4 animate-pulse">
        {/* Verdict Bar */}
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-full" />
        
        {/* Grid outline */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-1">
          {/* Left Side */}
          <div className="md:col-span-6 space-y-3">
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
          </div>
          {/* Right Side */}
          <div className="md:col-span-6 space-y-4 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700/60 pt-4 md:pt-0 md:pl-5">
            <div className="space-y-2">
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full w-full" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Matrix Skeleton (Bloomberg-style outlet angle table) */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl p-5 mt-4 space-y-3.5 animate-pulse">
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-2" />
        <div className="divide-y divide-slate-200 dark:divide-slate-700/60">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-2 py-3.5 first:pt-0 last:pb-0">
              <div className="sm:col-span-1 h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
              <div className="sm:col-span-3 h-4 bg-slate-200 dark:bg-slate-800 rounded w-4/5" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. TL;DR Wire Skeleton (3 pulsing lines for 2-sentence paragraph) */}
      <div className="space-y-3 pt-4 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-850 rounded w-full" />
        <div className="h-4 bg-slate-200 dark:bg-slate-855 rounded w-11/12" />
        <div className="h-4 bg-slate-200 dark:bg-slate-850 rounded w-3/4" />
      </div>
    </div>
  );
}
