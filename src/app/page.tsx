import React from "react";
import { prisma } from "@/lib/db";
import HomepageClient from "@/components/HomepageClient";

// Ensure Next.js doesn't cache this page statically forever so new RSS imports appear
export const revalidate = 0;

export default async function Home() {
  // Query articles along with any associated fact checks and sources from SQLite
  const articles = await prisma.article.findMany({
    orderBy: {
      publishedAt: "desc",
    },
    include: {
      factChecks: true,
      source: true,
    },
  });

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
  }));

  console.log("HOMEPAGE LOADED ARTICLES COUNT:", articles.length);

  return <HomepageClient initialArticles={serializedArticles} />;
}
