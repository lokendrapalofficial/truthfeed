"use client";

import React, { useState, useEffect } from "react";
import { Search, Globe, Award, HelpCircle, User, LogIn, Sun, Moon, Bookmark } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { useTheme } from "next-themes";
import AuthModal from "@/components/AuthModal";
import UserMenu from "@/components/UserMenu";
import Link from "next/link";

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
}: NavbarProps) {
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const supabase = createClientComponentClient();

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

  useEffect(() => setMounted(true), []);

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Typographic Masthead Logo */}
          <div
            className="cursor-pointer select-none"
            onClick={() => { setActiveTab("all"); setSearchQuery(""); }}
          >
            <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-slate-100 leading-none hover:opacity-80 transition-opacity duration-200">
              TruthFeed
            </span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-sm relative group hidden md:block">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-700 dark:group-focus-within:text-slate-300 transition-colors duration-200">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search claims or publishers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-full bg-zinc-100 dark:bg-slate-800 text-xs text-zinc-900 dark:text-slate-100 placeholder-zinc-400 dark:placeholder-slate-500 border border-zinc-200 dark:border-slate-700 focus:border-zinc-400 dark:focus:border-slate-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all duration-200"
            />
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                activeTab === "all"
                  ? "bg-zinc-100 dark:bg-slate-800 text-zinc-900 dark:text-slate-100"
                  : "text-zinc-550 dark:text-slate-400 hover:bg-zinc-100 dark:hover:bg-slate-800 hover:text-zinc-800 dark:hover:text-slate-200"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Top News</span>
            </button>
            
            <button
              onClick={() => setActiveTab("fact-checks")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                activeTab === "fact-checks"
                  ? "bg-zinc-100 dark:bg-slate-800 text-zinc-900 dark:text-slate-100"
                  : "text-zinc-550 dark:text-slate-400 hover:bg-zinc-100 dark:hover:bg-slate-800 hover:text-zinc-800 dark:hover:text-slate-200"
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>Fact Checks</span>
            </button>

            <button
              onClick={() => setActiveTab("about")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                activeTab === "about"
                  ? "bg-zinc-100 dark:bg-slate-800 text-zinc-900 dark:text-slate-100"
                  : "text-zinc-550 dark:text-slate-405 hover:bg-zinc-100 dark:hover:bg-slate-800 hover:text-zinc-800 dark:hover:text-slate-200"
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">About</span>
            </button>

            {user && (
              <Link
                href="/dashboard/bookmarks"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer text-zinc-550 dark:text-slate-400 hover:bg-zinc-100 dark:hover:bg-slate-800 hover:text-zinc-800 dark:hover:text-slate-200"
              >
                <Bookmark className="h-3.5 w-3.5" />
                <span>Bookmarks</span>
              </Link>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-slate-800 text-zinc-500 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {mounted && resolvedTheme === "dark" ? (
                <Sun className="h-4.5 w-4.5" />
              ) : (
                <Moon className="h-4.5 w-4.5" />
              )}
            </button>

            {/* Session States */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-slate-700 ml-1">
                <UserMenu user={user} onSignOut={() => setUser(null)} />
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white dark:text-slate-900 bg-zinc-900 hover:bg-zinc-800 dark:bg-slate-100 dark:hover:bg-slate-200 border border-transparent transition-all duration-200 cursor-pointer shadow-sm ml-1"
              >
                <LogIn className="h-3 w-3" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="py-2 border-t border-zinc-100 dark:border-slate-700 md:hidden relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-9 pr-4 rounded-full bg-zinc-100 dark:bg-slate-800 text-xs text-zinc-900 dark:text-slate-100 placeholder-zinc-400 dark:placeholder-slate-500 border border-zinc-200 dark:border-slate-700 focus:border-zinc-400 dark:focus:border-slate-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all duration-200"
          />
        </div>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </nav>
  );
}
