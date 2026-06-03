"use server";

import Parser from "rss-parser";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Category templates for Unsplash fallback illustrations
const CATEGORY_TEMPLATES: Record<string, string[]> = {
  politics: [
    "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=800&q=80"
  ],
  tech: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80"
  ],
  science: [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80"
  ],
  health: [
    "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1584036561566-baf241f2c44e?auto=format&fit=crop&w=800&q=80"
  ],
  sports: [
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80"
  ],
  business: [
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1591696205602-2f950c417cb9?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
  ],
  entertainment: [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80"
  ],
  general: [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1495020689067-958852a6565d?auto=format&fit=crop&w=800&q=80"
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

// Decodes a Google News RSS base64 redirect URL
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

// Helper to filter out typical spacers and tracking pixels
function isAdOrSpacerImage(url: string): boolean {
  const lowercaseUrl = url.toLowerCase();
  const forbiddenKeywords = ["ad", "banner", "tracking", "spacer", "pixel", "analytics", "doubleclick", "adsystem", "advertisement", "logo", "icon", "favicon", "avatar", "placeholder"];
  if (forbiddenKeywords.some(kw => lowercaseUrl.includes(kw))) {
    return true;
  }
  if (lowercaseUrl.match(/\b(?:1x1|2x2|3x3|4x4|5x5|8x8|10x10|16x16|32x32|88x31|120x60|120x90|300x50)\b/)) {
    return true;
  }
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
      const url = decodeGoogleNewsUrl(rawItem.link) || rawItem.link;
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

      // OVERHAULED 5-STEP PIPELINE:
      let imageUrl: string | null = null;
      let isLogo = false;

      // 1. Try to extract raw url from enclosure/media tags or content HTML
      const rawUrl = extractRawImageUrl(rawItem);
      
      // 2. Sanitize, upgrade, and filter
      if (rawUrl) {
        imageUrl = sanitizeAndUpgradeImageUrl(rawUrl);
      }

      // 3. Fallback to publisher logo (isLogo) using s2 favicon provider
      if (!imageUrl) {
        const sourceUrl = sourceMap.get(rawItem.link) || null;
        const domain = extractDomain(sourceUrl);
        if (domain) {
          imageUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
          isLogo = true;
        }
      }

      // 4. Fallback to deterministic curated category template
      if (!imageUrl) {
        imageUrl = getDeterministicImage(title);
        isLogo = false;
      }

      // Print extracted parameters to console for verification
      console.log(`[INGESTION PIPELINE]`);
      console.log(`  Title:  "${title}"`);
      console.log(`  Source: "${parsedSourceName}"`);
      console.log(`  Image:  "${imageUrl}"`);
      console.log(`  isLogo: ${isLogo}`);

      await prisma.article.upsert({
        where: { url },
        update: {
          title,
          summary,
          content,
          imageUrl,
          isLogo,
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
          isLogo,
          sourceName: parsedSourceName,
          publishedAt,
          sourceId: existingSource ? existingSource.id : null,
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
