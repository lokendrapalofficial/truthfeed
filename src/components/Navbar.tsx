"use client";

import React from "react";
import { Search, Globe, Award, HelpCircle, User, LogIn, LogOut } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";

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
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Typographic Masthead Logo */}
          <div
            className="cursor-pointer select-none"
            onClick={() => { setActiveTab("all"); setSearchQuery(""); }}
          >
            <span className="font-serif text-2xl font-bold tracking-tight text-zinc-900 leading-none hover:opacity-80 transition-opacity duration-200">
              TruthFeed
            </span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-sm relative group hidden md:block">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-700 transition-colors duration-200">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search claims or publishers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-full bg-zinc-100 text-xs text-zinc-900 placeholder-zinc-400 border border-zinc-200 focus:border-zinc-400 focus:bg-white outline-none transition-all duration-200"
            />
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                activeTab === "all"
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Top News</span>
            </button>
            
            <button
              onClick={() => setActiveTab("fact-checks")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                activeTab === "fact-checks"
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>Fact Checks</span>
            </button>

            <button
              onClick={() => setActiveTab("about")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                activeTab === "about"
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">About</span>
            </button>

            {/* Session States */}
            {session ? (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 ml-1">
                <div className="hidden lg:flex items-center gap-1 text-xs font-medium text-zinc-500">
                  <User className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  <span className="line-clamp-1 max-w-[100px]">@{session.user?.name}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all duration-200 cursor-pointer"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white bg-zinc-900 hover:bg-zinc-800 border border-transparent transition-all duration-200 cursor-pointer shadow-sm ml-1"
              >
                <LogIn className="h-3 w-3" />
                <span>Set Username</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="py-2 border-t border-zinc-100 md:hidden relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-9 pr-4 rounded-full bg-zinc-100 text-xs text-zinc-900 placeholder-zinc-400 border border-zinc-200 focus:border-zinc-400 focus:bg-white outline-none transition-all duration-200"
          />
        </div>
      </div>
    </nav>
  );
}
