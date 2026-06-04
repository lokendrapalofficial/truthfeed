"use client";

import React, { useState } from "react";
import VerificationScorecard from "./VerificationScorecard";
import { VerificationScorecardData } from "@/app/actions/analyzeArticle";

interface VerificationDossierProps {
  articleId: string;
  articleTitle: string;
  sourceName: string;
  relatedSources?: any; // JSON array from database
  briefing: string | null; // Stores quickBrief
  articleText?: string | null; // Stores deepDive
  wikiContexts?: any[];
  category?: string;
  verification: VerificationScorecardData | null;
}

export default function VerificationDossier({
  relatedSources,
  briefing,
  articleText,
  verification,
}: VerificationDossierProps) {
  const [viewMode, setViewMode] = useState<"quick" | "deep">("quick");
  const sourcesList = Array.isArray(relatedSources) ? relatedSources : [];

  // Pick text based on selected toggle mode
  const activeText = viewMode === "quick" ? briefing : (articleText || briefing);

  // Parse the active text into paragraphs
  const paragraphs = activeText
    ? activeText
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 bg-white dark:bg-slate-900 transition-colors duration-300 space-y-6">
      {/* Verification Scorecard sitting at the top */}
      <VerificationScorecard data={verification} />

      {/* Segment Switcher Toggle */}
      <div className="flex justify-center border-b border-slate-200 dark:border-slate-700/60 pb-3 mt-4">
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700/60">
          <button
            onClick={() => setViewMode("quick")}
            className={`px-4.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              viewMode === "quick"
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
            }`}
          >
            Quick Brief
          </button>
          <button
            onClick={() => setViewMode("deep")}
            className={`px-4.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              viewMode === "deep"
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
            }`}
          >
            Deep Dive
          </button>
        </div>
      </div>

      {/* synthesized prose paragraphs */}
      {paragraphs.length > 0 ? (
        <div className="space-y-6 pt-2">
          {paragraphs.map((para, idx) => (
            <p
              key={idx}
              className="font-serif text-lg leading-relaxed text-slate-800 dark:text-slate-200"
            >
              {para}
            </p>
          ))}
        </div>
      ) : (
        /* Pulser Skeleton matching 3 paragraphs of text (fallback/safeguard) */
        <div className="animate-pulse space-y-8 pt-4">
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-11/12" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-4/5" />
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-11/12" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
          </div>
        </div>
      )}

      {/* Sources Footer */}
      {sourcesList.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-700 mt-8 pt-4">
          <div className="text-sm text-slate-500 flex flex-wrap items-center leading-relaxed">
            <span className="mr-1">Sources:</span>
            {sourcesList.map((item: any, idx: number) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="mx-1.5">•</span>}
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-slate-500 hover:text-slate-800 dark:hover:text-slate-350 transition-colors"
                >
                  {item.sourceName}
                </a>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
