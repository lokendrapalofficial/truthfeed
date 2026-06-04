"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Globe, Sun, Moon, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ShareWidget from "@/components/ShareWidget";
import SourceBadge from "@/components/SourceBadge";
import CommunityNotesSection, { NoteItem } from "@/components/CommunityNotesSection";
import NewsImage from "@/components/NewsImage";
import VerificationDossier from "@/components/VerificationDossier";
import { parseRelatedArticles } from "@/lib/rssParser";
import { useTheme } from "next-themes";
import { analyzeArticle } from "@/app/actions/analyzeArticle";
import { WikiContext } from "@/lib/wiki";

function getBriefingCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.match(/\b(court|senate|election|trump|biden|harris|law|government|president|policy|democrat|republican|tax|debt|tariff|white house|congress|politics|world|israel|ceasefire|border|clash|attack|treaty|suriname)\b/)) return "World";
  if (t.match(/\b(sport|game|nba|nfl|ipl|cricket|cup|stadium|athlete|championship|tennis|soccer|olympics|race|match|win|losing|golf)\b/)) return "Sports";
  if (t.match(/\b(apple|google|microsoft|ai|meta|nvidia|intel|openai|semiconductor|chip|cybersecurity|software|tech|technology|phone|quantum|robot|market|finance|stock|stocks|economy|business|ceo|company|billion)\b/)) return "Tech/Business";
  if (t.match(/\b(movie|film|hollywood|actor|actress|music|album|singer|pop|concert|tv|netflix|award|grammy|star|entertainment|celebrity|popstar|rapper)\b/)) return "Entertainment";
  return "World";
}

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

// Extract a clean 2-paragraph excerpt from article content
function getArticleParagraphs(title: string, summary: string | null, content: string | null, sourceName: string): string[] {
  let clean = summary || content || "";
  if (clean.includes("<ol>") || clean.includes("<li>")) {
    clean = clean.replace(/<ol>[\s\S]*?<\/ol>/gi, "");
  }
  clean = clean.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  clean = clean.replace(/See more headlines[\s\S]*/gi, "").trim();

  let p1 = clean;
  if (!p1 || p1.length < 60) {
    p1 = `Reports from ${sourceName} indicate significant new developments regarding "${title}". Editorial staff and journalists are continuing to monitor the situation as official statements and primary source documents are released.`;
  }

  const p2 = `Verification teams are actively reviewing the details, factual assertions, and media coverage surrounding this story. Readers can access the full, uninterrupted report directly from ${sourceName} via the original publisher link below.`;

  return [p1, p2];
}

export default function ArticleClient({ article, serializedNotes }: ArticleClientProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [verificationState, setVerificationState] = useState<"loading" | "verified" | "error">("loading");
  const [analysisData, setAnalysisData] = useState<string | null>(null);
  const [wikiContexts, setWikiContexts] = useState<WikiContext[]>([]);
  const [category, setCategory] = useState<string>("World");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleVerify = async () => {
    setVerificationState("loading");
    setErrorMsg(null);

    const detectedCategory = getBriefingCategory(article.title);

    try {
      const res = (await analyzeArticle(
        article.id,
        article.title,
        article.summary || article.content || undefined,
        article.relatedSources
      )) as any;

      if (res.success && (res.articleText || res.briefing)) {
        setAnalysisData(res.articleText || res.briefing);
        setWikiContexts(res.wikiContexts || []);
        setCategory(res.category || detectedCategory);
        setVerificationState("verified");
      } else {
        setErrorMsg(res.error || "Briefing compilation failed.");
        setVerificationState("error");
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Failed to execute claim verification.");
      setVerificationState("error");
    }
  };

  useEffect(() => {
    setMounted(true);
    handleVerify();
  }, []);

  const formattedDate = new Date(article.publishedAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const cleanTitle = getCleanHeadline(article.title, article.sourceName);
  const paragraphs = getArticleParagraphs(cleanTitle, article.summary, article.content, article.sourceName);

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
        <header className="space-y-3">
          {/* Source + Date metadata row */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-500 dark:text-slate-400">
            <SourceBadge sourceName={article.sourceName} source={article.source} />
            <span className="text-gray-300 dark:text-slate-600">•</span>
            <div className="flex items-center gap-1 text-gray-500 dark:text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-950 dark:text-slate-100">
            {cleanTitle}
          </h1>
        </header>

        {/* ——— HERO IMAGE ——— */}
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm relative">
          <NewsImage
            url={article.url}
            title={cleanTitle}
            sourceName={article.sourceName}
            imageUrl={article.imageUrl}
            isLogo={article.isLogo}
            className="w-full h-full object-cover"
          />
        </div>

        {/* ——— ARTICLE EXCERPT ——— */}
        <section className="space-y-4">
          {paragraphs.map((p, idx) => (
            <p key={idx} className="text-base text-gray-700 dark:text-slate-300 leading-relaxed font-sans">
              {p}
            </p>
          ))}
        </section>

        {/* ——— ERROR SECTION ——— */}
        {verificationState === "error" && (
          <div className="flex flex-col items-center justify-center p-6 border border-dashed border-rose-200 dark:border-rose-800 rounded-xl bg-rose-50/50 dark:bg-rose-950/10 text-center gap-4 transition-colors">
            <p className="text-xs text-rose-600 dark:text-rose-450 font-medium">
              {errorMsg || "Briefing compilation failed."}
            </p>
            <button
              onClick={handleVerify}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-350 text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer"
            >
              Retry Compilation
            </button>
          </div>
        )}

        {/* ——— DRAFTING LOADER SECTION ——— */}
        {verificationState === "loading" && (
          <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2 select-none">
              <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span>Drafting verified report...</span>
            </div>
            <div className="animate-pulse space-y-8">
              {/* Paragraph 1: 3 lines of text */}
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-11/12" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/5" />
              </div>
              {/* Paragraph 2: 4 lines of text */}
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-11/12" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              </div>
              {/* Paragraph 3: 2 lines of text */}
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
              </div>
            </div>
          </div>
        )}

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
                sourceName={article.sourceName}
                relatedSources={article.relatedSources}
                briefing={analysisData}
                wikiContexts={wikiContexts}
                category={category}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ——— CONTINUE READING BUTTON ——— */}
        <div className="pt-1">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex w-full items-center justify-center gap-2.5 h-14 rounded-2xl bg-gray-900 dark:bg-slate-100 hover:bg-gray-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-sm uppercase tracking-wider shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            <Globe className="h-4.5 w-4.5 opacity-70 group-hover:opacity-100 transition-opacity" />
            <span>Continue Reading on {article.sourceName}</span>
            <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>

        {/* ——— HOW OTHERS ARE REPORTING THIS ——— */}
        {(() => {
          const related = parseRelatedArticles(article.content);
          if (related.length === 0) return null;
          return (
            <section className="space-y-4 pt-2 border-t border-gray-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-slate-100 tracking-tight">
                  How Others Are Reporting This
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Alternative coverage on this topic from other newsrooms.
                </p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {related.map((item, idx) => (
                  <div key={idx} className="py-3.5 flex items-start gap-3">
                    <span className="h-6 w-6 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0 border border-gray-200 dark:border-slate-700">
                      {item.source.charAt(0)}
                    </span>
                    <div className="space-y-0.5 min-w-0">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-sm text-gray-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 leading-snug block transition-colors"
                      >
                        {item.title}
                      </a>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-450">
                        <span className="font-bold text-gray-700 dark:text-slate-300">{item.source}</span>
                        <span>·</span>
                        <span>Alternative Coverage</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })()}

        {/* ——— SHARE WIDGET ——— */}
        <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
          <ShareWidget articleTitle={cleanTitle} />
        </div>

        {/* ——— COMMUNITY NOTES ——— */}
        <section className="pb-16">
          <CommunityNotesSection articleId={article.id} notes={serializedNotes} />
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
