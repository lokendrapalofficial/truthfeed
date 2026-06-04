"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { WikiContext } from "@/lib/wiki";

interface VerificationDossierProps {
  articleId: string;
  articleTitle: string;
  sourceName: string;
  relatedSources?: any; // JSON array from database
  briefing: string | null;
  wikiContexts: WikiContext[];
}

export default function VerificationDossier({
  sourceName,
  relatedSources,
  briefing,
  wikiContexts,
}: VerificationDossierProps) {
  const sourcesList = Array.isArray(relatedSources) ? relatedSources : [];

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm transition-colors duration-300 flex flex-col gap-6">
      
      {/* Top Header Section */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700/60 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-mono text-xs font-black tracking-widest text-gray-800 dark:text-slate-200 uppercase">
            Strategic Intelligence Briefing
          </span>
        </div>
        <span className="text-[9px] font-mono tracking-wider font-extrabold uppercase bg-gray-50 text-gray-500 dark:bg-slate-900/60 dark:text-slate-400 px-2 py-0.5 border border-gray-200 dark:border-slate-750 rounded">
          Classified: Public Access
        </span>
      </div>

      {/* Main Grid Layout: 2 Columns for Desktop (Briefing + Wiki) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel 1: The Briefing (Main Column) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {briefing ? (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h3: ({ node, ...props }) => (
                    <h3
                      className="text-xs uppercase tracking-widest font-black text-gray-500 dark:text-slate-450 border-b border-gray-150 dark:border-slate-700/60 pb-1.5 mt-6 mb-3 first:mt-0 font-mono"
                      {...props}
                    />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed font-sans mb-3" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="space-y-2 mb-4 font-sans list-none pl-0" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="text-sm text-gray-700 dark:text-slate-350 leading-relaxed flex items-start gap-2.5">
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
            <div className="space-y-3 py-2">
              <div className="h-4 w-full bg-gray-150 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-150 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-150 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          )}
        </div>

        {/* Panel 2: The "Context Card" (Wikipedia Entity Context) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <span className="font-mono text-[10px] tracking-wider text-gray-400 dark:text-slate-500 uppercase font-black">
            📖 Wikipedia Context
          </span>
          {wikiContexts && wikiContexts.length > 0 ? (
            <div className="flex flex-col gap-4">
              {wikiContexts.slice(0, 2).map((wiki, index) => {
                const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(wiki.title.replace(/\s+/g, "_"))}`;
                return (
                  <div
                    key={index}
                    className="bg-gray-50/70 dark:bg-slate-800/30 border border-gray-150 dark:border-slate-700/60 rounded-xl p-4 flex flex-col gap-3 shadow-2xs hover:shadow-xs transition-shadow"
                  >
                    <div className="flex gap-3 items-start">
                      {wiki.thumbnailUrl && (
                        <img
                          src={wiki.thumbnailUrl}
                          alt={wiki.title}
                          className="w-14 h-14 rounded-md object-cover border border-gray-250/70 dark:border-slate-700 shrink-0 shadow-sm"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="font-extrabold text-sm text-gray-900 dark:text-slate-200 leading-tight">
                          📖 Entity Context: {wiki.title}
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed font-sans line-clamp-4 mt-1">
                          {wiki.extract}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-gray-200/50 dark:border-slate-700/30 pt-2 text-[9px] text-gray-400 dark:text-slate-500 tracking-wide font-mono flex items-center justify-between">
                      <span>Context via Wikipedia (CC BY-SA)</span>
                      <a
                        href={wikiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline hover:text-blue-500 dark:hover:text-blue-400 font-bold"
                      >
                        Read Article →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50/50 dark:bg-slate-800/10 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl p-4 text-center py-8 text-xs text-gray-400 dark:text-slate-500 italic font-medium">
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
