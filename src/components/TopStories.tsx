"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import NewsImage from "@/components/NewsImage";
import { formatSmartDate, getArticleCategory } from "@/lib/utils";

interface TopStoriesProps {
  activeCategory: string;
  categoryLabel: string;
  heroArticle: any;
  stackArticles: any[];
  isVerified: (article: any) => boolean;
  isConflicting: (article: any) => boolean;
}

export default function TopStories({
  activeCategory,
  categoryLabel,
  heroArticle,
  stackArticles,
  isVerified,
  isConflicting,
}: TopStoriesProps) {
  // Determine dynamic title - Renamed to Trending News
  const title = activeCategory === "foryou" 
    ? "Trending News" 
    : `Trending News in ${categoryLabel}`;

  // Helper to estimate total global outlets covering this story deterministically
  const getEstimatedOutletsCount = (article: any) => {
    if (!article) return 0;
    const category = article.analysis?.category || getArticleCategory(article.title, article.summary);
    const consensusScore = article.analysis?.verification?.consensusScore || 4;

    let hash = 0;
    for (let i = 0; i < article.id.length; i++) {
      hash = article.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const stableRandom = Math.abs(hash) % 20;

    let base = 15;
    const cat = (category || "").toLowerCase();
    if (cat.includes("world") || cat.includes("politics") || cat.includes("global")) {
      base = 60;
    } else if (cat.includes("business") || cat.includes("tech") || cat.includes("market") || cat.includes("finance")) {
      base = 35;
    } else if (cat.includes("sports") || cat.includes("entertainment")) {
      base = 25;
    }

    const scoreMultiplier = consensusScore >= 4 ? 1.5 : consensusScore <= 2 ? 1.25 : 0.95;
    return Math.round((base + stableRandom) * scoreMultiplier);
  };

  return (
    <div className="pb-8 border-b border-slate-200 dark:border-slate-800/80 animate-fadeIn">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <span className="h-5 w-1 bg-indigo-500 rounded-full shrink-0" />
          {title}
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 px-2.5 py-1 rounded-full">
          Live Feed
        </span>
      </div>

      {/* 3-column grid: hero (2 cols) + sidebar (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT: Featured Hero (spans 2 cols) ── */}
        {heroArticle && (
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className="lg:col-span-2"
          >
            <Link href={`/article/${heroArticle.id}`} className="group block h-full">
              <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-lg transition-all duration-300">
                {/* Hero Image */}
                <div className="aspect-[16/8] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                  <NewsImage
                    url={heroArticle.url}
                    title={heroArticle.title}
                    sourceName={heroArticle.sourceName}
                    imageUrl={heroArticle.imageUrl}
                    isLogo={heroArticle.isLogo}
                    isThematic={heroArticle.isThematic}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Category overlay chip */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-indigo-100 dark:border-indigo-800 px-2 py-0.5 rounded-full">
                      {heroArticle.analysis?.category || getArticleCategory(heroArticle.title, heroArticle.summary)}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-col flex-1 p-5 gap-3">
                  <h3 className="text-2xl md:text-3xl font-serif font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 leading-tight transition-colors">
                    {heroArticle.title}
                  </h3>

                  {/* Footer */}
                  <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                      <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        {heroArticle.sourceName}
                      </span>
                      <span>·</span>
                      <div className="flex items-center gap-1">
                        {formatSmartDate(heroArticle.publishedAt).showRedDot && (
                          <span className="animate-pulse bg-red-500 rounded-full h-1.5 w-1.5 inline-block shrink-0" />
                        )}
                        <span>{formatSmartDate(heroArticle.publishedAt).text}</span>
                      </div>
                      <span>·</span>
                      <span>{getEstimatedOutletsCount(heroArticle)} Outlets Tracking</span>
                      {isConflicting(heroArticle) && (
                        <span className="text-rose-600 dark:text-rose-450 font-semibold">⚠️ Conflicting</span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-800 dark:group-hover:text-indigo-300 transition-colors flex items-center gap-1 shrink-0">
                      Read Analysis <span aria-hidden>→</span>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* ── RIGHT: Sidebar stack of 3 secondary stories ── */}
        {stackArticles.length > 0 && (
          <div className="flex flex-col gap-3">
            {stackArticles.map((article) => {
              const smartDate = formatSmartDate(article.publishedAt);
              return (
                <Link
                  key={article.id}
                  href={`/article/${article.id}`}
                  className="group flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all duration-200 min-h-[110px]"
                >
                  {/* Top meta row */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      {article.analysis?.category || getArticleCategory(article.title, article.summary)}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600 text-[9px]">·</span>
                    <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                      {getEstimatedOutletsCount(article)} Outlets Tracking
                    </span>
                    {isConflicting(article) && (
                      <span className="text-[9px] bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-450 border border-rose-100 dark:border-rose-800/50 px-1.5 py-0.5 rounded-full font-semibold">
                        ⚠️ Conflict
                      </span>
                    )}
                    <span className="text-[9px] text-slate-400 dark:text-slate-550 ml-auto shrink-0 flex items-center gap-0.5">
                      {smartDate.showRedDot && (
                        <span className="animate-pulse bg-red-500 rounded-full h-1 w-1 inline-block shrink-0" />
                      )}
                      {smartDate.text}
                    </span>
                  </div>

                  {/* Headline */}
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2 leading-snug transition-colors flex-1">
                    {article.title}
                  </h3>

                  {/* Source footer */}
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-405 dark:text-slate-500 mt-2">
                    {article.sourceName}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
