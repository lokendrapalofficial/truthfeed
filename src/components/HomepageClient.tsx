"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import CleanCard from "@/components/CleanCard";
import BackToTop from "@/components/BackToTop";

interface HomepageClientProps {
  initialArticles: any[];
}

export default function HomepageClient({ initialArticles }: HomepageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredArticles = useMemo(() => {
    return initialArticles.filter((article) => {
      // 1. Search filter (by title or sourceName)
      const matchesSearch =
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.sourceName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Tab filter (optional: fact-checks)
      if (activeTab === "fact-checks") {
        const hasFactChecks = article.factChecks && article.factChecks.length > 0;
        if (!hasFactChecks) return false;
      }

      return true;
    });
  }, [initialArticles, searchQuery, activeTab]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300">
      {/* Navigation Header */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Core Content Feed */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => {
              // Extract unique sources for the CleanCard
              const sourcesList = [
                article.sourceName,
                ...(Array.isArray(article.relatedSources)
                  ? (article.relatedSources as any[]).map((s) => s.sourceName)
                  : []),
              ].filter(Boolean);
              const uniqueSources = Array.from(new Set(sourcesList));

              return (
                <Link
                  key={article.id}
                  href={`/article/${article.id}`}
                  className="block h-full"
                >
                  <CleanCard
                    title={article.title}
                    imageUrl={article.imageUrl}
                    publishedAt={new Date(article.publishedAt)}
                    sources={uniqueSources}
                    tl_dr={article.analysis?.briefing || null}
                  />
                </Link>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md mx-auto mt-12 transition-colors duration-300">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No articles found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed">
              We couldn't find any articles matching your search query or criteria.
            </p>
          </div>
        )}
      </main>

      {/* Floating Scroll to Top */}
      <BackToTop />

      {/* Clean Minimalist Aggregator Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900 py-10 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center space-y-2">
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-200 block">
            TruthFeed
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-405 leading-normal max-w-md mx-auto">
            Designed for fact-checking coverage comparisons and news transparency.
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()} TruthFeed Initiative. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
