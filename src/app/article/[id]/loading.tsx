import React from "react";
import { ArrowLeft } from "lucide-react";

export default function ArticleLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300">
      
      {/* Mini Editorial Navbar Skeleton */}
      <nav className="border-b border-gray-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 dark:text-slate-600">
            <ArrowLeft className="h-4 w-4" />
            <span>Newsroom</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
            <div className="flex items-center gap-1.5 select-none">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-200 dark:bg-slate-800 text-transparent font-bold text-xs tracking-tight animate-pulse">
                T
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-300 dark:text-slate-700">
                TruthFeed
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Skeleton */}
      <main className="flex-1 mx-auto max-w-2xl w-full px-4 sm:px-6 py-8 space-y-7 animate-pulse">
        {/* Article Header Skeleton */}
        <div className="space-y-3">
          {/* Metadata Row */}
          <div className="flex items-center gap-2">
            <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <span className="text-slate-200 dark:text-slate-800">•</span>
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          {/* Headline */}
          <div className="space-y-2.5">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-full" />
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
          </div>
        </div>

        {/* Hero Image Skeleton */}
        <div className="aspect-video w-full rounded-xl bg-slate-200 dark:bg-slate-800" />

        {/* Dynamic Excerpt Summary Skeleton */}
        <div className="space-y-6">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-11/12" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-4/5" />
        </div>
      </main>
    </div>
  );
}
