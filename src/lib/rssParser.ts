export interface RelatedSource {
  title: string;
  url: string;
  source: string;
}

/**
 * Parses the HTML description string from Google News RSS feed to extract alternative news links.
 * Google News format typically looks like:
 * <ol>
 *   <li><a href="https://news.google.com/articles/...">Headline Title</a>&nbsp;&nbsp;<font color="#6f6f6f">Publisher Name</font></li>
 * </ol>
 */
export function parseRelatedArticles(html: string): RelatedSource[] {
  if (!html || typeof html !== "string") return [];
  
  const related: RelatedSource[] = [];
  
  // Extract all <li>...</li> tag segments
  const liMatches = html.match(/<li>(.*?)<\/li>/gi);
  if (!liMatches) return [];

  for (const li of liMatches) {
    // Extract target anchor tag URL
    const hrefMatch = li.match(/href="([^"]+)"/i);
    // Extract anchor tag inner text (headline)
    const textMatch = li.match(/<a[^>]*>(.*?)<\/a>/i);
    // Extract publisher name from <font> tag
    const fontMatch = li.match(/<font[^>]*>(.*?)<\/font>/i);
    
    if (hrefMatch && textMatch) {
      // Decode HTML entities briefly for clean strings
      const rawTitle = textMatch[1]
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/<[^>]*>/g, "") // remove any stray tags inside <a>
        .trim();
        
      const rawSource = fontMatch 
        ? fontMatch[1].replace(/<[^>]*>/g, "").trim() 
        : "Google News";

      related.push({
        title: rawTitle,
        url: hrefMatch[1],
        source: rawSource,
      });
    }
  }

  return related;
}

/**
 * Safely parses the Google News RSS HTML <description> list, extracts the publisher names
 * from <font> tags, and returns them as a unique list, excluding the main publisher name.
 */
export function parseAlsoReportedPublishers(html: string, mainPublisher?: string): string[] {
  if (!html || typeof html !== "string") return [];

  const matches = html.match(/<font[^>]*>(.*?)<\/font>/gi);
  if (!matches) return [];

  const publishersSet = new Set<string>();
  const mainPubLower = mainPublisher?.toLowerCase().trim();

  for (const match of matches) {
    // Extract the inner text of the font tag
    const fontText = match.replace(/<[^>]*>/g, "");
    
    // Decode HTML entities
    const decoded = fontText
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'")
      .trim();

    if (decoded && decoded !== "Google News") {
      // If a main publisher is provided, exclude it from "Also reported by"
      if (mainPubLower && decoded.toLowerCase().trim() === mainPubLower) {
        continue;
      }
      publishersSet.add(decoded);
    }
  }

  return Array.from(publishersSet);
}

