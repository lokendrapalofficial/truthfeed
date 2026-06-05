import React from "react";
import { prisma } from "@/lib/db";
import HomepageClient from "@/components/HomepageClient";
import { createServerActionClient } from "@/lib/supabaseServer";
import { cookies } from "next/headers";

// Ensure Next.js doesn't cache this page statically forever so new RSS imports appear
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Get current user session
  const cookieStore = await cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });
  let userPreferences: string[] = [];
  let userEmail: string | null = null;
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      userEmail = session.user.email;
      const dbUser = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { preferences: true },
      });
      if (dbUser && dbUser.preferences) {
        userPreferences = (typeof dbUser.preferences === "string"
          ? JSON.parse(dbUser.preferences)
          : dbUser.preferences) as string[];
      }
    }
  } catch (err) {
    console.error("Error retrieving user preferences in server page.tsx:", err);
  }

  // Query articles and sources in parallel from PostgreSQL
  const [articles, sources] = await Promise.all([
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

  // If user has preferences, query forYouArticles filtered by category
  let forYouArticles: any[] = [];
  if (userPreferences.length > 0) {
    const interestToDbCategory: Record<string, string[]> = {
      "Geopolitics": ["World"],
      "Tech Markets": ["Tech/Business"],
      "Global Sports": ["Sports"],
      "Macro Economics": ["Tech/Business"],
      "Climate Policy": ["World"],
      "Cryptocurrency": ["Tech/Business"],
      "Entertainment & Arts": ["Entertainment"],
      "Health Science": ["World"],
      "World Affairs": ["World"]
    };
    
    const dbCategories = Array.from(new Set(
      userPreferences.flatMap(pref => interestToDbCategory[pref] || [])
    ));

    const dbForYou = await prisma.article.findMany({
      where: {
        publishedAt: {
          gte: sevenDaysAgo,
        },
        analysis: {
          category: {
            in: dbCategories,
          },
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
    });

    forYouArticles = dbForYou.map((art) => ({
      ...art,
      publishedAt: art.publishedAt.toISOString ? art.publishedAt.toISOString() : String(art.publishedAt),
      createdAt: art.createdAt.toISOString ? art.createdAt.toISOString() : String(art.createdAt),
      factChecks: art.factChecks.map((fc) => ({ ...fc })),
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
        category: art.analysis.category,
        verification: art.analysis.verification,
        framingMatrix: art.analysis.framingMatrix,
      } : null,
    }));
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
      category: art.analysis.category,
      verification: art.analysis.verification,
      framingMatrix: art.analysis.framingMatrix,
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
  console.log("FOR YOU ARTICLES COUNT:", forYouArticles.length);

  return (
    <HomepageClient
      initialArticles={serializedArticles}
      initialSources={serializedSources}
      forYouArticles={forYouArticles}
      userPreferences={userPreferences}
    />
  );
}
