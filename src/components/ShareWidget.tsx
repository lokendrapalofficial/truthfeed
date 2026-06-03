"use client";

import React, { useState } from "react";
import { Link2, Check, Share2 } from "lucide-react";

interface ShareWidgetProps {
  articleTitle: string;
}

export default function ShareWidget({ articleTitle }: ShareWidgetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleShareToX = () => {
    const text = `Check out this fact-checked article on TruthFeed: "${articleTitle}"`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(window.location.href)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-wrap items-center gap-3 py-4 border-t border-b border-zinc-100 mt-8 mb-4">
      <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 mr-2">
        <Share2 className="h-3.5 w-3.5" />
        <span>Share Report:</span>
      </span>

      {/* Copy Link Button */}
      <button
        onClick={handleCopyLink}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer ${
          copied
            ? "bg-zinc-900 border-zinc-900 text-white"
            : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-900 hover:text-zinc-900"
        }`}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            <span>Copied Link!</span>
          </>
        ) : (
          <>
            <Link2 className="h-3.5 w-3.5" />
            <span>Copy Link</span>
          </>
        )}
      </button>

      {/* Share on X (Twitter) */}
      <button
        onClick={handleShareToX}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 transition-all duration-200 cursor-pointer"
      >
        <svg className="h-3 w-3 fill-current text-zinc-800" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span>Share on X</span>
      </button>
    </div>
  );
}
