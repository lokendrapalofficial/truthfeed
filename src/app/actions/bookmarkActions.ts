"use server";

import { createServerActionClient } from "@/lib/supabaseServer";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleBookmark(articleId: string) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!session || !userId) {
      return { success: false, error: "You must be signed in to bookmark articles." };
    }

    // Check if bookmark exists
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });

    let isBookmarked = false;
    if (existingBookmark) {
      // Delete it
      await prisma.bookmark.delete({
        where: {
          id: existingBookmark.id,
        },
      });
      isBookmarked = false;
    } else {
      // Create it
      await prisma.bookmark.create({
        data: {
          userId,
          articleId,
        },
      });
      isBookmarked = true;
    }

    // Revalidate relevant pages
    revalidatePath("/");
    revalidatePath("/dashboard/bookmarks");
    revalidatePath(`/article/${articleId}`);

    return { success: true, isBookmarked };
  } catch (error: any) {
    console.error("Error toggling bookmark:", error);
    return { success: false, error: error.message || String(error) };
  }
}

export async function getUserBookmarkIds() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!session || !userId) {
      return { success: true, bookmarkIds: [] };
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      select: { articleId: true },
    });

    return { success: true, bookmarkIds: bookmarks.map(b => b.articleId) };
  } catch (error: any) {
    console.error("Error getting user bookmark IDs:", error);
    return { success: false, error: error.message || String(error), bookmarkIds: [] };
  }
}

export async function getBookmarkedArticles() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!session || !userId) {
      return { success: false, error: "Unauthorized access.", articles: [] };
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        article: {
          include: {
            factChecks: true,
            source: true,
            analysis: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const articles = bookmarks.map((b) => {
      const art = b.article;
      return {
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
      };
    });

    return { success: true, articles };
  } catch (error: any) {
    console.error("Error fetching bookmarked articles:", error);
    return { success: false, error: error.message || String(error), articles: [] };
  }
}
