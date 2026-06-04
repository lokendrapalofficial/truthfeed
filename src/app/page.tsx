import React from "react";
import { prisma } from "@/lib/db";
import HomepageClient from "@/components/HomepageClient";

// Ensure Next.js doesn't cache this page statically forever so new RSS imports appear
export const dynamic = "force-dynamic";

export default async function Home() {
  // Query articles and sources in parallel from PostgreSQL
  const [articles, sources] = await Promise.all([
    prisma.article.findMany({
      orderBy: {
        publishedAt: "desc",
      },
      include: {
        factChecks: true,
        source: true,
        analysis: true,
      },
    }),
    prisma.source.findMany(),
  ]);

  const serializedArticles = articles.map((art) => ({
    ...art,
    publishedAt: art.publishedAt.toISOString ? art.publishedAt.toISOString() : String(art.publishedAt),
    createdAt: art.createdAt.toISOString ? art.createdAt.toISOString() : String(art.createdAt),
    factChecks: art.factChecks.map((fc) => ({
      ...fc,
    })),
    source: art.source ? {
      id: art.source.id,
      name: art.source.name,
      bias: art.source.bias,
      credibility: art.source.credibility,
      description: art.source.description,
    } : null,
    analysis: art.analysis ? {
      id: art.analysis.id,
      claim: art.analysis.claim,
      briefing: art.analysis.briefing,
      wikiContexts: art.analysis.wikiContexts,
      category: art.analysis.category,
      articleText: art.analysis.articleText,
      verification: art.analysis.verification,
    } : null,
  }));

  const serializedSources = sources.map((s) => ({
    id: s.id,
    name: s.name,
    bias: s.bias,
    credibility: s.credibility,
    description: s.description,
  }));

  console.log("HOMEPAGE LOADED ARTICLES COUNT:", articles.length);

  return (
    <HomepageClient
      initialArticles={serializedArticles}
      initialSources={serializedSources}
    />
  );
}
