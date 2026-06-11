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

// Resolve a Google News article to the real publisher URL.
// Uses the Google News batchexecute API protocol to fetch the redirect target.
async function resolveGoogleNewsRedirect(googleUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(googleUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    clearTimeout(timeoutId);
    if (!res.ok) return null;

    const html = await res.text();
    
    // Extract the data-p attribute which contains the RPC requirements
    const dataPMatch = html.match(/<c-wiz[^>]+data-p=["']([^"']+)["']/i);
    if (!dataPMatch) return null;

    const rawData = dataPMatch[1];
    const decodedData = rawData.replace(/&quot;/g, '"');
    
    // Parse the protobuf-like array payload
    const obj = JSON.parse(decodedData.replace('%.@.', '["garturlreq",'));
    const reqPayload = [[
      'Fbv4je', 
      JSON.stringify([...obj.slice(0, -6), ...obj.slice(-2)]), 
      'null', 
      'generic'
    ]];

    const payload = new URLSearchParams();
    payload.append('f.req', JSON.stringify([reqPayload]));

    const postRes = await fetch('https://news.google.com/_/DotsSplashUi/data/batchexecute', {
      method: 'POST',
      body: payload.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
      }
    });

    if (!postRes.ok) return null;

    const postData = await postRes.text();
    const cleanJsonStr = postData.replace(")]}'\n", "");
    const parsedBatch = JSON.parse(cleanJsonStr);
    
    const arrayString = parsedBatch[0][2];
    const articleUrl = JSON.parse(arrayString)[1];
    
    return articleUrl;
  } catch (e) {
    console.error("resolveGoogleNewsRedirect error:", e);
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

// Detect generic publisher branding images (logos, default placeholders, Facebook/Twitter share images)
// These are returned by some publishers as their homepage og:image — they look terrible as news cards.
function isGenericBrandingImage(url: string): boolean {
  const low = url.toLowerCase();
  
  // Extract filename
  const filename = low.substring(low.lastIndexOf('/') + 1).split('?')[0];
  
  // If the filename itself is exactly generic, block it unless it's a dynamic story crop
  const isGenericFilename = 
    filename === "og-image.jpg" ||
    filename === "og-image.png" ||
    filename === "og_image.jpg" ||
    filename === "og_image.png" ||
    filename === "og.jpg" ||
    filename === "og.png" ||
    filename === "default.jpg" ||
    filename === "default.png" ||
    filename === "logo.jpg" ||
    filename === "logo.png" ||
    filename === "facebook.jpg" ||
    filename === "facebook.png" ||
    filename === "twitter.jpg" ||
    filename === "twitter.png" ||
    filename === "share.jpg" ||
    filename === "share.png" ||
    filename === "sharing.jpg" ||
    filename === "sharing.png" ||
    filename === "image.jpg" ||
    filename === "image.png";

  if (isGenericFilename) {
    // Proactively bypass blocking if the URL has dynamic structure:
    // 1. Contains a date pattern like /2026/06/03/ or 2026-06-03
    const hasDatePattern = /\/\d{4}\/\d{2}\/\d{2}\//.test(low) || /\/\d{4}-\d{2}-\d{2}/.test(low);
    // 2. Or is a long URL (> 120 chars) indicating it's a dynamic CDN/CMS path rather than a static logo/fallback
    const isDynamicPath = low.length > 120;
    
    if (hasDatePattern || isDynamicPath) {
      return false; // Dynamic crop, allow it!
    }
    return true; // Simple generic image, block it
  }

  return (
    // Keep structural generic paths
    /defaultpromo/i.test(low) ||             // NYT default
    /newsgraphics\/images\/icons/i.test(low) || // NYT icon path
    /euronews-og/i.test(low) ||
    /tc-logo/i.test(low) ||                  // TechCrunch static logo
    /forbes_logo/i.test(low) ||
    /website\/images\//i.test(low) ||
    /\/icons?\//i.test(low) ||
    /favicons?/i.test(low)
  );
}

// Perform protocol upgrade and boost image resolutions for known CDNs
function sanitizeAndUpgradeImageUrl(url: string): string | null {
  if (!url) return null;
  if (isAdOrSpacerImage(url)) return null;
  if (isGenericBrandingImage(url)) return null;

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

// Helper to extract meta tag content attributes robustly
function extractMetaValue(html: string, nameOrProperty: string): string | null {
  const metaTags = html.match(/<meta[^>]+>/gi);
  if (!metaTags) return null;
  
  const searchPattern = new RegExp(`(property|name)\\s*=\\s*["']?${nameOrProperty}["']?`, 'i');
  
  for (const tag of metaTags) {
    if (searchPattern.test(tag)) {
      const contentMatch = tag.match(/content\s*=\s*["']([^"']+)["']/i) 
        || tag.match(/content\s*=\s*([^\s>]+)/i);
      if (contentMatch?.[1]) {
        return contentMatch[1].replace(/&amp;/g, "&").trim();
      }
    }
  }
  return null;
}

/**
 * Fetch a page (article or publisher homepage) and extract og:image / twitter:image.
 * Returns null on any failure — caller falls through to next pipeline step.
 */
async function fetchOgImage(pageUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(pageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      },
    });

    clearTimeout(timeoutId);
    if (!res.ok) return null;

    const html = await res.text();

    // Priority 1: og:image
    const ogImage = extractMetaValue(html, "og:image");
    if (ogImage && !isAdOrSpacerImage(ogImage)) return ogImage;

    // Priority 2: twitter:image
    const twitterImage = extractMetaValue(html, "twitter:image");
    if (twitterImage && !isAdOrSpacerImage(twitterImage)) return twitterImage;

    // Priority 3: standard thumbnail
    const thumbnail = extractMetaValue(html, "thumbnail");
    if (thumbnail && !isAdOrSpacerImage(thumbnail)) return thumbnail;

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

    // Feeds list: main feed plus 7 news categories from Google News
    const FEED_URLS = [
      "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en", // main
      "https://news.google.com/news/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en",
      "https://news.google.com/news/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en",
      "https://news.google.com/news/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en",
      "https://news.google.com/news/rss/headlines/section/topic/SPORTS?hl=en-US&gl=US&ceid=US:en",
      "https://news.google.com/news/rss/headlines/section/topic/ENTERTAINMENT?hl=en-US&gl=US&ceid=US:en",
      "https://news.google.com/news/rss/headlines/section/topic/HEALTH?hl=en-US&gl=US&ceid=US:en",
      "https://news.google.com/news/rss/headlines/section/topic/SCIENCE?hl=en-US&gl=US&ceid=US:en",
    ];

    console.log("[RSS Sync] Fetching multiple category feeds in parallel...");
    const feedPromises = FEED_URLS.map(async (url) => {
      try {
        const feed = await parser.parseURL(url);
        // Only take the top 8 most recent items from each feed to prevent serverless timeouts
        return (feed.items || []).slice(0, 8);
      } catch (err) {
        console.error(`[RSS Sync] Failed to fetch feed ${url}:`, err);
        return [];
      }
    });

    const feedResults = await Promise.all(feedPromises);
    const allItems = feedResults.flat();

    if (allItems.length === 0) {
      return { success: false, message: "No articles found in RSS feeds" };
    }

    // Deduplicate items by their Google News link or decoded URL
    const uniqueItemsMap = new Map<string, any>();
    for (const item of allItems) {
      if (item.link) {
        const decodedUrl = tryDecodeGoogleNewsUrl(item.link);
        if (!uniqueItemsMap.has(decodedUrl)) {
          uniqueItemsMap.set(decodedUrl, item);
        }
      }
    }
    const uniqueItems = Array.from(uniqueItemsMap.values());
    console.log(`[RSS Sync] Found ${allItems.length} total feed items. Deduplicated to ${uniqueItems.length} unique articles.`);

    // Pre-query all existing RSS URLs in batch to avoid 200+ single queries
    const rawFeedUrls = uniqueItems.map(item => item.link).filter(Boolean);
    let existingRssUrlsSet = new Set<string>();
    try {
      const existingArticles = await prisma.article.findMany({
        where: {
          rssUrl: {
            in: rawFeedUrls,
          },
        },
        select: {
          rssUrl: true,
        },
      });
      existingRssUrlsSet = new Set(existingArticles.map((a) => a.rssUrl).filter(Boolean) as string[]);
      console.log(`[RSS Sync] Found ${existingRssUrlsSet.size} of the ${rawFeedUrls.length} feed articles already exist in database.`);
    } catch (dbErr) {
      console.error("[RSS Sync] Failed to batch query existing RSS URLs, falling back to individual checks:", dbErr);
    }

    let upsertCount = 0;

    // Process unique articles in parallel batches of 5 to run efficiently without database/network timeout
    const batchSize = 5;
    for (let i = 0; i < uniqueItems.length; i += batchSize) {
      const batch = uniqueItems.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (item) => {
          if (!item.link || !item.title) return;

          const rawItem = item as any;
          const title = rawItem.title;
          let url = tryDecodeGoogleNewsUrl(rawItem.link);
          const rssUrl = rawItem.link;

          // 1. FAST CHECK: If raw Google News RSS URL is already ingested, skip entirely!
          if (existingRssUrlsSet.has(rssUrl)) {
            return;
          }

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

          // Related sources mapping
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

          // Ingestion Image Pipeline
          let imageUrl: string | null = null;
          let isLogo = false;
          let isThematic = false;
          let imageSource = "none";

          const sourceUrl = sourceMap.get(rawItem.link) || null;
          const sourceDomain = extractDomain(sourceUrl);

          // STEP 1: Google redirect lookup (Real publisher URL)
          const realArticleUrl = await resolveGoogleNewsRedirect(rawItem.link);
          if (realArticleUrl) {
            url = realArticleUrl;

            // 2. RESOLVED CHECK: If resolved real URL is already ingested, skip fetching metadata/OG-image
            try {
              const existingResolved = await prisma.article.findUnique({
                where: { url },
                select: { id: true },
              });
              if (existingResolved) {
                return;
              }
            } catch (dbErr) {
              console.error("[RSS Sync] Database check error (resolved URL):", dbErr);
            }

            const ogImage = await fetchOgImage(realArticleUrl);
            if (ogImage) {
              const sanitized = sanitizeAndUpgradeImageUrl(ogImage);
              if (sanitized) {
                imageUrl = sanitized;
                imageSource = "article-og:image";
              }
            }
          }

          // STEP 2: RSS tag parsing fallback
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

          // STEP 2.5: Related article image fallback
          if (!imageUrl && relatedSources.length > 0) {
            for (const source of relatedSources.slice(0, 3)) {
              try {
                const resolvedUrl = await resolveGoogleNewsRedirect(source.url);
                if (resolvedUrl) {
                  const ogImage = await fetchOgImage(resolvedUrl);
                  if (ogImage) {
                    const sanitized = sanitizeAndUpgradeImageUrl(ogImage);
                    if (sanitized) {
                      imageUrl = sanitized;
                      imageSource = `related-og:image (${source.sourceName})`;
                      break;
                    }
                  }
                }
              } catch (e) {
                // Ignore
              }
            }
          }

          // STEP 3: Publisher homepage backup
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

          // STEP 4: Standard thematic placeholder
          if (!imageUrl) {
            imageUrl = getDeterministicImage(title);
            isThematic = true;
            imageSource = "unsplash-thematic";
          }

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
              rssUrl,
            },
            create: {
              title,
              url,
              rssUrl,
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
        })
      );
    }

    // Prune old articles (older than 14 days) to prevent hitting Supabase 500MB limits
    try {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const oldArticles = await prisma.article.findMany({
        where: {
          publishedAt: {
            lt: fourteenDaysAgo,
          },
        },
        select: {
          id: true,
        },
      });
      const oldArticleIds = oldArticles.map((a) => a.id);

      if (oldArticleIds.length > 0) {
        // 1. Clean up FactChecks first (since they lack cascade deletion in schema)
        await prisma.factCheck.deleteMany({
          where: {
            relatedArticleId: {
              in: oldArticleIds,
            },
          },
        });

        // 2. Delete the old articles (Prisma handles implicit join tables for savedBy)
        const deleteResult = await prisma.article.deleteMany({
          where: {
            id: {
              in: oldArticleIds,
            },
          },
        });
        console.log(`[Database Pruning] Successfully pruned ${deleteResult.count} articles older than 14 days.`);
      }
    } catch (pruneErr) {
      console.error("[Database Pruning] Failed to prune old articles:", pruneErr);
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
