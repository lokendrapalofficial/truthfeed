"use server";

import Parser from "rss-parser";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Category templates for Unsplash fallback illustrations (high-res 1200px editorial)
const CATEGORY_TEMPLATES: Record<string, string[]> = {
  politics: [
    "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1200&q=85"
  ],
  tech: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=85"
  ],
  science: [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=85"
  ],
  health: [
    "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1584036561566-baf241f2c44e?auto=format&fit=crop&w=1200&q=85"
  ],
  sports: [
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=85"
  ],
  business: [
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1591696205602-2f950c417cb9?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=85"
  ],
  entertainment: [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=85"
  ],
  general: [
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1495020689067-958852a6565d?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=85"
  ]
};

// Map keywords to standard categories
function getHeadlineCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.match(/\b(court|senate|election|trump|biden|harris|law|government|president|policy|democrat|republican|tax|debt|tariff|white house|congress|politics)\b/)) return "politics";
  if (t.match(/\b(apple|google|microsoft|ai|meta|nvidia|intel|openai|semiconductor|chip|cybersecurity|software|tech|technology|phone|quantum|robot)\b/)) return "tech";
  if (t.match(/\b(space|mars|nasa|science|telescope|scientific|gene|dna|chemistry|physics|universe|planet|galaxy|scientist)\b/)) return "science";
  if (t.match(/\b(health|cancer|vaccine|virus|covid|fda|medical|disease|drug|outbreak|clinical|hospital|patient)\b/)) return "health";
  if (t.match(/\b(sport|game|nba|nfl|ipl|cricket|cup|stadium|athlete|championship|tennis|soccer|olympics|race|match|win|losing)\b/)) return "sports";
  if (t.match(/\b(market|finance|stock|stocks|wall st|economy|economic|business|ceo|company|billion|inflation|fed|rate|interest|bank|trading|nasdaq|dow)\b/)) return "business";
  if (t.match(/\b(movie|film|hollywood|actor|actress|music|album|singer|pop|concert|tv|netflix|award|grammy|star|entertainment)\b/)) return "entertainment";
  return "general";
}

// Generate deterministic Unsplash template image
function getDeterministicImage(title: string): string {
  const category = getHeadlineCategory(title);
  const templates = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES.general;
  
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % templates.length;
  return templates[index];
}

// Decode HTML character entities to scan plain text
function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-")
    .replace(/&nbsp;/g, " ");
}

// Extract image tag from decoded HTML block
function extractImageFromHtml(html: string): string | null {
  if (!html) return null;
  const decoded = decodeHtmlEntities(html);
  const match = decoded.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

// Resolve a Google News RSS link to the real article URL by following HTTP redirects.
// Google News uses a 302 redirect chain — we just follow it with a browser User-Agent.
async function resolveGoogleNewsRedirect(googleUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(googleUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    clearTimeout(timeoutId);
    const finalUrl = res.url;

    // Only use the resolved URL if it's actually a real publisher page
    if (finalUrl && !finalUrl.includes("news.google.com") && finalUrl.startsWith("http")) {
      return finalUrl;
    }
    return null;
  } catch {
    return null;
  }
}

// Keep a simple decode attempt for related article URLs (best-effort, not critical)
function tryDecodeGoogleNewsUrl(googleUrl: string): string {
  try {
    const urlObj = new URL(googleUrl);
    if (!urlObj.hostname.includes("news.google.com")) return googleUrl;
    const parts = urlObj.pathname.split("/");
    const base64Str = parts.find((p) => p.startsWith("CBMi") || p.length > 50);
    if (!base64Str) return googleUrl;
    const buffer = Buffer.from(base64Str.split("?")[0], "base64");
    const utf8Str = buffer.toString("utf8");
    const httpIndex = utf8Str.indexOf("http");
    if (httpIndex === -1) return googleUrl;
    const urlMatch = utf8Str.substring(httpIndex).match(/https?:\/\/[a-zA-Z0-9_\-\.\/\?&\+=\#~%!*':;(),]+/);
    return urlMatch ? urlMatch[0] : googleUrl;
  } catch {
    return googleUrl;
  }
}

// Precise ad/tracker/spacer detection — avoids broad substring matches that kill real images.
// Only blocks genuinely bad URLs using specific patterns.
function isAdOrSpacerImage(url: string): boolean {
  const low = url.toLowerCase();

  // Block known ad/tracking domains
  if (
    low.includes("doubleclick.net") ||
    low.includes("googlesyndication") ||
    low.includes("adsystem") ||
    low.includes("adservice") ||
    low.includes("pagead") ||
    low.includes("adclick")
  ) return true;

  // Block tiny 1x1 / pixel tracker patterns embedded in URL path
  if (low.match(/[_\-\/\.](1x1|2x2|spacer|blank|pixel|tracking)[\.\?_]/)) return true;

  // Block standard pixel dimensions that only trackers use
  if (low.match(/\b(?:1x1|2x2|3x3|4x4|5x5|8x8|10x10|88x31|120x60|120x90|300x50)\b/)) return true;

  // Block actual favicon files (not icons or logos in articles)
  if (low.match(/\/favicon\.(ico|png|gif)$/)) return true;

  // Block data URIs
  if (low.startsWith("data:")) return true;

  return false;
}

// Perform protocol upgrade and boost image resolutions for known CDNs
function sanitizeAndUpgradeImageUrl(url: string): string | null {
  if (!url) return null;
  if (isAdOrSpacerImage(url)) return null;

  let sanitized = url.trim();
  if (sanitized.startsWith("http://")) {
    sanitized = sanitized.replace(/^http:\/\//i, "https://");
  }

  // Rewrite standard BBC low-res formats (e.g. /240/ or /480/) to high-resolution hero sizes
  if (sanitized.includes("bbci.co.uk")) {
    sanitized = sanitized.replace(/\/news\/(?:240|320|480)\//i, "/news/1024/");
    sanitized = sanitized.replace(/\/(?:240|320|480)\/cpsprodpb/i, "/1024/cpsprodpb");
  }
  // Rewrite Yahoo thumbnail templates
  if (sanitized.includes("yahoo.com")) {
    sanitized = sanitized.replace(/---\d+x\d+\./i, "---1024x768.");
  }

  return sanitized;
}

// Sequentially check multiple tags in parsed RSS object
function extractRawImageUrl(item: any): string | null {
  // 1. Check enclosure tag
  if (item.enclosure?.url) {
    return item.enclosure.url;
  }
  
  // 2. Check XML media namespace custom field arrays
  const mediaContent = item.mediaContent;
  if (mediaContent && Array.isArray(mediaContent) && mediaContent.length > 0) {
    const url = mediaContent[0]?.$.url || mediaContent[0]?.url;
    if (url) return url;
  }
  
  const mediaThumbnail = item.mediaThumbnail;
  if (mediaThumbnail && Array.isArray(mediaThumbnail) && mediaThumbnail.length > 0) {
    const url = mediaThumbnail[0]?.$.url || mediaThumbnail[0]?.url;
    if (url) return url;
  }
  
  // 3. Scan HTML descriptions and contents using regex
  const htmlSources = [item.content, item.contentSnippet, item.description];
  for (const html of htmlSources) {
    if (html) {
      const parsedImage = extractImageFromHtml(html);
      if (parsedImage) return parsedImage;
    }
  }
  
  return null;
}

// Helper to extract target news domain from URL
function extractDomain(urlStr: string | null | undefined): string | null {
  if (!urlStr) return null;
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// Helper to fetch publisher source links directly from the raw XML
async function fetchSourceUrlsMap(): Promise<Map<string, string>> {
  const sourceMap = new Map<string, string>();
  try {
    const res = await fetch("https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en");
    if (!res.ok) return sourceMap;
    const xmlText = await res.text();
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];
      const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
      const link = linkMatch ? linkMatch[1].trim() : null;
      const sourceMatch = itemContent.match(/<source[^>]+url=["']([^"']+)["']/i);
      const sourceUrl = sourceMatch ? sourceMatch[1].trim() : null;
      if (link && sourceUrl) {
        sourceMap.set(link, sourceUrl);
      }
    }
  } catch (e) {
    console.error("Error fetching raw RSS sources:", e);
  }
  return sourceMap;
}

/**
 * Fetch a page (article or publisher homepage) and extract og:image / twitter:image.
 * Uses a 5-second timeout and reads only the first 20KB (og tags are always in <head>).
 * Returns null on any failure — caller falls through to next pipeline step.
 */
async function fetchOgImage(pageUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(pageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TruthFeed/1.0; +https://truthfeed-hazel.vercel.app)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    clearTimeout(timeoutId);
    if (!res.ok) return null;

    const reader = res.body?.getReader();
    if (!reader) return null;

    let html = "";
    let totalBytes = 0;
    const MAX_BYTES = 20 * 1024;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      html += new TextDecoder().decode(value);
      totalBytes += value.byteLength;
      if (totalBytes >= MAX_BYTES) { reader.cancel(); break; }
    }

    // Priority 1: og:image
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch?.[1] && !isAdOrSpacerImage(ogMatch[1])) return ogMatch[1];

    // Priority 2: twitter:image
    const twitterMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (twitterMatch?.[1] && !isAdOrSpacerImage(twitterMatch[1])) return twitterMatch[1];

    return null;
  } catch {
    return null;
  }
}

export async function fetchNews() {
  try {
    // 1. Fetch XML source map directly
    const sourceMap = await fetchSourceUrlsMap();

    // 2. Configure parser with custom media namespaces mapping
    const parser = new Parser({
      customFields: {
        item: [
          ['media:content', 'mediaContent', { keepArray: true }],
          ['media:thumbnail', 'mediaThumbnail', { keepArray: true }]
        ]
      }
    });

    const feed = await parser.parseURL(
      "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"
    );

    if (!feed.items || feed.items.length === 0) {
      return { success: false, message: "No articles found in RSS feed" };
    }

    let upsertCount = 0;

    for (const item of feed.items) {
      if (!item.link || !item.title) continue;

      const rawItem = item as any;
      const title = rawItem.title;
      const url = tryDecodeGoogleNewsUrl(rawItem.link);
      const summary = rawItem.contentSnippet || "";
      const content = rawItem.content || rawItem.contentSnippet || "";
      const sourceName = rawItem.source?.text || rawItem.creator || "Google News";
      const publishedAt = rawItem.pubDate ? new Date(rawItem.pubDate) : new Date();

      // Extract specific publisher from suffix mapping
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

      // ─────────────────────────────────────────────────────────────
      // ENHANCED IMAGE PIPELINE — Real article photo first
      // ─────────────────────────────────────────────────────────────
      let imageUrl: string | null = null;
      let isLogo = false;
      let isThematic = false;
      let imageSource = "none";

      const sourceUrl = sourceMap.get(rawItem.link) || null;
      const sourceDomain = extractDomain(sourceUrl);

      // STEP 1: Follow the Google News redirect → get real article URL → fetch og:image
      // This is the primary path for article-specific hero images.
      const realArticleUrl = await resolveGoogleNewsRedirect(rawItem.link);
      if (realArticleUrl) {
        const ogImage = await fetchOgImage(realArticleUrl);
        if (ogImage) {
          const sanitized = sanitizeAndUpgradeImageUrl(ogImage);
          if (sanitized) {
            imageUrl = sanitized;
            imageSource = "article-og:image";
          }
        }
      }

      // STEP 2: RSS multi-tag extraction (enclosure, media:content, media:thumbnail, HTML img)
      if (!imageUrl) {
        const rawUrl = extractRawImageUrl(rawItem);
        if (rawUrl) {
          const sanitized = sanitizeAndUpgradeImageUrl(rawUrl);
          if (sanitized) {
            imageUrl = sanitized;
            imageSource = "rss-tag";
          }
        }
      }

      // STEP 3: Fallback — fetch og:image from publisher homepage
      if (!imageUrl && sourceDomain) {
        const homepageOg = await fetchOgImage(`https://${sourceDomain}`);
        if (homepageOg) {
          const sanitized = sanitizeAndUpgradeImageUrl(homepageOg);
          if (sanitized) {
            imageUrl = sanitized;
            imageSource = "homepage-og:image";
          }
        }
      }

      // STEP 4: Thematic Unsplash editorial fallback (isThematic=true)
      if (!imageUrl) {
        imageUrl = getDeterministicImage(title);
        isThematic = true;
        imageSource = "unsplash-thematic";
      }

      // ─────────────────────────────────────────────────
      // ZERO-COST CONSENSUS RELATED SOURCES PARSER
      // ─────────────────────────────────────────────────
      const relatedSources: { title: string; sourceName: string; url: string }[] = [];
      const relatedRegex = /<a href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<font[^>]*>([^<]+)<\/font>/g;
      const parseText = (content || "").replace(/&nbsp;/g, " ");
      let match;
      while ((match = relatedRegex.exec(parseText)) !== null) {
        const itemUrl = match[1];
        const itemTitle = match[2];
        const itemSourceName = match[3];
        relatedSources.push({
          title: itemTitle.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'").trim(),
          sourceName: itemSourceName.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'").trim(),
          url: tryDecodeGoogleNewsUrl(itemUrl),
        });
      }

      console.log(`[INGESTION] ${imageSource.padEnd(20)} | isThematic:${isThematic} | "${title.substring(0, 55)}"`);
      console.log(`            Image: ${(imageUrl || 'NULL').substring(0, 80)}`);

      await prisma.article.upsert({
        where: { url },
        update: {
          title,
          summary,
          content,
          imageUrl,
          isLogo,
          isThematic,
          sourceName: parsedSourceName,
          publishedAt,
          sourceId: existingSource ? existingSource.id : null,
          relatedSources: relatedSources as any,
        },
        create: {
          title,
          url,
          content,
          summary,
          imageUrl,
          isLogo,
          isThematic,
          sourceName: parsedSourceName,
          publishedAt,
          sourceId: existingSource ? existingSource.id : null,
          relatedSources: relatedSources as any,
        },
      });

      upsertCount++;
    }

    try {
      revalidatePath("/");
    } catch (e) {
      console.warn("revalidatePath skipped (non-Next.js environment context)");
    }
    return { success: true, count: upsertCount };
  } catch (error: any) {
    console.error("Error fetching RSS news:", error);
    return { success: false, error: error.message || String(error) };
  }
}
