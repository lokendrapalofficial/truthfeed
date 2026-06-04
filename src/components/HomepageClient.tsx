"use client";

import React, { useState, useMemo, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, RefreshCw, User, LogIn, LogOut, Sun, Moon, LayoutGrid, List } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { fetchNews } from "@/app/actions/fetchNews";
import { motion } from "framer-motion";
import BackToTop from "@/components/BackToTop";
import NewsCard from "@/components/NewsCard";
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
  { id: "top", label: "Top Stories" },
  { id: "verified", label: "Verified 🟢" },
  { id: "foryou", label: "For You" },
  { id: "world", label: "World" },
  { id: "business", label: "Business" },
  { id: "technology", label: "Technology" },
  { id: "entertainment", label: "Entertainment" },
  { id: "sports", label: "Sports" },
  { id: "science", label: "Science" },
  { id: "health", label: "Health" },
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
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("top");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isPending, startTransition] = useTransition();
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [articles, setArticles] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const activeCategoryMounted = useRef(false);
  const searchQueryMounted = useRef(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const savedView = localStorage.getItem("truthfeed-viewmode");
    if (savedView === "grid" || savedView === "list") {
      setViewMode(savedView);
    }
  }, []);

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("truthfeed-viewmode", mode);
  };

  const handleRefresh = () => {
    startTransition(async () => {
      setRefreshMessage("Syncing feed...");
      const result = await fetchNews();
      if (result.success) {
        setRefreshMessage(`Synced ${result.count} articles`);
        setTimeout(() => setRefreshMessage(null), 3000);
      } else {
        setRefreshMessage(`Sync failed: ${result.error || result.message}`);
        setTimeout(() => setRefreshMessage(null), 4000);
      }
    });
  };

  const allArticles = useMemo(() => {
    return initialArticles.map((art) => ({
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
    }));
  }, [initialArticles]);

  const filteredArticles = useMemo(() => {
    let result = allArticles.filter((article) => {
      // 1. Search Query Match
      const matchesSearch =
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.sourceName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Category Match
      if (activeCategory === "verified") {
        const isTrue = article.factChecks?.some((fc: any) => fc.rating === "TRUE");
        const isHighCred = article.source?.credibility === "VERY_HIGH" || article.source?.credibility === "HIGH";
        const isHighConf = article.analysis?.verification?.confidenceLevel === "High" || article.analysis?.verification?.confidenceLevel === "HIGH";
        if (!isTrue && !isHighCred && !isHighConf) return false;
      } else if (activeCategory !== "top" && activeCategory !== "foryou") {
        const cat = getArticleCategory(article.title, article.summary);
        if (cat !== activeCategory) return false;
      }

      return true;
    });

    // Mimic algorithmic feed personalization for "For You"
    if (activeCategory === "foryou") {
      result = [...result].sort((a, b) => {
        const aVerified = isVerified(a) ? 1 : 0;
        const bVerified = isVerified(b) ? 1 : 0;
        if (aVerified !== bVerified) return bVerified - aVerified;

        const aScore = getConsensusScore(a) || 0;
        const bScore = getConsensusScore(b) || 0;
        if (aScore !== bScore) return bScore - aScore;

        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
    }

    return result;
  }, [allArticles, searchQuery, activeCategory]);

  const trendingVerified = useMemo(() => {
    return allArticles
      .filter((art) => isVerified(art))
      .slice(0, 5);
  }, [allArticles]);

  const heroArticle = useMemo(() => {
    return filteredArticles[0] || null;
  }, [filteredArticles]);

  const stackArticles = useMemo(() => {
    return filteredArticles.slice(1, 5);
  }, [filteredArticles]);

  const feedArticles = useMemo(() => {
    return filteredArticles.slice(5);
  }, [filteredArticles]);

  const heroColSpan = stackArticles.length > 0 ? "lg:col-span-8" : "lg:col-span-12";

  // Helper function to query the local database articles array by page
  const getFilteredArticlesForCategory = (category: string, query: string) => {
    let result = allArticles.filter((article) => {
      // 1. Search Query Match
      const matchesSearch =
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.summary.toLowerCase().includes(query.toLowerCase()) ||
        article.sourceName.toLowerCase().includes(query.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Category Match
      if (category === "verified") {
        const isTrue = article.factChecks?.some((fc: any) => fc.rating === "TRUE");
        const isHighCred = article.source?.credibility === "VERY_HIGH" || article.source?.credibility === "HIGH";
        const isHighConf = article.analysis?.verification?.confidenceLevel === "High" || article.analysis?.verification?.confidenceLevel === "HIGH";
        if (!isTrue && !isHighCred && !isHighConf) return false;
      } else if (category !== "top" && category !== "foryou") {
        const cat = getArticleCategory(article.title, article.summary);
        if (cat !== category) return false;
      }

      return true;
    });

    if (category === "foryou") {
      result = [...result].sort((a, b) => {
        const aVerified = isVerified(a) ? 1 : 0;
        const bVerified = isVerified(b) ? 1 : 0;
        if (aVerified !== bVerified) return bVerified - aVerified;

        const aScore = getConsensusScore(a) || 0;
        const bScore = getConsensusScore(b) || 0;
        if (aScore !== bScore) return bScore - aScore;

        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
    }

    return result;
  };

  const fetchArticles = (category: string, pageNum: number, currentSearchQuery: string = searchQuery) => {
    setIsLoading(true);
    const filtered = getFilteredArticlesForCategory(category, currentSearchQuery);
    
    // The main feed starts after the hero and stack articles (index 5 onwards)
    const feedOnly = filtered.slice(5);
    
    const itemsPerPage = 6;
    const initialItems = 9;
    
    let nextBatch: any[] = [];
    let newHasMore = false;
    
    if (pageNum === 1) {
      nextBatch = feedOnly.slice(0, initialItems);
      newHasMore = initialItems < feedOnly.length;
      setArticles(nextBatch);
    } else {
      const startIndex = initialItems + (pageNum - 2) * itemsPerPage;
      nextBatch = feedOnly.slice(startIndex, startIndex + itemsPerPage);
      newHasMore = (startIndex + itemsPerPage) < feedOnly.length;
      setArticles((prev) => [...prev, ...nextBatch]);
    }
    
    setHasMore(newHasMore);
    setIsLoading(false);
  };

  // Watch activeCategory changes to reset and immediately trigger first fetch
  useEffect(() => {
    if (!activeCategoryMounted.current) {
      activeCategoryMounted.current = true;
      setIsLoading(true);
      fetchArticles(activeCategory, 1, searchQuery);
      return;
    }
    setPage(1);
    setArticles([]);
    setHasMore(true);
    setIsLoading(true);
    fetchArticles(activeCategory, 1, searchQuery);
  }, [activeCategory]);

  // Watch searchQuery changes to reset and refetch
  useEffect(() => {
    if (!searchQueryMounted.current) {
      searchQueryMounted.current = true;
      return;
    }
    setPage(1);
    setArticles([]);
    setHasMore(true);
    setIsLoading(true);
    fetchArticles(activeCategory, 1, searchQuery);
  }, [searchQuery]);

  // IntersectionObserver effect for scroll trigger
  useEffect(() => {
    const currentLoader = loaderRef.current;
    if (!currentLoader || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => {
            const nextPage = prev + 1;
            setTimeout(() => {
              fetchArticles(activeCategory, nextPage, searchQuery);
            }, 0);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentLoader);

    return () => {
      observer.unobserve(currentLoader);
    };
  }, [activeCategory, searchQuery, hasMore, isLoading, articles]);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300">
      
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 backdrop-blur-sm transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            
            {/* Left: TruthFeed Logo */}
            <div
              className="cursor-pointer flex items-center gap-1.5 select-none"
              onClick={() => {
                setActiveCategory("top");
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

            {/* Center: Rounded Search Bar */}
            <div className="flex-1 max-w-xl relative group mx-2">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-700 dark:group-focus-within:text-slate-350 transition-colors">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Search for topics, sources and claims"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-full bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 border border-transparent dark:border-slate-750 focus:border-slate-200 dark:focus:border-slate-650 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all duration-300"
              />
            </div>

            {/* Right: Profile Actions / Sync Trigger */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isPending}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:text-slate-300 transition-colors cursor-pointer"
                title="Sync News Feed"
              >
                <RefreshCw className={`h-4.5 w-4.5 ${isPending ? "animate-spin" : ""}`} />
              </button>
              
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

              {session ? (
                <div className="flex items-center gap-2">
                  <span className="hidden md:inline-flex text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border dark:border-slate-700">
                    @{session.user?.name}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="p-2 rounded-full hover:bg-slate-150 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="h-4.5 w-4.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-400 cursor-pointer transition-colors"
                  title="Sign In"
                >
                  <User className="h-4.5 w-4.5" />
                </button>
              )}
            </div>

          </div>
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
                  : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-650 dark:hover:text-slate-350"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          
          {/* Sync message banners */}
          {refreshMessage && (
            <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs px-4 py-2 rounded-lg text-center font-medium animate-pulse mb-6">
              {refreshMessage}
            </div>
          )}

          {filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              
              {/* Left 9 Columns - Content */}
              <div className="xl:col-span-9 space-y-10">
                
                {/* Hero & Stack Layout (Above the Fold) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/80">
                  {/* Left Column (lg:col-span-8) - Hero Card */}
                  {heroArticle && (
                    <div className={heroColSpan}>
                      <motion.article 
                        whileHover={{ y: -2 }}
                        className="group cursor-pointer"
                      >
                        <Link href={`/article/${heroArticle.id}`}>
                          {/* Image */}
                          <div className="aspect-video w-full overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-950 relative">
                            <NewsImage
                              url={heroArticle.url}
                              title={heroArticle.title}
                              sourceName={heroArticle.sourceName}
                              imageUrl={heroArticle.imageUrl}
                              isLogo={heroArticle.isLogo}
                              isThematic={heroArticle.isThematic}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                            />
                          </div>
                          
                          {/* Category Tag */}
                          <div className="mt-4">
                            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                              {(heroArticle.analysis?.category || getArticleCategory(heroArticle.title, heroArticle.summary)).toUpperCase()}
                            </span>
                          </div>

                          {/* Title */}
                          <h2 className="text-3xl md:text-4xl font-serif font-bold mt-1.5 text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                            {heroArticle.title}
                          </h2>
                          
                          {/* 2-sentence Quick Brief */}
                          <p className="text-slate-600 dark:text-slate-300 mt-2.5 text-base leading-relaxed line-clamp-2 font-sans">
                            {heroArticle.analysis?.briefing || heroArticle.summary || heroArticle.content}
                          </p>
                          
                          {/* Footer */}
                          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 font-mono">
                            <span className="font-semibold text-slate-700 dark:text-slate-350">{heroArticle.sourceName}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              {formatSmartDate(heroArticle.publishedAt).showRedDot && (
                                <span className="animate-pulse bg-red-500 rounded-full h-1.5 w-1.5 inline-block shrink-0" />
                              )}
                              <span>{formatSmartDate(heroArticle.publishedAt).text}</span>
                            </div>
                            
                            {/* Verification Badge */}
                            {isVerified(heroArticle) && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-700 dark:text-emerald-450 font-semibold flex items-center gap-1">
                                  ✅ Verified{getConsensusScore(heroArticle) ? ` by ${getConsensusScore(heroArticle)} Sources` : ""}
                                </span>
                              </>
                            )}
                            {isConflicting(heroArticle) && (
                              <>
                                <span>•</span>
                                <span className="text-rose-700 dark:text-rose-455 font-semibold flex items-center gap-1">
                                  ⚠️ Conflicting
                                </span>
                              </>
                            )}
                          </div>
                        </Link>
                      </motion.article>
                    </div>
                  )}

                  {/* Right Column (lg:col-span-4) - Stack of 3-4 secondary stories */}
                  {stackArticles.length > 0 && (
                    <div className="lg:col-span-4 flex flex-col justify-between">
                      <div className="space-y-4">
                        {stackArticles.map((article, idx) => {
                          const smartDate = formatSmartDate(article.publishedAt);
                          const isLast = idx === stackArticles.length - 1;
                          return (
                            <div key={article.id} className={!isLast ? "border-b border-slate-200 dark:border-slate-800 pb-4 mb-4" : ""}>
                              <Link href={`/article/${article.id}`} className="group flex gap-4 items-start justify-between">
                                {/* Text Section */}
                                <div className="flex-1 min-w-0">
                                  {/* Category Tag */}
                                  <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase block mb-1">
                                    {(article.analysis?.category || getArticleCategory(article.title, article.summary)).toUpperCase()}
                                  </span>
                                  
                                  {/* Headline */}
                                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                                    {article.title}
                                  </h3>
                                  
                                  {/* Verification Badge & Timestamp */}
                                  <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-slate-500 dark:text-slate-455">
                                    <span className="font-semibold text-slate-700 dark:text-slate-350">{article.sourceName}</span>
                                    <span>•</span>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {smartDate.showRedDot && (
                                        <span className="animate-pulse bg-red-500 rounded-full h-1 w-1 inline-block shrink-0" />
                                      )}
                                      <span>{smartDate.text}</span>
                                    </div>
                                    {isVerified(article) && (
                                      <span className="text-emerald-700 dark:text-emerald-450 font-semibold shrink-0">
                                        ✅ Verified
                                      </span>
                                    )}
                                    {isConflicting(article) && (
                                      <span className="text-rose-700 dark:text-rose-450 font-semibold shrink-0">
                                        ⚠️ Conflict
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Thumbnail */}
                                <div className="w-24 h-24 shrink-0 overflow-hidden rounded bg-slate-50 dark:bg-slate-950 relative">
                                  <NewsImage
                                    url={article.url}
                                    title={article.title}
                                    sourceName={article.sourceName}
                                    imageUrl={article.imageUrl}
                                    isLogo={article.isLogo}
                                    isThematic={article.isThematic}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                </div>
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* High Density Main Feed (Below the fold) */}
                <section className="space-y-6">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      Latest Updates
                    </h2>
                  </div>

                   {isLoading && articles.length === 0 ? (
                    <div className="flex justify-center py-12">
                      <div className="flex gap-1.5 items-center text-slate-400 dark:text-slate-500 font-mono text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" />
                        <span className="ml-1.5">Loading more stories...</span>
                      </div>
                    </div>
                  ) : articles.length > 0 ? (
                    <>
                      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4 max-w-3xl"}>
                        {articles.map((article) => (
                          <NewsCard key={article.id} article={article} viewMode={viewMode} />
                        ))}
                      </div>
 
                      {/* Infinite Scroll Trigger */}
                      {hasMore && (
                        <div ref={loaderRef} className="flex justify-center py-8">
                          <div className="flex gap-1.5 items-center text-slate-400 dark:text-slate-500 font-mono text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" />
                            <span className="ml-1.5">Loading more stories...</span>
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

              {/* Sticky Sidebar (xl:col-span-3) */}
              <aside className="xl:col-span-3 hidden xl:block sticky top-28 self-start max-h-[calc(100vh-9rem)] overflow-y-auto no-scrollbar pr-1">
                
                {/* Trending Verifications */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                    Trending Verifications 📈
                  </h3>
                  <div className="flex flex-col gap-3">
                    {trendingVerified.length > 0 ? (
                      trendingVerified.map((art, index) => (
                        <div key={art.id} className="flex gap-3 py-2 border-b border-slate-100 dark:border-slate-800/55 last:border-0">
                          <span className="text-xl font-extrabold text-slate-305 dark:text-slate-700 w-6 text-right shrink-0">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <Link href={`/article/${art.id}`} className="font-semibold text-sm text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 transition-colors">
                              {art.title}
                            </Link>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 block">
                              {art.sourceName} • {formatSmartDate(art.publishedAt).text}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No verified stories trending today.</p>
                    )}
                  </div>
                </div>

              </aside>

            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl max-w-md mx-auto transition-colors duration-300">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No articles available for this category</h3>
              <p className="text-slate-550 dark:text-slate-400 text-sm mt-1.5 leading-relaxed">
                No matching feeds could be indexed for "{CATEGORIES.find(c => c.id === activeCategory)?.label}". Hit the Sync trigger in the top right to download new RSS streams.
              </p>
            </div>
          )}

        </div>
      </main>

      {/* Floating Scroll to Top */}
      <BackToTop />

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
