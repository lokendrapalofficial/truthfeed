"use client";

import React from "react";
import Link from "next/link";
import { Globe, ExternalLink } from "lucide-react";
import NewsImage from "@/components/NewsImage";
import { formatSmartDate, getArticleCategory } from "@/lib/utils";

export interface WireCardProps {
  article: any;
}

export default function WireCard({ article }: WireCardProps) {
  const smartDate = formatSmartDate(article.publishedAt);
  const category = (article.analysis?.category || getArticleCategory(article.title, article.summary || article.content || "")).toUpperCase();
  
  // Consensus Badge calculation
  const getConsensusScore = () => {
    if (article.analysis?.verification?.consensusScore !== undefined && article.analysis?.verification?.consensusScore !== null) {
      return article.analysis.verification.consensusScore;
    }
    const factChecks = article.factChecks || [];
    if (factChecks.some((fc: any) => fc.rating === "TRUE")) return 5;
    if (article.source?.credibility === "VERY_HIGH") return 5;
    if (article.source?.credibility === "HIGH") return 4;
    return null;
  };

  const score = getConsensusScore();
  const confidence = article.analysis?.verification?.confidenceLevel;
  const isConflict = confidence === "Conflicting" || confidence === "Low" || (score !== null && score <= 2);

  // Framing split preview string
  const getFramingPreview = () => {
    if (!article.analysis?.framingMatrix) return null;
    try {
      const matrix = typeof article.analysis.framingMatrix === "string"
        ? JSON.parse(article.analysis.framingMatrix)
        : article.analysis.framingMatrix;
      
      if (Array.isArray(matrix) && matrix.length > 0) {
        if (matrix.length >= 2) {
          return `Angle split: ${matrix[0].angle} vs. ${matrix[1].angle}`;
        }
        return `Focus: ${matrix[0].angle}`;
      }
    } catch (e) {
      console.error("Error parsing framing matrix for preview:", e);
    }
    return null;
  };

  const framingPreview = getFramingPreview();
  const showImage = article.imageUrl && !article.isLogo;
  const isCompiling = !article.analysis?.briefing;

  return (
    <article className="w-full flex flex-row gap-6 items-start justify-between py-6">
      
      {/* Left Column: Typography Content & Badges */}
      <div className="flex-1 min-w-0 space-y-2 select-text">
        
        {/* Monospace Metadata Row */}
        <div className="flex items-center justify-between sm:justify-start sm:gap-4 text-[10px] font-mono tracking-wider uppercase text-slate-400 dark:text-slate-500">
          <span className="font-bold text-slate-500 dark:text-slate-450 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded">
            {category}
          </span>
          <div className="flex items-center gap-1">
            {smartDate.showRedDot && (
              <span className="animate-pulse bg-red-500 rounded-full h-1.5 w-1.5 shrink-0" />
            )}
            <span>{smartDate.text}</span>
          </div>
        </div>

        {/* Headline (Serif & Bold) */}
        <h3 className="font-serif font-bold text-2xl leading-snug text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <Link href={`/article/${article.id}`}>
            {article.title}
          </Link>
        </h3>

        {/* The TL;DR Wire Brief (Synthesized only, never raw description) */}
        {isCompiling ? (
          /* Sleek pulsing inline skeleton for TL;DR */
          <div className="animate-pulse space-y-2 py-1">
            <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-full" />
            <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-11/12" />
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed font-sans">
            {article.analysis.briefing}
          </p>
        )}

        {/* The Data Row (Consensus Badge + Framing Preview) */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono select-none">
          {/* Consensus Badge */}
          {isCompiling ? (
            <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-20 animate-pulse" />
          ) : isConflict ? (
            <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 font-bold">
              🔴 CONFLICT
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-250 dark:border-emerald-900/60 font-bold">
              🟢 {score || 3}/5 DESKS
            </span>
          )}

          {/* Framing Preview */}
          {isCompiling ? (
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-44 animate-pulse" />
          ) : (
            framingPreview && (
              <span className="text-slate-500 dark:text-slate-450 italic truncate max-w-sm sm:max-w-md">
                {framingPreview}
              </span>
            )
          )}

          {/* Publisher Reference */}
          <span className="text-slate-400 dark:text-slate-500 ml-auto sm:ml-0 font-sans">
            via {article.sourceName}
          </span>
        </div>

      </div>

      {/* Right Column: Mini Thumbnail Image (Photos are secondary to typography) */}
      {showImage && (
        <div className="w-24 h-24 shrink-0 relative rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80">
          <Link href={`/article/${article.id}`}>
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
      )}

    </article>
  );
}
