/**
 * Standalone test for the server-side OG image fetcher logic.
 * Run with: node src/scripts/testOgFetcher.js
 */

const TEST_URLS = [
  { source: "BBC", url: "https://www.bbc.com/news/articles/cx2dkl4n7n3o" },
  { source: "The Guardian", url: "https://www.theguardian.com/us-news/2025/jun/03/trump-iran-israel-war" },
  { source: "AP News", url: "https://apnews.com/article/trump-netanyahu-iran-war-ceasefire" },
  { source: "Reuters", url: "https://www.reuters.com/world/us/" },
  { source: "NY Times (paywalled)", url: "https://www.nytimes.com/2025/06/03/us/politics/trump-iran.html" },
];

async function fetchOgImage(articleUrl) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

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
      if (totalBytes >= MAX_BYTES) {
        reader.cancel();
        break;
      }
    }

    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogImageMatch?.[1]) return { url: ogImageMatch[1], reason: "og:image ✅" };

    const twitterImageMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (twitterImageMatch?.[1]) return { url: twitterImageMatch[1], reason: "twitter:image ✅" };

    return { url: null, reason: "No OG/Twitter image tags found in first 20KB" };
  } catch (e) {
    return { url: null, reason: e.name === "AbortError" ? "Timeout (>4s)" : `Error: ${e.message}` };
  }
}

(async () => {
  console.log("\n═══════════════════════════════════════════════");
  console.log("   TruthFeed OG Image Fetcher — Live Test");
  console.log("═══════════════════════════════════════════════\n");

  for (const { source, url } of TEST_URLS) {
    const start = Date.now();
    const result = await fetchOgImage(url);
    const elapsed = Date.now() - start;

    console.log(`📰 ${source}`);
    console.log(`   URL:     ${url}`);
    console.log(`   Result:  ${result.reason}`);
    if (result.url) {
      console.log(`   Image:   ${result.url.substring(0, 90)}`);
    }
    console.log(`   Time:    ${elapsed}ms\n`);
  }

  console.log("═══════════════════════════════════════════════\n");
})();
