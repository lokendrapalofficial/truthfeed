"use client";

import React, { useState } from "react";
import { Calendar, ShieldAlert, ShieldCheck, HelpCircle, AlertCircle, ArrowUpRight } from "lucide-react";
import SourceBadge, { SourceData } from "@/components/SourceBadge";

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
  sourceName: string;
  publishedAt: string;
  factChecks?: FactCheckMock[];
  source?: SourceData | null;
}

interface NewsCardProps {
  article: ArticleMock;
}

export default function NewsCard({ article }: NewsCardProps) {
  const [showFactDetail, setShowFactDetail] = useState(false);
  const factCheck = article.factChecks && article.factChecks.length > 0 ? article.factChecks[0] : null;

  // Rating styles config — light-mode only, WCAG AA contrast
  const ratingConfigs = {
    TRUE: {
      label: "Verified True",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />,
    },
    FALSE: {
      label: "False / Misleading",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      icon: <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />,
    },
    MIXED: {
      label: "Mixed Truth",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <AlertCircle className="h-3.5 w-3.5 text-amber-600" />,
    },
    UNVERIFIED: {
      label: "Unverified Claim",
      badgeClass: "bg-zinc-50 text-zinc-500 border-zinc-200",
      icon: <HelpCircle className="h-3.5 w-3.5 text-zinc-400" />,
    },
  };

  const rating = factCheck ? factCheck.rating : null;
  const config = rating ? ratingConfigs[rating] : null;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-zinc-300">
      <div>
        {/* Header: Source and Date */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-4">
          <SourceBadge sourceName={article.sourceName} source={article.source} />
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-zinc-400 shrink-0" />
            <span>{formatDate(article.publishedAt)}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-serif text-lg font-bold leading-snug text-zinc-900 group-hover:text-zinc-950 transition-colors duration-200 mb-2.5">
          <a
            href={article.url}
            rel="noopener noreferrer"
            className="focus:outline-none flex items-start gap-1"
          >
            <span>{article.title}</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity mt-1 text-zinc-500" />
          </a>
        </h3>

        {/* Summary */}
        <p className="text-sm leading-relaxed text-zinc-600 mb-5 line-clamp-3">
          {article.summary}
        </p>
      </div>

      {/* Fact Check Section */}
      {factCheck && config && (
        <div className="mt-4 pt-4 border-t border-zinc-100">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${config.badgeClass}`}>
              {config.icon}
              <span>{config.label}</span>
            </div>

            <button
              onClick={() => setShowFactDetail(!showFactDetail)}
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 hover:underline focus:outline-none transition-colors cursor-pointer"
            >
              {showFactDetail ? "Hide Details" : "View Fact Check"}
            </button>
          </div>

          {showFactDetail && (
            <div className="mt-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 text-xs space-y-2">
              <p className="font-bold text-zinc-700">
                Claim: <span className="font-normal italic">"{factCheck.claimText}"</span>
              </p>
              <p className="font-bold text-zinc-700">
                Verdict: <span className="font-normal">{factCheck.verdict}</span>
              </p>
              <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-2.5 pt-2 border-t border-zinc-100">
                <span>By: {factCheck.sourceOrganization}</span>
                <a
                  href={factCheck.factCheckUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-800 font-bold hover:underline"
                >
                  Source Report &rarr;
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Default Unverified Status for non-fact-checked articles */}
      {!factCheck && (
        <div className="mt-4 pt-4 border-t border-zinc-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-zinc-50 text-zinc-500 border-zinc-200">
              <HelpCircle className="h-3.5 w-3.5 text-zinc-400" />
              <span>Unverified Story</span>
            </div>
            <span className="text-[10px] font-semibold text-zinc-400 italic">No fact check available</span>
          </div>
        </div>
      )}
    </article>
  );
}
