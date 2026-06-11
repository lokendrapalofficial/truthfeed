"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Bookmark, FolderOpen } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { getBookmarkedArticles, toggleBookmark } from "@/app/actions/bookmarkActions";
import TransparencyCard from "@/components/TransparencyCard";

export default function BookmarksPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBookmarks() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError("Please sign in to view your bookmarks.");
          setLoading(false);
          return;
        }

        const res = await getBookmarkedArticles();
        if (res.success) {
          setArticles(res.articles || []);
        } else {
          setError(res.error || "Failed to load bookmarks.");
        }
      } catch (err: any) {
        console.error("Error loading bookmarks:", err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }

    loadBookmarks();
  }, [supabase]);

  // Remove article from list dynamically when untoggled
  const handleToggleBookmark = (articleId: string, isSaved: boolean) => {
    if (!isSaved) {
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
          <span className="text-sm font-mono text-slate-400">Loading saved articles...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/60 transition-colors duration-300 flex flex-col">
      {/* Navigation Header */}
      <nav className="border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Newsroom</span>
          </Link>
          <span className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-widest font-mono flex items-center gap-1.5">
            <Bookmark className="h-4 w-4 text-indigo-500 fill-indigo-500/10" />
            Bookmarks
          </span>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Bookmarked Stories
          </h1>
          <p className="text-xs text-slate-550 dark:text-slate-400">
            Your saved research summaries and news comparisons.
          </p>
        </div>

        {error ? (
          <div className="max-w-md mx-auto text-center py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <p className="text-sm text-slate-650 dark:text-slate-400 font-medium">{error}</p>
            <Link
              href="/"
              className="inline-flex h-9 items-center justify-center px-4 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold hover:opacity-95 transition-opacity"
            >
              Back to Newsroom
            </Link>
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {articles.map((article) => (
              <div key={article.id} className="relative group/card">
                <TransparencyCard
                  article={article}
                  viewMode="grid"
                  isBookmarked={true}
                  onToggleBookmark={handleToggleBookmark}
                />
                {/* Explicit Quick Remove overlay button for user accessibility */}
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleBookmark(article.id, false);
                    await toggleBookmark(article.id);
                  }}
                  className="absolute bottom-12 right-4 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-100 dark:border-rose-900/40 rounded-lg shadow-sm opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 cursor-pointer"
                  title="Remove bookmark"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="max-w-md mx-auto text-center py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-sm space-y-4 transition-colors duration-300">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-450 dark:text-slate-500">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">No bookmarked articles</h3>
              <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed max-w-xs mx-auto">
                Stories you bookmark will appear here for easy reference and tracking.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex h-9 items-center justify-center px-4 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold hover:opacity-90 active:scale-98 transition-all shadow-sm"
            >
              Explore Feed
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
