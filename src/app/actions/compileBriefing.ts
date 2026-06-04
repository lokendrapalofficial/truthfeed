"use server";

import { prisma } from "@/lib/db";
import { groq } from "@/lib/groq";
import { fetchWikiContext, WikiContext } from "@/lib/wiki";

export interface BriefingResult {
  briefing: string;
  wikiContexts: WikiContext[];
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
          };
        }

        const parsed = JSON.parse(cachedAnalysis.claim);
        if (parsed.briefing && Array.isArray(parsed.wikiContexts)) {
          return {
            success: true,
            briefing: parsed.briefing as string,
            wikiContexts: parsed.wikiContexts as WikiContext[],
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

      const mockBriefing = `### 🚨 The Situation\n- **Breaking Report**: ${article.title.replace(/\s*[-|]\s*[^|]+$/, "")}.\n- **Primary Source**: Initial publication originated via ${article.sourceName}.\n- **Verification Queue**: Auditing channels are active. No professional fact-check has been published.\n\n### 🌍 Deep Context & Background\nThis article pertains to developments covered by ${article.sourceName}. Media outlets across categories are reporting related stories to trace chronological consensus.\n\n### 📡 Media Radar\nCoverage priorities suggest a strong focus on immediate breaking news updates, with analytical pieces expected to emerge as secondary statements are verified.`;

      const resultPayload = { briefing: mockBriefing, wikiContexts: mockWiki };
      await prisma.analysis.upsert({
        where: { articleId },
        update: {
          briefing: mockBriefing,
          wikiContexts: JSON.parse(JSON.stringify(mockWiki)),
          claim: article.title,
        },
        create: {
          articleId,
          briefing: mockBriefing,
          wikiContexts: JSON.parse(JSON.stringify(mockWiki)),
          claim: article.title,
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
          content: `You are an elite Intelligence Analyst compiling a Strategic Morning Briefing for executives. You have breaking news headlines and deep contextual data from Wikipedia. 
Write a highly professional, structured briefing. Do not use AI cliches. Use precise, objective language.
Output valid Markdown with these exact sections:
### 🚨 The Situation
(3 bullet points of the hard, undisputed facts from the breaking news).
### 🌍 Deep Context & Background
(Synthesize the Wikipedia data to explain the geopolitical, historical, or geographical significance of the location/entities involved. Why does this matter?).
### 📡 Media Radar
(Briefly analyze how different outlets are prioritizing this story based on their headlines).`
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
      temperature: 0.3,
    });

    const briefingText = briefingResponse.choices[0]?.message?.content;
    if (!briefingText) {
      return { success: false, error: "Failed to compile Briefing text from Groq" };
    }

    const resultPayload = {
      briefing: briefingText,
      wikiContexts,
    };

    // Cache the briefing payload in the database Analysis model
    await prisma.analysis.upsert({
      where: { articleId },
      update: {
        briefing: briefingText,
        wikiContexts: JSON.parse(JSON.stringify(wikiContexts)),
        claim: article.title,
      },
      create: {
        articleId,
        briefing: briefingText,
        wikiContexts: JSON.parse(JSON.stringify(wikiContexts)),
        claim: article.title,
      },
    });

    return { success: true, ...resultPayload };
  } catch (error: any) {
    console.error("Error in compileBriefing action:", error);
    return { success: false, error: error.message || String(error) };
  }
}
