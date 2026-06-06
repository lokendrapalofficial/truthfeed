import React from "react";
import { VerificationScorecardData } from "@/app/actions/analyzeArticle";

interface VerificationScorecardProps {
  data: VerificationScorecardData | null;
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(5, score)) / 5;
  const barColor =
    score >= 4 ? "bg-emerald-500" : score >= 3 ? "bg-blue-500" : score >= 2 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <span className="text-sm font-bold font-mono text-slate-700 dark:text-slate-300 w-8 text-right shrink-0">
        {score}/5
      </span>
    </div>
  );
}

export default function VerificationScorecard({ data }: VerificationScorecardProps) {
  if (!data) {
    return (
      <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-4 text-center">
        <p className="text-xs font-mono text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          TruthFeed Intelligence is compiling the verification scorecard…
        </p>
      </div>
    );
  }

  const levelConfig: Record<string, { label: string; badge: string; ring: string }> = {
    High: {
      label: "HIGH CONFIDENCE",
      badge: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700",
      ring: "border-emerald-300 dark:border-emerald-700",
    },
    Medium: {
      label: "MEDIUM CONFIDENCE",
      badge: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700",
      ring: "border-blue-300 dark:border-blue-700",
    },
    Low: {
      label: "LOW CONFIDENCE",
      badge: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600",
      ring: "border-slate-300 dark:border-slate-600",
    },
    Conflicting: {
      label: "CONFLICTING REPORTS",
      badge: "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700",
      ring: "border-rose-300 dark:border-rose-700",
    },
  };

  const cfg = levelConfig[data.confidenceLevel] || levelConfig["Low"];

  return (
    <div className={`rounded-xl border ${cfg.ring} bg-white dark:bg-slate-900 p-5 space-y-4`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
            TruthFeed Verification Scorecard
          </p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug line-clamp-2">
            {data.coreClaim}
          </p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center text-[9px] font-mono font-bold border px-2.5 py-1 rounded-full uppercase tracking-wider ${cfg.badge}`}
        >
          {cfg.label}
        </span>
      </div>

      {/* Score bar */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Consensus Score
        </p>
        <ScoreBar score={data.consensusScore} />
      </div>

      {/* Conflict report */}
      {data.conflictReport && (
        <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Conflict Report: </span>
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

      {/* Footer attribution */}
      <div className="flex items-center gap-1.5 pt-1">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-600">
          Generated by TruthFeed Intelligence
        </span>
      </div>
    </div>
  );
}
