"use client";

import React, { useEffect, useState } from "react";
import { fetchFactChecks, MappedFactCheck } from "@/app/actions/fetchFactChecks";
import { GeminiAnalysisResult } from "@/app/actions/analyzeArticle";
import { Shield, Sparkles, CheckCircle, Search, RefreshCw, ExternalLink } from "lucide-react";

interface ArticleAnalysisProps {
  articleId: string;
  articleTitle: string;
  analysis: GeminiAnalysisResult | null;
  analyzing: boolean;
  analysisError: string | null;
  isMockAnalysis?: boolean;
}

export default function ArticleAnalysis({
  articleId,
  articleTitle,
  analysis,
  analyzing,
  analysisError,
  isMockAnalysis = false,
}: ArticleAnalysisProps) {
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
    return { bg: "bg-stone-50", text: "text-stone-600", border: "border-stone-200" };
  };

  return (
    <div className="w-full space-y-6 font-sans">

      {/* Loading State Skeleton for AI Audit */}
      {analyzing && (
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
      )}

      {/* Analysis Results Display */}
      {!analyzing && analysis && (
        <div className="p-5 border border-stone-200 bg-white rounded-xl shadow-sm space-y-4 transition-all duration-300">
          
          {/* Audit Header */}
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <div className="flex items-center gap-1.5 text-stone-900">
              <Shield className="h-4.5 w-4.5 text-stone-500" />
              <h4 className="font-serif font-black text-xs uppercase tracking-wider">TruthFeed AI Audit</h4>
            </div>
            {isMockAnalysis ? (
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Demo Mock
              </span>
            ) : (
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                Gemini Active
              </span>
            )}
          </div>

          {/* Section 1: Neutral Summary */}
          <div className="space-y-1">
            <h5 className="text-[9px] uppercase font-bold tracking-wider text-stone-400">
              Neutralized Summary
            </h5>
            <p className="text-xs leading-relaxed text-stone-700 bg-stone-50 border border-stone-100 p-3 rounded-lg font-sans font-medium">
              {analysis.neutralSummary}
            </p>
          </div>

          {/* Section 2: Extracted Factual Claims */}
          <div className="space-y-1.5">
            <h5 className="text-[9px] uppercase font-bold tracking-wider text-stone-400">
              Extracted Factual Claims
            </h5>
            <ul className="space-y-2">
              {analysis.claims.map((claim, index) => (
                <li key={index} className="flex items-start gap-1.5 text-xs text-stone-700">
                  <CheckCircle className="h-3.5 w-3.5 text-stone-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{claim}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3: Verification Search Queries */}
          <div className="pt-3 border-t border-stone-100 space-y-1.5">
            <h5 className="text-[9px] uppercase font-bold tracking-wider text-stone-400 flex items-center gap-1">
              <Search className="h-3 w-3 text-stone-400" />
              Verification Search Queries
            </h5>
            <div className="space-y-1.5">
              {analysis.searchQueries.map((query, index) => (
                <a
                  key={index}
                  href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-2 rounded border border-stone-100 bg-stone-50 hover:bg-stone-100 text-xs text-stone-700 hover:text-stone-900 transition-all duration-200"
                >
                  <span className="font-semibold line-clamp-1 italic">"{query}"</span>
                  <span className="text-[9px] text-stone-400 font-bold group-hover:underline shrink-0">
                    Search &rarr;
                  </span>
                </a>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Analysis Error State */}
      {!analyzing && analysisError && (
        <div className="p-4 rounded-xl border border-rose-250 bg-rose-50 text-rose-700 text-xs text-left">
          <strong>Error Running Audit:</strong> {analysisError}
        </div>
      )}

      {/* Professional Fact-Checks Section */}
      {loadingFactChecks ? (
        <div className="p-5 border border-stone-200 bg-white rounded-xl shadow-sm space-y-3 animate-pulse">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div className="h-3.5 w-32 bg-stone-200 rounded" />
            <div className="h-3.5 w-3.5 bg-stone-200 rounded-full animate-spin" />
          </div>
          <div className="h-8 bg-stone-100 rounded" />
        </div>
      ) : factCheckError ? (
        <div className="p-4 border border-stone-200 bg-white rounded-xl shadow-sm space-y-2">
          <h4 className="font-serif font-black text-xs uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-2">Professional Fact-Checks</h4>
          <p className="text-rose-600 text-xs">Failed to query fact-checks: {factCheckError}</p>
        </div>
      ) : factChecks.length === 0 ? (
        <div className="p-4 border border-stone-200 bg-white rounded-xl shadow-sm space-y-2">
          <h4 className="font-serif font-black text-xs uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-2">Professional Fact-Checks</h4>
          <p className="text-stone-500 text-xs leading-relaxed italic">
            No professional fact-checks published for this claim yet. Rely on the AI Context Analysis above.
          </p>
        </div>
      ) : (
        <div className="p-5 border border-stone-200 bg-white rounded-xl shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div className="flex items-center gap-1.5 text-stone-900">
              <Shield className="h-4.5 w-4.5 text-stone-500" />
              <h4 className="font-serif font-black text-xs uppercase tracking-wider">Professional Fact-Checks</h4>
            </div>
            {isFactCheckMock && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Demo Mock
              </span>
            )}
          </div>

          <div className="space-y-3">
            {factChecks.map((check, index) => {
              const styles = getRatingStyles(check.textualRating);
              return (
                <div
                  key={index}
                  className="p-3 rounded border border-stone-100 bg-stone-50 space-y-2 hover:border-stone-200 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-stone-850">
                      {check.publisherName}
                    </span>
                    <span className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded border ${styles.bg} ${styles.text} ${styles.border}`}>
                      {check.textualRating}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {check.claimText && (
                      <p className="text-[10px] text-stone-500 italic leading-relaxed">
                        Claim: "{check.claimText}"
                      </p>
                    )}
                    <h5 className="text-xs font-bold leading-snug text-stone-800">
                      {check.reviewTitle}
                    </h5>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <a
                      href={check.reviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-[9px] font-bold text-stone-700 hover:text-stone-900 transition-colors"
                    >
                      <span>Read Full Review</span>
                      <ExternalLink className="h-2.5 w-2.5 text-stone-400" />
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
