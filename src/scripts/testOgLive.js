/**
 * Live OG image test — fetches REAL current article URLs from the Google News RSS feed,
 * then tests the og:image fetcher on each of them.
 * Run with: node src/scripts/testOgLive.js
 */

const RSS_URL = "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en";

// Decode Google News base64-encoded redirect URLs to real publisher URLs
function decodeGoogleNewsUrl(googleUrl) {
  try {
    const urlObj = new URL(googleUrl);
    if (!urlObj.hostname.includes("news.google.com")) return googleUrl;
    const parts = urlObj.pathname.split('/');
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
  } catch {
    return googleUrl;
  }
}

async function fetchOgImage(articleUrl) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(articleUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TruthFeed/1.0; +https://truthfeed-hazel.vercel.app)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    clearTimeout(timeoutId);
    if (!res.ok) return { url: null, reason: `HTTP ${res.status}` };

    const reader = res.body?.getReader();
    if (!reader) return { url: null, reason: "No readable body" };

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

    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch?.[1]) return { url: ogMatch[1], reason: "og:image ✅" };

    const twitterMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (twitterMatch?.[1]) return { url: twitterMatch[1], reason: "twitter:image ✅" };

    return { url: null, reason: "No OG tags in first 20KB" };
  } catch (e) {
    return { url: null, reason: e.name === "AbortError" ? "⏱ Timeout (>5s)" : `Error: ${e.message}` };
  }
}

// Minimal RSS XML parser (no extra deps)
function parseRssItems(xml, limit = 8) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
    const itemContent = match[1];
    const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
    const sourceMatch = itemContent.match(/<source[^>]*>([\s\S]*?)<\/source>/);
    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim(),
        link: linkMatch[1].trim(),
        source: sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim() : "Unknown",
      });
    }
  }
  return items;
}

(async () => {
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("   TruthFeed — Live OG Image Pipeline Test");
  console.log("   (Using real current Google News RSS articles)");
  console.log("═══════════════════════════════════════════════════════\n");

  // Step 1: Fetch live RSS
  console.log("⬇ Fetching live Google News RSS...");
  const rssRes = await fetch(RSS_URL);
  const xmlText = await rssRes.text();
  const items = parseRssItems(xmlText, 8);
  console.log(`✅ Loaded ${items.length} articles from RSS\n`);

  let successCount = 0;

  for (const item of items) {
    const decodedUrl = decodeGoogleNewsUrl(item.link);
    const isDecoded = decodedUrl !== item.link && !decodedUrl.includes("news.google.com");
    
    console.log(`📰 ${item.source}`);
    console.log(`   Headline: "${item.title.substring(0, 65)}..."`);
    console.log(`   URL:      ${decodedUrl.substring(0, 80)}`);

    if (!isDecoded) {
      console.log(`   ⚠ URL still points to news.google.com — skipping OG fetch\n`);
      continue;
    }

    const start = Date.now();
    const result = await fetchOgImage(decodedUrl);
    const elapsed = Date.now() - start;

    console.log(`   Result:   ${result.reason} (${elapsed}ms)`);
    if (result.url) {
      console.log(`   Image:    ${result.url.substring(0, 85)}`);
      successCount++;
    }
    console.log();
  }

  const decoded = items.filter(i => {
    const d = decodeGoogleNewsUrl(i.link);
    return d !== i.link && !d.includes("news.google.com");
  }).length;

  console.log("═══════════════════════════════════════════════════════");
  console.log(`📊 Summary:`);
  console.log(`   ${items.length} articles fetched from RSS`);
  console.log(`   ${decoded} successfully decoded from Google redirect`);
  console.log(`   ${successCount} / ${decoded} had fetchable og:image`);
  console.log("═══════════════════════════════════════════════════════\n");
})();
