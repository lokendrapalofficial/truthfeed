import React from "react";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Globe } from "lucide-react";
import ArticleAnalysis from "@/components/ArticleAnalysis";
import SourceBadge from "@/components/SourceBadge";
import CommunityNotesSection from "@/components/CommunityNotesSection";

export const dynamic = "force-dynamic";

interface ArticlePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  if (!id) notFound();

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      factChecks: true,
      source: true,
      communityNotes: {
        include: { user: true },
      },
    },
  });

  if (!article) notFound();

  const serializedNotes = article.communityNotes.map((note) => ({
    id: note.id,
    articleId: note.articleId,
    userId: note.userId,
    user: { name: note.user.name },
    text: note.text,
    sourceUrl: note.sourceUrl,
    upvotes: note.upvotes,
    downvotes: note.downvotes,
    createdAt: note.createdAt.toISOString ? note.createdAt.toISOString() : String(note.createdAt),
  }));

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 text-zinc-900">
      
      {/* Editorial Mini-Header */}
      <nav className="border-b border-zinc-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Newsroom</span>
          </Link>
          {/* Compact Typographic Masthead */}
          <span className="font-serif text-xl font-bold tracking-tight text-zinc-900">
            TruthFeed
          </span>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 mx-auto max-w-4xl w-full px-4 sm:px-6 py-10">
        
        {/* Centered Single-Column Article */}
        <article className="max-w-3xl mx-auto py-12 px-6 sm:px-8 bg-white rounded-3xl border border-zinc-200 shadow-sm mt-8">
          
          {/* Publisher Metadata */}
          <div className="flex items-center gap-3 text-xs text-zinc-500 mb-6 pb-4 border-b border-zinc-100">
            <SourceBadge sourceName={article.sourceName} source={article.source} />
            <div className="flex items-center gap-1 text-zinc-400">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(article.publishedAt)}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-serif text-4xl sm:text-5xl font-black leading-tight tracking-tight text-zinc-900 mb-6">
            {article.title}
          </h1>

          {/* Story Text */}
          <div className="text-lg leading-relaxed text-zinc-700 font-serif font-normal space-y-6">
            <p>{article.content || article.summary}</p>
            {article.summary && article.content !== article.summary && (
              <p className="mt-4">{article.content}</p>
            )}
          </div>

          {/* Source URL Info block */}
          <div className="mt-8 pt-6 border-t border-zinc-100">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 hover:underline transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span>Visit Original Publisher Report &rarr;</span>
            </a>
          </div>

        </article>

        {/* Stacked Footnotes / Context Panels */}
        <div className="max-w-3xl mx-auto mt-16 pt-12 border-t border-zinc-200 space-y-12">
          <ArticleAnalysis articleId={article.id} articleTitle={article.title} />
          <CommunityNotesSection articleId={article.id} notes={serializedNotes} />
        </div>

      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-zinc-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-1">
            <span className="font-serif text-2xl font-bold tracking-tight text-zinc-900">
              TruthFeed
            </span>
          </div>
          <p className="font-sans text-sm font-normal tracking-wide text-zinc-400 mb-6">
            Read the news. Know the truth.
          </p>
          <p className="text-xs text-zinc-400 mb-1">Designed for editorial integrity. All verified records are property of their respective fact-check organizations.</p>
          <p className="text-xs text-zinc-400">&copy; {new Date().getFullYear()} TruthFeed Initiative. Powered by Next.js and Prisma.</p>
        </div>
      </footer>

    </div>
  );
}
