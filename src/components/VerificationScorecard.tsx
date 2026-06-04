"use client";

import React from "react";
import { ShieldCheck, AlertTriangle, AlertCircle, ExternalLink } from "lucide-react";
import { VerificationScorecardData } from "@/app/actions/analyzeArticle";

interface VerificationScorecardProps {
  data: VerificationScorecardData | null;
}

export default function VerificationScorecard({ data }: VerificationScorecardProps) {
  if (!data) return null;

  const audit = data.professionalAudit;
  const isHumanAudit = !!audit;

  // Determine professional audit details if present
  let statusText = "";
  let statusColorClass = "";
  let statusBgClass = "";
  let IconComponent = ShieldCheck;
  let isDebunked = false;
  let badgeLabel = "";

  if (isHumanAudit && audit) {
    const ratingLower = audit.textualRating.toLowerCase();
    if (
      ratingLower.includes("false") ||
      ratingLower.includes("fake") ||
      ratingLower.includes("incorrect") ||
      ratingLower.includes("debunked") ||
      ratingLower.includes("misleading") ||
      ratingLower.includes("pants on fire")
    ) {
      isDebunked = true;
      statusText = `DEBUNKED // RATED ${audit.textualRating.toUpperCase()}`;
      statusColorClass = "text-rose-600 dark:text-rose-400";
      statusBgClass = "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60";
      IconComponent = AlertCircle;
      badgeLabel = `❌ Debunked by ${audit.publisherName}`;
    } else if (
      ratingLower.includes("true") ||
      ratingLower.includes("correct") ||
      ratingLower.includes("accurate")
    ) {
      statusText = `VERIFIED TRUE`;
      statusColorClass = "text-emerald-600 dark:text-emerald-450";
      statusBgClass = "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-900/60";
      IconComponent = ShieldCheck;
      badgeLabel = `✅ Verified by ${audit.publisherName}`;
    } else {
      statusText = `HUMAN AUDIT // RATED ${audit.textualRating.toUpperCase()}`;
      statusColorClass = "text-amber-600 dark:text-amber-450";
      statusBgClass = "bg-amber-50 dark:bg-amber-950/20 border-amber-250 dark:border-amber-900/60";
      IconComponent = AlertTriangle;
      badgeLabel = `⚠️ Rated "${audit.textualRating}" by ${audit.publisherName}`;
    }
  } else {
    // AI audit status mapping
    const conf = data.confidenceLevel || "Medium";
    if (conf === "High") {
      statusText = "VERIFICATION STATUS: HIGH CONFIDENCE";
      statusColorClass = "text-emerald-600 dark:text-emerald-450";
      statusBgClass = "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-900/60";
      IconComponent = ShieldCheck;
    } else if (conf === "Medium") {
      statusText = "VERIFICATION STATUS: MEDIUM CONFIDENCE";
      statusColorClass = "text-amber-600 dark:text-amber-450";
      statusBgClass = "bg-amber-50 dark:bg-amber-950/20 border-amber-250 dark:border-amber-900/60";
      IconComponent = AlertTriangle;
    } else {
      statusText = `VERIFICATION STATUS: ${conf.toUpperCase()} / LOW CONFIDENCE`;
      statusColorClass = "text-rose-600 dark:text-rose-450";
      statusBgClass = "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60";
      IconComponent = AlertCircle;
    }
  }

  // Corroboration progress bar colors
  const consensusScore = data.consensusScore || 0;
  const barPercentage = Math.min(Math.max((consensusScore / 5) * 100, 0), 100);
  let barColorClass = "bg-amber-500";
  if (consensusScore >= 4) barColorClass = "bg-emerald-500";
  else if (consensusScore <= 1) barColorClass = "bg-rose-500";

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl p-5 shadow-sm space-y-4">
      {/* Verdict Header Badge Banner */}
      <div className={`flex items-center gap-2.5 p-3 rounded-lg border ${statusBgClass}`}>
        <IconComponent className={`h-5 w-5 shrink-0 ${statusColorClass}`} />
        <span className={`text-xs font-bold font-mono tracking-widest uppercase ${statusColorClass}`}>
          {statusText}
        </span>
      </div>

      {/* Grid: Claim & Details */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-1">
        {/* Left Column: The Core Claim */}
        <div className="md:col-span-6 space-y-1">
          <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
            Core Claim Under Review
          </span>
          <p className="font-serif text-base text-slate-800 dark:text-slate-250 leading-relaxed font-medium">
            &ldquo;{data.coreClaim}&rdquo;
          </p>
        </div>

        {/* Right Column: Desk Audit Metrics */}
        <div className="md:col-span-6 space-y-4 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700/60 pt-4 md:pt-0 md:pl-5">
          {/* Corroboration Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono tracking-wider uppercase text-slate-400 dark:text-slate-500">
              <span>Independent Corroboration</span>
              <span className="font-bold text-slate-700 dark:text-slate-350">
                {consensusScore}/5 Global Desks
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColorClass}`}
                style={{ width: `${barPercentage}%` }}
              />
            </div>
          </div>

          {/* Conflict Report */}
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
              Conflict Report
            </span>
            <p className="text-xs text-slate-650 dark:text-slate-300 leading-normal">
              {data.conflictReport || "None detected across global reporting feeds."}
            </p>
          </div>

          {/* AI Reasoning */}
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
              Audit Reasoning
            </span>
            <p className="text-xs text-slate-655 dark:text-slate-350 leading-normal font-sans italic">
              {data.reasoning}
            </p>
          </div>
        </div>
      </div>

      {/* Professional Audit Badge Banner Overlay */}
      {isHumanAudit && audit && (
        <div className="mt-4 p-3 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 rounded-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              {badgeLabel}
            </span>
          </div>
          <a
            href={audit.reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-blue-600 hover:text-blue-750 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1 hover:underline select-none whitespace-nowrap shrink-0"
          >
            <span>Read Full Audit</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}
