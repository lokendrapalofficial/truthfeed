"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Globe, Shield, Sparkles, Activity, MessageSquare, ChevronDown, ChevronUp, Search, ExternalLink, Sun, Moon } from "lucide-react";
import ShareWidget from "@/components/ShareWidget";
import SourceBadge from "@/components/SourceBadge";
import CommunityNotesSection, { NoteItem } from "@/components/CommunityNotesSection";
import PublisherVisual from "@/components/PublisherVisual";
import { analyzeArticle } from "@/app/actions/analyzeArticle";
import { getPerspectives, PerspectivesResult } from "@/app/actions/getPerspectives";
import { fetchFactChecks, MappedFactCheck } from "@/app/actions/fetchFactChecks";
import { parseRelatedArticles } from "@/lib/rssParser";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

interface ArticleClientProps {
  article: any;
  serializedNotes: NoteItem[];
}

// Utility to clean up headline by stripping publisher name suffixes (e.g., " - CNN")
function getCleanHeadline(title: string, sourceName: string): string {
  if (!title) return "";
  let clean = title.trim();
  const escapedSource = sourceName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`\\s*[-|]\\s*${escapedSource}\\s*$`, 'i');
  clean = clean.replace(regex, '');
  return clean;
}

export default function ArticleClient({ article, serializedNotes }: ArticleClientProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activePerspectiveTab, setActivePerspectiveTab] = useState<"left" | "center" | "right">("center");
  
  // Coverage Perspectives States
  const [perspectives, setPerspectives] = useState<PerspectivesResult | null>(null);
  const [loadingPerspectives, setLoadingPerspectives] = useState(true);
  const [perspectivesError, setPerspectivesError] = useState<string | null>(null);

  // Gemini AI Analysis States (Auto-run on mount)
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [analyzing, setAnalyzing] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isMockAnalysis, setIsMockAnalysis] = useState(false);

  // Real-time Professional Fact-Checks States
  const [factChecks, setFactChecks] = useState<MappedFactCheck[]>([]);
  const [loadingFactChecks, setLoadingFactChecks] = useState(true);
  const [factCheckError, setFactCheckError] = useState<string | null>(null);
  const [isFactCheckMock, setIsFactCheckMock] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-run AI Fact-Check Audit when component mounts
  useEffect(() => {
    let isMounted = true;
    const runAIAnalysis = async () => {
      setAnalyzing(true);
      setAnalysisError(null);
      try {
        const result = await analyzeArticle(article.id);
        if (!isMounted) return;
        if (result.success && result.analysis) {
          setAnalysis(result.analysis);
          setIsMockAnalysis(!!result.isMock);
        } else {
          setAnalysisError(result.error || "Failed to retrieve AI analysis");
        }
      } catch (err: any) {
        if (isMounted) {
          setAnalysisError(err.message || String(err));
        }
      } finally {
        if (isMounted) setAnalyzing(false);
      }
    };
    runAIAnalysis();
    return () => { isMounted = false; };
  }, [article.id]);

  // Fetch coverage perspectives
  useEffect(() => {
    let isMounted = true;
    const fetchCoveragePerspectives = async () => {
      setLoadingPerspectives(true);
      setPerspectivesError(null);
      try {
        const result = await getPerspectives(article.id);
        if (!isMounted) return;
        if (result.success && result.perspectives) {
          setPerspectives(result.perspectives);
        } else {
          setPerspectivesError(result.error || "Failed to retrieve coverage perspectives.");
        }
      } catch (err: any) {
        if (isMounted) {
          setPerspectivesError(err.message || String(err));
        }
      } finally {
        if (isMounted) setLoadingPerspectives(false);
      }
    };

    fetchCoveragePerspectives();
    return () => { isMounted = false; };
  }, [article.id]);

  // Fetch real-time professional fact checks based on article title
  useEffect(() => {
    let isMounted = true;
    const loadFactChecks = async () => {
      setLoadingFactChecks(true);
      setFactCheckError(null);
      try {
        const result = await fetchFactChecks(article.title);
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
  }, [article.title]);

  // Credibility score meter values with Twitter dark theme support
  const getCredibilityScore = (credibility?: string) => {
    switch (credibility) {
      case "VERY_HIGH":
        return { label: "Very High", percentage: 95, color: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", bgLight: "bg-emerald-50 dark:bg-emerald-950/20" };
      case "HIGH":
        return { label: "High", percentage: 80, color: "bg-emerald-500", text: "text-emerald-650 dark:text-emerald-400", bgLight: "bg-emerald-50 dark:bg-emerald-950/20" };
      case "MEDIUM":
        return { label: "Medium", percentage: 55, color: "bg-amber-500", text: "text-amber-650 dark:text-amber-400", bgLight: "bg-amber-50 dark:bg-amber-950/20" };
      case "LOW":
        return { label: "Low", percentage: 30, color: "bg-rose-500", text: "text-rose-650 dark:text-rose-400", bgLight: "bg-rose-50 dark:bg-rose-950/20" };
      case "VERY_LOW":
        return { label: "Very Low", percentage: 15, color: "bg-rose-600", text: "text-rose-700 dark:text-rose-400", bgLight: "bg-rose-50 dark:bg-rose-950/20" };
      default:
        return { label: "Unrated", percentage: 0, color: "bg-gray-300 dark:bg-slate-700", text: "text-gray-500 dark:text-slate-400", bgLight: "bg-gray-50 dark:bg-slate-800/40" };
    }
  };

  const getBiasPill = (bias?: string) => {
    if (!bias) return { label: "Independent", style: "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-750" };
    switch (bias) {
      case "LEFT":
        return { label: "Left Bias", style: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/80" };
      case "LEAN_LEFT":
        return { label: "Lean Left", style: "bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/80" };
      case "CENTER":
        return { label: "Center/Neutral", style: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80" };
      case "LEAN_RIGHT":
        return { label: "Lean Right", style: "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/80" };
      case "RIGHT":
        return { label: "Right Bias", style: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/80" };
      default:
        return { label: bias, style: "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-750" };
    }
  };

  const getRatingStyles = (rating: string) => {
    const r = rating.toLowerCase();
    if (r === "true" || r === "correct" || r === "accurate" || r === "mostly true") {
      return { bg: "bg-emerald-50 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-850" };
    }
    if (r === "false" || r === "mostly false" || r === "fake" || r === "incorrect" || r === "untrue") {
      return { bg: "bg-rose-50 dark:bg-rose-900/40", text: "text-rose-700 dark:text-rose-450", border: "border-rose-200 dark:border-rose-850" };
    }
    if (r.includes("mixed") || r.includes("misleading") || r.includes("partly") || r.includes("half") || r.includes("somewhat") || r.includes("context")) {
      return { bg: "bg-amber-50 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-850" };
    }
    return { bg: "bg-gray-50 dark:bg-slate-800/60", text: "text-gray-600 dark:text-slate-400", border: "border-gray-200 dark:border-slate-750" };
  };

  const cred = getCredibilityScore(article.source?.credibility);
  const biasPill = getBiasPill(article.source?.bias);
  const formattedDate = new Date(article.publishedAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Headline cleanup
  const cleanTitle = getCleanHeadline(article.title, article.sourceName);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300">
      
      {/* Mini Editorial Navbar with aligned back button and logo */}
      <nav className="border-b border-gray-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Newsroom</span>
          </Link>
          
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {mounted && resolvedTheme === "dark" ? (
                <Sun className="h-4.5 w-4.5" />
              ) : (
                <Moon className="h-4.5 w-4.5" />
              )}
            </button>

            <div className="flex items-center gap-1.5 select-none">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs tracking-tight transition-colors duration-300">
                T
              </div>
              <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-slate-100">
                TruthFeed
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Single Column Layout */}
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 sm:px-6 py-6 space-y-6">
        
        {/* Article Metadata (Tight spacing, reduced margins) */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
          <SourceBadge sourceName={article.sourceName} source={article.source} />
          <span>•</span>
          <div className="flex items-center gap-1 text-gray-500 dark:text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Clean Headline (Sans-serif, bold, tight spacing) */}
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-955 dark:text-slate-100">
          {cleanTitle}
        </h1>

        {/* Cover Thumbnail Image Fallback */}
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm relative">
          <PublisherVisual sourceName={article.sourceName} viewMode="detail" />
        </div>

        {/* TASK 4: AI Briefing Box (bg-blue-50 with sparkle icon) at the top of coverage */}
        <section className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl p-5 sm:p-6 space-y-4 transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-blue-150 dark:border-blue-900/40 pb-2">
            <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-300">
              <Sparkles className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400 fill-blue-100 dark:fill-blue-950" />
              <h2 className="font-bold text-sm uppercase tracking-wider">TruthFeed AI Briefing</h2>
            </div>
            {isMockAnalysis ? (
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Demo Mock
              </span>
            ) : (
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-250 dark:border-emerald-800/80">
                Active
              </span>
            )}
          </div>

          {analyzing ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-3.5 bg-blue-100 dark:bg-blue-900 rounded w-full" />
              <div className="h-3.5 bg-blue-100 dark:bg-blue-900 rounded w-5/6" />
              <div className="h-3.5 bg-blue-100 dark:bg-blue-900 rounded w-2/3" />
            </div>
          ) : analysisError ? (
            <p className="text-xs text-red-650">Failed to load briefing: {analysisError}</p>
          ) : analysis ? (
            <div className="space-y-4 text-xs sm:text-sm">
              <p className="leading-relaxed text-blue-955 dark:text-blue-200 font-medium font-sans">
                {analysis.neutralSummary}
              </p>

              {/* Extracted Factual Claims */}
              {analysis.claims && analysis.claims.length > 0 && (
                <div className="pt-3 border-t border-blue-150 dark:border-blue-900/40 space-y-1.5">
                  <h4 className="font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider text-[10px]">Extracted Factual Claims</h4>
                  <ul className="space-y-1.5">
                    {analysis.claims.map((claim: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5 text-blue-955 dark:text-blue-200 font-sans">
                        <span className="h-1.5 w-1.5 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                        <span className="leading-relaxed font-medium">{claim}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Verification Search Queries */}
              {analysis.searchQueries && analysis.searchQueries.length > 0 && (
                <div className="pt-3 border-t border-blue-150 dark:border-blue-900/40 space-y-2">
                  <h4 className="font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider text-[10px]">Verification Search Queries</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.searchQueries.map((query: string, idx: number) => (
                      <a
                        key={idx}
                        href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-100/80 dark:bg-blue-955/60 hover:bg-blue-200/85 dark:hover:bg-blue-900/60 border border-blue-200/50 dark:border-blue-805 text-blue-900 dark:text-blue-300 text-xs font-semibold hover:underline transition-all"
                      >
                        <Search className="h-3 w-3 shrink-0 text-blue-600 dark:text-blue-450" />
                        <span>"{query}"</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </section>

        {/* Original Article Link (Clean and scannable button directly below Briefing) */}
        <div className="py-2 flex justify-center border-b border-gray-200 dark:border-slate-700 pb-5">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 dark:border-slate-700 hover:border-gray-900 dark:hover:border-slate-200 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow active:scale-98 transition-all cursor-pointer"
          >
            <Globe className="h-4 w-4 text-gray-400 dark:text-slate-550" />
            <span>Read full coverage at {article.sourceName}</span>
            <ExternalLink className="h-3.5 w-3.5 text-gray-400 dark:text-slate-550" />
          </a>
        </div>

        {/* TASK 4: How Others Are Reporting This (Alternative Sources Extracted from RSS) */}
        {(() => {
          const related = parseRelatedArticles(article.content);
          return (
            <section className="space-y-4 pt-2">
              <div className="border-b border-gray-200 dark:border-slate-700 pb-2">
                <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100 tracking-tight">How Others Are Reporting This</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Alternative perspectives and headlines parsed from secondary reports on this topic.</p>
              </div>
              
              {related.length > 0 ? (
                <div className="divide-y divide-gray-150 dark:divide-slate-805">
                  {related.map((item, idx) => (
                    <div key={idx} className="py-3.5 flex items-start gap-3.5">
                      <span className="h-6 w-6 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0 border border-gray-200 dark:border-slate-700">
                        {item.source.charAt(0)}
                      </span>
                      <div className="space-y-1">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-sm text-gray-955 dark:text-slate-100 hover:text-blue-650 dark:hover:text-blue-400 leading-snug block"
                        >
                          {item.title}
                        </a>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-450">
                          <span className="font-bold text-gray-800 dark:text-slate-300">{item.source}</span>
                          <span>•</span>
                          <span>Alternative Coverage</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700 text-center text-xs text-gray-500 dark:text-slate-405 italic">
                  Only single-source reporting was found for this feed item.
                </div>
              )}
            </section>
          );
        })()}

        {/* Share Widget */}
        <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
          <ShareWidget articleTitle={cleanTitle} />
        </div>

        {/* Source Credibility Rating */}
        <section className="space-y-4 pt-4 border-t border-gray-200 dark:border-slate-700">
          <div className="border-b border-gray-200 dark:border-slate-700 pb-2">
            <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100 tracking-tight">Publisher Credibility &amp; Bias</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Independent ratings assessing factual precision and ideological lean.</p>
          </div>

          {article.source ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/40 text-xs transition-colors duration-300">
              <div className="space-y-2">
                <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold tracking-wider">Factual Credibility</span>
                <div className="flex justify-between items-center text-xs font-bold text-gray-800 dark:text-slate-300">
                  <span>{cred.label} ({cred.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-250 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden border border-gray-300 dark:border-slate-700 p-0.5">
                  <div className={`h-full rounded-full ${cred.color}`} style={{ width: `${cred.percentage}%` }} />
                </div>
              </div>

              <div className="space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold tracking-wider block mb-1">Editorial Bias Rating</span>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${biasPill.style}`}>
                    {biasPill.label}
                  </span>
                </div>
              </div>
              
              {article.source.description && (
                <div className="col-span-1 md:col-span-2 pt-3 border-t border-gray-200 dark:border-slate-700 text-xs text-gray-605 dark:text-slate-400 italic">
                  "{article.source.description}"
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-center text-xs text-gray-500 dark:text-slate-405 italic">
              This publisher rating has not been verified in our active database registry yet.
            </div>
          )}
        </section>

        {/* Media Coverage Perspectives */}
        <section className="space-y-4 pt-4 border-t border-gray-200 dark:border-slate-700">
          <div className="border-b border-gray-200 dark:border-slate-700 pb-2">
            <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100 tracking-tight">Media Coverage Perspectives</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Cross-compare political framing styles across conservative, moderate, and progressive channels.</p>
          </div>

          {loadingPerspectives ? (
            <div className="p-6 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl shadow-sm space-y-3 animate-pulse">
              <div className="h-4.5 w-1/3 bg-gray-150 dark:bg-slate-900 rounded" />
              <div className="h-3.5 w-3/4 bg-gray-100 dark:bg-slate-900/80 rounded" />
            </div>
          ) : perspectivesError ? (
            <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-center text-xs text-rose-600">
              Failed to generate coverage perspective: {perspectivesError}
            </div>
          ) : perspectives ? (
            <div className="space-y-4">
              <div className="flex border border-gray-200 dark:border-slate-700 rounded-full overflow-hidden p-0.5 bg-gray-50 dark:bg-slate-800">
                {(["left", "center", "right"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActivePerspectiveTab(tab)}
                    className={`flex-1 text-center py-2 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer ${
                      activePerspectiveTab === tab
                        ? tab === "left"
                          ? "bg-blue-600 text-white shadow-sm"
                          : tab === "right"
                          ? "bg-red-600 text-white shadow-sm"
                          : "bg-emerald-650 text-white shadow-sm"
                        : "text-gray-550 dark:text-slate-400 hover:bg-gray-150 dark:hover:bg-slate-900 hover:text-gray-800 dark:hover:text-slate-205"
                    }`}
                  >
                    {tab === "left" ? "Left Bias" : tab === "right" ? "Right Bias" : "Center / Neutral"}
                  </button>
                ))}
              </div>

              <div className="p-4.5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 rounded-xl min-h-[140px] text-xs space-y-3 transition-colors duration-300">
                <AnimatePresence mode="wait">
                  {activePerspectiveTab === "left" && (
                    <motion.div
                      key="left"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-3"
                    >
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/80">
                          Progressive Framing
                        </span>
                        <h4 className="font-bold text-sm text-gray-905 dark:text-slate-100 mt-2">
                          {perspectives.leftCoverage.headline}
                        </h4>
                      </div>
                      <p className="leading-relaxed text-gray-650 dark:text-slate-300 font-medium font-sans">
                        {perspectives.leftCoverage.framing}
                      </p>
                      <div className="bg-gray-50 dark:bg-slate-800 border border-gray-150 dark:border-slate-700 p-3.5 rounded-lg space-y-1.5">
                        <h5 className="text-[9px] uppercase font-bold text-gray-405 dark:text-slate-500">Narrative Focal Points</h5>
                        <ul className="list-disc list-inside text-xs text-gray-700 dark:text-slate-300 space-y-1 leading-relaxed">
                          {perspectives.leftCoverage.keyPoints.map((kp, idx) => (
                            <li key={idx}>{kp}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 font-semibold">
                        Representative Outlets: <span className="font-bold text-gray-700 dark:text-slate-300">{perspectives.leftCoverage.outletExample}</span>
                      </div>
                    </motion.div>
                  )}

                  {activePerspectiveTab === "center" && (
                    <motion.div
                      key="center"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-3"
                    >
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/80">
                          Neutral/Objective Framing
                        </span>
                        <h4 className="font-bold text-sm text-gray-905 dark:text-slate-100 mt-2">
                          {perspectives.centerCoverage.headline}
                        </h4>
                      </div>
                      <p className="leading-relaxed text-gray-650 dark:text-slate-300 font-medium font-sans">
                        {perspectives.centerCoverage.framing}
                      </p>
                      <div className="bg-gray-50 dark:bg-slate-800 border border-gray-150 dark:border-slate-700 p-3.5 rounded-lg space-y-1.5">
                        <h5 className="text-[9px] uppercase font-bold text-gray-405 dark:text-slate-500">Objective Focal Points</h5>
                        <ul className="list-disc list-inside text-xs text-gray-700 dark:text-slate-300 space-y-1 leading-relaxed">
                          {perspectives.centerCoverage.keyPoints.map((kp, idx) => (
                            <li key={idx}>{kp}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 font-semibold">
                        Representative Outlets: <span className="font-bold text-gray-700 dark:text-slate-300">{perspectives.centerCoverage.outletExample}</span>
                      </div>
                    </motion.div>
                  )}

                  {activePerspectiveTab === "right" && (
                    <motion.div
                      key="right"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-3"
                    >
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-red-650 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded border border-red-200 dark:border-red-800/80">
                          Conservative Framing
                        </span>
                        <h4 className="font-bold text-sm text-gray-905 dark:text-slate-100 mt-2">
                          {perspectives.rightCoverage.headline}
                        </h4>
                      </div>
                      <p className="leading-relaxed text-gray-650 dark:text-slate-300 font-medium font-sans">
                        {perspectives.rightCoverage.framing}
                      </p>
                      <div className="bg-gray-50 dark:bg-slate-800 border border-gray-150 dark:border-slate-700 p-3.5 rounded-lg space-y-1.5">
                        <h5 className="text-[9px] uppercase font-bold text-gray-405 dark:text-slate-500">Narrative Focal Points</h5>
                        <ul className="list-disc list-inside text-xs text-gray-700 dark:text-slate-300 space-y-1 leading-relaxed">
                          {perspectives.rightCoverage.keyPoints.map((kp, idx) => (
                            <li key={idx}>{kp}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-405 font-semibold">
                        Representative Outlets: <span className="font-bold text-gray-700 dark:text-slate-300">{perspectives.rightCoverage.outletExample}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : null}
        </section>

        {/* Community Context Notes Board */}
        <section className="space-y-4 pt-4 border-t border-gray-200 dark:border-slate-700">
          <CommunityNotesSection articleId={article.id} notes={serializedNotes} />
        </section>

        {/* TASK 4: Professional Fact Checks Section at the bottom */}
        <section className="space-y-4 pt-4 border-t border-gray-200 dark:border-slate-700 pb-16">
          <div className="border-b border-gray-200 dark:border-slate-700 pb-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100 tracking-tight">Professional Fact Checks</h3>
              {isFactCheckMock && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Demo Mock
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-sans">
              Independent reviews verified by global fact-checking publications.
            </p>
          </div>

          {loadingFactChecks ? (
            <div className="p-5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl shadow-sm space-y-3 animate-pulse">
              <div className="h-4 bg-gray-150 dark:bg-slate-900 rounded w-1/3" />
              <div className="h-3 bg-gray-100 dark:bg-slate-900/80 rounded w-full" />
            </div>
          ) : factCheckError ? (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs text-left">
              <strong>Error Loading Reviews:</strong> {factCheckError}
            </div>
          ) : factChecks.length === 0 ? (
            <div className="p-4 border border-gray-250 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-xl text-center text-xs text-gray-500 dark:text-slate-400 italic">
              No professional fact-checks have been registered for this article headline yet. Rely on the AI Briefing above.
            </div>
          ) : (
            <div className="space-y-3">
              {factChecks.map((check, index) => {
                const styles = getRatingStyles(check.textualRating);
                return (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 space-y-2.5 hover:border-gray-300 dark:hover:border-slate-600 transition-colors duration-200 text-xs text-gray-900 dark:text-slate-300"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-gray-800 dark:text-slate-350">
                        {check.publisherName}
                      </span>
                      <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${styles.bg} ${styles.text} ${styles.border}`}>
                        {check.textualRating}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {check.claimText && (
                        <p className="text-[10px] text-gray-500 dark:text-slate-450 italic leading-relaxed">
                          Claim: "{check.claimText}"
                        </p>
                      )}
                      <h5 className="text-xs sm:text-sm font-bold leading-snug text-gray-900 dark:text-slate-100 font-sans">
                        {check.reviewTitle}
                      </h5>
                    </div>

                    <div className="pt-1.5 flex justify-end">
                      <a
                        href={check.reviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-850 dark:hover:text-blue-300 transition-colors hover:underline"
                      >
                        <span>Read Full Report</span>
                        <ExternalLink className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* Clean Minimalist Aggregator Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/40 py-10 transition-colors duration-300">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center space-y-2">
          <span className="text-sm font-bold tracking-tight text-gray-900 dark:text-slate-205 block">
            TruthFeed
          </span>
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-normal max-w-md mx-auto">
            Designed for fact-checking coverage comparisons and news transparency.
          </p>
          <p className="text-[10px] text-gray-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()} TruthFeed Initiative. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
