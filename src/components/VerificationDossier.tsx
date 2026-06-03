"use client";

import React, { useState, useEffect } from "react";
import { ExternalLink, CheckCircle2, Circle, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeArticle, GeminiAnalysisResult } from "@/app/actions/analyzeArticle";
import { fetchFactChecks, MappedFactCheck } from "@/app/actions/fetchFactChecks";

interface VerificationDossierProps {
  articleId: string;
  articleTitle: string;
  isMockMode?: boolean;
}

export default function VerificationDossier({
  articleId,
  articleTitle,
  isMockMode = false,
}: VerificationDossierProps) {
  const [analysis, setAnalysis] = useState<GeminiAnalysisResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const [primaryFactCheck, setPrimaryFactCheck] = useState<MappedFactCheck | null>(null);
  const [factCheckLoading, setFactCheckLoading] = useState(true);
  const [factCheckReady, setFactCheckReady] = useState(false);

  // Fetch AI brief + claims
  useEffect(() => {
    let alive = true;
    const run = async () => {
      setAnalysisLoading(true);
      setAnalysisError(null);
      try {
        const res = await analyzeArticle(articleId);
        if (!alive) return;
        if (res.success && res.analysis) {
          setAnalysis(res.analysis);
          setIsMock(!!res.isMock);
        } else {
          setAnalysisError(res.error || "Analysis unavailable.");
        }
      } catch (e: any) {
        if (alive) setAnalysisError(e.message || "Unknown error");
      } finally {
        if (alive) setAnalysisLoading(false);
      }
    };
    run();
    return () => { alive = false; };
  }, [articleId]);

  // Fetch primary fact check verdict
  useEffect(() => {
    let alive = true;
    const run = async () => {
      setFactCheckLoading(true);
      try {
        const res = await fetchFactChecks(articleTitle);
        if (!alive) return;
        if (res.success && res.reviews && res.reviews.length > 0) {
          setPrimaryFactCheck(res.reviews[0]);
        } else {
          setPrimaryFactCheck(null);
        }
      } catch {
        if (alive) setPrimaryFactCheck(null);
      } finally {
        if (alive) {
          setFactCheckLoading(false);
          setFactCheckReady(true);
        }
      }
    };
    run();
    return () => { alive = false; };
  }, [articleTitle]);

  const getRatingStyle = (rating: string) => {
    const r = rating.toLowerCase();
    if (r.includes("true") || r.includes("accurate") || r.includes("correct")) {
      return {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />,
        text: "text-emerald-700 dark:text-emerald-400",
      };
    }
    if (r.includes("false") || r.includes("fake") || r.includes("incorrect")) {
      return {
        icon: <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />,
        text: "text-rose-700 dark:text-rose-400",
      };
    }
    return {
      icon: <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />,
      text: "text-amber-700 dark:text-amber-400",
    };
  };

  const SkeletonLine = ({ w = "w-full" }: { w?: string }) => (
    <div className={`h-3.5 ${w} bg-gray-100 dark:bg-slate-700 rounded-full animate-pulse`} />
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden transition-colors duration-300"
    >
      {/* Card Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-gray-900 dark:text-slate-100 font-mono">
            Verification Dossier
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isMock && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              Demo
            </span>
          )}
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            AI Powered
          </span>
        </div>
      </div>

      {/* Section 1: THE BRIEF */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700/60 space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 font-mono">
          The Brief
        </p>
        <AnimatePresence mode="wait">
          {analysisLoading ? (
            <motion.div key="brief-loading" className="space-y-2" exit={{ opacity: 0 }}>
              <SkeletonLine />
              <SkeletonLine w="w-4/5" />
            </motion.div>
          ) : analysisError ? (
            <motion.p
              key="brief-error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-gray-400 dark:text-slate-500 italic"
            >
              AI briefing temporarily unavailable.
            </motion.p>
          ) : analysis ? (
            <motion.p
              key="brief-content"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="text-sm leading-relaxed text-gray-700 dark:text-slate-300 font-sans"
            >
              {analysis.brief}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Section 2: KEY CLAIMS */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700/60 space-y-2.5">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 font-mono">
          Key Claims
        </p>
        <AnimatePresence mode="wait">
          {analysisLoading ? (
            <motion.div key="claims-loading" className="space-y-2.5" exit={{ opacity: 0 }}>
              <SkeletonLine w="w-full" />
              <SkeletonLine w="w-5/6" />
              <SkeletonLine w="w-4/6" />
            </motion.div>
          ) : analysis && analysis.claims && analysis.claims.length > 0 ? (
            <motion.ul
              key="claims-content"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className="space-y-2"
            >
              {analysis.claims.slice(0, 3).map((claim, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-slate-300 leading-relaxed font-sans">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 dark:bg-blue-500 shrink-0" />
                  <span>{claim}</span>
                </li>
              ))}
            </motion.ul>
          ) : !analysisLoading ? (
            <p className="text-xs text-gray-400 dark:text-slate-500 italic">No verifiable claims extracted.</p>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Section 3: VERIFICATION STATUS */}
      <div className="px-5 py-4 space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 font-mono">
          Verification Status
        </p>
        <AnimatePresence mode="wait">
          {factCheckLoading ? (
            <motion.div key="verdict-loading" exit={{ opacity: 0 }}>
              <SkeletonLine w="w-2/3" />
            </motion.div>
          ) : factCheckReady && primaryFactCheck ? (
            <motion.div
              key="verdict-found"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1 }}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                {getRatingStyle(primaryFactCheck.textualRating).icon}
                <span className={`text-sm font-bold ${getRatingStyle(primaryFactCheck.textualRating).text}`}>
                  Rated &ldquo;{primaryFactCheck.textualRating}&rdquo; by {primaryFactCheck.publisherName}
                </span>
              </div>
              {primaryFactCheck.reviewUrl && primaryFactCheck.reviewUrl !== "#" && (
                <a
                  href={primaryFactCheck.reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors hover:underline"
                >
                  <span>Read Report</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="verdict-none"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1 }}
              className="flex items-center gap-2"
            >
              <Circle className="h-4 w-4 text-gray-300 dark:text-slate-600 shrink-0" />
              <span className="text-sm text-gray-400 dark:text-slate-500 font-sans">
                No professional audit published yet.
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
