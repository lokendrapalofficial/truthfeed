"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NewsImageProps {
  url: string;
  title: string;
  sourceName: string;
  className?: string;
}

// Map common news source names to their official domains
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

// Decodes a Google News RSS base64 redirect URL client-side
function decodeGoogleNewsUrl(googleUrl: string): string | null {
  try {
    const urlObj = new URL(googleUrl);
    if (!urlObj.hostname.includes("news.google.com")) return googleUrl;
    
    const pathname = urlObj.pathname;
    const parts = pathname.split('/');
    const base64Str = parts.find(p => p.startsWith('CBMi') || p.length > 50);
    if (!base64Str) return googleUrl;
    
    const cleanedB64 = base64Str.split('?')[0];
    const normalizedB64 = cleanedB64.replace(/-/g, '+').replace(/_/g, '/');
    const binaryStr = atob(normalizedB64);
    
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const utf8Str = new TextDecoder('utf-8').decode(bytes);
    
    const httpIndex = utf8Str.indexOf('http');
    if (httpIndex === -1) return googleUrl;
    
    const rest = utf8Str.substring(httpIndex);
    const urlMatch = rest.match(/https?:\/\/[a-zA-Z0-9_\-\.\/\?&\+=\#~%!*':;(),]+/);
    return urlMatch ? urlMatch[0] : googleUrl;
  } catch (e) {
    return googleUrl;
  }
}

// Checks if the image URL is a Google News logo or hosted on Google domains
const isGoogleImage = (url: string): boolean => {
  const lowUrl = url.toLowerCase();
  return lowUrl.includes("googleusercontent.com") || 
         lowUrl.includes("gstatic.com") || 
         lowUrl.includes("google.com") ||
         (lowUrl.includes("logo") && lowUrl.includes("google"));
};

export default function NewsImage({ url, title, sourceName, className = "w-full h-full object-cover" }: NewsImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [logoState, setLogoState] = useState<"clearbit" | "google" | "initials">("clearbit");

  // Helper to extract initials
  const getInitials = (name: string): string => {
    if (!name) return "TF";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const domain = getPublisherDomain(sourceName);
  const initials = getInitials(sourceName);
  const logoUrl = `https://logo.clearbit.com/${domain}`;

  useEffect(() => {
    let isMounted = true;
    const fetchImage = async () => {
      setLoading(true);
      setError(false);
      try {
        // Resolve original publisher URL if it's a google news redirect link
        const targetUrl = decodeGoogleNewsUrl(url) || url;
        
        const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(targetUrl)}`);
        if (!res.ok) throw new Error("Failed to fetch og:image");
        const data = await res.json();
        
        if (isMounted) {
          const imgUrl = data?.data?.image?.url;
          // Only use the fetched image if it's not a Google News logo / Google domain image
          if (imgUrl && !isGoogleImage(imgUrl)) {
            setImageUrl(imgUrl);
          } else {
            setError(true);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (url) {
      fetchImage();
    } else {
      setError(true);
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [url]);

  return (
    <div className="relative w-full h-full bg-gray-100 dark:bg-slate-800 transition-colors duration-300">
      <AnimatePresence mode="wait">
        {loading ? (
          // Loading skeleton state
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-200 dark:bg-slate-700 animate-pulse w-full h-full"
          />
        ) : error || !imageUrl ? (
          // Fallback elegant initials + publisher logo + gradient background
          <motion.div
            key="fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 flex flex-col items-center justify-center w-full h-full select-none gap-2 p-4 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 shadow-md flex items-center justify-center border border-gray-200/50 dark:border-slate-600/50 overflow-hidden p-2.5">
              {logoState === "clearbit" && (
                <img
                  src={logoUrl}
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
          </motion.div>
        ) : (
          // Loaded image state
          <motion.img
            key="image"
            src={imageUrl}
            alt={title}
            crossOrigin="anonymous"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={className}
            onError={() => setError(true)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
