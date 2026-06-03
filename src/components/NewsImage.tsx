"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NewsImageProps {
  url: string;
  title: string;
  sourceName: string;
  className?: string;
}

export default function NewsImage({ url, title, sourceName, className = "w-full h-full object-cover" }: NewsImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Helper to extract initials
  const getInitials = (name: string): string => {
    if (!name) return "TF";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  useEffect(() => {
    let isMounted = true;
    const fetchImage = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error("Failed to fetch og:image");
        const data = await res.json();
        
        if (isMounted) {
          if (data?.data?.image?.url) {
            setImageUrl(data.data.image.url);
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

  const initials = getInitials(sourceName);

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
          // Fallback elegant initials + gradient background
          <motion.div
            key="fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center w-full h-full select-none"
          >
            <span className="text-gray-400 dark:text-slate-500 font-extrabold text-2xl tracking-wider font-sans">
              {initials}
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
