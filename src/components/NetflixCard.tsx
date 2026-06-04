"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import NewsImage from "./NewsImage";

interface NetflixCardProps {
  article: any;
}

export default function NetflixCard({ article }: NetflixCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Extract verification rating details
  const getVerificationBadge = () => {
    const factCheck = article.factChecks && article.factChecks.length > 0 ? article.factChecks[0] : null;
    if (factCheck) {
      if (factCheck.rating === "TRUE") {
        return (
          <span className="bg-emerald-500/90 backdrop-blur-xs text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-400/30 tracking-wider">
            🟢 VERIFIED
          </span>
        );
      }
      if (factCheck.rating === "FALSE" || factCheck.rating === "MIXED") {
        return (
          <span className="bg-rose-500/90 backdrop-blur-xs text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-rose-400/30 tracking-wider">
            ⚠️ CONFLICT
          </span>
        );
      }
    }

    const credibility = article.source?.credibility;
    if (credibility === "VERY_HIGH" || credibility === "HIGH") {
      return (
        <span className="bg-emerald-500/90 backdrop-blur-xs text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-400/30 tracking-wider">
          🟢 VERIFIED
        </span>
      );
    }
    if (credibility === "LOW" || credibility === "VERY_LOW") {
      return (
        <span className="bg-rose-500/90 backdrop-blur-xs text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-rose-400/30 tracking-wider">
          ⚠️ CONFLICT
        </span>
      );
    }

    return (
      <span className="bg-stone-500/80 backdrop-blur-xs text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-stone-400/20 tracking-wider">
        ◯ PENDING
      </span>
    );
  };

  // Resolve quick brief or neutral summaries
  const quickBrief = article.analysis?.verification?.quickBrief || 
                     article.summary || 
                     article.content || 
                     "";

  // Clamp the summary text for visually cinematic layout spacing
  const shortBrief = quickBrief.length > 100 
    ? quickBrief.substring(0, 97) + "..." 
    : quickBrief;

  return (
    <Link href={`/article/${article.id}`} className="block">
      <motion.div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="min-w-[320px] md:min-w-[400px] aspect-[16/10] relative overflow-hidden rounded-xl cursor-pointer snap-start shadow-md select-none group z-10 hover:z-20 hover:shadow-2xl"
      >
        {/* Full-bleed cover photography */}
        <motion.div
          animate={{ scale: isHovered ? 1.08 : 1.0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute inset-0 w-full h-full"
        >
          <NewsImage
            url={article.url}
            title={article.title}
            sourceName={article.sourceName}
            imageUrl={article.imageUrl}
            isLogo={false} // Force full bleed illustration over logos
            isThematic={article.isThematic}
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Cinematic dark bottom gradient overlay */}
        <div className="bg-gradient-to-t from-black/95 via-black/45 to-transparent absolute inset-0 pointer-events-none" />

        {/* Top Left: Verification Status */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          {getVerificationBadge()}
        </div>

        {/* Absolute positioned content text */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10 flex flex-row items-end justify-between gap-4 pointer-events-none">
          <div className="flex-1 flex flex-col justify-end min-w-0">
            {/* Quick Brief description that slides / fades in on hover */}
            <AnimatePresence>
              {isHovered && shortBrief && (
                <motion.p
                  initial={{ opacity: 0, height: 0, y: 10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: 10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="text-slate-200 text-xs md:text-sm mb-2.5 font-sans leading-relaxed line-clamp-2 pr-4 font-normal"
                >
                  {shortBrief}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Headline */}
            <h3 className="text-lg md:text-xl font-serif text-white leading-tight font-extrabold line-clamp-2">
              {article.title}
            </h3>
          </div>

          {/* Bottom Right: Monospace source pill indicator */}
          <div className="shrink-0 text-right mb-0.5">
            <span className="text-[10px] text-slate-350 font-mono uppercase tracking-widest font-bold">
              [{article.sourceName}]
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
