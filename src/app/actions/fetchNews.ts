"use server";

import Parser from "rss-parser";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function fetchNews() {
  try {
    const parser = new Parser();
    const feed = await parser.parseURL(
      "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"
    );

    if (!feed.items || feed.items.length === 0) {
      return { success: false, message: "No articles found in RSS feed" };
    }

    let upsertCount = 0;

    for (const item of feed.items) {
      if (!item.link || !item.title) continue;

      // Extract details
      const title = item.title;
      const url = item.link;
      const summary = item.contentSnippet || item.content || "";
      const sourceName = item.source?.text || item.creator || "Google News";
      const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

      // Extract specific publisher if the source is "Google News"
      let parsedSourceName = sourceName;
      if (parsedSourceName === "Google News") {
        const parts = title.split(" - ");
        if (parts.length > 1) {
          const lastPart = parts[parts.length - 1].trim();
          if (
            lastPart.toLowerCase().includes("breaking") ||
            lastPart.toLowerCase().includes("latest") ||
            lastPart.toLowerCase().includes("videos") ||
            lastPart.toLowerCase().includes("home")
          ) {
            if (parts.length > 2) {
              parsedSourceName = parts[parts.length - 2].trim();
            }
          } else {
            parsedSourceName = lastPart;
          }
        }
      }

      // Check if publisher exists in seeded Source ratings
      const existingSource = await prisma.source.findUnique({
        where: { name: parsedSourceName },
      });

      await prisma.article.upsert({
        where: { url },
        update: {
          title,
          summary,
          sourceName: parsedSourceName,
          publishedAt,
          sourceId: existingSource ? existingSource.id : null,
        },
        create: {
          title,
          url,
          content: summary || title, // fallback for required content field
          summary,
          sourceName: parsedSourceName,
          publishedAt,
          sourceId: existingSource ? existingSource.id : null,
        },
      });

      upsertCount++;
    }

    revalidatePath("/");
    return { success: true, count: upsertCount };
  } catch (error: any) {
    console.error("Error fetching RSS news:", error);
    return { success: false, error: error.message || String(error) };
  }
}
