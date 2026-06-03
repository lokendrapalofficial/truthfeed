"use client";

import React, { useState, useTransition, useEffect } from "react";
import { analyzeArticle, GeminiAnalysisResult } from "@/app/actions/analyzeArticle";
import { fetchFactChecks, MappedFactCheck } from "@/app/actions/fetchFactChecks";
import { Shield, Sparkles, CheckCircle, Search, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";

interface ArticleAnalysisProps {
  articleId: string;
  articleTitle: string;
}

export default function ArticleAnalysis({ articleId, articleTitle }: ArticleAnalysisProps) {
  const [isPending, startTransition] = useTransition();
  const [analysis, setAnalysis] = useState<GeminiAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const [factChecks, setFactChecks] = useState<MappedFactCheck[]>([]);
  const [loadingFactChecks, setLoadingFactChecks] = useState<boolean>(true);
  const [factCheckError, setFactCheckError] = useState<string | null>(null);
  const [isFactCheckMock, setIsFactCheckMock] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadFactChecks = async () => {
      setLoadingFactChecks(true);
      setFactCheckError(null);
      try {
        const result = await fetchFactChecks(articleTitle);
        if (!isMounted) return;
        if (result.success && result.reviews) {
          setFactChecks(result.reviews);
          setIsFactCheckMock(!!result.isMock);
        } else {
          setFactCheckError(result.error || "Failed to fetch professional reviews");
        }
      } catch (err: any) {
        if (!isMounted) return;
        setFactCheckError(err.message || String(err));
      } finally {
        if (isMounted) setLoadingFactChecks(false);
      }
    };
    loadFactChecks();
    return () => { isMounted = false; };
  }, [articleTitle]);

  // Light-mode only rating styles — all on white backgrounds
  const getRatingStyles = (rating: string) => {
    const r = rating.toLowerCase();
    if (r === "true" || r === "correct" || r === "accurate" || r === "mostly true") {
      return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
    }
    if (r === "false" || r === "mostly false" || r === "fake" || r === "incorrect" || r === "untrue") {
      return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" };
    }
    if (r.includes("mixed") || r.includes("misleading") || r.includes("partly") || r.includes("half") || r.includes("somewhat") || r.includes("context")) {
      return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
    }
    return { bg: "bg-zinc-50", text: "text-zinc-600", border: "border-zinc-200" };
  };

  const handleRunAnalysis = () => {
    setError(null);
    startTransition(async () => {
      const result = await analyzeArticle(articleId);
      if (result.success && result.analysis) {
        setAnalysis(result.analysis);
        setIsMock(!!result.isMock);
      } else {
        setError(result.error || "Failed to retrieve AI analysis");
      }
    });
  };

  return (
    <div className="w-full space-y-6 font-sans">

      {/* Run Analysis Trigger Card */}
      {!analysis && !isPending && (
        <div className="p-6 border border-zinc-200 bg-white rounded-2xl text-center shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 mx-auto mb-4 border border-zinc-200">
            <Shield className="h-5 w-5" />
          </div>
          <h3 className="font-serif text-base font-bold text-zinc-900">
            TruthFeed AI Fact-Check Audit
          </h3>
          <p className="text-zinc-500 text-[11px] mt-1.5 mb-5 max-w-xs mx-auto leading-normal">
            Extract verifiable claims, neutralize emotionally charged reporting patterns, and generate validation searches utilizing Google Gemini models.
          </p>
          <button
            onClick={handleRunAnalysis}
            className="w-full inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 duration-200 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Run TruthFeed AI Analysis</span>
          </button>
          {error && (
            <div className="mt-4 p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs text-left">
              <strong>Error Running Audit:</strong> {error}
            </div>
          )}
        </div>
      )}

      {/* Loading State Skeleton */}
      {isPending && (
        <div className="p-6 border border-zinc-200 bg-white rounded-2xl shadow-sm space-y-5 animate-pulse">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="h-3.5 w-28 bg-zinc-200 rounded" />
            <RefreshCw className="h-3.5 w-3.5 text-zinc-300 animate-spin" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-zinc-100 rounded" />
            <div className="h-3 w-5/6 bg-zinc-100 rounded" />
            <div className="h-3 w-4/5 bg-zinc-100 rounded" />
          </div>
          <div className="space-y-3 pt-3 border-t border-zinc-100">
            <div className="h-3 w-20 bg-zinc-100 rounded" />
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-3.5 bg-zinc-200 rounded-full" />
              <div className="h-2.5 w-36 bg-zinc-100 rounded" />
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results Display */}
      {analysis && !isPending && (
        <div className="p-6 border border-zinc-200 bg-white rounded-2xl shadow-sm space-y-5 transition-all duration-300">
          
          {/* Audit Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3.5">
            <div className="flex items-center gap-2 text-zinc-900">
              <Shield className="h-4.5 w-4.5 text-zinc-500" />
              <h4 className="font-serif font-black text-sm uppercase tracking-wide">TruthFeed AI Audit</h4>
            </div>
            {isMock ? (
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Demo Mock
              </span>
            ) : (
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                Gemini Active
              </span>
            )}
          </div>

          {/* Section 1: Neutral Summary */}
          <div className="space-y-1.5">
            <h5 className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
              Neutralized Summary
            </h5>
            <p className="text-xs leading-relaxed text-zinc-700 bg-zinc-50 border border-zinc-100 p-3.5 rounded-xl font-sans font-medium">
              {analysis.neutralSummary}
            </p>
          </div>

          {/* Section 2: Extracted Factual Claims */}
          <div className="space-y-2">
            <h5 className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
              Extracted Factual Claims
            </h5>
            <ul className="space-y-2.5">
              {analysis.claims.map((claim, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-zinc-700">
                  <CheckCircle className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{claim}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3: Verification Search Queries */}
          <div className="pt-4 border-t border-zinc-100 space-y-2">
            <h5 className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1">
              <Search className="h-3 w-3 text-zinc-400" />
              Verification Search Queries
            </h5>
            <div className="space-y-2">
              {analysis.searchQueries.map((query, index) => (
                <a
                  key={index}
                  href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-2.5 rounded-xl border border-zinc-100 bg-zinc-50 hover:bg-zinc-100 text-xs text-zinc-700 hover:text-zinc-900 transition-all duration-200"
                >
                  <span className="font-semibold line-clamp-1 italic">"{query}"</span>
                  <span className="text-[10px] text-zinc-400 font-bold group-hover:underline shrink-0">
                    Search &rarr;
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Re-run Audit button */}
          <div className="pt-1.5">
            <button
              onClick={handleRunAnalysis}
              className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-700 flex items-center gap-1.5 focus:outline-none transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3 w-3 text-zinc-400" />
              <span>Re-run Fact-Check Audit</span>
            </button>
          </div>

        </div>
      )}

      {/* Professional Fact-Checks Section */}
      {loadingFactChecks ? (
        <div className="p-6 border border-zinc-200 bg-white rounded-2xl shadow-sm space-y-4 animate-pulse">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="h-3.5 w-36 bg-zinc-200 rounded" />
            <div className="h-3.5 w-3.5 bg-zinc-200 rounded-full animate-spin" />
          </div>
          <div className="space-y-3">
            <div className="p-3 border border-zinc-100 rounded-lg space-y-2">
              <div className="h-3.5 w-full bg-zinc-100 rounded" />
            </div>
          </div>
        </div>
      ) : factCheckError ? (
        <div className="p-5 border border-zinc-200 bg-white rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Shield className="h-4 w-4 text-rose-500" />
            <h4 className="font-serif font-black text-sm text-zinc-900">Professional Fact-Checks</h4>
          </div>
          <p className="text-rose-600 text-xs">Failed to query fact-checks: {factCheckError}</p>
        </div>
      ) : factChecks.length === 0 ? (
        <div className="p-5 border border-zinc-200 bg-white rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Shield className="h-4 w-4 text-zinc-400" />
            <h4 className="font-serif font-black text-sm text-zinc-900">Professional Fact-Checks</h4>
          </div>
          <p className="text-zinc-500 text-xs leading-relaxed italic">
            No professional fact-checks published for this claim yet. Rely on the AI Context Analysis above.
          </p>
        </div>
      ) : (
        <div className="p-6 border border-zinc-200 bg-white rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2 text-zinc-900">
              <Shield className="h-4.5 w-4.5 text-zinc-500" />
              <h4 className="font-serif font-black text-sm uppercase tracking-wide">Professional Fact-Checks</h4>
            </div>
            {isFactCheckMock && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Demo Mock
              </span>
            )}
          </div>

          <div className="space-y-4">
            {factChecks.map((check, index) => {
              const styles = getRatingStyles(check.textualRating);
              return (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-zinc-100 bg-zinc-50 space-y-3 hover:border-zinc-200 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-zinc-800">
                      {check.publisherName}
                    </span>
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles.bg} ${styles.text} ${styles.border}`}>
                      {check.textualRating}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {check.claimText && (
                      <p className="text-xs text-zinc-500 italic leading-relaxed">
                        Claim: "{check.claimText}"
                      </p>
                    )}
                    <h5 className="text-xs font-bold leading-snug text-zinc-800">
                      {check.reviewTitle}
                    </h5>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <a
                      href={check.reviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-700 hover:text-zinc-900 transition-colors"
                    >
                      <span>Read Full Review</span>
                      <ExternalLink className="h-3 w-3 text-zinc-400" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
