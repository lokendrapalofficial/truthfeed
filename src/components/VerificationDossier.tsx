"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import { MappedFactCheck } from "@/app/actions/fetchFactChecks";

interface VerificationDossierProps {
  articleId: string;
  articleTitle: string;
  sourceName: string;
  relatedSources?: any; // JSON array from database
  analysisClaim: string | null; // Extracted claim from Groq
  primaryFactCheck: MappedFactCheck | null;
}

const renderVerdictBadge = (
  primaryFactCheck: MappedFactCheck | null,
  relatedSourcesCount: number
) => {
  if (primaryFactCheck) {
    const rating = primaryFactCheck.textualRating;
    const publisher = primaryFactCheck.publisherName;
    const r = rating.toLowerCase();
    
    if (r.includes("true") || r.includes("accurate") || r.includes("correct") || r === "verified") {
      return (
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/80 shadow-sm">
          <span>🟢 Rated {rating} by {publisher}</span>
        </div>
      );
    }
    if (r.includes("false") || r.includes("fake") || r.includes("incorrect")) {
      return (
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase bg-rose-50 text-rose-700 border border-rose-250 dark:bg-rose-955/40 dark:text-rose-450 dark:border-rose-900/80 shadow-sm">
          <span>🔴 Rated {rating} by {publisher}</span>
        </div>
      );
    }
    // Mixed, misleading
    return (
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase bg-amber-50 text-amber-700 border border-amber-250 dark:bg-amber-955/40 dark:text-amber-450 dark:border-amber-900/80 shadow-sm">
        <span>🟡 Rated {rating} by {publisher}</span>
      </div>
    );
  }

  // Consensus fallback
  if (relatedSourcesCount > 2) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/80 shadow-sm">
        <span>🟢 High Consensus: Independently verified by {relatedSourcesCount} major outlets.</span>
      </div>
    );
  }

  // Awaiting audit fallback
  return (
    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase bg-gray-50 text-gray-500 border border-gray-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700 shadow-sm">
      <span>◯ Awaiting Professional Audit</span>
    </div>
  );
};

export default function VerificationDossier({
  articleTitle,
  relatedSources,
  analysisClaim,
  primaryFactCheck,
}: VerificationDossierProps) {
  const sourcesList = Array.isArray(relatedSources) ? relatedSources : [];

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm transition-colors duration-300 flex flex-col gap-5">
      
      {/* SECTION 1: THE CLAIM */}
      <div className="flex flex-col">
        <span className="font-mono text-[10px] tracking-wider text-gray-400 dark:text-slate-500 uppercase font-black mb-2">
          THE CLAIM
        </span>
        {analysisClaim ? (
          <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-1 italic font-semibold text-gray-900 dark:text-slate-100 text-base leading-relaxed">
            &ldquo;{analysisClaim}&rdquo;
          </blockquote>
        ) : (
          <div className="space-y-2 py-1">
            <div className="h-4 w-full bg-gray-150 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-150 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        )}
      </div>

      {/* SECTION 2: THE VERDICT */}
      <div className="flex flex-col items-start border-t border-gray-100 dark:border-slate-700/60 pt-4">
        <span className="font-mono text-[10px] tracking-wider text-gray-400 dark:text-slate-500 uppercase font-black mb-2.5">
          THE VERDICT
        </span>
        {renderVerdictBadge(primaryFactCheck, sourcesList.length)}
      </div>

      {/* SECTION 3: THE EVIDENCE: CROSS-REFERENCE */}
      <div className="flex flex-col border-t border-gray-100 dark:border-slate-700/60 pt-4">
        <span className="font-mono text-[10px] tracking-wider text-gray-400 dark:text-slate-500 uppercase font-black mb-3">
          INDEPENDENT CORROBORATION
        </span>
        {sourcesList.length > 0 ? (
          <ul className="space-y-3">
            {sourcesList.map((item: any, idx: number) => (
              <li key={idx} className="text-sm leading-relaxed text-gray-700 dark:text-slate-350 flex items-start gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                <div>
                  <span className="font-bold text-gray-900 dark:text-slate-200">{item.sourceName || "Alternative Source"}: </span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-800 dark:hover:text-blue-300 font-medium inline-flex items-center gap-0.5"
                  >
                    <span>&ldquo;{item.title}&rdquo;</span>
                    <ExternalLink className="h-3 w-3 inline opacity-70" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-450 dark:text-slate-500 italic">
            No independent corroborative coverages mapped in RSS feed description.
          </p>
        )}
      </div>
      
    </div>
  );
}
