"use client";

import React, { useState, useTransition, useMemo } from "react";
import { useSession, signIn } from "next-auth/react";
import { ThumbsUp, ThumbsDown, ExternalLink, MessageSquare, PlusCircle, AlertCircle, LogIn } from "lucide-react";
import { submitNote, voteNote } from "@/app/actions/noteActions";

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
  const { data: session } = useSession();
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
    if (!session) {
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
      <div className="p-6 border border-zinc-200 bg-white rounded-2xl shadow-sm space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
          <MessageSquare className="h-4.5 w-4.5 text-zinc-500" />
          <div className="flex flex-col">
            <h4 className="font-serif font-bold text-sm uppercase tracking-wider text-zinc-900">
              Community Notes
            </h4>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
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
                  className="p-4 rounded-xl border border-zinc-100 bg-zinc-50 space-y-3 hover:border-zinc-200 transition-colors duration-200"
                >
                  {/* Note header */}
                  <div className="flex justify-between items-center text-[10px] text-zinc-400">
                    <span className="font-bold uppercase tracking-wide text-zinc-700">
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
                  <p className="text-xs sm:text-sm leading-relaxed text-zinc-700 font-sans">
                    {note.text}
                  </p>

                  {/* Footer: Citation + Votes */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-zinc-100 text-xs">
                    
                    <a
                      href={note.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-700 hover:text-zinc-900 transition-colors"
                    >
                      <span>View Citation Source</span>
                      <ExternalLink className="h-2.5 w-2.5 shrink-0 text-zinc-400" />
                    </a>

                    <div className="flex items-center gap-1.5">
                      {/* Upvote */}
                      <button
                        onClick={() => handleVote(note.id, "UPVOTE")}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 transition-colors text-[9px] font-bold select-none cursor-pointer"
                        title="Upvote note"
                      >
                        <ThumbsUp className="h-2.5 w-2.5 text-zinc-500" />
                        <span className="text-zinc-600">{note.upvotes}</span>
                      </button>

                      {/* Downvote */}
                      <button
                        onClick={() => handleVote(note.id, "DOWNVOTE")}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 transition-colors text-[9px] font-bold select-none cursor-pointer"
                        title="Downvote note"
                      >
                        <ThumbsDown className="h-2.5 w-2.5 text-zinc-500" />
                        <span className="text-zinc-600">{note.downvotes}</span>
                      </button>

                      {/* Net Score Badge */}
                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                          netScore > 0
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : netScore < 0
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-zinc-100 text-zinc-500 border-zinc-200"
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
          <p className="text-zinc-400 text-xs italic leading-relaxed text-center py-5 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl">
            No community notes submitted for this article yet. Be the first to add helpful context.
          </p>
        )}

      </div>

      {/* Submission Form Card */}
      {session ? (
        <form
          onSubmit={handleSubmit}
          className="p-6 border border-zinc-200 bg-white rounded-2xl shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <PlusCircle className="h-4.5 w-4.5 text-zinc-500" />
            <h4 className="font-serif font-bold text-sm uppercase tracking-wider text-zinc-900">
              Add Community Context
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            {/* Note text */}
            <div className="space-y-1">
              <label className="font-bold text-[9px] uppercase tracking-wider text-zinc-400">
                Note Context
              </label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Provide accurate, neutral factual details to correct misleading information or add important surrounding context..."
                rows={3}
                className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-zinc-400 outline-none text-zinc-800 text-xs leading-relaxed transition-all duration-200 resize-none"
              />
            </div>

            {/* Source Citation */}
            <div className="space-y-1">
              <label className="font-bold text-[9px] uppercase tracking-wider text-zinc-400">
                Source Citation URL (Proof/Evidence)
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/trusted-source-report"
                className="w-full h-9 px-3 rounded-lg border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-zinc-400 outline-none text-zinc-800 text-xs transition-all duration-200"
              />
            </div>
          </div>

          {/* Error & Success alerts */}
          {error && (
            <div className="p-3 border border-rose-200 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex items-center gap-1.5">
              <PlusCircle className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 duration-200 cursor-pointer disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            <span>{isPending ? "Submitting note context..." : "Submit Note Context"}</span>
          </button>

        </form>
      ) : (
        <div className="p-6 border border-zinc-200 bg-white rounded-2xl shadow-sm text-center space-y-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 mx-auto border border-zinc-200">
            <LogIn className="h-4.5 w-4.5 text-zinc-500" />
          </div>
          <div className="max-w-xs mx-auto space-y-1">
            <h5 className="font-serif font-bold text-sm text-zinc-900">
              Contribute to TruthFeed
            </h5>
            <p className="text-zinc-500 text-[10px] leading-relaxed">
              Sign in / Set Username in the Navbar above to contribute facts and upvote community notes.
            </p>
          </div>
          <button
            onClick={() => signIn()}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95 duration-200 cursor-pointer"
          >
            <LogIn className="h-3 w-3" />
            <span>Set Username now</span>
          </button>
        </div>
      )}

    </div>
  );
}
