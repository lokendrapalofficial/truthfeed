"use server";

import { prisma } from "@/lib/db";
import { genAI, geminiModel } from "@/lib/gemini";

export interface GeminiAnalysisResult {
  brief: string;
  claims: string[];
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
        brief: `${article.sourceName} reports on "${article.title.substring(0, 60)}...". The story covers developments of significance to readers following this topic.`,
        claims: [
          `The article originates from ${article.sourceName || "the specified publisher"}.`,
          `Published on ${new Date(article.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`,
          `Headline summary: "${article.title.substring(0, 55)}..."`,
        ],
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

    const prompt = `You are a concise, objective fact-checking assistant. Analyze the following news headline and summary.

Your task:
1) Write a BRIEF: a maximum of TWO sentences that neutrally summarize what happened. No editorializing, no bias.
2) Extract KEY CLAIMS: up to THREE specific, verifiable factual claims made in the article. Each claim should be a single, short sentence.

Return ONLY valid JSON in this exact structure:
{
  "brief": "Two sentence maximum neutral summary.",
  "claims": ["Specific verifiable claim 1.", "Specific verifiable claim 2.", "Specific verifiable claim 3."]
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
          brief: `${article.sourceName} has published a report on "${article.title.substring(0, 60)}...". The Gemini AI briefing service is temporarily unavailable — please check back shortly.`,
          claims: [
            `The article originates from ${article.sourceName || "the specified publisher"}.`,
            `Published on ${new Date(article.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`,
            `Headline: "${article.title.substring(0, 55)}..."`,
          ],
        };

        return { success: true, analysis: mockResult, isMock: true, rateLimitHit: true };
      }
    } catch (fallbackDbError) {
      console.error("Resilience fallback database error:", fallbackDbError);
    }

    return { success: false, error: error.message || String(error) };
  }
}
