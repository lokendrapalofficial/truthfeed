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
      <div className="border-b border-slate-200 dark:border-slate-850 pb-3">
        <div className="text-xs font-mono uppercase tracking-widest text-slate-500">
          INTELLIGENCE MEMO // {category ? (category.toLowerCase().includes("tech") ? "TECH/BUSINESS" : category.toUpperCase()) : "WORLD"} DESK // HIGH CONFIDENCE
        </div>
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
                      className="border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 font-mono mt-6 mb-3 first:mt-0"
                      {...props}
                    />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-serif mb-3" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="space-y-3 mb-4 font-serif list-none pl-0" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-serif flex items-start gap-2.5">
                      <span className="mt-2 h-1 w-1 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0" />
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
          <span className="font-mono text-[10px] tracking-wider text-slate-500 dark:text-slate-500 uppercase">
            WIKIPEDIA CONTEXT
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
                        Entity Context: {wiki.title}
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
      <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] tracking-wider text-slate-500 uppercase">
            REFERENCES // PRESS CROSS-REFERENCE MATRIX
          </span>
          <span className="text-[9px] font-mono text-slate-400 dark:text-slate-650">
            VERIFIED WIRE FEEDS
          </span>
        </div>
        {sourcesList.length > 0 ? (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded">
            <table className="w-full text-left border-collapse font-mono text-[11px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-2 font-medium">[OUTLET]</th>
                  <th className="px-4 py-2 font-medium">[DISPATCH TITLE]</th>
                  <th className="px-4 py-2 text-right font-medium pr-4">[ACCESS]</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {sourcesList.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-2 text-slate-900 dark:text-slate-350 uppercase tracking-tight whitespace-nowrap">
                      {item.sourceName}
                    </td>
                    <td className="px-4 py-2 text-slate-650 dark:text-slate-400 max-w-xs sm:max-w-md truncate">
                      {item.title}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap pr-4">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-300 font-bold"
                      >
                        Read Full Report -&gt;
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-600 italic">
            NO INDEPENDENT CORROBORATIVE DISPATCHES MAPPED.
          </p>
        )}
      </div>

    </div>
  );
}
