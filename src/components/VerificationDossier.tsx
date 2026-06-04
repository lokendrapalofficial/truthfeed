"use client";

import React from "react";
import { ExternalLink, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { WikiContext } from "@/lib/wiki";

interface VerificationDossierProps {
  articleId: string;
  articleTitle: string;
  sourceName: string;
  relatedSources?: any; // JSON array from database
  briefing: string | null;
  wikiContexts: WikiContext[];
  category?: string;
}

export default function VerificationDossier({
  sourceName,
  relatedSources,
  briefing,
  wikiContexts,
  category,
}: VerificationDossierProps) {
  const sourcesList = Array.isArray(relatedSources) ? relatedSources : [];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm transition-colors duration-300 flex flex-col gap-6">
      
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-black tracking-widest text-slate-800 dark:text-slate-200 uppercase">
              Strategic Intelligence Briefing
            </span>
          </div>
          {/* Domain Badge */}
          {category && (
            <span className={`text-[9.5px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full border font-sans ${
              category.toLowerCase().includes("sport")
                ? "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                : category.toLowerCase().includes("tech")
                ? "bg-purple-50 text-purple-700 border-purple-250 dark:bg-purple-950/40 dark:text-purple-450 dark:border-purple-800"
                : category.toLowerCase().includes("entertain")
                ? "bg-pink-50 text-pink-700 border-pink-250 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-800"
                : "bg-blue-50 text-blue-700 border-blue-250 dark:bg-blue-950/40 dark:text-blue-450 dark:border-blue-800"
            }`}>
              {category.toLowerCase().includes("sport")
                ? "🏆 SPORTS DOSSIER"
                : category.toLowerCase().includes("tech")
                ? "💼 MARKET & TECH BRIEFING"
                : category.toLowerCase().includes("entertain")
                ? "🎬 CULTURE & MEDIA"
                : "🌍 GLOBAL INTELLIGENCE"}
            </span>
          )}
        </div>
        <span className="text-[9px] font-mono tracking-wider font-extrabold uppercase bg-slate-50 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 px-2 py-0.5 border border-slate-200 dark:border-slate-800 rounded self-start sm:self-auto">
          Classified: Public Access
        </span>
      </div>

      {/* Main Grid Layout: CSS Grid layout (grid grid-cols-1 lg:grid-cols-12 gap-8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (lg:col-span-8): The Briefing Panel */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {briefing ? (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h3: ({ node, ...props }) => (
                    <h3
                      className="border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 text-xs text-slate-500 uppercase font-bold tracking-wider font-mono mt-6 mb-3 first:mt-0"
                      {...props}
                    />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans mb-3" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="space-y-3 mb-4 font-sans list-none pl-0" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed flex items-start gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400 shrink-0" />
                      <span>{props.children}</span>
                    </li>
                  ),
                }}
              >
                {briefing}
              </ReactMarkdown>
            </div>
          ) : (
            /* Sleek Briefing Skeleton */
            <div className="space-y-4 py-2 animate-pulse">
              <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-850 rounded" />
                <div className="h-4 w-11/12 bg-slate-200 dark:bg-slate-850 rounded" />
                <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-850 rounded" />
              </div>
              <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded mt-8 mb-6" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-850 rounded" />
                <div className="h-4 w-4/5 bg-slate-200 dark:bg-slate-850 rounded" />
              </div>
            </div>
          )}
        </div>

        {/* Right Column (lg:col-span-4): The "Deep Context" Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <span className="font-mono text-[10px] tracking-wider text-slate-400 dark:text-slate-500 uppercase font-black">
            📖 Wikipedia Context
          </span>
          {briefing === null ? (
            /* Sleek Sidebar Skeleton */
            <div className="flex flex-col gap-4 animate-pulse">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-700 shrink-0" />
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-3.5 w-5/6 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-3.5 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                  <div className="border-t border-slate-200/50 dark:border-slate-700/30 pt-2 flex justify-between">
                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : wikiContexts && wikiContexts.length > 0 ? (
            <div className="flex flex-col gap-4">
              {wikiContexts.slice(0, 2).map((wiki, index) => {
                const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(wiki.title.replace(/\s+/g, "_"))}`;
                return (
                  <div
                    key={index}
                    className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {/* Header: Flex row with the thumbnailUrl and the title in bold */}
                    <div className="flex items-center gap-2.5">
                      {wiki.thumbnailUrl ? (
                        <img
                          src={wiki.thumbnailUrl}
                          alt={wiki.title}
                          className="w-8 h-8 rounded object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-750 flex items-center justify-center text-slate-550 dark:text-slate-400 shrink-0 border border-slate-200 dark:border-slate-700">
                          <BookOpen className="h-4.5 w-4.5" />
                        </div>
                      )}
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight truncate">
                        📖 Entity Context: {wiki.title}
                      </span>
                    </div>

                    {/* Body: Clamped extract text */}
                    <p className="line-clamp-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                      {wiki.extract}
                    </p>

                    {/* Footer: Wikipedia attribution link */}
                    <div className="border-t border-slate-255 dark:border-slate-700/30 pt-2 flex items-center justify-between">
                      <a
                        href={wikiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-slate-400 dark:text-slate-500 hover:underline hover:text-blue-500 dark:hover:text-blue-400 font-medium"
                      >
                        Source: Wikipedia (CC BY-SA)
                      </a>
                      <a
                        href={wikiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Read Article →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-50/50 dark:bg-slate-800/10 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center py-8 text-xs text-slate-400 dark:text-slate-500 italic font-medium">
              No geographical or entity details found on Wikipedia.
            </div>
          )}
        </div>

      </div>

      {/* Panel 3: The Source Matrix (Bottom Cross-Reference Table) */}
      <div className="border-t border-gray-100 dark:border-slate-700/60 pt-5">
        <div className="flex items-center justify-between mb-3.5">
          <span className="font-mono text-[10px] tracking-wider text-gray-400 dark:text-slate-500 uppercase font-black">
            📡 The Source Matrix (Cross-Reference)
          </span>
          <span className="text-[9px] font-mono text-gray-400 dark:text-slate-500">
            Fair Use Compliant Outlinks
          </span>
        </div>
        {sourcesList.length > 0 ? (
          <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-lg shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/70 dark:bg-slate-800/80 border-b border-gray-250 dark:border-slate-700 font-mono uppercase tracking-wider text-gray-400 dark:text-slate-550 font-black">
                  <th className="px-4 py-2.5 font-semibold text-[9px]">[Source Logo/Name]</th>
                  <th className="px-4 py-2.5 font-semibold text-[9px]">[Headline Focus]</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-[9px] pr-5">[Read Full Report -&gt;]</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-slate-700/50">
                {sourcesList.map((item: any, idx: number) => {
                  const domain = item.url ? item.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : "";
                  const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : "";
                  
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-750/30 transition-colors">
                      <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-slate-200 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {faviconUrl && (
                            <img
                              src={faviconUrl}
                              alt={item.sourceName}
                              className="w-3.5 h-3.5 rounded-sm object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                          <span>{item.sourceName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 dark:text-slate-350 max-w-xs sm:max-w-md truncate font-medium">
                        &ldquo;{item.title}&rdquo;
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap pr-5">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-800 dark:hover:text-blue-300 font-bold"
                        >
                          <span>Read Full Report</span>
                          <span className="ml-0.5">-&gt;</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-gray-450 dark:text-slate-500 italic">
            No independent corroborative coverages mapped in RSS feed description.
          </p>
        )}
      </div>

    </div>
  );
}
