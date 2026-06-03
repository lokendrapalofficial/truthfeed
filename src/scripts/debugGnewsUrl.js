/**
 * Debug Google News URL decoding — inspect what's inside the new CBMi... base64 blobs.
 * Run with: node src/scripts/debugGnewsUrl.js
 */

const RSS_URL = "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en";

function parseRssLinks(xml, limit = 5) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
    const itemContent = match[1];
    const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
    const sourceUrlMatch = itemContent.match(/<source[^>]+url=["']([^"']+)["']/i);
    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim(),
        link: linkMatch[1].trim(),
        sourceUrl: sourceUrlMatch ? sourceUrlMatch[1].trim() : null,
      });
    }
  }
  return items;
}

(async () => {
  console.log("Fetching RSS...");
  const res = await fetch(RSS_URL);
  const xml = await res.text();
  const items = parseRssLinks(xml, 5);
  
  console.log(`\n${"═".repeat(70)}`);
  console.log("Inspecting Google News URL structures");
  console.log("═".repeat(70));
  
  for (const item of items) {
    console.log(`\n📰 "${item.title.substring(0, 60)}"`);
    console.log(`   Source URL: ${item.sourceUrl}`);
    console.log(`   Raw link:   ${item.link}`);
    
    // Try to decode the base64 blob inside the path
    try {
      const url = new URL(item.link);
      const pathParts = url.pathname.split('/').filter(Boolean);
      console.log(`   Path parts: ${JSON.stringify(pathParts)}`);
      
      // Try each path segment as potential base64
      for (const part of pathParts) {
        if (part.length > 20) {
          try {
            const clean = part.split('?')[0];
            const decoded = Buffer.from(clean, 'base64').toString('utf8');
            const httpIdx = decoded.indexOf('http');
            if (httpIdx !== -1) {
              console.log(`   ✅ Decoded URL found in path segment!`);
              console.log(`   Decoded: ${decoded.substring(httpIdx, httpIdx + 100)}`);
            } else {
              // Show first 50 chars of decoded to understand format
              const printable = decoded.replace(/[^\x20-\x7E]/g, '·').substring(0, 80);
              console.log(`   Segment "${part.substring(0, 20)}..." -> "${printable}"`);
            }
          } catch (e) {
            console.log(`   Segment "${part.substring(0, 20)}..." -> base64 decode failed`);
          }
        }
      }
      
      // Also try query params
      for (const [key, val] of url.searchParams) {
        if (val.length > 20) {
          try {
            const decoded = Buffer.from(val, 'base64').toString('utf8');
            const httpIdx = decoded.indexOf('http');
            if (httpIdx !== -1) {
              console.log(`   ✅ Found URL in query param "${key}"!`);
              console.log(`   Decoded: ${decoded.substring(httpIdx, httpIdx + 100)}`);
            }
          } catch {}
        }
      }
    } catch (e) {
      console.log(`   Parse error: ${e.message}`);
    }
  }
  
  console.log(`\n${"═".repeat(70)}`);
  console.log("The sourceUrl from <source url=\"...\"> contains the real domain.");
  console.log("If article URLs cannot be decoded, we can use sourceUrl to fetch the");
  console.log("publisher's homepage og:image as a branded header image.");
  console.log("═".repeat(70) + "\n");
})();
