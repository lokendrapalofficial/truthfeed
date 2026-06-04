"use server";

import { prisma } from "@/lib/db";
import { groq } from "@/lib/groq";

export async function extractClaim(articleId: string) {
  try {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return { success: false, error: "Article not found in database" };
    }

    // Check caching first
    const cachedAnalysis = await prisma.analysis.findUnique({
      where: { articleId },
    });

    if (cachedAnalysis) {
      return { success: true, claim: cachedAnalysis.claim };
    }

    const apiKey = process.env.GROQ_API_KEY;

    // Graceful offline/demo mock fallback if key is missing
    if (!apiKey || apiKey.trim() === "" || apiKey === "MOCK_KEY") {
      console.warn("Using mock claim extraction because GROQ_API_KEY is not defined.");
      
      // Simulate network request delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const fallbackClaim = article.title.replace(/\s*[-|]\s*[^|]+$/, ""); // Strip publisher suffix if any

      // Save to cache so we don't repeat the delay
      await prisma.analysis.create({
        data: {
          articleId,
          claim: fallbackClaim,
        },
      });

      return { success: true, claim: fallbackClaim };
    }

    // Call Groq API
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-instant",
      messages: [
        {
          role: "system",
          content: "You are a precise fact-checking assistant. Your sole job is to extract the core claim from a news article. Do not summarize, do not provide evidence, do not judge truthfulness. Just output valid JSON with a single key 'claim'."
        },
        {
          role: "user",
          content: `Extract the single, core factual claim from this news headline and description. Output ONLY a JSON object with one key: 'claim'. Do not summarize, do not provide evidence, do not judge truthfulness. Just extract the claim.

Example output: {"claim": "A fatal mass stabbing involving nine victims, including five children, occurred in Suriname."}

Headline: "${article.title}"
Description: "${article.summary || article.content}"`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { success: false, error: "Empty response from Groq API" };
    }

    const parsedJson = JSON.parse(content);
    const claim = parsedJson.claim || article.title;

    // Cache the claim
    await prisma.analysis.create({
      data: {
        articleId,
        claim,
      },
    });

    return { success: true, claim };
  } catch (error: any) {
    console.error("Error in extractClaim server action:", error);
    
    // Extreme resilient fallback on error: use cleaned title without saving to DB
    const fallbackTitle = articleId ? (await prisma.article.findUnique({ where: { id: articleId } }))?.title || "" : "";
    return { success: true, claim: fallbackTitle || "Unknown Claim" };
  }
}
