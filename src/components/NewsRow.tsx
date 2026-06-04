"use client";

import React from "react";
import NetflixCard from "./NetflixCard";

interface NewsRowProps {
  title: string;
  articles: any[];
}

export default function NewsRow({ title, articles }: NewsRowProps) {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Title */}
      <h2 className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-slate-100 flex items-center gap-2">
        {title}
      </h2>

      {/* Horizontal Snap Scroll Container */}
      <div className="flex overflow-x-auto gap-4 pb-4 scroll-smooth snap-x snap-mandatory scrollbar-hide">
        {articles.map((article) => (
          <NetflixCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
