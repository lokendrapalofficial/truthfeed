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
  confidenceLevel: "High" | "Medium" | "Low" | "Conflicting" | "Single-Source Verified";
  conflictReport: string;
  reasoning: string;
  professionalAudit?: {
    publisherName: string;
    textualRating: string;
    reviewUrl: string;
  } | null;
  perspectives?: {
    sourceName: string;
    highlight: string;
  }[];
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
      const parsedRelated: any[] = articleRelated
        ? (typeof articleRelated === "string" ? JSON.parse(articleRelated) : JSON.parse(JSON.stringify(articleRelated)))
        : [];

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
        
        const mockQuickBrief = `🚨 ALERT: Out of 5 major outlets tracking "${articleTitle.replace(/\s*[-|]\s*[^|]+$/, "")}", coverage diverges on the timeline and key details remain unverified.`;
 
        const mockDeepDive = `${selectedLocation} — Reports on the ground diverge regarding the key details of "${articleTitle.replace(/\s*[-|]\s*[^|]+$/, "")}". A comparison of coverage reveals conflicting accounts.
 
While ${article.sourceName} reported immediate official confirmation, alternative sources cite conflicting narratives.
 
Verification tracking remains active as independent outlets confirm the details. The consensus is split with 2 out of 5 major outlets agreeing on the baseline facts.`;

        const mockPerspectives = (parsedRelated as any[]).map((src: any) => ({
          sourceName: src.sourceName,
          highlight: `Focuses on ${src.title.toLowerCase().includes("strike") ? "casualty report details" : "regional and geopolitical impact"}`
        }));

        const mockVerification: VerificationScorecardData = {
          coreClaim: articleTitle,
          consensusScore: 2,
          confidenceLevel: "Low",
          conflictReport: "Out of 5 major outlets tracking the event, 2 agree on the facts, while key details remain unverified.",
          reasoning: `Diverging reports from ${article.sourceName} and alternative sources.`,
          professionalAudit: null,
          perspectives: mockPerspectives
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

      const uniqueRelated = parsedRelated.filter(
        (item: any) =>
          item.sourceName?.toLowerCase().trim() !== article.sourceName?.toLowerCase().trim()
      );

      // 5. Compile the Morning Briefing using Groq
      const auditResponse = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `SYSTEM ROLE: You are an elite senior news editor. Your job is to synthesize cross-referenced news headlines into sharp, objective, clear, and human-centric intelligence briefings.
 
 WRITING STYLE RULES:
 - Write like a professional global news bureau (AP, Reuters, Bloomberg). Be sharp, clear, objective, and concise.
 - Stop referring to the platform ("TruthFeed", "TruthFeed Intelligence", or "The Desk") in the body of the text. Let the layout do the branding; let the text do the reporting.
 - Humanize the copy. Avoid rigid, algorithmic-sounding sentences:
   * Instead of: "TruthFeed Intelligence has flagged discrepancies regarding the recent Pakistani airstrikes..."
     Use: "Reports on the ground diverge regarding the civilian toll of the recent Pakistani airstrikes..."
   * Instead of: "Synthesized desk reports yield a conflicting consensus score of 4/5."
     Use: "Out of 5 major outlets tracking the event, 4 agree on the baseline facts, though key details remain unverified."
   * Instead of: "We at TruthFeed are actively auditing these reports to resolve the discrepancies..."
     Use: "Verification tracking is active as outlets independent of local authorities confirm the casualty breakdown."
 - Start Quick Brief with '🚨 ALERT:' if conflicting, or '✅ VERIFIED:' if high consensus. Keep it to 2-3 sentences max. Naturally weave in the consensus (e.g., "Out of 5 major outlets tracking the event, 4 agree on the baseline facts, though key details remain unverified.").
 - For the Deep Dive, structure it as a clean, multi-paragraph news report starting with a location dateline in uppercase (e.g., 'LONDON — ', 'NEW YORK — '). Explain the facts clearly and highlight key discrepancies between source coverage without using robotic meta-commentary.
  
 OUTPUT JSON FORMAT:
 {
   "quickBrief": "Start with 🚨 ALERT or ✅ VERIFIED. 2-3 sentences max. Explain the main conflict or confirmation. Include a humanized consensus sentence.",
   "deepDive": "Structure exactly like this: [LOCATION] — [Clear summary of the event]...",
   "category": "World" | "Sports" | "Tech/Business" | "Entertainment",
   "verification": {
     "coreClaim": "[The central claim being verified]",
     "consensusScore": [1-5 integer of how many of the 5 outlets agree on the core claim],
     "confidenceLevel": "High" | "Medium" | "Low" | "Conflicting" | "Single-Source Verified",
     "conflictReport": "[A 1-sentence summary of any discrepancies, or 'None' if consensus is high]",
     "reasoning": "[A 1-sentence editorial justification for the verdict/consensus score]"
   },
   "perspectives": [
     {
       "sourceName": "[Exact name of the related publisher, e.g. AP News, CNN]",
       "highlight": "[A 1-line bullet point/tag showing how this source's reporting differs or what specific detail/angle they report, e.g., 'Reports 11 children killed' or 'Casualty breakdown unverified']"
     }
   ]
 }`
          },
          {
            role: "user",
            content: uniqueRelated.length === 0
              ? `Breaking Headline: "${articleTitle}"
This story currently has only ONE source (${article.sourceName}) and NO alternative coverage.
Please write a briefing anchored entirely by this single source.

In your JSON response:
- For "quickBrief", output exactly: "Single-Source Curation: This report is anchored entirely by ${article.sourceName}. No conflicting reports have been flagged across our network."
- For "deepDive", write a professional news wire report from the perspective of a single verified source. Do not mention multiple newsrooms or coverage consensus.
- For "category", classify it.
- For "verification", set:
  * "consensusScore": 5
  * "confidenceLevel": "Single-Source Verified"
  * "conflictReport": "None"
  * "reasoning": "Single-source curation from a verified primary publisher."
- For "perspectives", return an empty array [] since there are no alternative outlets reporting this.`
              : `Breaking Headline: "${articleTitle}"
Related coverage headlines:
${uniqueRelated.map(s => `- ${s.title} (${s.sourceName})`).join("\n")}

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
      let quickBrief = parsedBriefing.quickBrief || "";
      let deepDive = parsedBriefing.deepDive || "";
 
      // Post-processing safeguard: replace [LOCATION] with selectedLocation if LLM didn't replace it
      if (deepDive.includes("[LOCATION]")) {
        deepDive = deepDive.replace("[LOCATION]", selectedLocation);
      }
 
      // Read verification values from LLM structured output, falling back to heuristics if missing
      let consensusScore = 3;
      let confidenceLevel: "High" | "Medium" | "Low" | "Conflicting" | "Single-Source Verified" = "Medium";

      if (uniqueRelated.length === 0) {
        consensusScore = 5;
        confidenceLevel = "Single-Source Verified";
      } else {
        if (parsedBriefing.verification?.consensusScore !== undefined) {
          consensusScore = Number(parsedBriefing.verification.consensusScore);
        } else {
          const scoreMatch = (quickBrief + " " + deepDive).match(/(?:Consensus:\s*|at\s*|out of \d+ major outlets tracking the event,?\s*)(\d+)(?:\s*agree|\/5)/i);
          if (scoreMatch) {
            consensusScore = parseInt(scoreMatch[1], 10);
          } else if (quickBrief.includes("5/5") || quickBrief.includes("5 agree")) {
            consensusScore = 5;
          } else if (quickBrief.includes("4/5") || quickBrief.includes("4 agree")) {
            consensusScore = 4;
          } else if (quickBrief.includes("2/5") || quickBrief.includes("2 agree")) {
            consensusScore = 2;
          } else if (quickBrief.includes("1/5") || quickBrief.includes("1 agree")) {
            consensusScore = 1;
          }
        }

        if (parsedBriefing.verification?.confidenceLevel) {
          const cl = parsedBriefing.verification.confidenceLevel;
          if (["High", "Medium", "Low", "Conflicting", "Single-Source Verified"].includes(cl)) {
            confidenceLevel = cl as any;
          }
        } else {
          const combinedLower = (quickBrief + " " + deepDive).toLowerCase();
          if (quickBrief.includes("🚨 ALERT") || combinedLower.includes("conflict") || combinedLower.includes("dispute")) {
            confidenceLevel = "Conflicting";
          } else if (combinedLower.includes("high") || quickBrief.includes("✅ VERIFIED")) {
            confidenceLevel = "High";
          } else if (combinedLower.includes("low")) {
            confidenceLevel = "Low";
          }
        }
      }

      // Dynamic Wording Template Adjustments for the Text Summary (quickBrief)
      if (uniqueRelated.length === 0) {
        quickBrief = `Single-Source Curation: This report is anchored entirely by ${article.sourceName}. No conflicting reports have been flagged across our network.`;
      } else if (uniqueRelated.length + 1 >= 4 && confidenceLevel === "High") {
        quickBrief = `High Consensus: ${uniqueRelated.length + 1} major independent newsrooms have cross-verified the baseline facts of this breaking event.`;
      } else if (confidenceLevel === "Conflicting" || consensusScore < 3.5) {
        quickBrief = `Divergent Coverage: Core details remain unverified as regional outlets conflict on the final breakdown.`;
      }

      const conflictReport = uniqueRelated.length === 0
        ? "None"
        : (parsedBriefing.verification?.conflictReport || 
           (confidenceLevel === "Conflicting" ? "Discrepancies and conflicting accounts flagged in coverage." : "Consensus established across reported sources."));

      const reasoning = uniqueRelated.length === 0
        ? "Single-source curation from a verified primary publisher."
        : (parsedBriefing.verification?.reasoning || 
           `Out of 5 major outlets tracking the event, ${consensusScore} agree on the baseline facts, though key details remain unverified.`);
 
      const verification: VerificationScorecardData = {
        coreClaim: parsedBriefing.verification?.coreClaim || articleTitle,
        consensusScore,
        confidenceLevel,
        conflictReport,
        reasoning,
        professionalAudit: parsedBriefing.verification?.professionalAudit || null,
        perspectives: parsedBriefing.perspectives || []
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
