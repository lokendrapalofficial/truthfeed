"use client";

import React, { useMemo } from "react";

interface VerificationDossierProps {
  articleId: string;
  articleTitle: string;
  articleUrl: string;
  sourceName: string;
  relatedSources?: any; // JSON array from database
  briefing: string | null; // Stores tl_dr
  category?: string;
  verification: any | null;
  framingMatrix: any[];
}

export default function VerificationDossier({
  articleTitle,
  articleUrl,
  sourceName,
  relatedSources,
  briefing,
  verification,
  framingMatrix,
}: VerificationDossierProps) {
  // Deduplicate and process the matrix of coverage outlets
  const matrixList = useMemo(() => {
    const primaryItem = { outlet: sourceName, angle: articleTitle };
    const rawList = [
      primaryItem,
      ...(framingMatrix && framingMatrix.length > 0
        ? framingMatrix
        : Array.isArray(relatedSources)
        ? relatedSources.map((rs: any) => ({
            outlet: rs.sourceName,
            angle: rs.title,
          }))
        : []),
    ];

    const seen = new Set<string>();
    return rawList.filter((item) => {
      if (!item || !item.outlet) return false;
      const outletLower = item.outlet.toLowerCase().trim();
      if (seen.has(outletLower)) return false;
      seen.add(outletLower);
      return true;
    });
  }, [sourceName, articleTitle, framingMatrix, relatedSources]);

  // Consensus indicator logic
  const { isFractured, outletCount } = useMemo(() => {
    const conf = verification?.confidenceLevel;
    const score = verification?.consensusScore;
    const isFractured =
      conf === "Conflicting" ||
      conf === "CONFLICTING" ||
      (score !== undefined && score <= 2);
    return {
      isFractured,
      outletCount: matrixList.length,
    };
  }, [verification, matrixList]);

  return (
    <div className="w-full bg-white dark:bg-slate-900 transition-colors duration-300 space-y-8">
      {/* 1. Intelligence Brief (TL;DR) Card */}
      {briefing && briefing.trim() && (
        <div className="bg-slate-50 dark:bg-slate-900 border-l-4 border-blue-500 p-6 rounded-r-lg my-8 shadow-sm">
          <div className="text-[10px] font-mono tracking-widest text-slate-500 dark:text-slate-400 uppercase font-bold mb-2.5">
            INTELLIGENCE BRIEF
          </div>
          <div className="text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-sans font-medium">
            {briefing}
          </div>
        </div>
      )}

      {/* 2. Consensus & Framing Dashboard */}
      <div className="space-y-4 pt-4">
        <div className="text-xs font-mono tracking-widest text-slate-500 dark:text-slate-400 uppercase select-none border-b border-slate-200 dark:border-slate-800 pb-2.5 font-bold">
          MEDIA CONSENSUS & FRAMING
        </div>

        {/* Consensus Badge */}
        <div className="text-xl md:text-2xl font-extrabold font-sans tracking-tight py-2 select-none">
          {isFractured ? (
            <span className="text-rose-600 dark:text-rose-450">
              🔴 NARRATIVE FRACTURE
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-450">
              🟢 HIGH CONSENSUS ({outletCount}/{outletCount} Outlets Align)
            </span>
          )}
        </div>

        {/* The Source Matrix List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/20 dark:bg-slate-900/10 p-2">
          {matrixList.length > 0 ? (
            matrixList.map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-baseline justify-between p-3.5 border-b border-slate-105 dark:border-slate-800/60 last:border-0 hover:bg-slate-100/30 dark:hover:bg-slate-850/10 transition-colors duration-150"
              >
                <span className="font-extrabold text-slate-900 dark:text-slate-105 min-w-[140px] tracking-tight">
                  {item.outlet}
                </span>
                <span className="text-slate-600 dark:text-slate-400 italic text-sm text-left sm:pl-4 mt-1 sm:mt-0 font-medium">
                  Focus: {item.angle}
                </span>
              </div>
            ))
          ) : (
            <div className="p-5 text-sm text-slate-400 italic text-center select-none">
              No coverage outlets currently indexed for comparison.
            </div>
          )}
        </div>
      </div>

      {/* 3. Read Original CTA Button */}
      <div className="flex justify-center pt-6 mt-8">
        <a
          href={articleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-6 py-3 rounded-lg font-bold hover:opacity-90 transition text-center shadow-sm text-sm tracking-wide"
        >
          Read Full Report on {sourceName} →
        </a>
      </div>
    </div>
  );
}
