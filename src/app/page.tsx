import React from "react";
import { prisma } from "@/lib/db";
import HomepageClient from "@/components/HomepageClient";
import { fetchNews } from "@/app/actions/fetchNews";

// Ensure Next.js doesn't cache this page statically so new RSS imports appear
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Query articles and sources in parallel from PostgreSQL
  let [articles, sources] = await Promise.all([
    prisma.article.findMany({
      where: {
        publishedAt: {
          gte: sevenDaysAgo,
        },
      },
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

  // Auto-sync: if DB is nearly empty (e.g. after a reset), fetch fresh articles now
  if (articles.length < 10) {
    console.log(`[Auto-sync] Only ${articles.length} articles found — triggering RSS sync...`);
    try {
      const syncResult = await fetchNews();
      console.log(`[Auto-sync] Synced ${syncResult.count ?? 0} new articles.`);

      // Re-query after sync so the page renders with the fresh data
      articles = await prisma.article.findMany({
        where: {
          publishedAt: { gte: sevenDaysAgo },
        },
        orderBy: { publishedAt: "desc" },
        include: {
          factChecks: true,
          source: true,
          analysis: true,
        },
      });
    } catch (syncErr) {
      console.error("[Auto-sync] RSS sync failed:", syncErr);
    }
  }

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
