"use server";

import { prisma } from "@/lib/db";
import { groq } from "@/lib/groq";
import { fetchWikiContext, WikiContext } from "@/lib/wiki";

export interface BriefingResult {
  briefing: string;
  wikiContexts: WikiContext[];
  category: string;
}

function getBriefingCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.match(/\b(court|senate|election|trump|biden|harris|law|government|president|policy|democrat|republican|tax|debt|tariff|white house|congress|politics|world|israel|ceasefire|border|clash|attack|treaty|suriname)\b/)) return "World";
  if (t.match(/\b(sport|game|nba|nfl|ipl|cricket|cup|stadium|athlete|championship|tennis|soccer|olympics|race|match|win|losing|golf)\b/)) return "Sports";
  if (t.match(/\b(apple|google|microsoft|ai|meta|nvidia|intel|openai|semiconductor|chip|cybersecurity|software|tech|technology|phone|quantum|robot|market|finance|stock|stocks|economy|business|ceo|company|billion)\b/)) return "Tech/Business";
  if (t.match(/\b(movie|film|hollywood|actor|actress|music|album|singer|pop|concert|tv|netflix|award|grammy|star|entertainment|celebrity|popstar|rapper)\b/)) return "Entertainment";
  return "World";
}

export async function compileBriefing(articleId: string) {
  try {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return { success: false, error: "Article not found in database" };
    }

    // 1. Check Caching first (Backward compatible JSON parser)
    const cachedAnalysis = await prisma.analysis.findUnique({
      where: { articleId },
    });

    if (cachedAnalysis) {
      try {
        if (cachedAnalysis.briefing) {
          let parsedWiki: WikiContext[] = [];
          if (cachedAnalysis.wikiContexts) {
            parsedWiki = (typeof cachedAnalysis.wikiContexts === "string"
              ? JSON.parse(cachedAnalysis.wikiContexts)
              : cachedAnalysis.wikiContexts) as WikiContext[];
          }
          return {
            success: true,
            briefing: cachedAnalysis.briefing,
            wikiContexts: parsedWiki,
            category: cachedAnalysis.category || "World",
          };
        }

        const parsed = JSON.parse(cachedAnalysis.claim);
        if (parsed.briefing && Array.isArray(parsed.wikiContexts)) {
          return {
            success: true,
            briefing: parsed.briefing as string,
            wikiContexts: parsed.wikiContexts as WikiContext[],
            category: parsed.category || getBriefingCategory(article.title),
          };
        }
      } catch {
        // Fall back to compiling fresh if cached data was legacy format
      }
    }

    const apiKey = process.env.GROQ_API_KEY;

    // Graceful offline mock fallback if key is missing
    if (!apiKey || apiKey.trim() === "" || apiKey === "MOCK_KEY") {
      console.warn("Using mock briefing compilation because GROQ_API_KEY is not defined.");
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockWiki: WikiContext[] = [
        {
          title: article.sourceName,
          extract: `${article.sourceName} is a major global media organization providing breaking news, coverage analysis, and localized editorial content.`,
          thumbnailUrl: `https://www.google.com/s2/favicons?domain=wikipedia.org&sz=128`,
        }
      ];

      const mockCategory = getBriefingCategory(article.title);
      const categoryLabel = mockCategory === "Tech/Business" ? "TECH/BUSINESS" : mockCategory.toUpperCase();
      
      const mockBriefing = `### THE WIRE BRIEF
The developments regarding "${article.title.replace(/\s*[-|]\s*[^|]+$/, "")}" have been published across multiple channels. According to corroborated reports from ${article.sourceName} and international news agencies, the event details are verified and logged by editorial desks.

### KEY DEVELOPMENTS
- **Initial Report**: Statement distribution originated via ${article.sourceName}.
- **Desk Verification**: Desk editors are tracking official releases and public statements.
- **Entity Scope**: Primary events are located within administrative and regional boundaries.

### GLOBAL CONSENSUS
The incident is independently verified by regional wire services, indicating a high-confidence factual occurrence.

### BACKGROUND CONTEXT
The subject matter in this dispatch aligns with ongoing international updates. Documentation indicates that ${article.sourceName} is a major information network providing localized reporting and wire support.`;

      const resultPayload = { briefing: mockBriefing, wikiContexts: mockWiki, category: mockCategory };
      await prisma.analysis.upsert({
        where: { articleId },
        update: {
          briefing: mockBriefing,
          wikiContexts: JSON.parse(JSON.stringify(mockWiki)),
          claim: article.title,
          category: mockCategory,
        },
        create: {
          articleId,
          briefing: mockBriefing,
          wikiContexts: JSON.parse(JSON.stringify(mockWiki)),
          claim: article.title,
          category: mockCategory,
        },
      });

      return { success: true, ...resultPayload };
    }

    // 2. Groq Extraction Call: Extract 2-3 Entities (Locations, People, Organizations)
    let entities: string[] = [];
    try {
      const entityResponse = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a precise data extractor. Extract 2-3 key entities (Locations, People, Organizations) mentioned in this news headline and description. Return ONLY a JSON object with one key 'entities' containing an array of strings. Do not include markdown code block formatting in your response."
          },
          {
            role: "user",
            content: `Headline: "${article.title}"\nDescription: "${article.summary || article.content}"`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const entityContent = entityResponse.choices[0]?.message?.content;
      if (entityContent) {
        const parsed = JSON.parse(entityContent);
        if (Array.isArray(parsed.entities)) {
          entities = parsed.entities;
        }
      }
    } catch (entityError) {
      console.error("Error extracting entities with Groq:", entityError);
      // Fallback: extract source name and parsed entities roughly
      entities = [article.sourceName];
    }

    // Fallback if no entities extracted
    if (entities.length === 0) {
      entities = [article.sourceName];
    }

    // 3. Query Wikipedia summary context for these entities
    const wikiContexts = await fetchWikiContext(entities);

    // 4. Compile the Morning Briefing using Groq
    const relatedSources: any[] = article.relatedSources ? JSON.parse(JSON.stringify(article.relatedSources)) : [];
    
    const briefingResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a Senior Desk Editor at a global news wire (e.g., Reuters, Associated Press). Your task is to compile a definitive, human-quality Intelligence Memo based on cross-referenced news headlines and verified encyclopedia context.

First, classify this news story into one of these four categories: "World", "Sports", "Tech/Business", or "Entertainment".
Output a JSON object with two keys:
1) "category": Must be exactly one of: "World", "Sports", "Tech/Business", or "Entertainment".
2) "briefing": A markdown string compiled using the exact memo template below.

STRICT STYLE RULES:
- NEVER use AI clichés (e.g., 'delve', 'tapestry', 'crucial', 'paramount', 'in conclusion', 'it is important to note', 'underscores').
- Write in crisp, objective, active-voice journalistic prose.
- Use the 'Inverted Pyramid' structure: hard facts first, context second.
- Do NOT use emojis in the report text. Keep it strictly professional.
- Explicitly cite the cross-referenced sources in the text to prove verification (e.g., 'according to corroborated reports from BBC, CBS News, and Yahoo').

OUTPUT FORMAT (Markdown for "briefing" key):
### THE WIRE BRIEF
(2-3 sentences synthesizing the core undisputed facts from all provided headlines. E.g., 'A mass stabbing in Suriname has left nine dead, including five children, according to corroborated reports from BBC, CBS News, and Yahoo.')

### KEY DEVELOPMENTS
(3-4 bullet points detailing specific facts extracted from the cross-references, such as the location 'Paramaribo' or specific police statements).

### GLOBAL CONSENSUS
(A brief, professional assessment of the media cross-reference. E.g., 'This incident is independently verified by five major international news desks, indicating a high-confidence factual event.')

### BACKGROUND CONTEXT
(Seamlessly weave in the provided Wikipedia context about the location/entities to give the reader necessary geographical or historical background without sounding like an encyclopedia copy-paste.)`
        },
        {
          role: "user",
          content: `Breaking Headline: "${article.title}"
Related coverage headlines:
${relatedSources.length > 0 ? relatedSources.map(s => `- ${s.title} (${s.sourceName})`).join("\n") : "- No alternative coverage reported yet."}

Wikipedia Entity Context:
${wikiContexts.length > 0 ? wikiContexts.map(w => `Entity: ${w.title}\nBackground: ${w.extract}`).join("\n\n") : "No historical entity background returned from Wikipedia."}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const briefingContent = briefingResponse.choices[0]?.message?.content;
    if (!briefingContent) {
      return { success: false, error: "Failed to compile Briefing text from Groq" };
    }

    let parsedBriefing;
    try {
      parsedBriefing = JSON.parse(briefingContent);
    } catch (parseError) {
      console.error("Error parsing Groq briefing JSON:", parseError);
      return { success: false, error: "Failed to parse Groq briefing response JSON" };
    }

    const category = parsedBriefing.category || "World";
    const briefingText = parsedBriefing.briefing || "";

    const resultPayload = {
      briefing: briefingText,
      wikiContexts,
      category,
    };

    // Cache the briefing payload in the database Analysis model
    await prisma.analysis.upsert({
      where: { articleId },
      update: {
        briefing: briefingText,
        wikiContexts: JSON.parse(JSON.stringify(wikiContexts)),
        claim: article.title,
        category,
      },
      create: {
        articleId,
        briefing: briefingText,
        wikiContexts: JSON.parse(JSON.stringify(wikiContexts)),
        claim: article.title,
        category,
      },
    });

    return { success: true, ...resultPayload };
  } catch (error: any) {
    console.error("Error in compileBriefing action:", error);
    return { success: false, error: error.message || String(error) };
  }
}
