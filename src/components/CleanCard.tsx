import React from "react";
import { formatSmartDate, getArticleCategory } from "@/lib/utils";

interface CleanCardProps {
  title: string;
  imageUrl: string | null;
  publishedAt: Date;
  sources: string[];
  tl_dr: string | null;
}

export default function CleanCard({
  title,
  imageUrl,
  publishedAt,
  sources,
  tl_dr,
}: CleanCardProps) {
  const timeAgoResult = formatSmartDate(publishedAt);
  const category = getArticleCategory(title, tl_dr || "").toUpperCase();

  // Get the first 3 items in the sources array
  const topSources = sources.slice(0, 3);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700 group">
      {/* 16:9 Image Area */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-600">
            <svg
              className="w-10 h-10 opacity-40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Body Area */}
      <div className="p-5 flex flex-col flex-1">
        {/* Meta Header */}
        <div className="flex items-center justify-between text-[10px] font-mono tracking-wider mb-2.5">
          <span className="font-bold text-blue-600 dark:text-blue-400">
            {category}
          </span>
          <span className="text-slate-500 dark:text-slate-450">
            {timeAgoResult.text}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-serif font-bold text-xl text-slate-900 dark:text-slate-50 leading-snug mb-3 line-clamp-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
          {title}
        </h3>

        {/* Summary Area */}
        {tl_dr && tl_dr.trim() ? (
          <p className="text-sm font-sans text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 mb-4 flex-1">
            {tl_dr}
          </p>
        ) : (
          <div className="flex-1 mb-4" />
        )}

        {/* Footer Area */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium">Sources: </span>
          {topSources.length > 0 ? topSources.join(", ") : "TruthFeed Index"}
        </div>
      </div>
    </div>
  );
}
