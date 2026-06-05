"use client";

import React, { useState, useTransition, useMemo, useEffect } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { ThumbsUp, ThumbsDown, ExternalLink, MessageSquare, PlusCircle, AlertCircle, LogIn } from "lucide-react";
import { submitNote, voteNote } from "@/app/actions/noteActions";
import AuthModal from "@/components/AuthModal";

export interface NoteItem {
  id: string;
  articleId: string;
  userId: string;
  user: {
    name: string;
  };
  text: string;
  sourceUrl: string;
  upvotes: number;
  downvotes: number;
  createdAt: string | Date;
}

interface CommunityNotesSectionProps {
  articleId: string;
  notes: NoteItem[];
}

export default function CommunityNotesSection({ articleId, notes }: CommunityNotesSectionProps) {
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

  const [noteText, setNoteText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
  }, [notes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!noteText.trim()) { setError("Please add some context text."); return; }
    if (!sourceUrl.trim()) { setError("Please provide a citation URL."); return; }
    startTransition(async () => {
      const result = await submitNote(articleId, noteText, sourceUrl);
      if (result.success) {
        setSuccess("Note successfully posted to TruthFeed!");
        setNoteText("");
        setSourceUrl("");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to post note");
      }
    });
  };

  const handleVote = (noteId: string, voteType: "UPVOTE" | "DOWNVOTE") => {
    if (!user) {
      setError("You must be logged in to vote.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    startTransition(async () => {
      const result = await voteNote(noteId, voteType);
      if (!result.success) setError(result.error || "Failed to submit vote");
    });
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Note Board Display */}
      <div className="p-6 border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl shadow-sm space-y-6 transition-colors duration-300">
        
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-slate-700 pb-4">
          <MessageSquare className="h-4.5 w-4.5 text-zinc-500 dark:text-slate-400" />
          <div className="flex flex-col">
            <h4 className="font-bold text-sm uppercase tracking-wider text-zinc-900 dark:text-slate-100">
              Community Notes
            </h4>
            <span className="text-[10px] font-semibold text-zinc-400 dark:text-slate-450 uppercase tracking-wider">
              Crowdsourced context and citations
            </span>
          </div>
        </div>

        {/* Notes list */}
        {sortedNotes.length > 0 ? (
          <div className="space-y-4">
            {sortedNotes.map((note) => {
              const netScore = note.upvotes - note.downvotes;
              return (
                <div
                  key={note.id}
                  className="p-4 rounded-xl border border-zinc-100 dark:border-slate-750 bg-zinc-50 dark:bg-slate-900/60 space-y-3 hover:border-zinc-200 dark:hover:border-slate-600 transition-colors duration-200"
                >
                  {/* Note header */}
                  <div className="flex justify-between items-center text-[10px] text-zinc-400 dark:text-slate-500">
                    <span className="font-bold uppercase tracking-wide text-zinc-700 dark:text-slate-300">
                      @{note.user?.name || "Anonymous Contributor"}
                    </span>
                    <span>
                      {new Date(note.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Context text */}
                  <p className="text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-slate-200 font-sans">
                    {note.text}
                  </p>

                  {/* Footer: Citation + Votes */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-zinc-100 dark:border-slate-700 text-xs">
                    
                    <a
                      href={note.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-700 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-slate-250 transition-colors"
                    >
                      <span>View Citation Source</span>
                      <ExternalLink className="h-2.5 w-2.5 shrink-0 text-zinc-400 dark:text-slate-500" />
                    </a>

                    <div className="flex items-center gap-1.5">
                      {/* Upvote */}
                      <button
                        onClick={() => handleVote(note.id, "UPVOTE")}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-slate-850 hover:bg-zinc-200 dark:hover:bg-slate-750 border border-zinc-200 dark:border-slate-700 transition-colors text-[9px] font-bold select-none cursor-pointer text-zinc-600 dark:text-slate-300"
                        title="Upvote note"
                      >
                        <ThumbsUp className="h-2.5 w-2.5 text-zinc-500 dark:text-slate-400" />
                        <span>{note.upvotes}</span>
                      </button>

                      {/* Downvote */}
                      <button
                        onClick={() => handleVote(note.id, "DOWNVOTE")}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-slate-850 hover:bg-zinc-200 dark:hover:bg-slate-750 border border-zinc-200 dark:border-slate-700 transition-colors text-[9px] font-bold select-none cursor-pointer text-zinc-600 dark:text-slate-300"
                        title="Downvote note"
                      >
                        <ThumbsDown className="h-2.5 w-2.5 text-zinc-500 dark:text-slate-400" />
                        <span>{note.downvotes}</span>
                      </button>

                      {/* Net Score Badge */}
                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                          netScore > 0
                            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80"
                            : netScore < 0
                            ? "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-455 border-rose-200 dark:border-rose-800/80"
                            : "bg-zinc-100 dark:bg-slate-850 text-zinc-500 dark:text-slate-400 border-zinc-200 dark:border-slate-700"
                        }`}
                      >
                        Score: {netScore}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-zinc-500 dark:text-slate-400 text-xs italic leading-relaxed text-center py-4 font-sans">
            No community notes yet. Be the first to add verified context to this story.
          </p>
        )}

      </div>

      {/* Submission Form Card */}
      {user ? (
        <form
          onSubmit={handleSubmit}
          className="p-6 border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl shadow-sm space-y-4 transition-colors duration-300"
        >
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-slate-700 pb-3">
            <PlusCircle className="h-4.5 w-4.5 text-zinc-500 dark:text-slate-400" />
            <h4 className="font-bold text-sm uppercase tracking-wider text-zinc-900 dark:text-slate-100">
              Add Community Context
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            {/* Note text */}
            <div className="space-y-1">
              <label className="font-bold text-[9px] uppercase tracking-wider text-zinc-400 dark:text-slate-500">
                Note Context
              </label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Provide accurate, neutral factual details to correct misleading information or add important surrounding context..."
                rows={3}
                className="w-full p-3 rounded-xl border border-zinc-200 dark:border-slate-700 bg-zinc-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-850 focus:border-zinc-400 dark:focus:border-slate-650 outline-none text-zinc-800 dark:text-slate-205 text-xs leading-relaxed transition-all duration-200 resize-none"
              />
            </div>

            {/* Source Citation */}
            <div className="space-y-1">
              <label className="font-bold text-[9px] uppercase tracking-wider text-zinc-400 dark:text-slate-500">
                Source Citation URL (Proof/Evidence)
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/trusted-source-report"
                className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-slate-700 bg-zinc-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-850 focus:border-zinc-400 dark:focus:border-slate-650 outline-none text-zinc-800 dark:text-slate-205 text-xs transition-all duration-200"
              />
            </div>
          </div>

          {/* Error & Success alerts */}
          {error && (
            <div className="p-3 border border-rose-200 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs rounded-xl flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-1.5">
              <PlusCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-full bg-zinc-900 dark:bg-slate-100 hover:bg-zinc-800 dark:hover:bg-slate-200 text-white dark:text-slate-905 font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 duration-200 cursor-pointer disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            <span>{isPending ? "Submitting note context..." : "Submit Note Context"}</span>
          </button>

        </form>
      ) : (
        <div className="p-6 border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-center space-y-4 transition-colors duration-300">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-slate-900 text-zinc-600 mx-auto border border-zinc-200 dark:border-slate-700">
            <LogIn className="h-4.5 w-4.5 text-zinc-500 dark:text-slate-400" />
          </div>
          <div className="max-w-xs mx-auto space-y-1">
            <h5 className="font-bold text-sm text-zinc-900 dark:text-slate-100">
              Contribute to TruthFeed
            </h5>
            <p className="text-zinc-550 dark:text-slate-400 text-[10px] leading-relaxed">
              Sign in / Set Username in the Navbar above to contribute facts and upvote community notes.
            </p>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full bg-zinc-900 dark:bg-slate-100 hover:bg-zinc-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95 duration-200 cursor-pointer"
          >
            <LogIn className="h-3 w-3" />
            <span>Set Username now</span>
          </button>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
