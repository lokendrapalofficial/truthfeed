"use client";

import React from "react";

interface VerificationDossierProps {
  articleId: string;
  articleTitle: string;
  sourceName: string;
  relatedSources?: any; // JSON array from database
  briefing: string | null;
  wikiContexts?: any[];
  category?: string;
}

export default function VerificationDossier({
  relatedSources,
  briefing,
}: VerificationDossierProps) {
  const sourcesList = Array.isArray(relatedSources) ? relatedSources : [];

  // Parse the synthesized article text into paragraphs
  const paragraphs = briefing
    ? briefing
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 bg-white dark:bg-slate-900 transition-colors duration-300">
      {paragraphs.length > 0 ? (
        <div className="space-y-6">
          {paragraphs.map((para, idx) => (
            <p
              key={idx}
              className="font-serif text-lg leading-relaxed text-slate-800 dark:text-slate-200"
            >
              {para}
            </p>
          ))}
        </div>
      ) : (
        /* Pulser Skeleton matching 3 paragraphs of text */
        <div className="animate-pulse space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-11/12" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Sources Footer */}
      {sourcesList.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-700 mt-8 pt-4">
          <div className="text-sm text-slate-500 flex flex-wrap items-center leading-relaxed">
            <span className="mr-1">Sources:</span>
            {sourcesList.map((item: any, idx: number) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="mx-1.5">•</span>}
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-slate-500 hover:text-slate-800 dark:hover:text-slate-350 transition-colors"
                >
                  {item.sourceName}
                </a>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
