"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import NewsImage from "@/components/NewsImage";
import { formatSmartDate, getArticleCategory } from "@/lib/utils";

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
  isThematic?: boolean;
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
  analysis?: {
    id?: string;
    claim?: string;
    briefing?: string | null;
    wikiContexts?: any;
    category?: string | null;
    articleText?: string | null;
    verification?: {
      coreClaim?: string;
      consensusScore?: number;
      confidenceLevel?: string;
      conflictReport?: string;
      reasoning?: string;
    } | null;
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

  // Fact check audit pill mapping
  const renderAuditBadge = () => {
    const credibility = article.source?.credibility;

    if (factCheck) {
      if (factCheck.rating === "TRUE") {
        return (
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-800">
            🟢 VERIFIED
          </span>
        );
      }
      if (factCheck.rating === "FALSE" || factCheck.rating === "MIXED") {
        return (
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-750 dark:text-rose-450 border border-rose-250 dark:border-rose-800">
            ⚠️ CONFLICTING
          </span>
        );
      }
    }

    if (credibility === "VERY_HIGH" || credibility === "HIGH") {
      return (
        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-800">
          🟢 VERIFIED
        </span>
      );
    }
    if (credibility === "LOW" || credibility === "VERY_LOW") {
      return (
        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-750 dark:text-rose-450 border border-rose-250 dark:border-rose-800">
          ⚠️ CONFLICTING
        </span>
      );
    }

    return null;
  };

  const dotColorClass = getCredibilityDotColor(article.source?.credibility);
  const credibilityLabel = article.source?.credibility ? `Credibility: ${article.source.credibility.replace("_", " ")}` : "Credibility: UNRATED";

  const smartDate = formatSmartDate(article.publishedAt);

  const getConsensusScore = () => {
    if (article.analysis?.verification?.consensusScore !== undefined) {
      return article.analysis.verification.consensusScore;
    }
    const factChecks = article.factChecks || [];
    if (factChecks.some((fc: any) => fc.rating === "TRUE")) return 5;
    if (article.source?.credibility === "VERY_HIGH") return 5;
    if (article.source?.credibility === "HIGH") return 4;
    return null;
  };

  const score = getConsensusScore();
  const isVerified = article.factChecks?.some((fc: any) => fc.rating === "TRUE") ||
                     article.source?.credibility === "VERY_HIGH" ||
                     article.source?.credibility === "HIGH" ||
                     article.analysis?.verification?.confidenceLevel === "High";

  const consensusBadge = isVerified && score ? (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 select-none">
      🟢 {score}/5 Desks
    </span>
  ) : null;

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
              isThematic={article.isThematic}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </Link>
        </div>
        <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColorClass}`}
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

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 font-mono border-t border-stone-50 dark:border-slate-750/50 mt-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{article.sourceName}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <div className="flex items-center gap-1">
                {smartDate.showRedDot && (
                  <span className="animate-pulse bg-red-500 rounded-full h-1.5 w-1.5 inline-block shrink-0" />
                )}
                <span>{smartDate.text}</span>
              </div>
            </div>
            {consensusBadge}
          </div>
        </div>
      </motion.article>
    );
  }

  // Grid View Layout (Vertical Card - Current Layout)
  const category = (article.analysis?.category || getArticleCategory(article.title, article.summary || article.content || "")).toUpperCase();

  return (
    <motion.article
      whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors duration-300"
    >
      <div>
        <div className="aspect-video w-full overflow-hidden bg-stone-50 dark:bg-slate-950 relative">
          <Link href={`/article/${article.id}`} className="block w-full h-full">
            <NewsImage
              url={article.url}
              title={article.title}
              sourceName={article.sourceName}
              imageUrl={article.imageUrl}
              isLogo={article.isLogo}
              isThematic={article.isThematic}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </Link>
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase mb-1">
            {category}
          </span>
          <h3 className="font-sans font-bold text-xl text-stone-900 dark:text-slate-100 mb-2 line-clamp-2 hover:text-stone-700 dark:hover:text-slate-350 transition-colors leading-snug">
            <Link href={`/article/${article.id}`}>
              {article.title}
            </Link>
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mb-3">
            {article.summary || article.content}
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 pt-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-150 dark:border-slate-800/80 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-700 dark:text-slate-350">{article.sourceName}</span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <div className="flex items-center gap-1">
            {smartDate.showRedDot && (
              <span className="animate-pulse bg-red-500 rounded-full h-1.5 w-1.5 inline-block shrink-0" />
            )}
            <span>{smartDate.text}</span>
          </div>
        </div>
        {consensusBadge}
      </div>
    </motion.article>
  );
}
