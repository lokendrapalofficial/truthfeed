import React from "react";
import { Search, RefreshCw, Sun, LayoutGrid } from "lucide-react";

export default function Loading() {
  // We mock a list of 8 category buttons for subnavigation skeleton
  const categories = [
    "For You",
    "Trending News",
    "World",
    "Business",
    "Technology",
    "Sports",
    "Entertainment",
    "Health",
    "Science",
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* Navigation Header Skeleton */}
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Left: TruthFeed Logo */}
            <div className="flex items-center gap-1.5 select-none">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm tracking-tight">
                T
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                TruthFeed
              </span>
            </div>

            {/* Center: Search Bar Skeleton */}
            <div className="flex-1 max-w-xl relative group mx-2">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <div className="w-full h-10 pl-10 pr-4 rounded-full bg-slate-100 dark:bg-slate-800 border border-transparent" />
            </div>

            {/* Right: Actions Skeleton */}
            <div className="flex items-center gap-3">
              <div className="p-2 text-slate-350 dark:text-slate-600">
                <RefreshCw className="h-4.5 w-4.5" />
              </div>
              <div className="p-2 text-slate-350 dark:text-slate-600">
                <Sun className="h-4.5 w-4.5" />
              </div>
              <div className="px-3.5 h-9 rounded-full bg-slate-100 dark:bg-slate-850 border border-slate-250 dark:border-slate-850 flex items-center text-slate-300 dark:text-slate-600 font-bold text-[10px] tracking-wider uppercase select-none">
                Sign In
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Category Ribbon Skeleton */}
      <div className="sticky top-16 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar flex-1 mr-4">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className={`px-4 py-1.5 text-xs font-semibold tracking-wide whitespace-nowrap rounded-full ${
                  idx === 0
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "text-slate-300 dark:text-slate-700 bg-slate-50 dark:bg-slate-850/50"
                }`}
              >
                {cat}
              </div>
            ))}
          </div>

          {/* Grid/List View Toggler */}
          <div className="flex items-center gap-1 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-3 py-1.5 text-slate-300 dark:text-slate-600">
            <div className="p-1.5">
              <LayoutGrid className="h-4.5 w-4.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Core Content Feed Skeleton */}
      <main className="flex-1 w-full animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-10">
          {/* Trending News Section Skeleton */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-4 w-16 bg-slate-100 dark:bg-slate-850 rounded-full" />
            </div>

            {/* 3-column grid: Hero (2 cols) + Sidebar (1 col) Skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Hero Story Skeleton */}
              <div className="lg:col-span-2 flex flex-col bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl overflow-hidden min-h-[380px]">
                {/* Hero Image Block */}
                <div className="aspect-[16/8] w-full bg-slate-200 dark:bg-slate-800" />
                {/* Body Block */}
                <div className="p-5 flex flex-col flex-1 gap-4">
                  <div className="flex gap-2">
                    <div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-3.5 w-4 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-3.5 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-6 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-6 w-[85%] bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                  <div className="mt-auto flex justify-between items-center">
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                </div>
              </div>

              {/* Sidebar Stories Skeleton */}
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((val) => (
                  <div
                    key={val}
                    className="flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 min-h-[110px]"
                  >
                    <div className="flex gap-2">
                      <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="space-y-1.5 mt-2">
                      <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-4 w-[75%] bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded mt-3" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Latest Updates Section Skeleton */}
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center">
              <div className="h-7 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-7 w-48 bg-slate-100 dark:bg-slate-850 rounded-md" />
            </div>

            {/* Grid of cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((card) => (
                <div
                  key={card}
                  className="flex flex-col h-full rounded-xl border border-slate-250 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden"
                >
                  <div className="aspect-video w-full bg-slate-200 dark:bg-slate-800" />
                  <div className="flex flex-col flex-1 p-4 gap-3">
                    <div className="flex gap-2">
                      <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-4 w-[90%] bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-auto">
                      <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
