"use server";

import Parser from "rss-parser";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

function getCategoryImageUrl(title: string): string {
  const t = title.toLowerCase();
  if (t.match(/\b(court|senate|election|trump|biden|harris|law|government|president|policy|democrat|republican|tax|debt|tariff|white house|congress|politics)\b/)) {
    return "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80"; // Politics
  }
  if (t.match(/\b(apple|google|microsoft|ai|meta|nvidia|intel|openai|semiconductor|chip|cybersecurity|software|tech|technology|phone|quantum|robot)\b/)) {
    return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"; // Tech
  }
  if (t.match(/\b(space|mars|nasa|science|telescope|scientific|gene|dna|chemistry|physics|universe|planet|galaxy|scientist)\b/)) {
    return "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80"; // Science
  }
  if (t.match(/\b(health|cancer|vaccine|virus|covid|fda|medical|disease|drug|outbreak|clinical|hospital|patient)\b/)) {
    return "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80"; // Health
  }
  if (t.match(/\b(sport|game|nba|nfl|cup|stadium|athlete|championship|tennis|soccer|olympics|race|match|win|losing)\b/)) {
    return "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80"; // Sports
  }
  if (t.match(/\b(market|finance|stock|stocks|wall st|economy|economic|business|ceo|company|billion|inflation|fed|rate|interest|bank)\b/)) {
    return "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80"; // Business
  }
  if (t.match(/\b(movie|film|hollywood|actor|actress|music|album|singer|pop|concert|tv|netflix|award|grammy|star)\b/)) {
    return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80"; // Entertainment
  }
  return "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80"; // World / General fallback
}

function decodeGoogleNewsUrl(googleUrl: string): string | null {
  try {
    const urlObj = new URL(googleUrl);
    if (!urlObj.hostname.includes("news.google.com")) return googleUrl;
    
    const pathname = urlObj.pathname;
    const parts = pathname.split('/');
    const base64Str = parts.find(p => p.startsWith('CBMi') || p.length > 50);
    if (!base64Str) return googleUrl;
    
    const cleanedB64 = base64Str.split('?')[0];
    const buffer = Buffer.from(cleanedB64, 'base64');
    const utf8Str = buffer.toString('utf8');
    
    const httpIndex = utf8Str.indexOf('http');
    if (httpIndex === -1) return googleUrl;
    
    const rest = utf8Str.substring(httpIndex);
    const urlMatch = rest.match(/https?:\/\/[a-zA-Z0-9_\-\.\/\?&\+=\#~%!*':;(),]+/);
    return urlMatch ? urlMatch[0] : googleUrl;
  } catch (e) {
    return googleUrl;
  }
}

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
      const url = decodeGoogleNewsUrl(item.link) || item.link;
      const summary = item.contentSnippet || "";
      const content = item.content || item.contentSnippet || "";
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

      // Extract image URL from RSS feed if available, else use a category-based visual helper
      const feedImage = item.enclosure?.url || (item as any).media?.content?.[0]?.$.url || null;
      const imageUrl = feedImage || getCategoryImageUrl(title);

      await prisma.article.upsert({
        where: { url },
        update: {
          title,
          summary,
          content,
          imageUrl,
          sourceName: parsedSourceName,
          publishedAt,
          sourceId: existingSource ? existingSource.id : null,
        },
        create: {
          title,
          url,
          content,
          summary,
          imageUrl,
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
