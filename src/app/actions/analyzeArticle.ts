"use server";

import { prisma } from "@/lib/db";
import { groq } from "@/lib/groq";
import { fetchWikiContext, WikiContext } from "@/lib/wiki";
import { fetchFactChecks } from "@/app/actions/fetchFactChecks";

export interface GeminiAnalysisResult {
  claim: string;
  verdict: string;
  evidence: string;
}

export interface VerificationScorecardData {
  coreClaim: string;
  consensusScore: number;
  confidenceLevel: "High" | "Medium" | "Low" | "Conflicting";
  conflictReport: string;
  reasoning: string;
  professionalAudit?: {
    publisherName: string;
    textualRating: string;
    reviewUrl: string;
  } | null;
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

      const articleTitle = title || article.title;
      const articleDesc = description || article.summary || article.content || "";
      const articleRelated = relatedSources || article.relatedSources;

      // 2. Check Caching first (Backward compatible JSON parser)
      const cachedAnalysis = await prisma.analysis.findUnique({
        where: { articleId },
      });

      if (cachedAnalysis) {
        try {
          if (cachedAnalysis.verification) {
            const parsedWiki = cachedAnalysis.wikiContexts
              ? (typeof cachedAnalysis.wikiContexts === "string"
                ? JSON.parse(cachedAnalysis.wikiContexts)
                : cachedAnalysis.wikiContexts) as WikiContext[]
              : [];

            const parsedVerification = typeof cachedAnalysis.verification === "string"
              ? JSON.parse(cachedAnalysis.verification)
              : cachedAnalysis.verification;

            return {
              success: true,
              briefing: cachedAnalysis.briefing || "",
              articleText: cachedAnalysis.articleText || "",
              wikiContexts: parsedWiki,
              category: cachedAnalysis.category || "World",
              verification: parsedVerification as VerificationScorecardData,
            };
          }
        } catch (cacheError) {
          console.error("Error reading cached verification scorecard:", cacheError);
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
        
        const mockQuickBrief = `Reports from ${article.sourceName} indicate significant new developments regarding "${articleTitle.replace(/\s*[-|]\s*[^|]+$/, "")}". Local authorities and news outlets have confirmed that events are unfolding rapidly, with emergency response operations active.`;

        const mockDeepDive = `PARAMARIBO, Suriname — The developments regarding "${articleTitle.replace(/\s*[-|]\s*[^|]+$/, "")}" have been published across multiple channels. Local authorities and media representatives have confirmed that events are unfolding rapidly, prompting response operations from regional agencies.

The incident was widely corroborated by international outlets including ${article.sourceName} and global news desks. Journalists are tracking public releases and security updates as verified information continues to emerge from official channels.

Historically, the region has been a focal point for regional trade and partnerships. Documentation from Wikipedia indicates that ${article.sourceName} serves as a key information platform, reporting on local administrative and geographical changes as they happen.`;

        const mockVerification: VerificationScorecardData = {
          coreClaim: articleTitle,
          consensusScore: 4,
          confidenceLevel: "High",
          conflictReport: "Minor naming differences resolved; primary timeline holds consensus across major desks.",
          reasoning: `Corroborated by ${article.sourceName} and multiple international news outlets reporting identical core figures.`,
          professionalAudit: null
        };

        // Query mock Fact-checks if they match
        try {
          const factCheckRes = await fetchFactChecks(articleTitle);
          if (factCheckRes.success && factCheckRes.reviews && factCheckRes.reviews.length > 0) {
            const primary = factCheckRes.reviews[0];
            mockVerification.professionalAudit = {
              publisherName: primary.publisherName,
              textualRating: primary.textualRating,
              reviewUrl: primary.reviewUrl,
            };
          }
        } catch (err) {
          console.error("Mock factcheck query error:", err);
        }

        const resultPayload = {
          briefing: mockQuickBrief,
          articleText: mockDeepDive,
          wikiContexts: mockWiki,
          category: mockCategory,
          verification: mockVerification
        };

        await prisma.analysis.upsert({
          where: { articleId },
          update: {
            briefing: mockQuickBrief,
            articleText: mockDeepDive,
            wikiContexts: JSON.parse(JSON.stringify(mockWiki)),
            claim: articleTitle,
            category: mockCategory,
            verification: JSON.parse(JSON.stringify(mockVerification))
          },
          create: {
            articleId,
            briefing: mockQuickBrief,
            articleText: mockDeepDive,
            wikiContexts: JSON.parse(JSON.stringify(mockWiki)),
            claim: articleTitle,
            category: mockCategory,
            verification: JSON.parse(JSON.stringify(mockVerification))
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
      
      const auditResponse = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are an Editorial Desk Chief performing a verification audit at a global news wire. Your task is to analyze the primary news headline and corroborating related sources, and output a JSON object containing a confidence evaluation and synthesized dispatches.

First, classify this news story into one of these four categories: "World", "Sports", "Tech/Business", or "Entertainment".

Output a JSON object with these EXACT keys:
1) "category": Must be exactly one of: "World", "Sports", "Tech/Business", or "Entertainment".
2) "quickBrief": A single-paragraph, high-level summary of the news event.
3) "deepDive": A comprehensive, 3-to-4 paragraph objective journalistic report. Start the first paragraph with a dateline (e.g. 'CITY, Country — ').
4) "verification": A JSON object containing:
   - "coreClaim": The specific factual assertion being made in the article headline or description.
   - "consensusScore": An integer from 0 to 5, indicating how many independent sources corroborate this claim.
   - "confidenceLevel": A string representing the reliability of the claim. Must be exactly one of: "High", "Medium", "Low", or "Conflicting".
   - "conflictReport": A string indicating if the sources agree, or if there are discrepancies in numbers/timelines.
   - "reasoning": A single sentence explaining why this confidence level and score were assigned.

STRICT FORMATTING RULES FOR WRITING prose (quickBrief and deepDive):
- Output ONLY plain text dispatches inside the JSON fields.
- NO Markdown headers (no '###', no '**' formatting).
- NO bullet points.
- NO emojis.
- NO AI cliches ('delve', 'tapestry', 'crucial').
- Just write objective, active-voice, professional journalistic prose.`
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

      const briefingContent = auditResponse.choices[0]?.message?.content;
      if (!briefingContent) {
        return { success: false, error: "Failed to compile Briefing text from Groq" };
      }

      let parsedBriefing: any;
      try {
        parsedBriefing = JSON.parse(briefingContent);
      } catch (parseError) {
        console.error("Error parsing Groq briefing JSON:", parseError);
        return { success: false, error: "Failed to parse Groq briefing response JSON" };
      }

      const category = parsedBriefing.category || "World";
      const quickBrief = parsedBriefing.quickBrief || "";
      const deepDive = parsedBriefing.deepDive || "";
      const verification: VerificationScorecardData = parsedBriefing.verification || {
        coreClaim: articleTitle,
        consensusScore: 1,
        confidenceLevel: "Medium",
        conflictReport: "Not assessed by AI",
        reasoning: "Standard fallback evaluation"
      };

      // 6. Query Google Fact Check API for coreClaim
      let professionalAudit = null;
      try {
        const factCheckRes = await fetchFactChecks(verification.coreClaim || articleTitle);
        if (factCheckRes.success && factCheckRes.reviews && factCheckRes.reviews.length > 0) {
          const primary = factCheckRes.reviews[0];
          professionalAudit = {
            publisherName: primary.publisherName,
            textualRating: primary.textualRating,
            reviewUrl: primary.reviewUrl,
          };
        }
      } catch (fcErr) {
        console.error("Error retrieving professional fact checks:", fcErr);
      }

      verification.professionalAudit = professionalAudit;

      const resultPayload = {
        briefing: quickBrief,
        articleText: deepDive,
        wikiContexts,
        category,
        verification
      };

      // Cache the briefing payload in the database Analysis model
      await prisma.analysis.upsert({
        where: { articleId },
        update: {
          briefing: quickBrief,
          articleText: deepDive,
          wikiContexts: JSON.parse(JSON.stringify(wikiContexts)),
          claim: articleTitle,
          category,
          verification: JSON.parse(JSON.stringify(verification))
        },
        create: {
          articleId,
          briefing: quickBrief,
          articleText: deepDive,
          wikiContexts: JSON.parse(JSON.stringify(wikiContexts)),
          claim: articleTitle,
          category,
          verification: JSON.parse(JSON.stringify(verification))
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
