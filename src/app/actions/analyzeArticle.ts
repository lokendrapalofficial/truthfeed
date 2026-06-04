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
      const locations = ['LONDON', 'NEW YORK', 'GENEVA', 'SINGAPORE', 'DUBAI', 'BRUSSELS'];
      const selectedLocation = locations[Math.floor(Math.random() * locations.length)];

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
        
        const mockQuickBrief = `🚨 ALERT: Conflicting accounts emerge regarding "${articleTitle.replace(/\s*[-|]\s*[^|]+$/, "")}". ${article.sourceName} reports conflicting data, while regional desks dispute the timeline. Consensus: 2/5 desks.`;

        const mockDeepDive = `${selectedLocation} — Desk verification has flagged significant contradictions in coverage regarding "${articleTitle.replace(/\s*[-|]\s*[^|]+$/, "")}". A comparison of reporting outputs reveals diverging timelines and official statements.

While ${article.sourceName} reported immediate police confirmation, alternative sources cite a contradiction. Regional desks cite conflicting narratives.

Editorial Desks urge caution when citing these initial releases. The consensus remains LOW at 2/5 sources due to conflicting details. Comma-separated reports are being audited to resolve these discrepancies.`;

        const mockVerification: VerificationScorecardData = {
          coreClaim: articleTitle,
          consensusScore: 2,
          confidenceLevel: "Low",
          conflictReport: "Conflicting numbers and timelines reported by independent media bureaus.",
          reasoning: `Diverging reports from ${article.sourceName} and local outlets on scene.`,
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
            content: `SYSTEM ROLE: You are Grok, an elite intelligence analyst working at a global news verification desk. Your job is to synthesize cross-referenced news headlines into punchy, urgent intelligence briefings that explicitly highlight conflicts, discrepancies, and verification status.

WRITING STYLE RULES:
- Use URGENT, punchy language. Lead with the verification status or conflict.
- Start Quick Brief with '🚨 ALERT:' if conflicting, or '✅ VERIFIED:' if high consensus.
- Use phrases like: 'Desk verification has flagged...', 'Editorial Desks urge caution...', 'Conflicting accounts emerge...', 'Critical numbers diverge...', 'Consensus remains low/high at X/5 sources...'
- Explicitly call out discrepancies in timelines, numbers, or official statements.
- Use location datelines for Deep Dive (e.g., 'LONDON — ', 'NEW YORK — ').
- Sound like an intelligence cable, NOT a neutral news summary.
- Be dramatic but factual. Highlight what is DISPUTED or UNCONFIRMED.

OUTPUT JSON FORMAT:
{
  'quickBrief': 'Start with 🚨 ALERT or ✅ VERIFIED. 2-3 sentences max. Explicitly state the consensus score (e.g., \"Consensus: 5/5 desks\" or \"Consensus: 2/5 - conflicting reports\"). Highlight the main conflict or confirmation.',
  
  'deepDive': 'Structure exactly like this:
  
  ${selectedLocation} — Desk verification has flagged [specific issue] regarding \"[headline]\". A comparison of reporting outputs reveals [specific discrepancies - timelines, numbers, statements].
  
  While [Source A] reported [claim], [Source B] cites [contradiction]. [Source C] states [alternative narrative].
  
  Editorial Desks urge caution when citing these initial releases. The consensus remains [HIGH/MEDIUM/LOW] at [X]/5 sources due to [specific reason]. Comma-separated reports are being audited to resolve these discrepancies.'
}`
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

      const category = parsedBriefing.category || getBriefingCategory(articleTitle);
      const quickBrief = parsedBriefing.quickBrief || "";
      let deepDive = parsedBriefing.deepDive || "";

      // Post-processing safeguard: replace [LOCATION] with selectedLocation if LLM didn't replace it
      if (deepDive.includes("[LOCATION]")) {
        deepDive = deepDive.replace("[LOCATION]", selectedLocation);
      }

      // Reconstruct verification data from briefing prose
      let consensusScore = 3;
      const scoreMatch = (quickBrief + " " + deepDive).match(/(?:Consensus:\s*|at\s*|rating:\s*)(\d+)\/5/i);
      if (scoreMatch) {
        consensusScore = parseInt(scoreMatch[1], 10);
      } else if (quickBrief.includes("5/5")) {
        consensusScore = 5;
      } else if (quickBrief.includes("4/5")) {
        consensusScore = 4;
      } else if (quickBrief.includes("2/5")) {
        consensusScore = 2;
      } else if (quickBrief.includes("1/5")) {
        consensusScore = 1;
      }

      let confidenceLevel: "High" | "Medium" | "Low" | "Conflicting" = "Medium";
      const combinedLower = (quickBrief + " " + deepDive).toLowerCase();
      if (quickBrief.includes("🚨 ALERT") || combinedLower.includes("conflict") || combinedLower.includes("dispute")) {
        confidenceLevel = "Conflicting";
      } else if (combinedLower.includes("high") || quickBrief.includes("✅ VERIFIED")) {
        confidenceLevel = "High";
      } else if (combinedLower.includes("low")) {
        confidenceLevel = "Low";
      }

      const conflictReport = parsedBriefing.verification?.conflictReport || 
        (confidenceLevel === "Conflicting" ? "Discrepancies and conflicting accounts flagged by the Desk." : "Consensus established across reported sources.");

      const reasoning = parsedBriefing.verification?.reasoning || 
        `Synthesized desk reports yield a ${confidenceLevel.toLowerCase()} consensus score of ${consensusScore}/5.`;

      const verification: VerificationScorecardData = {
        coreClaim: parsedBriefing.verification?.coreClaim || articleTitle,
        consensusScore,
        confidenceLevel,
        conflictReport,
        reasoning,
        professionalAudit: parsedBriefing.verification?.professionalAudit || null
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
