"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import NewsImage from "@/components/NewsImage";

export type RatingType = "TRUE" | "FALSE" | "MIXED" | "UNVERIFIED";

export interface FactCheckMock {
  id: string;
  claimText: string;
  verdict: string;
  rating: RatingType;
  sourceOrganization: string;
  factCheckUrl: string;
}

export interface ArticleMock {
  id: string;
  title: string;
  url: string;
  content: string;
  summary: string;
  imageUrl?: string | null;
  isLogo?: boolean;
  sourceName: string;
  publishedAt: string;
  factChecks?: FactCheckMock[];
  source?: {
    id: string;
    name: string;
    bias: string;
    credibility: string;
    description?: string | null;
  } | null;
}

interface NewsCardProps {
  article: ArticleMock;
  viewMode?: "grid" | "list";
}

export default function NewsCard({ article, viewMode = "grid" }: NewsCardProps) {
  const factCheck = article.factChecks && article.factChecks.length > 0 ? article.factChecks[0] : null;

  // Credibility dot color mapping
  const getCredibilityDotColor = (credibility?: string) => {
    if (!credibility) return "bg-stone-300 dark:bg-slate-700";
    switch (credibility) {
      case "VERY_HIGH":
      case "HIGH":
        return "bg-emerald-500";
      case "MEDIUM":
        return "bg-amber-500";
      case "LOW":
      case "VERY_LOW":
        return "bg-rose-500";
      default:
        return "bg-stone-300 dark:bg-slate-700";
    }
  };

  // Fact check audit pill mapping with Twitter-style dark mode overrides
  const renderAuditBadge = () => {
    if (!factCheck) {
      return (
        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          AUDIT PENDING
        </span>
      );
    }

    switch (factCheck.rating) {
      case "TRUE":
        return (
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-800">
            VERIFIED TRUE
          </span>
        );
      case "FALSE":
        return (
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/40 text-rose-750 dark:text-rose-450 border border-rose-250 dark:border-rose-800">
            FALSE / MISLEADING
          </span>
        );
      case "MIXED":
        return (
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-250 dark:border-amber-800">
            MIXED TRUTH
          </span>
        );
      default:
        return (
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-50 dark:bg-slate-800 text-stone-707 dark:text-slate-400 border border-stone-250 dark:border-slate-700">
            UNVERIFIED
          </span>
        );
    }
  };

  const dotColorClass = getCredibilityDotColor(article.source?.credibility);
  const credibilityLabel = article.source?.credibility ? `Credibility: ${article.source.credibility.replace("_", " ")}` : "Credibility: UNRATED";

  // List View Layout (Horizontal Flex)
  if (viewMode === "list") {
    return (
      <motion.article
        whileHover={{ x: 2 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white dark:bg-slate-800 rounded-xl border border-stone-150 dark:border-slate-700 flex flex-row gap-4 p-3.5 transition-colors duration-300 w-full shadow-xs"
      >
        <div className="w-32 h-32 rounded-lg overflow-hidden bg-stone-50 dark:bg-slate-900 shrink-0 border border-stone-100 dark:border-slate-850 relative">
          <Link href={`/article/${article.id}`} className="block w-full h-full">
            <NewsImage
              url={article.url}
              title={article.title}
              sourceName={article.sourceName}
              imageUrl={article.imageUrl}
              isLogo={article.isLogo}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </Link>
        </div>
        <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-stone-700 dark:text-slate-400 truncate max-w-[120px]">{article.sourceName}</span>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${dotColorClass}`}
                title={credibilityLabel}
              />
              {renderAuditBadge()}
            </div>
            <h3 className="font-bold text-base text-stone-900 dark:text-slate-100 leading-snug line-clamp-2 hover:text-stone-700 dark:hover:text-slate-300 transition-colors">
              <Link href={`/article/${article.id}`}>
                {article.title}
              </Link>
            </h3>
            <p className="text-xs text-stone-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {article.summary || article.content}
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-slate-500 pt-1 font-sans">
            <time>{new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time>
            <Link
              href={`/article/${article.id}`}
              className="flex items-center gap-1 text-stone-500 dark:text-slate-400 hover:text-stone-700 dark:hover:text-slate-300 transition-colors cursor-pointer font-medium"
            >
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>AI Context</span>
            </Link>
          </div>
        </div>
      </motion.article>
    );
  }

  // Grid View Layout (Vertical Card - Current Layout)
  return (
    <motion.article
      whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-stone-150 dark:border-slate-700 flex flex-col justify-between transition-colors duration-300"
    >
      <div>
        <div className="aspect-video w-full overflow-hidden bg-stone-50 dark:bg-slate-900 relative">
          <Link href={`/article/${article.id}`} className="block w-full h-full">
            <NewsImage
              url={article.url}
              title={article.title}
              sourceName={article.sourceName}
              imageUrl={article.imageUrl}
              isLogo={article.isLogo}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </Link>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-stone-700 dark:text-gray-400">{article.sourceName}</span>
            <span
              className={`w-2 h-2 rounded-full ${dotColorClass}`}
              title={credibilityLabel}
            />
            {renderAuditBadge()}
          </div>
          <h3 className="font-bold text-lg text-stone-900 dark:text-slate-100 mb-2 line-clamp-2 hover:text-stone-700 dark:hover:text-slate-300 transition-colors">
            <Link href={`/article/${article.id}`}>
              {article.title}
            </Link>
          </h3>
          <p className="text-sm text-stone-600 dark:text-slate-450 line-clamp-2 mb-3">
            {article.summary || article.content}
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 pt-1 flex items-center justify-between text-xs text-stone-500 dark:text-slate-500 border-t border-stone-50 dark:border-slate-750">
        <time>{new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time>
        <Link
          href={`/article/${article.id}`}
          className="flex items-center gap-1 text-stone-500 dark:text-slate-400 hover:text-stone-700 dark:hover:text-slate-300 transition-colors cursor-pointer font-medium"
        >
          <Sparkles className="h-3 w-3 text-amber-500" />
          <span>AI Context</span>
        </Link>
      </div>
    </motion.article>
  );
}
