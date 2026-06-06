"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Brain, Clock, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NewsImage from "@/components/NewsImage";
import { formatSmartDate } from "@/lib/utils";
import { explainSimply } from "@/app/actions/explainSimply";

interface TransparencyCardProps {
  article: {
    id: string;
    title: string;
    url: string;
    sourceName: string;
    publishedAt: string;
    imageUrl?: string | null;
    isLogo?: boolean;
    isThematic?: boolean;
    analysis?: {
      briefing?: string | null;
      category?: string | null;
      verification?: {
        consensusScore?: number;
        confidenceLevel?: string;
      } | null;
    } | null;
    source?: {
      bias?: string;
      credibility?: string;
    } | null;
  };
  viewMode?: "grid" | "list";
}

function TrustIndicator({ level }: { level?: string }) {
  if (!level) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-2 py-0.5 rounded-full">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
        PENDING
      </span>
    );
  }

  const map: Record<string, { label: string; color: string; dot: string }> = {
    High: {
      label: "VERIFIED",
      color: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50",
      dot: "bg-emerald-500",
    },
    Medium: {
      label: "MIXED",
      color: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50",
      dot: "bg-blue-500",
    },
    Low: {
      label: "UNVERIFIED",
      color: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
      dot: "bg-slate-400",
    },
    Conflicting: {
      label: "CONFLICTING",
      color: "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50",
      dot: "bg-rose-500",
    },
  };

  const entry = map[level] || map["Low"];

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold border px-2 py-0.5 rounded-full ${entry.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${entry.dot}`} />
      {entry.label}
    </span>
  );
}

export default function TransparencyCard({ article, viewMode = "grid" }: TransparencyCardProps) {
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [explainState, setExplainState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [explanation, setExplanation] = useState<string | null>(null);

  const smartDate = formatSmartDate(article.publishedAt);
  const confidenceLevel = article.analysis?.verification?.confidenceLevel;
  const briefing = article.analysis?.briefing;

  const hasAnalysis = Boolean(briefing);

  const handleExplainSimply = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isExplainOpen && explanation) {
      setIsExplainOpen(false);
      return;
    }

    setIsExplainOpen(true);

    if (explanation) return; // already fetched

    setExplainState("loading");
    try {
      const res = await explainSimply(article.id, article.title, briefing);
      if (res.success) {
        setExplanation(res.explanation);
        setExplainState("done");
      } else {
        setExplanation(res.explanation);
        setExplainState("error");
      }
    } catch {
      setExplanation("Failed to generate explanation. Please try again.");
      setExplainState("error");
    }
  };

  if (viewMode === "list") {
    return (
      <article className="group flex gap-4 items-start py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
        {/* Thumbnail */}
        <div className="w-20 h-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 relative">
          <NewsImage
            url={article.url}
            title={article.title}
            sourceName={article.sourceName}
            imageUrl={article.imageUrl}
            isLogo={article.isLogo}
            isThematic={article.isThematic}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {article.sourceName}
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 dark:text-slate-500">
              {smartDate.showRedDot && (
                <span className="animate-pulse bg-red-500 rounded-full h-1.5 w-1.5 inline-block shrink-0" />
              )}
              <span>{smartDate.text}</span>
            </div>
            <TrustIndicator level={confidenceLevel} />
          </div>

          {/* Headline */}
          <Link href={`/article/${article.id}`}>
            <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-2">
              {article.title}
            </h3>
          </Link>

          {/* TL;DR or Pending */}
          {hasAnalysis ? (
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 font-sans">
              {briefing}
            </p>
          ) : (
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 italic">
              TruthFeed Intelligence is analyzing this story…
            </span>
          )}

          {/* Explain Simply Button */}
          <div className="mt-1">
            <button
              onClick={handleExplainSimply}
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors cursor-pointer"
            >
              <Brain className="h-3 w-3" />
              Explain Simply
              {isExplainOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            <AnimatePresence>
              {isExplainOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/50 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {explainState === "loading" ? (
                      <div className="flex items-center gap-2 text-indigo-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" />
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.15s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.3s]" />
                        <span className="ml-1 font-mono text-[10px]">TruthFeed Intelligence thinking…</span>
                      </div>
                    ) : (
                      explanation
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </article>
    );
  }

  // Grid mode (default)
  return (
    <article className="group flex flex-col h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-300">
      {/* Thumbnail */}
      <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative shrink-0">
        <NewsImage
          url={article.url}
          title={article.title}
          sourceName={article.sourceName}
          imageUrl={article.imageUrl}
          isLogo={article.isLogo}
          isThematic={article.isThematic}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
        />
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Meta Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {article.sourceName}
          </span>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 dark:text-slate-500">
            {smartDate.showRedDot && (
              <span className="animate-pulse bg-red-500 rounded-full h-1.5 w-1.5 inline-block shrink-0" />
            )}
            <Clock className="h-2.5 w-2.5" />
            <span>{smartDate.text}</span>
          </div>
          <TrustIndicator level={confidenceLevel} />
        </div>

        {/* Headline */}
        <Link href={`/article/${article.id}`} className="flex-1">
          <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-3">
            {article.title}
          </h3>
        </Link>

        {/* TL;DR Pill */}
        {hasAnalysis ? (
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 font-sans">
            {briefing}
          </p>
        ) : (
          <div className="flex items-center gap-1.5">
            <HelpCircle className="h-3 w-3 text-amber-500 shrink-0" />
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 italic">
              Analysis pending…
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-auto">
          {/* Explain Simply Button */}
          <button
            onClick={handleExplainSimply}
            className="w-full flex items-center justify-between gap-1.5 text-[10px] font-bold font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 px-2 py-1.5 rounded-lg transition-all cursor-pointer group/btn"
          >
            <div className="flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 group-hover/btn:animate-pulse" />
              <span>🧠 Explain Simply</span>
            </div>
            {isExplainOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          <AnimatePresence>
            {isExplainOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/50 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  {explainState === "loading" ? (
                    <div className="flex items-center gap-2 text-indigo-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.15s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.3s]" />
                      <span className="ml-1 font-mono text-[10px]">TruthFeed Intelligence thinking…</span>
                    </div>
                  ) : (
                    explanation
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </article>
  );
}
