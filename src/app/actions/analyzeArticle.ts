"use server";

import { prisma } from "@/lib/db";
import { genAI, geminiModel } from "@/lib/gemini";

export interface GeminiAnalysisResult {
  claim: string;
  verdict: string;
  evidence: string;
}

export async function analyzeArticle(articleId: string) {
  try {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return { success: false, error: "Article not found in database" };
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Graceful fallback for mock mode if GEMINI_API_KEY is not defined
    if (!apiKey || apiKey === "MOCK_KEY" || apiKey.trim() === "") {
      console.warn("Using mock Gemini analysis because GEMINI_API_KEY is not defined.");

      await new Promise((resolve) => setTimeout(resolve, 1200));

      const mockResult: GeminiAnalysisResult = {
        claim: article.title,
        verdict: "Unverified",
        evidence: `Published by ${article.sourceName || "the publisher"} on ${new Date(article.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. Gemini AI analysis is currently offline.`,
      };

      return { success: true, analysis: mockResult, isMock: true };
    }

    // Build model client
    const model = genAI.getGenerativeModel({
      model: geminiModel,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `You are a Lead Product Designer, Frontend Architect, and a highly precise, objective fact-checking AI.
Analyze the following news headline and summary.

Your tasks:
1) Extract "claim": The main factual assertion made in the article headline or description.
2) Determine "verdict": Classify the claim strictly as one of the following: "True", "False", "Misleading", or "Unverified".
3) Provide "evidence": Exactly 1 to 2 sentences of objective context explaining what we found regarding this claim. Be neutral, precise, and fact-based.

CRITICAL RULES:
- Do NOT write generic summaries, bias analysis, or perspectives.
- Strictly output valid JSON matching the exact structure below.

Return ONLY valid JSON in this exact structure:
{
  "claim": "string (the main factual assertion)",
  "verdict": "string (True, False, Misleading, or Unverified)",
  "evidence": "string (max 2 sentences of objective context)"
}

---
Headline: "${article.title}"
Summary: "${article.summary || article.content}"`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    if (!responseText) {
      return { success: false, error: "Empty response from Gemini API" };
    }

    const parsedAnalysis: GeminiAnalysisResult = JSON.parse(responseText);
    return { success: true, analysis: parsedAnalysis, isMock: false };

  } catch (error: any) {
    console.error("Error analyzing article with Gemini:", error);

    // Resilient offline fallback
    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
      });

      if (article) {
        console.warn("Resilience Trigger: Switched to offline mock fallback due to Gemini API limits.");

        const mockResult: GeminiAnalysisResult = {
          claim: article.title,
          verdict: "Unverified",
          evidence: `The article is reported by ${article.sourceName || "the specified publisher"}. Gemini AI briefing service is temporarily unavailable.`,
        };

        return { success: true, analysis: mockResult, isMock: true, rateLimitHit: true };
      }
    } catch (fallbackDbError) {
      console.error("Resilience fallback database error:", fallbackDbError);
    }

    return { success: false, error: error.message || String(error) };
  }
}
