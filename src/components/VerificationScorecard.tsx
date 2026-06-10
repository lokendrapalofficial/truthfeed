import React from "react";
import { VerificationScorecardData } from "@/app/actions/analyzeArticle";

interface VerificationScorecardProps {
  data: VerificationScorecardData | null;
  category?: string;
}

export default function VerificationScorecard({ data, category }: VerificationScorecardProps) {
  if (!data) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-850/40 p-4 text-center">
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider animate-pulse">
          Compiling verification scorecard…
        </p>
      </div>
    );
  }

  const levelStr = data.confidenceLevel as string;
  const isSingleSource = levelStr === "Single-Source Verified" || levelStr === "Single Source" || levelStr === "Standalone Report";
  const isConflict = !isSingleSource && (levelStr === "Conflicting" || data.consensusScore < 3.5);

  let pillText = "High Consensus";
  let pillColor = "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40";
  let dotColor = "bg-emerald-500";

  if (isSingleSource) {
    pillText = "Single-Source Verified";
    pillColor = "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40";
    dotColor = "bg-blue-500";
  } else if (isConflict) {
    pillText = "Conflicting Reports";
    pillColor = "text-rose-700 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40";
    dotColor = "bg-rose-500";
  }

  return (
    <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 p-5 space-y-4 transition-colors">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
          Newsroom &gt; {category || "Verification"} Desk
        </div>
        <span
          className={`shrink-0 inline-flex items-center text-[9px] font-mono font-bold border px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
            isSingleSource
              ? "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
              : isConflict
              ? "text-rose-700 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800"
              : "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-250 dark:border-emerald-800"
          }`}
        >
          {isSingleSource ? data.confidenceLevel : `${data.confidenceLevel} CONFIDENCE`}
        </span>
      </div>

      {/* Consensus Pill tag instead of progress bar */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
          Consensus Verdict
        </span>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${pillColor}`}>
            <span className={`h-2 w-2 rounded-full ${dotColor}`} />
            {pillText}
          </span>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            ({Math.round(data.consensusScore * 20)}/100)
          </span>
        </div>
      </div>

      {/* Conflict report */}
      {data.conflictReport && (
        <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
          <span className="font-semibold text-slate-850 dark:text-slate-200">Discrepancy Report: </span>
          {data.conflictReport}
        </div>
      )}

      {/* Reasoning */}
      {data.reasoning && (
        <div className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed italic">
          {data.reasoning}
        </div>
      )}

      {/* Professional Audit */}
      {data.professionalAudit && (
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-start gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0 mt-0.5">
            Fact-Checked by:
          </span>
          <div className="min-w-0">
            <a
              href={data.professionalAudit.reviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline block truncate"
            >
              {data.professionalAudit.publisherName}
            </a>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-500 uppercase">
              {data.professionalAudit.textualRating}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
