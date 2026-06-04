"use client";

import React, { useState, useMemo, useTransition, useEffect } from "react";
import Link from "next/link";
import { Search, RefreshCw, User, LogIn, LogOut, Sun, Moon, LayoutGrid, List } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { fetchNews } from "@/app/actions/fetchNews";
import BackToTop from "@/components/BackToTop";
import NewsCard from "@/components/NewsCard";
import NewsImage from "@/components/NewsImage";
import NewsRow from "@/components/NewsRow";

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
  { id: "foryou", label: "For You" },
  { id: "us", label: "U.S." },
  { id: "world", label: "World" },
  { id: "business", label: "Business" },
  { id: "tech", label: "Technology" },
  { id: "science", label: "Science" },
  { id: "health", label: "Health" },
];

export default function HomepageClient({ initialArticles }: HomepageClientProps) {
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("top");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isPending, startTransition] = useTransition();
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Load persisted view mode preference
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

  // Helper to map search categorizations based on text keywords
  const getArticleCategory = (title: string, summary: string): string => {
    const t = `${title} ${summary}`.toLowerCase();
    if (t.match(/\b(court|senate|election|trump|biden|harris|law|government|president|policy|democrat|republican|tax|debt|tariff|white house|congress|politics|us|u\.s\.)\b/)) return "us";
    if (t.match(/\b(apple|google|microsoft|ai|meta|nvidia|intel|openai|semiconductor|chip|cybersecurity|software|tech|technology|phone|quantum|robot)\b/)) return "tech";
    if (t.match(/\b(space|mars|nasa|science|telescope|scientific|gene|dna|chemistry|physics|universe|planet|galaxy|scientist)\b/)) return "science";
    if (t.match(/\b(health|cancer|vaccine|virus|covid|fda|medical|disease|drug|outbreak|clinical|hospital|patient)\b/)) return "health";
    if (t.match(/\b(market|finance|stock|stocks|wall st|economy|economic|business|ceo|company|billion|inflation|fed|rate|interest|bank)\b/)) return "business";
    return "world";
  };

  const articles = useMemo(() => {
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
    }));
  }, [initialArticles]);

  // Combined search, category, and audit rating filter logic
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
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
  }, [articles, searchQuery, activeCategory]);

  // Helper to format date cleanly (e.g. "3 hours ago" or date string)
  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHrs < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins}m ago`;
      }
      if (diffHrs < 24) {
        return `${diffHrs}h ago`;
      }
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  // Partitioning logic for carousels
  const verifiedStories = useMemo(() => {
    return filteredArticles.filter((art) => 
      art.factChecks?.some((fc: any) => fc.rating === "TRUE") ||
      art.source?.credibility === "VERY_HIGH" ||
      art.source?.credibility === "HIGH"
    );
  }, [filteredArticles]);

  const conflictStories = useMemo(() => {
    return filteredArticles.filter((art) => 
      art.factChecks?.some((fc: any) => fc.rating === "FALSE" || art.factChecks?.some((fc: any) => fc.rating === "MIXED")) ||
      art.source?.credibility === "LOW" ||
      art.source?.credibility === "VERY_LOW"
    );
  }, [filteredArticles]);

  const generalStories = useMemo(() => {
    const ids = new Set([...verifiedStories.map((a) => a.id), ...conflictStories.map((a) => a.id)]);
    return filteredArticles.filter((art) => !ids.has(art.id));
  }, [filteredArticles, verifiedStories, conflictStories]);

  const spotlightArticles = useMemo(() => {
    return filteredArticles.slice(0, 6);
  }, [filteredArticles]);

  const remainderArticles = useMemo(() => {
    return filteredArticles.slice(6);
  }, [filteredArticles]);

  const getCategoryEmoji = (catId: string) => {
    switch (catId) {
      case "us": return "🇺🇸";
      case "world": return "🌍";
      case "business": return "💼";
      case "tech": return "💻";
      case "science": return "🔬";
      case "health": return "🏥";
      case "foryou": return "✨";
      default: return "💡";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300">
      
      {/* Google News Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/95 backdrop-blur-sm transition-colors duration-300">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            
            {/* Left: TruthFeed Logo */}
            <div
              className="cursor-pointer flex items-center gap-1.5 select-none"
              onClick={() => {
                setActiveCategory("top");
                setSearchQuery("");
              }}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm tracking-tight transition-colors duration-300">
                T
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
                TruthFeed
              </span>
            </div>

            {/* Center: Rounded Search Bar */}
            <div className="flex-1 max-w-xl relative group mx-2">
              <div className="absolute inset-y-0 left-4.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-gray-700 dark:group-focus-within:text-slate-350 transition-colors">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Search for topics, sources and claims"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-11 pr-4 rounded-full bg-gray-100 dark:bg-slate-800 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 border border-transparent dark:border-slate-700 focus:border-gray-200 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all duration-300"
              />
            </div>

            {/* Right: Profile Actions / Sync Trigger */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isPending}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 disabled:text-gray-300 transition-colors cursor-pointer"
                title="Sync News Feed"
              >
                <RefreshCw className={`h-4.5 w-4.5 ${isPending ? "animate-spin" : ""}`} />
              </button>
              
              {/* Theme Toggle Button */}
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
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
                  <span className="hidden md:inline-flex text-xs font-semibold text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border dark:border-slate-700">
                    @{session.user?.name}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="p-2 rounded-full hover:bg-gray-150 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="h-4.5 w-4.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-750 text-gray-600 dark:text-slate-400 cursor-pointer transition-colors"
                  title="Sign In"
                >
                  <User className="h-4.5 w-4.5" />
                </button>
              )}
            </div>

          </div>

          {/* Sub-Navigation & View Toggler Wrapper */}
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-705 bg-white dark:bg-slate-900 transition-colors duration-300">
            {/* Sub-Navigation Categories Scrollbar */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar flex-1 mr-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                  }}
                  className={`px-3 py-2 text-xs font-medium tracking-wide whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                    activeCategory === cat.id
                      ? "border-gray-900 dark:border-slate-100 text-gray-955 dark:text-slate-100 font-bold"
                      : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:border-gray-200 dark:hover:border-slate-700"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Grid/List View Mode Toggler */}
            <div className="flex items-center gap-1 shrink-0 border-l border-gray-100 dark:border-slate-800 pl-3 py-1.5">
              <button
                onClick={() => handleViewModeChange("grid")}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                    : "text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-850 hover:text-gray-600 dark:hover:text-slate-350"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={() => handleViewModeChange("list")}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                    : "text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-850 hover:text-gray-600 dark:hover:text-slate-350"
                }`}
                title="List View"
              >
                <List className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Core Content Feed */}
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-6 space-y-8">
        
        {/* Sync message banners */}
        {refreshMessage && (
          <div className="bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-xs px-4 py-2 rounded-lg text-center font-medium animate-pulse">
            {refreshMessage}
          </div>
        )}

        {filteredArticles.length > 0 ? (
          <div className="space-y-10">
            
            {/* Cinematic Scrolling Rows for Home (Top Stories / For You) */}
            {(activeCategory === "top" || activeCategory === "foryou") && (
              <div className="space-y-10">
                {verifiedStories.length > 0 && (
                  <NewsRow title="Trending & Verified 🟢" articles={verifiedStories.slice(0, 10)} />
                )}
                {conflictStories.length > 0 && (
                  <NewsRow title="Media Conflicts & Debates ⚠️" articles={conflictStories.slice(0, 10)} />
                )}
                {generalStories.length > 0 && (
                  <NewsRow title="Editor's Choice 🎬" articles={generalStories.slice(0, 10)} />
                )}
              </div>
            )}

            {/* Spotlight Row for Categories (Tech, Science, etc.) */}
            {activeCategory !== "top" && activeCategory !== "foryou" && spotlightArticles.length > 0 && (
              <NewsRow 
                title={`${CATEGORIES.find(c => c.id === activeCategory)?.label} Spotlight ${getCategoryEmoji(activeCategory)}`} 
                articles={spotlightArticles} 
              />
            )}

            {/* Standard Feed (Grid vs List Toggleable View Mode) */}
            <section className="space-y-4">
              <div className="border-b border-gray-150 dark:border-slate-800 pb-2 flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  {activeCategory === "top" || activeCategory === "foryou" ? "More Stories" : `All ${CATEGORIES.find(c => c.id === activeCategory)?.label} Stories`}
                </h3>
                <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Viewing as {viewMode === "grid" ? "Grid" : "List"}</span>
              </div>

              {((activeCategory === "top" || activeCategory === "foryou" ? filteredArticles : remainderArticles).length > 0) ? (
                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4 max-w-3xl mx-auto"}>
                  {(activeCategory === "top" || activeCategory === "foryou" ? filteredArticles : remainderArticles).map((article) => (
                    <NewsCard key={article.id} article={article} viewMode={viewMode} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-405 dark:text-slate-550 italic py-6">No additional articles match your filter preferences.</p>
              )}
            </section>

          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16 px-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl max-w-md mx-auto transition-colors duration-300">
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">No articles available for this category</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed">
              No matching feeds could be indexed for "{CATEGORIES.find(c => c.id === activeCategory)?.label}". Hit the Sync trigger in the top right to download new RSS streams.
            </p>
          </div>
        )}

      </main>

      {/* Floating Scroll to Top */}
      <BackToTop />

      {/* Clean Minimalist Aggregator Footer */}
      <footer className="mt-20 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/40 py-10 transition-colors duration-300">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center space-y-2">
          <span className="text-sm font-bold tracking-tight text-gray-900 dark:text-slate-205 block">
            TruthFeed
          </span>
          <p className="text-xs text-gray-450 dark:text-slate-400 leading-normal max-w-md mx-auto">
            Designed for fact-checking coverage comparisons and news transparency.
          </p>
          <p className="text-[10px] text-gray-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()} TruthFeed Initiative. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
