import React from "react";
import { prisma } from "@/lib/db";
import HomepageClient from "@/components/HomepageClient";

// Ensure Next.js doesn't cache this page statically forever so new RSS imports appear
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  // Fetch the latest 30 articles from the database, ordered by publishedAt desc
  const articles = await prisma.article.findMany({
    take: 30,
    orderBy: {
      publishedAt: "desc",
    },
    include: {
      analysis: true,
    },
  });

  const serializedArticles = articles.map((art) => ({
    id: art.id,
    title: art.title,
    url: art.url,
    content: art.content,
    summary: art.summary,
    imageUrl: art.imageUrl,
    isLogo: art.isLogo,
    isThematic: art.isThematic,
    sourceName: art.sourceName,
    publishedAt: art.publishedAt.toISOString ? art.publishedAt.toISOString() : String(art.publishedAt),
    createdAt: art.createdAt.toISOString ? art.createdAt.toISOString() : String(art.createdAt),
    relatedSources: art.relatedSources || [],
    analysis: art.analysis
      ? {
          id: art.analysis.id,
          briefing: art.analysis.briefing,
        }
      : null,
  }));

  console.log("HOMEPAGE LOADED ARTICLES COUNT:", serializedArticles.length);

  return <HomepageClient initialArticles={serializedArticles} />;
}
