export interface WikiContext {
  title: string;
  extract: string;
  thumbnailUrl: string | null;
}

/**
 * Queries the Wikipedia REST API for the summaries of given entity search terms.
 * Wikipedia content is Creative Commons licensed (CC BY-SA 3.0), ensuring strict legal compliance.
 */
export async function fetchWikiContext(entities: string[]): Promise<WikiContext[]> {
  const results: WikiContext[] = [];

  for (const entity of entities) {
    if (!entity || entity.trim() === "") continue;
    try {
      const cleanEntity = entity.trim().replace(/\s+/g, "_");
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanEntity)}`;

      const res = await fetch(url, {
        headers: {
          "User-Agent": "TruthFeed/1.0 (https://truthfeed-hazel.vercel.app; support@truthfeed.org)",
        },
        next: { revalidate: 86400 }, // Cache on the server-side for 24 hours
      });

      if (!res.ok) {
        console.warn(`Wikipedia summary request for "${entity}" failed with status ${res.status}`);
        continue;
      }

      const data = await res.json();
      if (data.extract) {
        results.push({
          title: data.title || entity,
          extract: data.extract,
          thumbnailUrl: data.thumbnail?.source || null,
        });
      }
    } catch (e) {
      console.error(`Error fetching Wikipedia summary for "${entity}":`, e);
    }
  }

  return results;
}
