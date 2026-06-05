"use server";

import { prisma } from "@/lib/db";
import { groq } from "@/lib/groq";
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
      const articleRelated = relatedSources || article.relatedSources;

      const parsedRelated: any[] = articleRelated
        ? (typeof articleRelated === "string" ? JSON.parse(articleRelated) : JSON.parse(JSON.stringify(articleRelated)))
        : [];

      // 2. Check Caching first
      const cachedAnalysis = await prisma.analysis.findUnique({
        where: { articleId },
      });

      if (cachedAnalysis) {
        try {
          if (cachedAnalysis.verification && cachedAnalysis.framingMatrix) {
            const parsedVerification = typeof cachedAnalysis.verification === "string"
              ? JSON.parse(cachedAnalysis.verification)
              : cachedAnalysis.verification;

            const parsedFramingMatrix = typeof cachedAnalysis.framingMatrix === "string"
              ? JSON.parse(cachedAnalysis.framingMatrix)
              : cachedAnalysis.framingMatrix;

            return {
              success: true,
              briefing: cachedAnalysis.briefing || "",
              category: cachedAnalysis.category || "World",
              verification: parsedVerification as VerificationScorecardData,
              framingMatrix: parsedFramingMatrix,
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

        const mockCategory = getBriefingCategory(articleTitle);
        const mockTlDr = `Factual reports corroborate the events surrounding "${articleTitle.replace(/\s*[-|]\s*[^|]+$/, "")}". Verification audits are tracking publisher coverage angles.`;
        
        const mockFramingMatrix = [
          { outlet: article.sourceName, angle: "Direct reporting and event details" }
        ];
        parsedRelated.slice(0, 3).forEach((rel: any) => {
          mockFramingMatrix.push({
            outlet: rel.sourceName || rel.source || "Alternative Outlet",
            angle: "Corroborative event coverage"
          });
        });

        let consensusScore = Math.min(5, parsedRelated.length + 1);
        let confidenceLevel: "High" | "Medium" | "Low" | "Conflicting" = 
          consensusScore >= 4 ? "High" : (consensusScore >= 2 ? "Medium" : "Low");

        const mockVerification: VerificationScorecardData = {
          coreClaim: articleTitle,
          consensusScore,
          confidenceLevel,
          conflictReport: "No significant narrative conflict detected across coverage.",
          reasoning: `Seeded mock desk audit matches ${parsedRelated.length + 1} corroborated outlets.`,
          professionalAudit: null
        };

        const resultPayload = {
          briefing: mockTlDr,
          category: mockCategory,
          verification: mockVerification,
          framingMatrix: mockFramingMatrix,
        };

        const savedAnalysis = await prisma.analysis.upsert({
          where: { articleId },
          update: {
            briefing: mockTlDr,
            category: mockCategory,
            verification: JSON.parse(JSON.stringify(mockVerification)),
            framingMatrix: JSON.parse(JSON.stringify(mockFramingMatrix)),
            claim: articleTitle,
          },
          create: {
            articleId,
            briefing: mockTlDr,
            category: mockCategory,
            verification: JSON.parse(JSON.stringify(mockVerification)),
            framingMatrix: JSON.parse(JSON.stringify(mockFramingMatrix)),
            claim: articleTitle,
          },
        });

        if (mockVerification.confidenceLevel === "Conflicting" || mockVerification.confidenceLevel === "Low") {
          await prisma.conflictAlert.upsert({
            where: { analysisId: savedAnalysis.id },
            update: {
              claim: mockVerification.coreClaim || articleTitle,
              category: mockCategory,
            },
            create: {
              analysisId: savedAnalysis.id,
              claim: mockVerification.coreClaim || articleTitle,
              category: mockCategory,
            },
          });
        }

        return { success: true, ...resultPayload };
      }

      // 3. Groq Extraction Call
      const auditResponse = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are an elite Media Intelligence Analyst. Your task is to analyze how different news outlets are framing the exact same event based on their headlines. 
Output a strict JSON object with two keys:
1. 'tl_dr': A 2-sentence, plain-English, purely factual summary of the event. No fluff.
2. 'framingMatrix': An array of objects for each corroborating source. Each object must have: 
   - 'outlet': The name of the publisher (e.g., 'CNBC').
   - 'angle': A short, 3-5 word description of what this specific outlet is focusing on (e.g., 'Macro market impact', 'Specific stock movers', 'Geopolitical tensions').

Example Output:
{
  'tl_dr': 'S&P 500 futures fell following a 9-day win streak as hopes for a quick US-Iran deal faded.',
  'framingMatrix': [
    {'outlet': 'CNBC', 'angle': 'Macro market impact & Middle East tensions'},
    {'outlet': 'Yahoo Finance', 'angle': 'Fading US-Iran deal hopes'},
    {'outlet': 'Investor\'s Business Daily', 'angle': 'Specific stock movers (Palo Alto, Marvell)'}
  ]
}`
          },
          {
            role: "user",
            content: `Breaking Headline: "${articleTitle}"
Related coverage headlines:
${parsedRelated.length > 0 ? parsedRelated.map(s => `- ${s.title} (${s.sourceName || s.source || 'Unknown Publisher'})`).join("\n") : "- No alternative coverage reported yet."}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const briefingContent = auditResponse.choices[0]?.message?.content;
      if (!briefingContent) {
        return { success: false, error: "Failed to compile Analysis from Groq" };
      }

      let parsedBriefing: any;
      try {
        parsedBriefing = JSON.parse(briefingContent);
      } catch (parseError) {
        console.error("Error parsing Groq analysis JSON:", parseError);
        return { success: false, error: "Failed to parse Groq analysis response JSON" };
      }

      const category = getBriefingCategory(articleTitle);
      const tl_dr = parsedBriefing.tl_dr || "";
      const framingMatrix = parsedBriefing.framingMatrix || [];

      // Calculate consensus score & confidence level programmatically
      let consensusScore = Math.min(5, parsedRelated.length + 1);
      let confidenceLevel: "High" | "Medium" | "Low" | "Conflicting" = "Medium";
      if (consensusScore >= 4) {
        confidenceLevel = "High";
      } else if (consensusScore <= 2) {
        confidenceLevel = "Low";
      }

      // Query Google Fact Check API for coreClaim
      let professionalAudit = null;
      try {
        const factCheckRes = await fetchFactChecks(articleTitle);
        if (factCheckRes.success && factCheckRes.reviews && factCheckRes.reviews.length > 0) {
          const primary = factCheckRes.reviews[0];
          professionalAudit = {
            publisherName: primary.publisherName,
            textualRating: primary.textualRating,
            reviewUrl: primary.reviewUrl,
          };
          
          const ratingLower = (primary.textualRating || "").toLowerCase();
          if (ratingLower.includes("false") || ratingLower.includes("misleading") || ratingLower.includes("mixed")) {
            confidenceLevel = "Conflicting";
            consensusScore = Math.min(consensusScore, 2);
          } else if (ratingLower.includes("true") || ratingLower.includes("correct")) {
            confidenceLevel = "High";
            consensusScore = Math.max(consensusScore, 4);
          }
        }
      } catch (fcErr) {
        console.error("Error retrieving professional fact checks:", fcErr);
      }

      const conflictReport = confidenceLevel === "Conflicting"
        ? "Narrative discrepancies and check rating flagged by external audit."
        : "No significant narrative conflict detected across coverage.";

      const reasoning = `Based on a cross-reference of ${parsedRelated.length + 1} outlets reporting on this event.`;

      const verification: VerificationScorecardData = {
        coreClaim: articleTitle,
        consensusScore,
        confidenceLevel,
        conflictReport,
        reasoning,
        professionalAudit
      };

      const resultPayload = {
        briefing: tl_dr,
        category,
        verification,
        framingMatrix,
      };

      // Cache the briefing payload in the database Analysis model
      const savedAnalysis = await prisma.analysis.upsert({
        where: { articleId },
        update: {
          briefing: tl_dr,
          category,
          verification: JSON.parse(JSON.stringify(verification)),
          framingMatrix: JSON.parse(JSON.stringify(framingMatrix)),
          claim: articleTitle,
        },
        create: {
          articleId,
          briefing: tl_dr,
          category,
          verification: JSON.parse(JSON.stringify(verification)),
          framingMatrix: JSON.parse(JSON.stringify(framingMatrix)),
          claim: articleTitle,
        },
      });

      if (verification.confidenceLevel === "Conflicting" || verification.confidenceLevel === "Low") {
        await prisma.conflictAlert.upsert({
          where: { analysisId: savedAnalysis.id },
          update: {
            claim: verification.coreClaim || articleTitle,
            category,
          },
          create: {
            analysisId: savedAnalysis.id,
            claim: verification.coreClaim || articleTitle,
            category,
          },
        });
      }

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
