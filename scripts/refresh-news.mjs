// One-off script to re-run the new 5-layer image pipeline against all current RSS articles
// Run: node --env-file=.env scripts/refresh-news.mjs

import { PrismaClient } from "@prisma/client";
import Parser from "rss-parser";

const prisma = new PrismaClient();

// ─── Category templates ───────────────────────────────────────────────────────
const CATEGORY_TEMPLATES = {
  politics: [
    "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1200&q=85",
  ],
  tech: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=85",
  ],
  science: [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=85",
  ],
  health: [
    "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1584036561566-baf241f2c44e?auto=format&fit=crop&w=1200&q=85",
  ],
  sports: [
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=85",
  ],
  business: [
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1591696205602-2f950c417cb9?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=85",
  ],
  entertainment: [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=85",
  ],
  general: [
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1495020689067-958852a6565d?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=85",
  ],
};

function getHeadlineCategory(title) {
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

function getDeterministicImage(title) {
  const category = getHeadlineCategory(title);
  const templates = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES.general;
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  return templates[Math.abs(hash) % templates.length];
}

// Precise sanitizer — no more broad keyword blocks
function isAdOrSpacerImage(url) {
  const low = url.toLowerCase();
  if (
    low.includes("doubleclick.net") || low.includes("googlesyndication") ||
    low.includes("adsystem") || low.includes("adservice") ||
    low.includes("pagead") || low.includes("adclick")
  ) return true;
  if (low.match(/[_\-\/\.](1x1|2x2|spacer|blank|pixel|tracking)[\.\?_]/)) return true;
  if (low.match(/\b(?:1x1|2x2|3x3|4x4|5x5|8x8|10x10|88x31|120x60|120x90|300x50)\b/)) return true;
  if (low.match(/\/favicon\.(ico|png|gif)$/)) return true;
  if (low.startsWith("data:")) return true;
  return false;
}

function sanitizeAndUpgradeImageUrl(url) {
  if (!url) return null;
  if (isAdOrSpacerImage(url)) return null;
  let s = url.trim().replace(/^http:\/\//i, "https://");
  if (s.includes("bbci.co.uk")) {
    s = s.replace(/\/news\/(?:240|320|480)\//i, "/news/1024/");
    s = s.replace(/\/(?:240|320|480)\/cpsprodpb/i, "/1024/cpsprodpb");
  }
  if (s.includes("yahoo.com")) s = s.replace(/---\d+x\d+\./i, "---1024x768.");
  return s;
}

function decodeHtmlEntities(str) {
  if (!str) return "";
  return str
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'")
    .replace(/&ndash;/g, "-").replace(/&mdash;/g, "-").replace(/&nbsp;/g, " ");
}

function extractImageFromHtml(html) {
  if (!html) return null;
  const match = decodeHtmlEntities(html).match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function extractRawImageUrl(item) {
  if (item.enclosure?.url) return item.enclosure.url;
  const mc = item.mediaContent;
  if (Array.isArray(mc) && mc.length > 0) { const u = mc[0]?.$?.url || mc[0]?.url; if (u) return u; }
  const mt = item.mediaThumbnail;
  if (Array.isArray(mt) && mt.length > 0) { const u = mt[0]?.$?.url || mt[0]?.url; if (u) return u; }
  for (const html of [item.content, item.contentSnippet, item.description]) {
    if (html) { const p = extractImageFromHtml(html); if (p) return p; }
  }
  return null;
}

function extractDomain(urlStr) {
  if (!urlStr) return null;
  try { return new URL(urlStr).hostname.replace(/^www\./, ""); } catch { return null; }
}

// ─── Key fix: Follow HTTP redirect to get real article URL ───────────────────
async function resolveGoogleNewsRedirect(googleUrl) {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 6000);
    const res = await fetch(googleUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    const finalUrl = res.url;
    if (finalUrl && !finalUrl.includes("news.google.com") && finalUrl.startsWith("http")) return finalUrl;
    return null;
  } catch { return null; }
}

async function fetchOgImage(pageUrl) {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(pageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(tid);
    if (!res.ok) return null;
    const reader = res.body?.getReader();
    if (!reader) return null;
    let html = "", total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      html += new TextDecoder().decode(value);
      total += value.byteLength;
      if (total >= 20 * 1024) { reader.cancel(); break; }
    }
    const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (og?.[1] && !isAdOrSpacerImage(og[1])) return og[1];
    const tw = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (tw?.[1] && !isAdOrSpacerImage(tw[1])) return tw[1];
    return null;
  } catch { return null; }
}

async function fetchSourceUrlsMap() {
  const map = new Map();
  try {
    const res = await fetch("https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en");
    if (!res.ok) return map;
    const xml = await res.text();
    const re = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
      const lm = m[1].match(/<link>([\s\S]*?)<\/link>/);
      const sm = m[1].match(/<source[^>]+url=["']([^"']+)["']/i);
      if (lm && sm) map.set(lm[1].trim(), sm[1].trim());
    }
  } catch (e) { console.error("sourceMap error:", e); }
  return map;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔄 Refreshing articles with REAL article images via redirect resolution...\n");

  const sourceMap = await fetchSourceUrlsMap();
  const parser = new Parser({
    customFields: { item: [["media:content","mediaContent",{keepArray:true}],["media:thumbnail","mediaThumbnail",{keepArray:true}]] },
  });

  const feed = await parser.parseURL("https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en");
  console.log(`📡 Fetched ${feed.items.length} items\n`);

  let count = 0;
  for (const item of feed.items) {
    if (!item.link || !item.title) continue;
    const raw = item;
    const title = raw.title;
    const summary = raw.contentSnippet || "";
    const content = raw.content || raw.contentSnippet || "";
    const sourceName = raw.source?.text || raw.creator || "Google News";
    const publishedAt = raw.pubDate ? new Date(raw.pubDate) : new Date();

    let parsedSourceName = sourceName;
    if (parsedSourceName === "Google News") {
      const parts = title.split(" - ");
      if (parts.length > 1) {
        const last = parts[parts.length - 1].trim();
        if (["breaking","latest","videos","home"].some(kw => last.toLowerCase().includes(kw))) {
          if (parts.length > 2) parsedSourceName = parts[parts.length - 2].trim();
        } else { parsedSourceName = last; }
      }
    }

    const existingSource = await prisma.source.findUnique({ where: { name: parsedSourceName } });
    const sourceUrl = sourceMap.get(raw.link) || null;
    const sourceDomain = extractDomain(sourceUrl);

    let imageUrl = null;
    let isLogo = false;
    let isThematic = false;
    let imageSource = "none";

    // STEP 1: Resolve real article URL via HTTP redirect → og:image
    const realArticleUrl = await resolveGoogleNewsRedirect(raw.link);
    if (realArticleUrl) {
      const og = await fetchOgImage(realArticleUrl);
      if (og) {
        const s = sanitizeAndUpgradeImageUrl(og);
        if (s) { imageUrl = s; imageSource = "article-og:image"; }
      }
    }

    // STEP 2: RSS media tags + HTML img regex
    if (!imageUrl) {
      const rawUrl = extractRawImageUrl(raw);
      if (rawUrl) {
        const s = sanitizeAndUpgradeImageUrl(rawUrl);
        if (s) { imageUrl = s; imageSource = "rss-tag"; }
      }
    }

    // STEP 3: Publisher homepage og:image fallback
    if (!imageUrl && sourceDomain) {
      const og = await fetchOgImage(`https://${sourceDomain}`);
      if (og) {
        const s = sanitizeAndUpgradeImageUrl(og);
        if (s) { imageUrl = s; imageSource = "homepage-og:image"; }
      }
    }

    // STEP 4: Thematic Unsplash
    if (!imageUrl) {
      imageUrl = getDeterministicImage(title);
      isThematic = true;
      imageSource = "unsplash-thematic";
    }

    const tag = imageSource === "article-og:image" ? "✅ REAL" :
                imageSource === "rss-tag"          ? "📎 RSS " :
                imageSource === "homepage-og:image"? "🏠 HOME" : "🖼  THEME";

    console.log(`${tag} [${imageSource.padEnd(20)}] "${title.substring(0, 50)}"`);
    if (realArticleUrl) console.log(`     → resolved: ${realArticleUrl.substring(0, 70)}`);
    console.log(`     → image:    ${(imageUrl||'NULL').substring(0, 70)}`);

    // Upsert using realArticleUrl as url when available (real publisher URL), else keep Google URL
    const articleUrl = realArticleUrl || raw.link;

    const relatedSources = [];
    const re = /<a href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<font[^>]*>([^<]+)<\/font>/g;
    const parseText = (content || "").replace(/&nbsp;/g, " ");
    let m;
    while ((m = re.exec(parseText)) !== null) {
      relatedSources.push({
        url: m[1], title: m[2].replace(/&amp;/g,"&").trim(),
        sourceName: m[3].replace(/&amp;/g,"&").trim(),
      });
    }

    await prisma.article.upsert({
      where: { url: articleUrl },
      update: { title, summary, content, imageUrl, isLogo, isThematic, sourceName: parsedSourceName, publishedAt, sourceId: existingSource?.id ?? null, relatedSources },
      create: { title, url: articleUrl, content, summary, imageUrl, isLogo, isThematic, sourceName: parsedSourceName, publishedAt, sourceId: existingSource?.id ?? null, relatedSources },
    });
    count++;
  }

  await prisma.$disconnect();
  console.log(`\n✅ Done! Re-upserted ${count} articles with real article images.`);
}

main().catch(e => { console.error(e); process.exit(1); });
