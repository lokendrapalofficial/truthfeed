"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Globe, Sun, Moon, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ShareWidget from "@/components/ShareWidget";
import { formatSmartDate } from "@/lib/utils";
import CommunityNotesSection, { NoteItem } from "@/components/CommunityNotesSection";
import NewsImage from "@/components/NewsImage";
import VerificationDossier from "@/components/VerificationDossier";
import DossierSkeleton from "@/components/DossierSkeleton";
import { useTheme } from "next-themes";
import { analyzeArticle } from "@/app/actions/analyzeArticle";

interface ArticleClientProps {
  article: any;
  serializedNotes: NoteItem[];
}

// Utility to clean up headline by stripping publisher name suffixes (e.g., " - CNN")
function getCleanHeadline(title: string, sourceName: string): string {
  if (!title) return "";
  let clean = title.trim();
  const escapedSource = sourceName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  const regex = new RegExp(`\\s*[-|]\\s*${escapedSource}\\s*$`, "i");
  clean = clean.replace(regex, "");
  return clean;
}

export default function ArticleClient({ article, serializedNotes }: ArticleClientProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const analysis = article.analysis;

  // Initialize compilation states
  const [verificationState, setVerificationState] = useState<"loading" | "verified" | "error">(
    analysis && analysis.briefing ? "verified" : "loading"
  );
  const [analysisData, setAnalysisData] = useState<string | null>(analysis?.briefing || null);
  const [verificationData, setVerificationData] = useState<any | null>(analysis?.verification || null);
  const [framingMatrix, setFramingMatrix] = useState<any[]>(() => {
    if (!analysis?.framingMatrix) return [];
    return typeof analysis.framingMatrix === "string"
      ? JSON.parse(analysis.framingMatrix)
      : analysis.framingMatrix;
  });
  const [category, setCategory] = useState<string>(analysis?.category || "World");

  // On-mount silent compilation trigger if analysis is missing
  useEffect(() => {
    setMounted(true);

    if (verificationState === "loading") {
      let isSubscribed = true;

      const triggerCompilation = async () => {
        try {
          const res = await analyzeArticle(
            article.id,
            article.title,
            article.summary || article.content,
            article.relatedSources
          );

          if (!isSubscribed) return;

          if (res.success) {
            setAnalysisData(res.briefing || "");
            setCategory(res.category || "World");
            setVerificationData(res.verification || null);
            setFramingMatrix(
              Array.isArray(res.framingMatrix)
                ? res.framingMatrix
                : typeof res.framingMatrix === "string"
                ? JSON.parse(res.framingMatrix)
                : []
            );
            setVerificationState("verified");
          } else {
            console.error("Compilation failed:", res.error);
            setVerificationState("error");
          }
        } catch (error) {
          console.error("Compilation error:", error);
          if (isSubscribed) {
            setVerificationState("error");
          }
        }
      };

      triggerCompilation();

      return () => {
        isSubscribed = false;
      };
    }
  }, [article.id, article.title, article.summary, article.content, article.relatedSources, verificationState]);

  const formattedDate = new Date(article.publishedAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const cleanTitle = getCleanHeadline(article.title, article.sourceName);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300">

      {/* Mini Editorial Navbar */}
      <nav className="border-b border-gray-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Newsroom</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {mounted && resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {/* TruthFeed Logo */}
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

      {/* Main Content — Single Column, Max Width 2xl for Premium Readability */}
      <main className="flex-1 mx-auto max-w-2xl w-full px-4 sm:px-6 py-8 space-y-7">

        {/* ——— ARTICLE HEADER ——— */}
        <header className="space-y-4">
          {/* Meta Row: publisher name + bias pill + credibility pill + timestamp right-aligned */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm tracking-tight">
                {article.sourceName}
              </span>
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                {article.source?.bias ? article.source.bias.replace("_", " ").toUpperCase() : "CENTER"}
              </span>
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                {article.source?.credibility ? article.source.credibility.replace("_", " ").toUpperCase() + " CREDIBILITY" : "HIGH CREDIBILITY"}
              </span>
            </div>
            <div className="text-slate-500 dark:text-slate-450 font-mono text-[11px] ml-auto">
              {formatSmartDate(article.publishedAt).text}
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-4xl font-serif font-bold leading-tight text-slate-950 dark:text-slate-50 mt-4">
            {cleanTitle}
          </h1>
        </header>

        {/* ——— HERO IMAGE ——— */}
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm relative mt-6">
          <NewsImage
            url={article.url}
            title={cleanTitle}
            sourceName={article.sourceName}
            imageUrl={article.imageUrl}
            isLogo={article.isLogo}
            isThematic={article.isThematic}
            className="w-full h-full object-cover"
          />
        </div>

        {/* ——— DRAFTING LOADER SKELETON STATE ——— */}
        {verificationState === "loading" && (
          <DossierSkeleton />
        )}

        {/* ——— ANCHOR POINT FOR ACTIVE INTELLIGENCE DOSSIER ——— */}
        <AnimatePresence>
          {verificationState === "verified" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <VerificationDossier
                articleId={article.id}
                articleTitle={article.title}
                articleUrl={article.url}
                sourceName={article.sourceName}
                relatedSources={article.relatedSources}
                briefing={analysisData}
                category={category}
                verification={verificationData}
                framingMatrix={framingMatrix}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ——— ERROR / SOURCE MATRIX FALLBACK ——— */}
        {verificationState === "error" && (
          <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-mono tracking-wider text-slate-550 dark:text-slate-400 uppercase select-none font-bold">
                SOURCE MATRIX
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Intelligence synthesis is currently offline. You can access direct event coverage from reporting newsrooms below:
              </p>
            </div>
            
            <div className="divide-y divide-slate-200 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
              {(() => {
                const sourcesList = Array.isArray(article.relatedSources) ? article.relatedSources : [];
                if (sourcesList.length === 0) {
                  return (
                    <div className="p-5 text-sm text-slate-500 dark:text-slate-450 italic text-center">
                      No alternative sources reported for this article.
                    </div>
                  );
                }
                return sourcesList.map((item: any, idx: number) => (
                  <div key={idx} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-100/50 dark:hover:bg-slate-850/40 transition-colors">
                    <div className="space-y-1 min-w-0">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:underline leading-snug block transition-colors"
                      >
                        {item.title}
                      </a>
                      <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {item.sourceName || "Alternative Publisher"}
                      </span>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-600 hover:text-blue-750 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1 hover:underline select-none whitespace-nowrap shrink-0 pt-0.5"
                    >
                      <span>Access Report</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* ——— SHARE WIDGET ——— */}
        <div className="pt-2 border-t border-slate-205 dark:border-slate-800">
          <ShareWidget articleTitle={cleanTitle} />
        </div>

        {/* ——— COMMUNITY NOTES (Collapsible Context) ——— */}
        <section className="pb-16">
          <details className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 mt-6 bg-slate-50/50 dark:bg-slate-900/20 group">
            <summary className="text-sm font-bold text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer select-none outline-none">
              Community Context
            </summary>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <CommunityNotesSection articleId={article.id} notes={serializedNotes} />
            </div>
          </details>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/40 py-10 transition-colors duration-300">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center space-y-2">
          <span className="text-sm font-bold tracking-tight text-gray-900 dark:text-slate-200 block">
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
