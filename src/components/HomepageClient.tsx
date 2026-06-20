"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, Sun, Moon, LayoutGrid, List, Bookmark, Globe } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/AuthModal";
import UserMenu from "@/components/UserMenu";
import { fetchNews, getArticles } from "@/app/actions/fetchNews";
import { getUserProfile, updateUserProfileSettings } from "@/app/actions/userActions";
import { toggleBookmark, getUserBookmarkIds } from "@/app/actions/bookmarkActions";
import { motion } from "framer-motion";
import BackToTop from "@/components/BackToTop";
import TransparencyCard from "@/components/TransparencyCard";
import TopStories from "@/components/TopStories";
import NewsImage from "@/components/NewsImage";
import { formatSmartDate, getArticleCategory } from "@/lib/utils";

interface SourceData {
  id: string;
  name: string;
  bias: string;
  credibility: string;
  description?: string | null;
}

interface HomepageClientProps {
  initialArticles: any[];
  initialSources: SourceData[];
}

const CATEGORIES = [
  { id: "foryou", label: "For You" },
  { id: "top", label: "Trending News" },
  { id: "world", label: "World" },
  { id: "business", label: "Business" },
  { id: "technology", label: "Technology" },
  { id: "sports", label: "Sports" },
  { id: "entertainment", label: "Entertainment" },
  { id: "health", label: "Health" },
  { id: "science", label: "Science" },
];

const getConsensusScore = (article: any) => {
  if (article.analysis?.verification?.consensusScore !== undefined && article.analysis?.verification?.consensusScore !== null) {
    return article.analysis.verification.consensusScore;
  }
  const factChecks = article.factChecks || [];
  if (factChecks.some((fc: any) => fc.rating === "TRUE")) return 5;
  if (article.source?.credibility === "VERY_HIGH") return 5;
  if (article.source?.credibility === "HIGH") return 4;
  return null;
};

const isVerified = (article: any) => {
  return article.factChecks?.some((fc: any) => fc.rating === "TRUE") ||
         article.source?.credibility === "VERY_HIGH" ||
         article.source?.credibility === "HIGH" ||
         article.analysis?.verification?.confidenceLevel === "High" ||
         article.analysis?.verification?.confidenceLevel === "HIGH";
};

const isConflicting = (article: any) => {
  return article.factChecks?.some((fc: any) => fc.rating === "FALSE" || fc.rating === "MIXED") ||
         article.source?.credibility === "LOW" ||
         article.source?.credibility === "VERY_LOW" ||
         article.analysis?.verification?.confidenceLevel === "Conflicting" ||
         article.analysis?.verification?.confidenceLevel === "CONFLICTING" ||
         article.analysis?.verification?.confidenceLevel === "Low";
};

export default function HomepageClient({ initialArticles }: HomepageClientProps) {
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const autoSyncAttempted = useRef<string | null>(null);

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    }
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const [userRegion, setUserRegion] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("truthfeed-country-preference");
      if (saved) return saved;
    }
    return "US";
  });
  const [userPrefs, setUserPrefs] = useState<string[]>([]);
  const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);
  const [articles, setArticles] = useState<any[]>(initialArticles);
  const [isRegionChanging, setIsRegionChanging] = useState(false);
  const activeFetchRegion = useRef<string | null>(null);
  const [lastSyncText, setLastSyncText] = useState<string>("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const updateLastSyncText = () => {
    if (typeof window === "undefined") return;
    const lastSyncTimeStr = localStorage.getItem(`truthfeed-last-sync-${userRegion}`);
    if (!lastSyncTimeStr) {
      setLastSyncText("");
      return;
    }
    const timestamp = parseInt(lastSyncTimeStr, 10);
    if (isNaN(timestamp) || timestamp === 0) {
      setLastSyncText("");
      return;
    }
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) {
      setLastSyncText("Just now");
    } else if (diffMins < 60) {
      setLastSyncText(`${diffMins}m ago`);
    } else {
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) {
        setLastSyncText(`${diffHours}h ago`);
      } else {
        setLastSyncText(new Date(timestamp).toLocaleDateString([], { month: "short", day: "numeric" }));
      }
    }
  };

  useEffect(() => {
    updateLastSyncText();
    const interval = setInterval(updateLastSyncText, 60000);
    return () => clearInterval(interval);
  }, [userRegion]);

  useEffect(() => {
    if (user?.id) {
      getUserProfile(user.id).then((res) => {
        if (res.success && res.user) {
          if (res.user.preferences) {
            setUserPrefs(res.user.preferences as string[]);
          }
           if (res.user.region) {
            let userReg = res.user.region as string;
            if (userReg === "GLOBAL") userReg = "US";
            if (userReg === "UK") userReg = "GB";
            if (userReg === "EU") userReg = "DE";
            setUserRegion(userReg);
            if (typeof window !== "undefined") {
              localStorage.setItem("truthfeed-country-preference", userReg);
            }
          }
        }
      });
      getUserBookmarkIds().then((res) => {
        if (res.success) {
          setBookmarkIds(res.bookmarkIds || []);
        }
      });
    } else {
      setUserPrefs([]);
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("truthfeed-country-preference");
        setUserRegion(saved || "US");
      } else {
        setUserRegion("US");
      }
      setBookmarkIds([]);
    }
  }, [user]);

  useEffect(() => {
    if (!user && (userRegion === "US" || userRegion === "GLOBAL")) {
      setArticles(initialArticles);
    }
  }, [initialArticles, user, userRegion]);

  const loadArticlesForRegion = async (region: string) => {
    activeFetchRegion.current = region;
    setIsRegionChanging(true);
    setArticles([]);
    try {
      const res = await getArticles(region);
      if (activeFetchRegion.current !== region) return; // Ignore stale request
      if (res.success && res.articles) {
        const serialized = res.articles.map((art: any) => ({
          ...art,
          publishedAt: art.publishedAt instanceof Date ? art.publishedAt.toISOString() : String(art.publishedAt),
          createdAt: art.createdAt instanceof Date ? art.createdAt.toISOString() : String(art.createdAt),
          factChecks: art.factChecks || [],
          source: art.source ? {
            id: art.source.id,
            name: art.source.name,
            bias: art.source.bias,
            credibility: art.source.credibility,
            description: art.source.description,
          } : null,
          analysis: art.analysis ? {
            id: art.analysis.id,
            claim: art.analysis.claim,
            briefing: art.analysis.briefing,
            wikiContexts: art.analysis.wikiContexts,
            category: art.analysis.category,
            articleText: art.analysis.articleText,
            verification: art.analysis.verification,
          } : null,
        }));
        setArticles(serialized);
      }
    } catch (err) {
      console.error("Failed to load region articles:", err);
    } finally {
      if (activeFetchRegion.current === region) {
        setIsRegionChanging(false);
      }
    }
  };

  useEffect(() => {
    if (userRegion) {
      loadArticlesForRegion(userRegion);
    }
  }, [userRegion]);

  const handleQuickRegionChange = async (newRegion: string) => {
    setUserRegion(newRegion);
    if (typeof window !== "undefined") {
      localStorage.setItem("truthfeed-country-preference", newRegion);
    }
    if (user?.id) {
      const currentName = user?.user_metadata?.full_name || user?.user_metadata?.name || "";
      try {
        await updateUserProfileSettings(user.id, currentName, newRegion);
      } catch (err) {
        console.error("Failed to persist quick region change:", err);
      }
    }
  };

  const handleBookmarkClick = async (e: React.MouseEvent, articleId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setIsAuthModalOpen(true);
      return;
    }

    const prev = bookmarkIds;
    const isSaved = prev.includes(articleId);

    if (isSaved) {
      setBookmarkIds(prev.filter((id) => id !== articleId));
    } else {
      setBookmarkIds([...prev, articleId]);
    }

    try {
      const res = await toggleBookmark(articleId);
      if (res.success) {
        if (res.isBookmarked) {
          setBookmarkIds((prev) => (prev.includes(articleId) ? prev : [...prev, articleId]));
        } else {
          setBookmarkIds((prev) => prev.filter((id) => id !== articleId));
        }
      } else {
        setBookmarkIds(prev);
        alert(res.error || "Failed to update bookmark.");
      }
    } catch {
      setBookmarkIds(prev);
      alert("An unexpected error occurred.");
    }
  };

  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("foryou");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"latest" | "verified" | "conflict">("latest");
  const [displayLimit, setDisplayLimit] = useState(24);

  useEffect(() => {
    setMounted(true);
    const savedView = localStorage.getItem("truthfeed-viewmode");
    if (savedView === "grid" || savedView === "list") {
      setViewMode(savedView);
    } else {
      const isMobile = window.innerWidth < 768;
      setViewMode(isMobile ? "list" : "grid");
    }
  }, []);

  // Reset pagination limit when category, search query, or sorting changes
  useEffect(() => {
    setDisplayLimit(24);
  }, [activeCategory, searchQuery, sortBy]);

  // Infinite Scroll Scroll Event Listener
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === "undefined") return;
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 200
      ) {
        setDisplayLimit((prev) => prev + 24);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Client-side automatic background sync on page mount.
  // If the news is older than 15 minutes, fetch fresh articles in the background silently.
  useEffect(() => {
    if (!userRegion) return;
    if (isRegionChanging) return; // Wait until initial region load is complete to avoid DB contention
    if (autoSyncAttempted.current === userRegion) return;
    autoSyncAttempted.current = userRegion;

    const runBackgroundSync = async () => {
      console.log(`[Auto-Sync] Initiating automatic background news sync for ${userRegion}...`);
      try {
        const result = await fetchNews(userRegion);
        localStorage.setItem(`truthfeed-last-sync-${userRegion}`, Date.now().toString());
        updateLastSyncText();
        if (result.success && typeof result.count === "number" && result.count > 0) {
          console.log(`[Auto-Sync] Background sync completed successfully: fetched ${result.count} new articles.`);
          await loadArticlesForRegion(userRegion);
        } else {
          console.log(`[Auto-Sync] Background sync checked for ${userRegion}, no new articles found.`);
        }
      } catch (err) {
        console.error(`[Auto-Sync] Background sync error for ${userRegion}:`, err);
      }
    };

    runBackgroundSync();
  }, [initialArticles, router, userRegion, isRegionChanging]);

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("truthfeed-viewmode", mode);
  };



  const allArticles = useMemo(() => {
    return articles.map((art) => ({
      id: art.id,
      title: art.title,
      url: art.url,
      content: art.content,
      summary: art.summary || art.content || "",
      imageUrl: art.imageUrl,
      isLogo: art.isLogo,
      isThematic: art.isThematic,
      sourceName: art.sourceName,
      publishedAt: art.publishedAt,
      factChecks: art.factChecks || [],
      source: art.source,
      analysis: art.analysis,
      region: art.region,
    }));
  }, [articles]);

  const mapPreferenceToCategory = (pref: string): string => {
    const p = pref.toLowerCase();
    if (p.includes("geopolitics") || p.includes("world")) return "world";
    if (p.includes("tech") || p.includes("crypto")) return "technology";
    if (p.includes("sport")) return "sports";
    if (p.includes("econom") || p.includes("business")) return "business";
    if (p.includes("climate") || p.includes("science")) return "science";
    if (p.includes("entertainment") || p.includes("art")) return "entertainment";
    if (p.includes("health")) return "health";
    return "world";
  };

  const preferredCategories = useMemo(() => {
    if (userPrefs.length === 0) return [];
    return Array.from(new Set(userPrefs.map(mapPreferenceToCategory)));
  }, [userPrefs]);

  const filteredArticles = useMemo(() => {
    return allArticles.filter((article) => {
      // 1. Search Query Match
      const matchesSearch =
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.sourceName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Category Match
      if (activeCategory !== "top" && activeCategory !== "foryou") {
        const cat = getArticleCategory(article.title, article.summary);
        if (cat !== activeCategory) return false;
      }

      return true;
    });
  }, [allArticles, searchQuery, activeCategory]);

  // Client-side title-similarity deduplication & outlet merging
  const deduplicatedArticles = useMemo(() => {
    const result: any[] = [];
    const seenUrls = new Set<string>();

    const normalizeTitle = (title: string) => {
      return title
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 3)
        .sort()
        .join(" ");
    };

    // Pre-calculate normalized titles and word arrays to avoid doing it in a nested loop
    const normalizedList = filteredArticles.map((art) => {
      const norm = normalizeTitle(art.title);
      return {
        art,
        norm,
        words: norm.split(" ").filter(Boolean),
      };
    });

    const addedNorms: { norm: string; words: string[]; art: any }[] = [];

    for (const item of normalizedList) {
      const art = item.art;
      const url = art.url;
      if (seenUrls.has(url)) continue;

      let duplicateParent: any = null;
      const words1 = item.words;
      const len1 = words1.length;

      if (len1 > 0) {
        for (const added of addedNorms) {
          const words2 = added.words;
          const len2 = words2.length;
          if (len2 === 0) continue;

          // Quick ratio filter: if length ratio > 2.0, similarity can't exceed 0.5 (below 0.6 threshold)
          if (len1 / len2 > 2.0 || len2 / len1 > 2.0) continue;

          let intersection = 0;
          if (len1 < len2) {
            for (let i = 0; i < len1; i++) {
              if (words2.includes(words1[i])) intersection++;
            }
          } else {
            for (let i = 0; i < len2; i++) {
              if (words1.includes(words2[i])) intersection++;
            }
          }

          const similarity = intersection / Math.max(len1, len2);
          if (similarity > 0.6) {
            duplicateParent = added.art;
            break;
          }
        }
      }

      if (duplicateParent) {
        if (!duplicateParent.extraOutlets) duplicateParent.extraOutlets = [];
        if (!duplicateParent.extraOutlets.some((o: any) => o.sourceName.toLowerCase() === art.sourceName.toLowerCase())) {
          duplicateParent.extraOutlets.push({
            title: art.title,
            sourceName: art.sourceName,
            url: art.url
          });
        }
      } else {
        seenUrls.add(url);
        const newArt = { ...art, extraOutlets: [] };
        addedNorms.push({ norm: item.norm, words: words1, art: newArt });
        result.push(newArt);
      }
    }
    return result;
  }, [filteredArticles]);

  const sortedAndFilteredArticles = useMemo(() => {
    let result = [...deduplicatedArticles];

    if (sortBy === "latest") {
      result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    } else if (sortBy === "verified") {
      result.sort((a, b) => {
        const aVer = isVerified(a) ? 1 : 0;
        const bVer = isVerified(b) ? 1 : 0;
        if (aVer !== bVer) return bVer - aVer;

        const aScore = getConsensusScore(a) || 0;
        const bScore = getConsensusScore(b) || 0;
        if (aScore !== bScore) return bScore - aScore;

        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
    } else if (sortBy === "conflict") {
      result.sort((a, b) => {
        const aCon = isConflicting(a) ? 1 : 0;
        const bCon = isConflicting(b) ? 1 : 0;
        if (aCon !== bCon) return bCon - aCon;

        const aScore = getConsensusScore(a) || 5;
        const bScore = getConsensusScore(b) || 5;
        if (aScore !== bScore) return aScore - bScore;

        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
    }

    // Bubble up user's preferred region and categories
    if (userRegion) {
      const isMatchingRegion = (artRegion: string) => {
        const regions = (artRegion || "").split(",");
        if (userRegion === "US") return regions.includes("US") || regions.includes("GLOBAL");
        if (userRegion === "GB") return regions.includes("GB") || regions.includes("UK");
        if (userRegion === "DE") return regions.includes("DE") || regions.includes("EU");
        return regions.includes(userRegion);
      };

      // Find articles matching user's region
      const matchingRegion = result.filter(art => isMatchingRegion(art.region));
      const otherRegion = result.filter(art => !isMatchingRegion(art.region));

      // Helper to process category bubbling
      const processCategoryBubbling = (list: any[]) => {
        if (activeCategory === "foryou" && preferredCategories.length > 0) {
          const matchingCat = list.filter(art => {
            const cat = getArticleCategory(art.title, art.summary || art.content || "");
            return preferredCategories.includes(cat);
          });
          const otherCat = list.filter(art => {
            const cat = getArticleCategory(art.title, art.summary || art.content || "");
            return !preferredCategories.includes(cat);
          });
          return [...matchingCat, ...otherCat];
        }
        return list;
      };

      return [...processCategoryBubbling(matchingRegion), ...processCategoryBubbling(otherRegion)];
    } else if (activeCategory === "foryou" && preferredCategories.length > 0) {
      // Standard category bubbling for GLOBAL
      const matching = result.filter(art => {
        const cat = getArticleCategory(art.title, art.summary || art.content || "");
        return preferredCategories.includes(cat);
      });
      const others = result.filter(art => {
        const cat = getArticleCategory(art.title, art.summary || art.content || "");
        return !preferredCategories.includes(cat);
      });
      return [...matching, ...others];
    }

    return result;
  }, [deduplicatedArticles, sortBy, activeCategory, preferredCategories, userRegion]);

  const showHeroSection = useMemo(() => {
    return activeCategory !== "top" && sortedAndFilteredArticles.length > 0;
  }, [activeCategory, sortedAndFilteredArticles]);

  const heroArticle = useMemo(() => {
    if (!showHeroSection) return null;
    return sortedAndFilteredArticles[0] || null;
  }, [showHeroSection, sortedAndFilteredArticles]);

  const stackArticles = useMemo(() => {
    if (!showHeroSection) return [];
    return sortedAndFilteredArticles.slice(1, 4);
  }, [showHeroSection, sortedAndFilteredArticles]);

  const feedArticles = useMemo(() => {
    const baseList = showHeroSection
      ? sortedAndFilteredArticles.slice(4)
      : sortedAndFilteredArticles;
    return baseList.slice(0, displayLimit);
  }, [showHeroSection, sortedAndFilteredArticles, displayLimit]);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300">
      
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 backdrop-blur-sm transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            
            {/* Left: TruthFeed Logo */}
            {!showMobileSearch && (
              <div
                className="cursor-pointer flex items-center gap-1.5 select-none shrink-0"
                onClick={() => {
                  setActiveCategory("foryou");
                  setSearchQuery("");
                }}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm tracking-tight transition-colors duration-300">
                  T
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  TruthFeed
                </span>
              </div>
            )}

            {/* Center: Rounded Search Bar (Responsive toggling) */}
            <div className={`flex-1 max-w-xl relative group mx-2 ${showMobileSearch ? "block" : "hidden sm:block"}`}>
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-700 dark:group-focus-within:text-slate-350 transition-colors">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Search for topics, sources and claims"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-10 rounded-full bg-slate-105 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 border border-transparent dark:border-slate-750 focus:border-slate-200 dark:focus:border-slate-650 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all duration-300"
              />
              {showMobileSearch && (
                <button
                  onClick={() => {
                    setShowMobileSearch(false);
                    setSearchQuery("");
                  }}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Right: Actions Tray */}
            {!showMobileSearch && (
              <div className="flex items-center gap-3 shrink-0">
                
                {/* Search Trigger for Mobile */}
                <button
                  onClick={() => setShowMobileSearch(true)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 sm:hidden transition-colors cursor-pointer"
                  title="Search"
                >
                  <Search className="h-4.5 w-4.5" />
                </button>

                {/* Quick Region Selector (Hidden on mobile) */}
                <div className="relative shrink-0 hidden md:block">
                  <select
                    value={userRegion}
                    onChange={(e) => handleQuickRegionChange(e.target.value)}
                    className="appearance-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-705 dark:text-slate-200 text-xs font-bold pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-slate-300 dark:focus:border-slate-655 transition-colors cursor-pointer select-none"
                  >
                    <option value="IN">🇮🇳 India Edition</option>
                    <option value="US">🇺🇸 United States</option>
                    <option value="GB">🇬🇧 United Kingdom</option>
                    <option value="AU">🇦🇺 Australia</option>
                    <option value="CA">🇨🇦 Canada</option>
                    <option value="DE">🇩🇪 Germany</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500 dark:text-slate-400">
                    <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>

                <span className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block shrink-0"></span>

                {user && (
                  <Link
                    href="/dashboard/bookmarks"
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                    title="My Bookmarks"
                  >
                    <Bookmark className="h-4.5 w-4.5" />
                  </Link>
                )}

                {mounted && lastSyncText && (
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 hidden sm:inline select-none px-1" title="Last news feed synchronization">
                    Synced {lastSyncText}
                  </span>
                )}
                
                <button
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                  title="Toggle theme"
                >
                  {mounted && resolvedTheme === "dark" ? (
                    <Sun className="h-4.5 w-4.5" />
                  ) : (
                    <Moon className="h-4.5 w-4.5" />
                  )}
                </button>

                {user ? (
                  <UserMenu user={user} onSignOut={() => { setUser(null); router.refresh(); }} />
                ) : (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 h-9 rounded-full bg-slate-105 dark:bg-slate-855 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-705 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider cursor-pointer border border-slate-250 dark:border-slate-850 transition-colors shadow-sm"
                    title="Sign In"
                  >
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

        {/* SUB-HEADER: Region Selection Tray for Mobile Viewports */}
        <div className="flex md:hidden items-center justify-start gap-2.5 px-4 py-2 overflow-x-auto bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200/60 dark:border-slate-800/60 scrollbar-hide">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 whitespace-nowrap select-none">Region:</span>
          {[
            { id: "IN", flag: "🇮🇳", label: "India" },
            { id: "US", flag: "🇺🇸", label: "US" },
            { id: "GB", flag: "🇬🇧", label: "UK" },
            { id: "AU", flag: "🇦🇺", label: "AU" },
            { id: "CA", flag: "🇨🇦", label: "CA" },
            { id: "DE", flag: "🇩🇪", label: "DE" },
          ].map((reg) => {
            const isActive = userRegion === reg.id;
            return (
              <button
                key={reg.id}
                onClick={() => handleQuickRegionChange(reg.id)}
                className={`text-[11px] font-bold px-2 py-0.5 rounded whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? "text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {reg.flag} {reg.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Sticky Category Ribbon */}
      <div className="sticky top-16 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar flex-1 mr-4">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-1.5 text-xs font-semibold tracking-wide whitespace-nowrap rounded-full transition-all cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-205 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Grid/List View Mode Toggler */}
          <div className="flex items-center gap-1 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-3 py-1.5">
            <button
              onClick={() => handleViewModeChange("grid")}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-855 hover:text-slate-650 dark:hover:text-slate-350"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => handleViewModeChange("list")}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-855 hover:text-slate-650 dark:hover:text-slate-350"
              }`}
              title="List View"
            >
              <List className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Core Content Feed */}
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-0 sm:px-6 py-6">
          


          {isRegionChanging ? (
            <div className="animate-pulse space-y-10">
              {/* Top Section Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Large card skeleton */}
                <div className="lg:col-span-2 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden min-h-[380px]">
                  <div className="aspect-[16/8] w-full bg-slate-200 dark:bg-slate-800" />
                  <div className="p-5 flex flex-col flex-1 gap-4">
                    <div className="flex gap-2">
                      <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-5 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-5 w-[85%] bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                </div>
                {/* Secondary cards stack skeleton */}
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((val) => (
                    <div
                      key={val}
                      className="flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 min-h-[110px]"
                    >
                      <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded mt-2" />
                      <div className="h-4 w-[75%] bg-slate-200 dark:bg-slate-800 rounded mt-1" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid Cards Skeleton */}
              <div className="space-y-6">
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((card) => (
                    <div
                      key={card}
                      className="flex flex-col h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
                    >
                      <div className="aspect-video w-full bg-slate-200 dark:bg-slate-800" />
                      <div className="p-4 flex flex-col flex-1 gap-3">
                        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-4 w-[90%] bg-slate-200 dark:bg-slate-800 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 gap-8">
              
              {/* Left 12 Columns - Content (Full width since sidebar is removed) */}
              <div className="xl:col-span-12 space-y-10">
                
                {/* ── CATEGORIZED TRENDING SECTIONS (Trending News Tab Only) ── */}
                {activeCategory === "top" && (
                  <div className="space-y-12">
                    {CATEGORIES.filter(c => c.id !== "foryou" && c.id !== "top").map((cat) => {
                      const catArticles = sortedAndFilteredArticles
                        .filter(art => getArticleCategory(art.title, art.summary || art.content || "") === cat.id)
                        .slice(0, 5);

                      if (catArticles.length === 0) return null;

                      const mainStory = catArticles[0];
                      const restStories = catArticles.slice(1);
                      const smartDate = formatSmartDate(mainStory.publishedAt);
                      
                      const mainOutletsCount = (() => {
                        const outlets = new Set<string>();
                        if (mainStory.sourceName) outlets.add(mainStory.sourceName.toLowerCase().trim());
                        if (mainStory.relatedSources && Array.isArray(mainStory.relatedSources)) {
                          for (const src of mainStory.relatedSources) {
                            if (src.sourceName) outlets.add(src.sourceName.toLowerCase().trim());
                          }
                        }
                        if (mainStory.extraOutlets && Array.isArray(mainStory.extraOutlets)) {
                          for (const src of mainStory.extraOutlets) {
                            if (src.sourceName) outlets.add(src.sourceName.toLowerCase().trim());
                          }
                        }
                        return outlets.size;
                      })();

                      return (
                        <div key={cat.id} className="space-y-4">
                          {/* Section Header */}
                          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 px-4 sm:px-0">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse"></span>
                              Trending News in {cat.label}
                            </h3>
                            <button
                              onClick={() => {
                                setActiveCategory(cat.id);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="text-xs font-bold font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-0"
                            >
                              View More <span aria-hidden>→</span>
                            </button>
                          </div>

                          {/* Grid Layout */}
                          {restStories.length === 0 ? (
                            // Only 1 article, render single large card
                            <div className="max-w-xl">
                              <TransparencyCard 
                                article={mainStory} 
                                viewMode="grid" 
                                isBookmarked={bookmarkIds.includes(mainStory.id)}
                                onToggleBookmark={(id, isSaved) => {
                                  if (isSaved) {
                                    setBookmarkIds((prev) => [...prev, id]);
                                  } else {
                                    setBookmarkIds((prev) => prev.filter((item) => item !== id));
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                              {/* Left Side: Main Featured Story (5 columns) */}
                              <div className="md:col-span-5 flex">
                                <Link
                                  href={`/article/${mainStory.id}`}
                                  className="group flex flex-col w-full rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-300"
                                >
                                  {/* Cover Image */}
                                  <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative shrink-0">
                                    <NewsImage
                                      url={mainStory.url}
                                      title={mainStory.title}
                                      sourceName={mainStory.sourceName}
                                      imageUrl={mainStory.imageUrl}
                                      isLogo={mainStory.isLogo}
                                      isThematic={mainStory.isThematic}
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                                    />
                                    <button
                                      onClick={(e) => handleBookmarkClick(e, mainStory.id)}
                                      className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 text-slate-605 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-800/50 transition-all z-10 cursor-pointer"
                                      title={bookmarkIds.includes(mainStory.id) ? "Remove Bookmark" : "Bookmark Story"}
                                    >
                                      <Bookmark className={`h-4.5 w-4.5 ${bookmarkIds.includes(mainStory.id) ? "fill-blue-600 dark:fill-blue-500 text-blue-600 dark:text-blue-500" : ""}`} />
                                    </button>
                                  </div>
                                  
                                  {/* Body */}
                                  <div className="p-4 flex flex-col flex-1 gap-2.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        {mainStory.sourceName}
                                      </span>
                                      <span className="text-slate-300 dark:text-slate-600">·</span>
                                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                        {smartDate.text}
                                      </span>
                                      {mainOutletsCount > 1 && (
                                        <span className="text-[9px] font-mono text-indigo-750 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/40 px-1.5 py-0.5 rounded-full">
                                          {mainOutletsCount} outlets
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-3">
                                      {mainStory.title}
                                    </h4>
                                  </div>
                                </Link>
                              </div>

                              {/* Right Side: List of 3-4 Secondary Stories (7 columns) */}
                              <div className="md:col-span-7 flex">
                                <div className="flex flex-col justify-between w-full bg-slate-50/30 dark:bg-slate-950/10 border border-slate-200/60 dark:border-slate-800/50 rounded-xl p-4 divide-y divide-slate-200/60 dark:divide-slate-800/60">
                                  {restStories.map((story) => {
                                    const storyDate = formatSmartDate(story.publishedAt);
                                    const storyOutletsCount = (() => {
                                      const outlets = new Set<string>();
                                      if (story.sourceName) outlets.add(story.sourceName.toLowerCase().trim());
                                      if (story.relatedSources && Array.isArray(story.relatedSources)) {
                                        for (const src of story.relatedSources) {
                                          if (src.sourceName) outlets.add(src.sourceName.toLowerCase().trim());
                                        }
                                      }
                                      if (story.extraOutlets && Array.isArray(story.extraOutlets)) {
                                        for (const src of story.extraOutlets) {
                                          if (src.sourceName) outlets.add(src.sourceName.toLowerCase().trim());
                                        }
                                      }
                                      return outlets.size;
                                    })();

                                    return (
                                      <Link
                                        key={story.id}
                                        href={`/article/${story.id}`}
                                        className="group py-3 first:pt-0 last:pb-0 block"
                                      >
                                        <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">
                                          <span className="font-bold text-slate-700 dark:text-slate-300">
                                            {story.sourceName}
                                          </span>
                                          <span>·</span>
                                          <span>{storyDate.text}</span>
                                          {storyOutletsCount > 1 && (
                                            <span className="text-[9px] font-mono text-indigo-750 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/40 px-1.5 py-0.5 rounded-full normal-case">
                                              {storyOutletsCount} outlets
                                            </span>
                                          )}
                                        </div>
                                        <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug mt-1.5 font-sans">
                                          {story.title}
                                        </h5>
                                      </Link>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── TRENDING NEWS ── Featured Hero + Sidebar Grid */}
                {showHeroSection && (
                  <TopStories
                    activeCategory={activeCategory}
                    categoryLabel={CATEGORIES.find((c) => c.id === activeCategory)?.label || ""}
                    heroArticle={heroArticle}
                    stackArticles={stackArticles}
                    isVerified={isVerified}
                    isConflicting={isConflicting}
                  />
                )}
 
                {/* High Density Main Feed (Below the fold) */}
                <section className="space-y-6">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-0">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>Latest Updates</span>
                      {activeCategory === "foryou" && preferredCategories.length > 0 && (
                        <span className="text-[10px] font-mono font-bold text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-800/40 px-2 py-0.5 rounded-full uppercase tracking-wider select-none animate-pulse">
                          Custom Tailored
                        </span>
                      )}
                    </h2>
                    
                    {/* Integrity & Time Sort Toggles */}
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-850 p-1 rounded-lg border border-slate-200/60 dark:border-slate-800/80">
                      <button
                        onClick={() => setSortBy("latest")}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          sortBy === "latest"
                            ? "bg-white dark:bg-slate-700 text-slate-850 dark:text-slate-100 shadow-sm"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
                        }`}
                      >
                        Latest
                      </button>
                      <button
                        onClick={() => setSortBy("verified")}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          sortBy === "verified"
                            ? "bg-white dark:bg-slate-700 text-slate-850 dark:text-slate-100 shadow-sm"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
                        }`}
                      >
                        Most Verified
                      </button>
                      <button
                        onClick={() => setSortBy("conflict")}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          sortBy === "conflict"
                            ? "bg-white dark:bg-slate-700 text-slate-850 dark:text-slate-100 shadow-sm"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
                        }`}
                      >
                        Highest Conflict
                      </button>
                    </div>
                  </div>
 
                  {feedArticles.length > 0 ? (
                    <>
                      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-4 max-w-5xl"}>
                        {feedArticles.map((article) => (
                          <TransparencyCard 
                            key={article.id} 
                            article={article} 
                            viewMode={viewMode} 
                            isBookmarked={bookmarkIds.includes(article.id)}
                            onToggleBookmark={(id, isSaved) => {
                              if (isSaved) {
                                setBookmarkIds((prev) => [...prev, id]);
                              } else {
                                setBookmarkIds((prev) => prev.filter((item) => item !== id));
                              }
                            }}
                          />
                        ))}
                      </div>

                      {/* Pulse Loading indicator when there are more articles available to render */}
                      {sortedAndFilteredArticles.length > feedArticles.length + (showHeroSection ? 4 : 0) && (
                        <div className="flex justify-center py-10">
                          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 dark:text-slate-550 animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-ping" />
                            <span>Loading more updates...</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-550 italic py-6">
                      No additional articles match your filter preferences.
                    </p>
                  )}
                </section>
 
              </div>
 
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl max-w-md mx-auto transition-colors duration-300">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No articles available for this category</h3>
              <p className="text-slate-550 dark:text-slate-400 text-sm mt-1.5 leading-relaxed">
                No matching feeds could be indexed for "{CATEGORIES.find(c => c.id === activeCategory)?.label}". We are checking for fresh updates in the background.
              </p>
            </div>
          )}

        </div>
      </main>

      {/* Floating Scroll to Top */}
      <BackToTop />

      {/* Velvet Rope Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Clean Minimalist Aggregator Footer */}
      <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 py-10 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center space-y-2">
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-200 block">
            TruthFeed
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal max-w-md mx-auto">
            Designed for fact-checking coverage comparisons and news transparency.
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()} TruthFeed Initiative. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
