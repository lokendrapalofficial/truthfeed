"use server";

import { prisma } from "@/lib/db";
import { genAI, geminiModel } from "@/lib/gemini";

export interface PerspectiveDetail {
  headline: string;
  framing: string;
  keyPoints: string[];
  outletExample: string;
}

export interface PerspectivesResult {
  leftCoverage: PerspectiveDetail;
  centerCoverage: PerspectiveDetail;
  rightCoverage: PerspectiveDetail;
}

export async function getPerspectives(articleId: string) {
  try {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return { success: false, error: "Article not found" };
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Resilient fallback logic for offline mock mode
    if (!apiKey || apiKey === "MOCK_KEY" || apiKey.trim() === "") {
      console.warn("Using mock coverage perspectives (GEMINI_API_KEY undefined).");
      await new Promise((resolve) => setTimeout(resolve, 800));
      return { success: true, perspectives: getMockPerspectives(article), isMock: true };
    }

    const model = genAI.getGenerativeModel({
      model: geminiModel,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `You are a professional media bias analyst. Analyze the following news story and describe how it is typically covered from Left-leaning, Center/Neutral, and Right-leaning media perspectives.

Headline: "${article.title}"
Content: "${article.summary || article.content}"

Format the response strictly as a JSON object containing three keys: "leftCoverage", "centerCoverage", and "rightCoverage".
Each key must be an object with the following fields:
1. "headline" (string) - A representative headline from this political bias.
2. "framing" (string) - An explanation of the bias framing, narrative emphasis, and angles prioritized.
3. "keyPoints" (array of exactly 2 strings) - The primary assertions or claims pushed.
4. "outletExample" (string) - Example outlet (e.g. "MSNBC, CNN", "Reuters, AP", "Fox News, New York Post").

Example structure:
{
  "leftCoverage": {
    "headline": "Left headline...",
    "framing": "Left narrative framing...",
    "keyPoints": ["point 1", "point 2"],
    "outletExample": "MSNBC, CNN"
  },
  "centerCoverage": { ... },
  "rightCoverage": { ... }
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    if (!responseText) {
      return { success: false, error: "Empty response from Gemini API" };
    }

    const parsed: PerspectivesResult = JSON.parse(responseText);
    return { success: true, perspectives: parsed, isMock: false };

  } catch (error: any) {
    console.error("Error generating perspectives with Gemini:", error);
    
    // Offline resilience fallback
    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
      });
      if (article) {
        return {
          success: true,
          perspectives: getMockPerspectives(article),
          isMock: true,
          error: "API rate limit or connection issue. Showing local mock fallback."
        };
      }
    } catch (_) {}

    return { success: false, error: error.message || String(error) };
  }
}

function getMockPerspectives(article: any): PerspectivesResult {
  const title = article.title;
  return {
    leftCoverage: {
      headline: `Progressive View: Left-leaning outlets emphasize structural and policy impacts of ${title.split(" - ")[0]}`,
      framing: "Focuses heavily on societal consequences, government accountability, and progressive reform solutions. Left-leaning coverage typically details systemic vulnerabilities and calls for increased oversight, highlighting the perspectives of advocacy groups and public officials advocating for public interest legislation.",
      keyPoints: [
        "Demands systemic reforms and emphasizes regulatory accountability in light of these events.",
        "Highlights the human or ecological impact, arguing that current market protections are insufficient."
      ],
      outletExample: "MSNBC, CNN, The Guardian"
    },
    centerCoverage: {
      headline: `Neutral Record: Multi-angle factual reports on ${title.split(" - ")[0]}`,
      framing: "Focuses strictly on verifiable occurrences, quoting key stakeholder press releases, legal documentation, and academic expert boards. Employs neutral, descriptive phrasing avoiding emotional adjectives, speculative commentary, or narrative bias.",
      keyPoints: [
        "Presents timelines, legislative actions, and confirmed witness/expert statements.",
        "Refrains from attributing ideological blame, focusing on economic data and official agency updates."
      ],
      outletExample: "Reuters, Associated Press, BBC News"
    },
    rightCoverage: {
      headline: "Conservative Coverage Analysis Pending",
      framing: "AI is currently analyzing conservative media coverage for this specific event. Check back shortly for curated perspective links.",
      keyPoints: [
        "Perspective indexing in progress",
        "Narrative framing analysis pending"
      ],
      outletExample: "Fox News, New York Post, Wall Street Journal Editorial"
    }
  };
}
