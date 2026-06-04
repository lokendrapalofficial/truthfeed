"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { GeminiAnalysisResult } from "@/app/actions/analyzeArticle";
import { MappedFactCheck } from "@/app/actions/fetchFactChecks";
import { parseAlsoReportedPublishers } from "@/lib/rssParser";

interface VerificationDossierProps {
  articleId: string;
  articleTitle: string;
  sourceName: string;
  source?: {
    id: string;
    name: string;
    bias: string;
    credibility: string;
    description?: string | null;
  } | null;
  articleContent?: string;
  analysis: GeminiAnalysisResult | null;
  primaryFactCheck: MappedFactCheck | null;
  isMockMode?: boolean;
}

const SEEDED_CREDIBILITY: Record<string, string> = {
  "Reuters": "VERY_HIGH",
  "AP News": "VERY_HIGH",
  "BBC News": "VERY_HIGH",
  "Bloomberg": "VERY_HIGH",
  "CNBC": "HIGH",
  "NPR": "HIGH",
  "The New York Times": "HIGH",
  "The Guardian": "HIGH",
  "Politico": "HIGH",
  "HuffPost": "MEDIUM",
  "CNN": "MEDIUM",
  "USA TODAY": "HIGH",
  "CBS News": "HIGH",
  "NBC News": "HIGH",
  "Forbes": "HIGH",
  "The Wall Street Journal": "HIGH",
  "Fox News": "MEDIUM",
  "Daily Mail": "LOW",
  "Breitbart": "LOW"
};

const getCredibilityDetails = (cred: string | null | undefined) => {
  if (!cred) return { dotColor: "bg-zinc-400 dark:bg-slate-600", text: "Unknown Credibility" };
  switch (cred) {
    case "VERY_HIGH":
      return { dotColor: "bg-emerald-500", text: "Very High Credibility" };
    case "HIGH":
      return { dotColor: "bg-emerald-500", text: "High Credibility" };
    case "MEDIUM":
      return { dotColor: "bg-amber-500", text: "Medium Credibility" };
    case "LOW":
      return { dotColor: "bg-rose-500", text: "Low Credibility" };
    case "VERY_LOW":
      return { dotColor: "bg-rose-500", text: "Very Low Credibility" };
    default:
      return { dotColor: "bg-zinc-400 dark:bg-slate-600", text: "Unknown Credibility" };
  }
};

const getVerdictBadge = (rating: string | null | undefined) => {
  if (!rating) {
    return {
      text: "◯ AWAITING AUDIT",
      classes: "bg-gray-50 text-gray-500 border border-gray-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700"
    };
  }
  
  const r = rating.toLowerCase();
  if (r.includes("true") || r.includes("accurate") || r.includes("correct") || r === "verified") {
    return {
      text: "✓ VERIFIED",
      classes: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
    };
  }
  if (r.includes("false") || r.includes("fake") || r.includes("incorrect")) {
    return {
      text: "✗ FALSE",
      classes: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800"
    };
  }
  // Mixed or Misleading or Unverified
  if (r.includes("misleading") || r.includes("mixed") || r.includes("half true") || r.includes("mostly false")) {
    return {
      text: `⚠ ${rating.toUpperCase()}`,
      classes: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
    };
  }
  
  return {
    text: `◯ ${rating.toUpperCase()}`,
    classes: "bg-gray-50 text-gray-500 border border-gray-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700"
  };
};

export default function VerificationDossier({
  articleId,
  articleTitle,
  sourceName,
  source,
  articleContent = "",
  analysis,
  primaryFactCheck,
  isMockMode = false,
}: VerificationDossierProps) {
  // Resolve source credibility
  const dbCredibility = source?.credibility;
  const seededCred = SEEDED_CREDIBILITY[sourceName];
  const resolvedCred = dbCredibility || seededCred;
  const credibilityDetails = getCredibilityDetails(resolvedCred);

  // Parse "Also reported by"
  const alsoReported = parseAlsoReportedPublishers(articleContent, sourceName);

  const ratingDetails = getVerdictBadge(primaryFactCheck?.textualRating);

  // If no professional fact-check and no Gemini claims exist, show graceful fallback message
  const hasNoData = !analysis && !primaryFactCheck;

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm transition-colors duration-300 flex flex-col gap-5">
      {hasNoData ? (
        /* Fallback message replacing sections 1, 2, and 3 */
        <div className="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-slate-900/40 border border-gray-150 dark:border-slate-700 rounded-lg text-gray-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
          No professional audit published yet. We recommend cross-referencing this claim with the primary sources listed below.
        </div>
      ) : (
        <>
          {/* SECTION 1: THE CLAIM */}
          <div className="flex flex-col">
            <span className="font-mono text-[10px] tracking-wider text-gray-400 dark:text-slate-500 uppercase font-black mb-2">
              THE CLAIM
            </span>
            <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-1 italic font-semibold text-gray-900 dark:text-slate-100 text-base leading-relaxed">
              &ldquo;{analysis?.claim || articleTitle}&rdquo;
            </blockquote>
          </div>

          {/* SECTION 2: THE VERDICT */}
          <div className="flex flex-col items-start border-t border-gray-100 dark:border-slate-700/60 pt-4">
            <span className="font-mono text-[10px] tracking-wider text-gray-400 dark:text-slate-500 uppercase font-black mb-2.5">
              THE VERDICT
            </span>
            <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase border shadow-sm ${ratingDetails.classes}`}>
              <span>{ratingDetails.text}</span>
            </div>
          </div>

          {/* SECTION 3: THE EVIDENCE */}
          <div className="flex flex-col border-t border-gray-100 dark:border-slate-700/60 pt-4">
            <span className="font-mono text-[10px] tracking-wider text-gray-400 dark:text-slate-500 uppercase font-black mb-2">
              THE EVIDENCE
            </span>
            {analysis?.evidence ? (
              <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed font-sans">
                {analysis.evidence}
              </p>
            ) : (
              <p className="text-xs text-gray-400 dark:text-slate-500 italic">
                Verification evidence is unavailable for this article.
              </p>
            )}
          </div>
        </>
      )}

      {/* SECTION 4: PRIMARY SOURCES & CREDIBILITY */}
      <div className="flex flex-col border-t border-gray-100 dark:border-slate-700/60 pt-4 gap-2">
        <span className="font-mono text-[10px] tracking-wider text-gray-400 dark:text-slate-500 uppercase font-black mb-1.5">
          PRIMARY SOURCES & CREDIBILITY
        </span>

        {/* Line 1: Original Publisher + Credibility Dot */}
        <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-slate-200">
          <span className="font-extrabold">{sourceName}</span>
          <div className="relative group/tooltip inline-block leading-none">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${credibilityDetails.dotColor} cursor-help border border-white dark:border-slate-800 shadow-sm`} />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:block bg-gray-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[10px] font-extrabold px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap z-50 tracking-wide">
              {credibilityDetails.text}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-slate-100" />
            </div>
          </div>
        </div>

        {/* Line 2: Fact-checked by [Publisher] */}
        {primaryFactCheck && (
          <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 dark:text-slate-400 mt-0.5 border-t border-gray-50 dark:border-slate-750/30 pt-1.5">
            <span>
              Fact-checked by <span className="font-semibold text-gray-700 dark:text-slate-300">{primaryFactCheck.publisherName}</span>
            </span>
            {primaryFactCheck.reviewUrl && primaryFactCheck.reviewUrl !== "#" && (
              <a
                href={primaryFactCheck.reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-850 dark:hover:text-blue-300 transition-colors font-bold"
              >
                <span>Read Report</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {/* Line 3: Also reported by: CBS News, Yahoo, People.com */}
        {alsoReported.length > 0 && (
          <div className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 border-t border-gray-50 dark:border-slate-750/30 pt-1.5 leading-relaxed font-sans">
            Also reported by: <span className="font-semibold text-gray-500 dark:text-slate-400">{alsoReported.join(", ")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
