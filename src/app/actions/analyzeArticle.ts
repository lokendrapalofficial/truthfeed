"use server";

import { prisma } from "@/lib/db";
import { groq } from "@/lib/groq";
import { fetchWikiContext, WikiContext } from "@/lib/wiki";

export interface GeminiAnalysisResult {
  claim: string;
  verdict: string;
  evidence: string;
}

// Module-level cache to lock concurrent compilations for the same articleId
const inFlightCompilations = new Map<string, Promise<any>>();

function getBriefingCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.match(/\b(court|senate|election|trump|biden|harris|law|government|president|policy|democrat|republican|tax|debt|tariff|white house|congress|politics|world|israel|ceasefire|border|clash|attack|treaty|suriname)\b/)) return "World";
  if (t.match(/\b(sport|game|nba|nfl|ipl|cricket|cup|stadium|athlete|championship|tennis|soccer|olympics|race|match|win|losing|golf)\b/)) return "Sports";
  if (t.match(/\b(apple|google|microsoft|ai|meta|nvidia|intel|openai|semiconductor|chip|cybersecurity|software|tech|technology|phone|quantum|robot|market|finance|stock|stocks|economy|business|ceo|company|billion)\b/)) return "Tech/Business";
  if (t.match(/\b(movie|film|hollywood|actor|actress|music|album|singer|pop|concert|tv|netflix|award|grammy|star|entertainment|celebrity|popstar|rapper)\b/)) return "Entertainment";
  return "World";
}

export async function analyzeArticle(
  articleId: string,
  title?: string,
  description?: string,
  relatedSources?: any
) {
  if (inFlightCompilations.has(articleId)) {
    console.log(`[Concurrency Lock] Awaiting existing compiler promise for article: ${articleId}`);
    return inFlightCompilations.get(articleId)!;
  }

  const promise = (async () => {
    try {
      // 1. Fetch from DB if details not provided
      const article = await prisma.article.findUnique({
        where: { id: articleId },
      });

      if (!article) {
        return { success: false, error: "Article not found in database" };
      }

      // If parameters were passed in, we can use them, but defaults are from the DB article object
      const articleTitle = title || article.title;
      const articleDesc = description || article.summary || article.content || "";
      const articleRelated = relatedSources || article.relatedSources;

      // 2. Check Caching first (Backward compatible JSON parser)
      const cachedAnalysis = await prisma.analysis.findUnique({
        where: { articleId },
      });

      if (cachedAnalysis) {
        try {
          if (cachedAnalysis.briefing || cachedAnalysis.articleText) {
            let parsedWiki: WikiContext[] = [];
            if (cachedAnalysis.wikiContexts) {
              parsedWiki = (typeof cachedAnalysis.wikiContexts === "string"
                ? JSON.parse(cachedAnalysis.wikiContexts)
                : cachedAnalysis.wikiContexts) as WikiContext[];
            }
            return {
              success: true,
              briefing: cachedAnalysis.briefing || cachedAnalysis.articleText || "",
              articleText: cachedAnalysis.articleText || cachedAnalysis.briefing || "",
              wikiContexts: parsedWiki,
              category: cachedAnalysis.category || "World",
            };
          }

          const parsed = JSON.parse(cachedAnalysis.claim);
          if ((parsed.briefing || parsed.articleText) && Array.isArray(parsed.wikiContexts)) {
            return {
              success: true,
              briefing: (parsed.articleText || parsed.briefing) as string,
              articleText: (parsed.articleText || parsed.briefing) as string,
              wikiContexts: parsed.wikiContexts as WikiContext[],
              category: parsed.category || getBriefingCategory(articleTitle),
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

        const mockCategory = getBriefingCategory(articleTitle);
        
        const mockArticleText = `PARAMARIBO, Suriname — The developments regarding "${articleTitle.replace(/\s*[-|]\s*[^|]+$/, "")}" have been published across multiple channels. Local authorities and media representatives have confirmed that events are unfolding rapidly, prompting response operations from regional agencies.

The incident was widely corroborated by international outlets including ${article.sourceName} and global news desks. Journalists are tracking public releases and security updates as verified information continues to emerge from official channels.

Historically, the region has been a focal point for regional trade and partnerships. Documentation from Wikipedia indicates that ${article.sourceName} serves as a key information platform, reporting on local administrative and geographical changes as they happen.`;

        const resultPayload = { briefing: mockArticleText, articleText: mockArticleText, wikiContexts: mockWiki, category: mockCategory };
        await prisma.analysis.upsert({
          where: { articleId },
          update: {
            briefing: mockArticleText,
            articleText: mockArticleText,
            wikiContexts: JSON.parse(JSON.stringify(mockWiki)),
            claim: articleTitle,
            category: mockCategory,
          },
          create: {
            articleId,
            briefing: mockArticleText,
            articleText: mockArticleText,
            wikiContexts: JSON.parse(JSON.stringify(mockWiki)),
            claim: articleTitle,
            category: mockCategory,
          },
        });

        return { success: true, ...resultPayload };
      }

      // 3. Groq Extraction Call: Extract 2-3 Entities (Locations, People, Organizations)
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
              content: `Headline: "${articleTitle}"\nDescription: "${articleDesc}"`
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
        entities = [article.sourceName];
      }

      if (entities.length === 0) {
        entities = [article.sourceName];
      }

      // 4. Query Wikipedia summary context for these entities
      const wikiContexts = await fetchWikiContext(entities);

      // 5. Compile the Morning Briefing using Groq
      const parsedRelated: any[] = articleRelated
        ? (typeof articleRelated === "string" ? JSON.parse(articleRelated) : JSON.parse(JSON.stringify(articleRelated)))
        : [];
      
      const briefingResponse = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a Senior Desk Editor at a global news wire (e.g., Reuters, Associated Press). Your task is to write a definitive, 3-to-4 paragraph news article based on the provided headlines and context.

First, classify this news story into one of these four categories: "World", "Sports", "Tech/Business", or "Entertainment".
Output a JSON object with three keys:
1) "category": Must be exactly one of: "World", "Sports", "Tech/Business", or "Entertainment".
2) "articleText": A string containing the synthesized news article compiled using the strict formatting rules below.
3) "briefing": Legacy key. Fill this with the exact same content as "articleText" for database backward compatibility.

STRICT FORMATTING RULES:
- Output ONLY plain text paragraphs. 
- NO Markdown headers (no '###', no '**').
- NO bullet points.
- NO emojis.
- NO AI cliches ('delve', 'tapestry', 'crucial').
- Start the first paragraph with a journalistic dateline (e.g., 'CITY, Country — ').
- In the second paragraph, naturally cite the corroborating sources (e.g., 'according to BBC, CBS...').
- In the final paragraph, weave in the background context.
- Just write beautiful, objective, cohesive journalistic prose.`
          },
          {
            role: "user",
            content: `Breaking Headline: "${articleTitle}"
Related coverage headlines:
${parsedRelated.length > 0 ? parsedRelated.map(s => `- ${s.title} (${s.sourceName})`).join("\n") : "- No alternative coverage reported yet."}

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
      const articleText = parsedBriefing.articleText || parsedBriefing.briefing || "";

      const resultPayload = {
        briefing: articleText,
        articleText,
        wikiContexts,
        category,
      };

      // Cache the briefing payload in the database Analysis model
      await prisma.analysis.upsert({
        where: { articleId },
        update: {
          briefing: articleText,
          articleText,
          wikiContexts: JSON.parse(JSON.stringify(wikiContexts)),
          claim: articleTitle,
          category,
        },
        create: {
          articleId,
          briefing: articleText,
          articleText,
          wikiContexts: JSON.parse(JSON.stringify(wikiContexts)),
          claim: articleTitle,
          category,
        },
      });

      return { success: true, ...resultPayload };
    } catch (error: any) {
      console.error("Error in analyzeArticle action:", error);
      return { success: false, error: error.message || String(error) };
    } finally {
      inFlightCompilations.delete(articleId);
    }
  })();

  inFlightCompilations.set(articleId, promise);
  return promise;
}

