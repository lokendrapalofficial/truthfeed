import React from "react";
import { VerificationScorecardData } from "@/app/actions/analyzeArticle";

interface VerificationScorecardProps {
  data: VerificationScorecardData | null;
  category?: string;
  totalSources?: number;
}

export default function VerificationScorecard({ data, category, totalSources }: VerificationScorecardProps) {
  if (!data) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-850/40 p-4 text-center">
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider animate-pulse">
          Compiling verification scorecard…
        </p>
      </div>
    );
  }

  const total = typeof totalSources === "number" ? totalSources : 1;
  const levelStr = data.confidenceLevel as string;
  const isSingleSource = levelStr === "Single-Source Verified" || levelStr === "Single Source" || levelStr === "Standalone Report" || total === 1;

  const conflictReportStr = data.conflictReport || "";
  const hasDiscrepancies = conflictReportStr.toLowerCase() !== "none" && conflictReportStr.trim().length > 0 && conflictReportStr.toLowerCase() !== "none.";
  const score = Math.round(data.consensusScore * 20);

  let state: "verified" | "single" | "developing" | "divergent" = "developing";
  
  if (isSingleSource) {
    state = "single";
  } else if (hasDiscrepancies || levelStr === "Conflicting" || score < 60) {
    state = "divergent";
  } else if (total >= 4 && score >= 80) {
    state = "verified";
  } else {
    state = "developing";
  }

  let pillText = "Developing Feed";
  let pillColor = "text-amber-700 dark:text-amber-450 bg-amber-50 dark:bg-amber-955/20 border-amber-200 dark:border-amber-800";
  let dotColor = "bg-amber-500";
  let scoreDisplay = `(${score}/100)`;
  
  let headerTagText = "DEVELOPING STAGE";
  let headerTagColor = "text-slate-650 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700";

  if (state === "single") {
    pillText = "Single-Source Verified";
    pillColor = "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40";
    dotColor = "bg-blue-550";
    scoreDisplay = "(N/A - Standalone)";
    headerTagText = "SYSTEM AUDIT";
    headerTagColor = "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700";
  } else if (state === "verified") {
    pillText = "Verified Consensus";
    pillColor = "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40";
    dotColor = "bg-emerald-500";
    scoreDisplay = `(${score}/100)`;
    headerTagText = "HIGH CONFIDENCE";
    headerTagColor = "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-250 dark:border-emerald-800";
  } else if (state === "divergent") {
    pillText = "Conflicting Reports";
    pillColor = "text-rose-700 dark:text-rose-455 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40";
    dotColor = "bg-rose-500";
    scoreDisplay = `(${score}/100)`;
    headerTagText = "SYSTEM AUDIT";
    headerTagColor = "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700";
  }

  return (
    <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 p-5 space-y-4 transition-colors">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
          Newsroom &gt; {category || "Verification"} Desk
        </div>
        <span
          className={`shrink-0 inline-flex items-center text-[9px] font-mono font-bold border px-2.5 py-0.5 rounded-full uppercase tracking-wider ${headerTagColor}`}
        >
          {headerTagText}
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
            {scoreDisplay}
          </span>
        </div>
      </div>

      {/* Conflict / Discrepancy report */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
        {hasDiscrepancies ? (
          <div className="rounded-lg p-3 bg-rose-50/50 dark:bg-rose-955/10 border border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-350 leading-relaxed">
            <span className="font-bold block mb-1 uppercase tracking-wider text-[10px] text-rose-600 dark:text-rose-400">
              Discrepancy Alert
            </span>
            {conflictReportStr}
          </div>
        ) : (
          <div className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1.5 leading-relaxed">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-650 shrink-0" />
            <span>No contradictions flagged across tracked outlets.</span>
          </div>
        )}
      </div>

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
