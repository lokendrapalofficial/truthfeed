"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LogOut, Settings, Award, Compass, Bookmark } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";

interface UserMenuProps {
  user: any;
  onSignOut: () => void;
}

export default function UserMenu({ user, onSignOut }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();

  const userEmail = user?.email || "";
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || userEmail.split("@")[0];
  const avatarUrl = user?.user_metadata?.avatar_url;

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onSignOut();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer select-none"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-7 w-7 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-xs shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="hidden md:inline text-xs font-semibold text-slate-700 dark:text-slate-350 pr-2 max-w-[100px] truncate">
          {displayName}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User info header */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1.5 text-left">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{displayName}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 truncate">{userEmail}</p>
          </div>

          <div className="flex flex-col gap-0.5">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <Compass className="h-4 w-4 text-slate-400" />
              <span>My Desk</span>
            </Link>

            <Link
              href="/dashboard/bookmarks"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <Bookmark className="h-4 w-4 text-slate-400" />
              <span>My Bookmarks</span>
            </Link>

            <Link
              href="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              <span>Account Settings</span>
            </Link>

            <Link
              href="/upgrade"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-450 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
            >
              <Award className="h-4 w-4 text-amber-550" />
              <span>Upgrade to Pro</span>
            </Link>

            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer text-left"
            >
              <Compass className="h-4 w-4 text-rose-500 rotate-45 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
