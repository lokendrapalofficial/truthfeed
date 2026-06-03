"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

interface NewsImageProps {
  url: string;
  title: string;
  sourceName: string;
  imageUrl?: string | null;
  isLogo?: boolean;
  className?: string;
}

// Map common news source names to their official domains for fallback favicons
const getPublisherDomain = (sourceName: string): string => {
  const name = sourceName.toLowerCase().trim();
  if (name.includes("cnn")) return "cnn.com";
  if (name.includes("new york times") || name.includes("nytimes")) return "nytimes.com";
  if (name.includes("washington post")) return "washingtonpost.com";
  if (name.includes("bbc")) return "bbc.co.uk";
  if (name.includes("reuters")) return "reuters.com";
  if (name.includes("associated press") || name.includes("ap news")) return "apnews.com";
  if (name.includes("fox news") || name.includes("foxnews")) return "foxnews.com";
  if (name.includes("nbc")) return "nbcnews.com";
  if (name.includes("usa today")) return "usatoday.com";
  if (name.includes("bloomberg")) return "bloomberg.com";
  if (name.includes("wall street journal") || name.includes("wsj")) return "wsj.com";
  if (name.includes("guardian")) return "theguardian.com";
  if (name.includes("politico")) return "politico.com";
  if (name.includes("forbes")) return "forbes.com";
  if (name.includes("npr")) return "npr.org";
  if (name.includes("abc news")) return "abcnews.go.com";
  if (name.includes("cbs")) return "cbsnews.com";
  if (name.includes("time")) return "time.com";
  if (name.includes("newsweek")) return "newsweek.com";
  if (name.includes("cnbc")) return "cnbc.com";
  if (name.includes("huffpost") || name.includes("huffington")) return "huffpost.com";
  if (name.includes("the hill")) return "thehill.com";
  if (name.includes("al jazeera") || name.includes("aljazeera")) return "aljazeera.com";
  if (name.includes("ft") || name.includes("financial times")) return "ft.com";
  if (name.includes("economist")) return "economist.com";
  if (name.includes("atlantic")) return "theatlantic.com";
  if (name.includes("vox")) return "vox.com";
  if (name.includes("buzzfeed")) return "buzzfeed.com";
  if (name.includes("gizmodo")) return "gizmodo.com";
  if (name.includes("techcrunch")) return "techcrunch.com";
  if (name.includes("wired")) return "wired.com";
  if (name.includes("slate")) return "slate.com";
  if (name.includes("verge")) return "theverge.com";
  
  const cleanName = name.replace(/[^a-z0-9]/g, "");
  return `${cleanName}.com`;
};

export default function NewsImage({
  url,
  title,
  sourceName,
  imageUrl,
  isLogo = false,
  className = "w-full h-full object-cover"
}: NewsImageProps) {
  const [logoState, setLogoState] = useState<"clearbit" | "google" | "initials">("clearbit");
  const [imageError, setImageError] = useState(false);

  const getInitials = (name: string): string => {
    if (!name) return "TF";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const domain = getPublisherDomain(sourceName);
  const initials = getInitials(sourceName);
  const fallbackLogoUrl = `https://logo.clearbit.com/${domain}`;

  // 1. If the article image is marked as a logo, render centered & styled inside compact box
  if (isLogo && imageUrl && !imageError) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 bg-gray-50 dark:bg-slate-800 transition-colors duration-300 relative select-none">
        <motion.img
          src={imageUrl}
          alt={`${sourceName} Logo`}
          className="max-h-24 max-w-[85%] object-contain filter dark:brightness-95"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // 2. Custom fallback logo view on image error or missing image
  if (imageError || !imageUrl) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 flex flex-col items-center justify-center w-full h-full select-none gap-2 p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 shadow-md flex items-center justify-center border border-gray-200/50 dark:border-slate-600/50 overflow-hidden p-2.5">
          {logoState === "clearbit" && (
            <img
              src={fallbackLogoUrl}
              alt={sourceName}
              className="w-full h-full object-contain"
              onError={() => setLogoState("google")}
            />
          )}
          {logoState === "google" && (
            <img
              src={`https://www.google.com/s2/favicons?sz=128&domain=${domain}`}
              alt={sourceName}
              className="w-full h-full object-contain"
              onError={() => setLogoState("initials")}
            />
          )}
          {logoState === "initials" && (
            <span className="text-gray-400 dark:text-slate-500 font-extrabold text-lg tracking-wider font-sans">
              {initials}
            </span>
          )}
        </div>
        <span className="text-[10px] font-extrabold tracking-wide uppercase text-gray-500 dark:text-slate-400 font-sans truncate max-w-[90%]">
          {sourceName}
        </span>
      </div>
    );
  }

  // 3. Normal cover image display
  return (
    <motion.img
      src={imageUrl}
      alt={title}
      crossOrigin="anonymous"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
      onError={() => setImageError(true)}
    />
  );
}
