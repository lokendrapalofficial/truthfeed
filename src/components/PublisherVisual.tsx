"use client";

import React from "react";
import { Newspaper } from "lucide-react";

interface PublisherVisualProps {
  sourceName: string;
  viewMode: "grid" | "list" | "hero" | "detail";
}

// Extract smart publisher initials (2-3 letters)
const getPublisherInitials = (name: string): string => {
  if (!name) return "TF";
  
  const words = name.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return "TF";
  
  // 1. Check if first word is a common acronym (all uppercase, e.g., "BBC", "CNN", "CNBC", "NPR")
  const firstWord = words[0];
  if (firstWord.length >= 2 && firstWord.length <= 4 && /^[A-Z0-9]+$/.test(firstWord)) {
    return firstWord;
  }
  
  // 2. Filter out minor words
  const minorWords = ["the", "of", "and", "in", "on", "at", "by", "for", "with", "a", "an"];
  const cleanWords = words.filter((w, idx) => {
    if (idx === 0) return true;
    return !minorWords.includes(w.toLowerCase());
  });
  
  // 3. Extract first letters
  if (cleanWords.length >= 3) {
    return (cleanWords[0][0] + cleanWords[1][0] + cleanWords[2][0]).toUpperCase();
  }
  
  if (cleanWords.length === 2) {
    const w1 = cleanWords[0];
    const w2 = cleanWords[1];
    if (w1.length <= 3) {
      return (w1 + w2[0]).substring(0, 3).toUpperCase();
    }
    return (w1[0] + w2[0]).toUpperCase();
  }
  
  const w = cleanWords[0];
  return w.substring(0, Math.min(w.length, 3)).toUpperCase();
};

export default function PublisherVisual({ sourceName, viewMode }: PublisherVisualProps) {
  const initials = getPublisherInitials(sourceName);

  // Define layout classes depending on viewMode
  let containerClasses = "relative w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center select-none overflow-hidden transition-colors duration-300";
  let textClasses = "font-serif font-bold text-slate-400 dark:text-slate-600 tracking-tighter leading-none relative z-10 select-none";
  let iconClasses = "absolute -bottom-6 -right-6 text-slate-400/20 dark:text-slate-600/20 opacity-[0.25] pointer-events-none z-0";

  if (viewMode === "list") {
    containerClasses += " w-32 h-32 rounded-lg flex-shrink-0";
    textClasses += " text-3xl";
    iconClasses += " w-20 h-20";
  } else if (viewMode === "grid") {
    containerClasses += " aspect-video rounded-t-xl";
    textClasses += " text-4xl sm:text-5xl";
    iconClasses += " w-28 h-28";
  } else if (viewMode === "hero") {
    containerClasses += " aspect-video lg:aspect-[21/9] rounded-lg";
    textClasses += " text-5xl sm:text-6xl md:text-7xl";
    iconClasses += " w-36 h-36 lg:w-48 lg:h-48";
  } else if (viewMode === "detail") {
    containerClasses += " aspect-video rounded-xl";
    textClasses += " text-5xl sm:text-6xl";
    iconClasses += " w-36 h-36";
  }

  return (
    <div className={containerClasses}>
      {/* Background Icon Texture */}
      <Newspaper className={iconClasses} />
      
      {/* Centered Initials Text */}
      <span className={textClasses}>
        {initials}
      </span>
    </div>
  );
}
