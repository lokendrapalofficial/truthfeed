import React from "react";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import ArticleClient from "@/components/ArticleClient";

export const dynamic = "force-dynamic";

interface ArticlePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  if (!id) {
    return {
      title: "Article Not Found | TruthFeed",
    };
  }

  const article = await prisma.article.findUnique({
    where: { id },
  });

  if (!article) {
    return {
      title: "Article Not Found | TruthFeed",
    };
  }

  const description = article.summary || (article.content ? article.content.substring(0, 160) + "..." : "Read this article on TruthFeed.");

  return {
    title: `${article.title} | TruthFeed`,
    description,
    openGraph: {
      title: article.title,
      description,
      type: "article",
      url: `https://truthfeed-hazel.vercel.app/article/${article.id}`,
      siteName: "TruthFeed",
      images: [
        {
          url: article.imageUrl || "https://truthfeed-hazel.vercel.app/logo-full.png",
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: [article.imageUrl || "https://truthfeed-hazel.vercel.app/logo-full.png"],
    },
  };
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

  const serializedArticle = {
    ...article,
    publishedAt: article.publishedAt.toISOString ? article.publishedAt.toISOString() : String(article.publishedAt),
    createdAt: article.createdAt.toISOString ? article.createdAt.toISOString() : String(article.createdAt),
    source: article.source ? {
      id: article.source.id,
      name: article.source.name,
      bias: article.source.bias,
      credibility: article.source.credibility,
      description: article.source.description,
    } : null,
    factChecks: article.factChecks.map((fc) => ({
      id: fc.id,
      claimText: fc.claimText,
      verdict: fc.verdict,
      rating: fc.rating,
      sourceOrganization: fc.sourceOrganization,
      factCheckUrl: fc.factCheckUrl,
    })),
  };

  return (
    <ArticleClient
      article={serializedArticle}
      serializedNotes={serializedNotes}
    />
  );
}
