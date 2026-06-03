import Parser from "rss-parser";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runBootstrap() {
  console.log("Starting Google News RSS feed synchronization...");
  try {
    const parser = new Parser();
    const feed = await parser.parseURL(
      "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"
    );

    if (!feed.items || feed.items.length === 0) {
      console.log("No articles found in RSS feed.");
      return;
    }

    console.log(`Parsed ${feed.items.length} items. Upserting into SQLite database...`);
    let count = 0;

    for (const item of feed.items) {
      if (!item.link || !item.title) continue;

      const title = item.title;
      const url = item.link;
      const summary = item.contentSnippet || item.content || "";
      const sourceName = item.source?.text || item.creator || "Google News";
      const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

      await prisma.article.upsert({
        where: { url },
        update: {
          title,
          summary,
          sourceName,
          publishedAt,
        },
        create: {
          title,
          url,
          content: summary || title,
          summary,
          sourceName,
          publishedAt,
        },
      });
      count++;
    }

    console.log(`Synchronization successful! Upserted ${count} articles.`);
  } catch (error) {
    console.error("Synchronization failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runBootstrap();
