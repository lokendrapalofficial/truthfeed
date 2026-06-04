"use client";

import React from "react";
import { GeminiAnalysisResult } from "@/app/actions/analyzeArticle";
import { Sparkles, RefreshCw } from "lucide-react";

interface ArticleAnalysisProps {
  articleId: string;
  articleTitle: string;
  analysis: GeminiAnalysisResult | null;
  analyzing: boolean;
  analysisError: string | null;
  isMockAnalysis?: boolean;
}

/**
 * @deprecated This component is superseded by VerificationDossier.
 * Kept for compatibility. Use <VerificationDossier> in new layouts.
 */
export default function ArticleAnalysis({
  analysis,
  analyzing,
  analysisError,
  isMockAnalysis = false,
}: ArticleAnalysisProps) {
  if (analyzing) {
    return (
      <div className="p-4 border border-stone-200 bg-white rounded-xl shadow-sm space-y-4 animate-pulse">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <div className="h-3.5 w-24 bg-stone-200 rounded" />
          <RefreshCw className="h-3.5 w-3.5 text-stone-300 animate-spin" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-stone-100 rounded" />
          <div className="h-3 w-5/6 bg-stone-100 rounded" />
          <div className="h-3 w-2/3 bg-stone-100 rounded" />
        </div>
      </div>
    );
  }

  if (analysisError) {
    return (
      <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs">
        <strong>Error Running Audit:</strong> {analysisError}
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="p-5 border border-stone-200 bg-white rounded-xl shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-stone-900">TruthFeed AI Brief</h4>
        </div>
        {isMockAnalysis && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Demo
          </span>
        )}
      </div>

      {/* Brief */}
      <div className="space-y-1">
        <h5 className="text-[9px] uppercase font-bold tracking-wider text-stone-400">The Brief</h5>
        <p className="text-xs leading-relaxed text-stone-700 font-sans font-medium">{analysis.evidence}</p>
      </div>

      {/* Claims */}
      {analysis.claim && (
        <div className="space-y-1.5">
          <h5 className="text-[9px] uppercase font-bold tracking-wider text-stone-400">Key Claims</h5>
          <ul className="space-y-2">
            <li className="flex items-start gap-1.5 text-xs text-stone-700">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
              <span className="leading-relaxed font-medium">{analysis.claim}</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
