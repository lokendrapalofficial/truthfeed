/**
 * Tests the publisher homepage og:image strategy on real news publishers.
 * This is what Step 0b in the pipeline does.
 * Run with: node src/scripts/testHomepageOg.js
 */

const PUBLISHERS = [
  { name: "BBC", domain: "bbc.com" },
  { name: "CBS News", domain: "cbsnews.com" },
  { name: "The Guardian", domain: "theguardian.com" },
  { name: "AP News", domain: "apnews.com" },
  { name: "Los Angeles Times", domain: "latimes.com" },
  { name: "The Washington Post", domain: "washingtonpost.com" },
  { name: "Politico", domain: "politico.com" },
  { name: "CalMatters", domain: "calmatters.org" },
  { name: "Slate", domain: "slate.com" },
  { name: "WSJ", domain: "wsj.com" },
];

async function fetchOgImage(pageUrl) {
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
    return { url: null, reason: e.name === "AbortError" ? "⏱ Timeout" : `Error: ${e.message}` };
  }
}

(async () => {
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("   TruthFeed — Publisher Homepage og:image Test");
  console.log("   (Verifying Step 0b of the image pipeline)");
  console.log("══════════════════════════════════════════════════════════\n");

  let successCount = 0;

  for (const { name, domain } of PUBLISHERS) {
    const url = `https://${domain}`;
    const start = Date.now();
    const result = await fetchOgImage(url);
    const elapsed = Date.now() - start;

    const status = result.url ? "✅" : "❌";
    console.log(`${status} ${name.padEnd(22)} ${result.reason.padEnd(18)} ${elapsed}ms`);
    if (result.url) {
      console.log(`   → ${result.url.substring(0, 90)}`);
      successCount++;
    }
  }

  console.log(`\n══════════════════════════════════════════════════════════`);
  console.log(`📊 ${successCount}/${PUBLISHERS.length} publishers returned a usable homepage og:image`);
  console.log(`══════════════════════════════════════════════════════════\n`);
})();
