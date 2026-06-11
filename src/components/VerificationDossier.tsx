"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  category,
}: VerificationDossierProps) {
  const [viewMode, setViewMode] = useState<"quick" | "deep">("quick");
  const sourcesList = Array.isArray(relatedSources) ? relatedSources : [];

  // Pick text based on selected toggle mode
  const activeText = viewMode === "quick" ? briefing : (articleText || briefing);

  // Helper to render bold text from **text** pattern
  const renderBoldText = (text: string) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={match.index} className="font-bold text-slate-950 dark:text-white">
          {match[1]}
        </strong>
      );
      lastIndex = boldRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Parse the active text into paragraphs for deep dive
  const paragraphs = activeText
    ? activeText
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  // Helper to extract clean bullet points from quick brief text
  const getBulletPoints = (text: string) => {
    if (!text) return [];
    const cleanText = text.replace(/^(🚨\s*ALERT:?|✅\s*VERIFIED:?)/i, "").trim();
    return cleanText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);
  };

  // Helper to render paragraph with custom bold prefixes and monospace consensus badge
  const renderParagraph = (para: string, idx: number) => {
    let prefix: React.ReactNode = null;
    let restText = para;

    const alertRegex = /^(🚨\s*ALERT:?)/i;
    const verifiedRegex = /^(✅\s*VERIFIED:?)/i;

    if (alertRegex.test(restText)) {
      const match = restText.match(alertRegex);
      if (match) {
        prefix = (
          <span className="font-sans font-extrabold text-red-600 dark:text-red-400 mr-2 inline-flex items-center gap-1.5 text-xl tracking-wider select-none">
            <span className="animate-pulse inline-block">🚨</span> ALERT:
          </span>
        );
        restText = restText.slice(match[0].length).trim();
      }
    } else if (verifiedRegex.test(restText)) {
      const match = restText.match(verifiedRegex);
      if (match) {
        prefix = (
          <span className="font-sans font-extrabold text-emerald-600 dark:text-emerald-400 mr-2 inline-flex items-center gap-1.5 text-xl tracking-wider select-none">
            <span>✅</span> VERIFIED:
          </span>
        );
        restText = restText.slice(match[0].length).trim();
      }
    }

    // Split restText by consensus score pattern: e.g. "Consensus: 5/5 desks" or "Consensus: 2/5 - conflicting reports"
    const consensusRegex = /(Consensus:\s*\d+\/\d+(?:\s*-\s*[^.]+|\s+\w+)*)/i;
    const parts = restText.split(consensusRegex);

    return (
      <p
        key={idx}
        className="font-serif text-[18px] leading-relaxed md:leading-loose text-slate-800 dark:text-slate-200"
      >
        {prefix}
        {parts.map((part, pIdx) => {
          if (consensusRegex.test(part)) {
            return (
              <span
                key={pIdx}
                className="font-mono text-sm bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700/60 mx-1 select-all inline-block align-middle font-semibold"
              >
                {part}
              </span>
            );
          }
          return part;
        })}
      </p>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 bg-white dark:bg-slate-900 transition-colors duration-300 space-y-8">
      {/* Segment Switcher Toggle */}
      <div className="flex justify-center border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700/65">
          <button
            onClick={() => setViewMode("quick")}
            className={`px-4.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              viewMode === "quick"
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-750 dark:hover:text-slate-350"
            }`}
          >
            Quick Brief
          </button>
          <button
            onClick={() => setViewMode("deep")}
            className={`px-4.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              viewMode === "deep"
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-750 dark:hover:text-slate-350"
            }`}
          >
            Deep Dive
          </button>
        </div>
      </div>

      {/* Synthesized prose text with AnimatePresence fade-in */}
      <div className="min-h-[140px] relative">
        <AnimatePresence mode="wait">
          {activeText ? (
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 pt-2"
            >
              {viewMode === "quick" ? (
                <ul className="space-y-3.5 font-sans text-base text-slate-800 dark:text-slate-200">
                  {getBulletPoints(activeText).map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3 leading-relaxed">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0 mt-2.5" />
                      <span>{renderBoldText(point)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-6 font-serif text-[18px] leading-relaxed md:leading-loose text-slate-800 dark:text-slate-200">
                  {paragraphs.map((para, idx) => renderParagraph(para, idx))}
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  📡 Report generated by TruthFeed
                </span>
              </div>
            </motion.div>
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
        </AnimatePresence>
      </div>

      {/* Verification Scorecard sitting below the fold / briefing prose */}
      <VerificationScorecard data={verification} category={category} totalSources={sourcesList.length + 1} />

      {/* Sources Footer */}
      {sourcesList.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-800 mt-8 pt-4">
          <div className="text-sm text-slate-500 flex flex-wrap items-center leading-relaxed font-sans">
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
