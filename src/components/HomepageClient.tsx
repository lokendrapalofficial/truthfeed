"use client";

import React, { useState, useMemo, useTransition, useEffect } from "react";
import Link from "next/link";
import { Search, RefreshCw, Sun, Moon } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/AuthModal";
import UserMenu from "@/components/UserMenu";
import { fetchNews } from "@/app/actions/fetchNews";
import BackToTop from "@/components/BackToTop";
import WireCard from "@/components/WireCard";
import { getArticleCategory } from "@/lib/utils";

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
  forYouArticles?: any[];
  userPreferences?: string[];
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

export default function HomepageClient({
  initialArticles,
  forYouArticles = [],
  userPreferences = [],
}: HomepageClientProps) {
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    }
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("top");
  const [isPending, startTransition] = useTransition();
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      relatedSources: art.relatedSources || [],
    }));
  }, [initialArticles]);

  const filteredArticles = useMemo(() => {
    if (activeCategory === "foryou") {
      let result = forYouArticles;
      if (searchQuery) {
        result = result.filter((article) => 
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.sourceName.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return result;
    }

    let result = allArticles.filter((article) => {
      // 1. Search Query Match (Banish raw RSS summary/content search dumps)
      const matchesSearch =
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.sourceName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Category Match
      if (activeCategory === "verified") {
        const isTrue = article.factChecks?.some((fc: any) => fc.rating === "TRUE");
        const isHighCred = article.source?.credibility === "VERY_HIGH" || article.source?.credibility === "HIGH";
        const isHighConf = article.analysis?.verification?.confidenceLevel === "High" || article.analysis?.verification?.confidenceLevel === "HIGH";
        if (!isTrue && !isHighCred && !isHighConf) return false;
      } else if (activeCategory !== "top") {
        const cat = getArticleCategory(article.title, article.summary || article.content || "");
        if (cat !== activeCategory) return false;
      }

      return true;
    });

    return result;
  }, [allArticles, forYouArticles, searchQuery, activeCategory]);

  // Filter top 3 conflicting stories for the Fracture Index
  const fractureArticles = useMemo(() => {
    return allArticles
      .filter((article) => {
        const conf = article.analysis?.verification?.confidenceLevel;
        return conf === "Conflicting" || conf === "CONFLICTING";
      })
      .slice(0, 3);
  }, [allArticles]);

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

              {user ? (
                <UserMenu user={user} onSignOut={() => { setUser(null); router.refresh(); }} />
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 h-9 rounded-full bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-705 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider cursor-pointer border border-slate-250 dark:border-slate-850 transition-colors shadow-sm"
                  title="Sign In"
                >
                  <span>Sign In</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Sticky Category Ribbon (Banish View toggler, feed is strictly wire list now) */}
      <div className="sticky top-16 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-1.5 mr-2 text-xs font-semibold tracking-wide whitespace-nowrap rounded-full transition-all cursor-pointer ${
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column (lg:col-span-8) - Wire Feed */}
              <div className="lg:col-span-8 divide-y divide-slate-200 dark:divide-slate-800/80">
                {filteredArticles.map((article) => (
                  <WireCard key={article.id} article={article} />
                ))}
              </div>

              {/* Right Column (lg:col-span-4) - Fracture Index Sidebar (Desktop Only) */}
              <aside className="lg:col-span-4 hidden lg:block sticky top-28 self-start">
                <div className="bg-slate-950 text-white rounded-xl border border-rose-900/40 border-l-4 border-l-rose-600 p-5 shadow-md space-y-4">
                  <div className="text-[10px] font-mono tracking-widest text-rose-500 uppercase select-none font-bold">
                    THE FRACTURE INDEX
                  </div>
                  
                  <div className="space-y-4">
                    {fractureArticles.length > 0 ? (
                      fractureArticles.map((article) => (
                        <div key={article.id} className="space-y-1.5 pb-4 border-b border-slate-900 last:border-b-0 last:pb-0 last:border-transparent">
                          <span className="text-[9px] font-mono bg-rose-950 text-rose-450 border border-rose-900/50 px-1.5 py-0.5 rounded font-bold inline-block">
                            🔴 NARRATIVE FRACTURE
                          </span>
                          <Link 
                            href={`/article/${article.id}`} 
                            className="block font-serif font-bold text-sm text-slate-100 hover:text-rose-455 transition-colors leading-snug"
                          >
                            {article.title}
                          </Link>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            Publisher: {article.sourceName}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic font-mono leading-relaxed">
                        No active narrative fractures detected today.
                      </p>
                    )}
                  </div>
                </div>
              </aside>

            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl max-w-md mx-auto transition-colors duration-300">
              {activeCategory === "foryou" ? (
                user ? (
                  <>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Expand your desk preferences</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed">
                      We couldn't find any recent briefings matching your current desk interests. Try adding more interests to your profile.
                    </p>
                    <Link
                      href="/onboarding"
                      className="inline-block mt-4 px-5 h-9 leading-9 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-[10px] uppercase tracking-wider hover:opacity-90 active:scale-98 transition-all"
                    >
                      Configure Desk
                    </Link>
                  </>
                ) : (
                  <>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Sign in to personalize your feed</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed">
                      Create an account or sign in to configure your personal intelligence desk and view tailored briefings.
                    </p>
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="mt-4 px-5 h-9 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-[10px] uppercase tracking-wider hover:opacity-90 active:scale-98 transition-all cursor-pointer"
                    >
                      Sign In
                    </button>
                  </>
                )
              ) : (
                <>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No articles available for this category</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed">
                    No matching feeds could be indexed for "{CATEGORIES.find(c => c.id === activeCategory)?.label}". Hit the Sync trigger in the top right to download new RSS streams.
                  </p>
                </>
              )}
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
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-normal max-w-md mx-auto">
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
