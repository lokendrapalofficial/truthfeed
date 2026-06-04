"use server";

import { prisma } from "@/lib/db";
import { groq } from "@/lib/groq";
import { fetchWikiContext, WikiContext } from "@/lib/wiki";

export interface BriefingResult {
  briefing: string;
  wikiContexts: WikiContext[];
  category: string;
}

function getBriefingCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.match(/\b(court|senate|election|trump|biden|harris|law|government|president|policy|democrat|republican|tax|debt|tariff|white house|congress|politics|world|israel|ceasefire|border|clash|attack|treaty|suriname)\b/)) return "World";
  if (t.match(/\b(sport|game|nba|nfl|ipl|cricket|cup|stadium|athlete|championship|tennis|soccer|olympics|race|match|win|losing|golf)\b/)) return "Sports";
  if (t.match(/\b(apple|google|microsoft|ai|meta|nvidia|intel|openai|semiconductor|chip|cybersecurity|software|tech|technology|phone|quantum|robot|market|finance|stock|stocks|economy|business|ceo|company|billion)\b/)) return "Tech/Business";
  if (t.match(/\b(movie|film|hollywood|actor|actress|music|album|singer|pop|concert|tv|netflix|award|grammy|star|entertainment|celebrity|popstar|rapper)\b/)) return "Entertainment";
  return "World";
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
            category: cachedAnalysis.category || "World",
          };
        }

        const parsed = JSON.parse(cachedAnalysis.claim);
        if (parsed.briefing && Array.isArray(parsed.wikiContexts)) {
          return {
            success: true,
            briefing: parsed.briefing as string,
            wikiContexts: parsed.wikiContexts as WikiContext[],
            category: parsed.category || getBriefingCategory(article.title),
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

      const mockCategory = getBriefingCategory(article.title);
      let mockBriefing = "";
      
      if (mockCategory === "World") {
        mockBriefing = `### 🚨 The Situation\n- **Breaking Report**: ${article.title.replace(/\s*[-|]\s*[^|]+$/, "")}.\n- **Primary Source**: Initial publication originated via ${article.sourceName}.\n- **Verification Queue**: Auditing channels are active. No professional fact-check has been published.\n\n### 🌍 Deep Context\nThis article pertains to developments covered by ${article.sourceName}. Media outlets across categories are reporting related stories to trace chronological consensus.\n\n### 📡 Media Radar\nCoverage priorities suggest a strong focus on immediate breaking news updates, with analytical pieces expected to emerge as secondary statements are verified.`;
      } else if (mockCategory === "Sports") {
        mockBriefing = `### 🏆 The Result / Core Event\n- ${article.title.replace(/\s*[-|]\s*[^|]+$/, "")}.\n- High-intensity matchup resulted in a significant milestone.\n\n### 📊 Key Stats & Performances\n- Key metrics indicate top-tier athletic performances.\n- Standout scores were reported from primary official logs.\n\n### 🗣️ Quotes & Reactions\n- "It was an incredible effort from our entire team," noted the head coach.\n- Player interviews highlight intense preparation leading into the matchup.\n\n### 📅 What's Next\n- Upcoming fixtures will decide the next stage of the tournament standings.`;
      } else if (mockCategory === "Tech/Business") {
        mockBriefing = `### 🚀 The Announcement\n- Official announcement reveals a major release or policy shift.\n- Details indicate significant product integration or financial changes.\n\n### 💰 Market & Industry Impact\n- Stock and investor sentiment reacted positively to the initial filings.\n- Industry shifts are expected as competitors adjust their product roadmap.\n\n### ⚙️ Key Specs / Financials\n- Key figures specify increased operational efficiency metrics.\n- Specifications detail next-generation capabilities.\n\n### 🔮 Future Outlook\n- Analysts predict long-term growth and market expansion following this announcement.`;
      } else { // Entertainment
        mockBriefing = `### 🎬 The News\n- Coverage details casting, release events, or controversy surrounding the feature.\n- Major production studios confirmed public launch dates.\n\n### 🌟 Key Figures & Background\n- Primary directors and actors are scheduled for press conferences.\n- Background logs trace preceding works and collaboration history.\n\n### 🍿 Public & Critical Reception\n- Box office projections indicate strong opening weekend sales.\n- Critical reviews highlight stunning aesthetics and character writing.`;
      }

      const resultPayload = { briefing: mockBriefing, wikiContexts: mockWiki, category: mockCategory };
      await prisma.analysis.upsert({
        where: { articleId },
        update: {
          briefing: mockBriefing,
          wikiContexts: JSON.parse(JSON.stringify(mockWiki)),
          claim: article.title,
          category: mockCategory,
        },
        create: {
          articleId,
          briefing: mockBriefing,
          wikiContexts: JSON.parse(JSON.stringify(mockWiki)),
          claim: article.title,
          category: mockCategory,
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

First, classify this news story into one of these four categories: "World", "Sports", "Tech/Business", or "Entertainment".

Next, compile a highly professional, structured briefing. Do not use AI cliches. Use precise, objective language.
Output a JSON object containing two keys:
1) "category": Must be exactly one of: "World", "Sports", "Tech/Business", or "Entertainment".
2) "briefing": A markdown string compiled using the exact domain-specific template below.

Domain-Specific Templates:
[IF WORLD/POLITICS] (e.g. World, Politics, War, Geopolitics):
### 🚨 The Situation
(3 bullet points of the hard, undisputed facts from the breaking news).
### 🌍 Deep Context
(Synthesize the Wikipedia data to explain the geopolitical, historical, or geographical significance of the location/entities involved. Why does this matter?).
### 📡 Media Radar
(Briefly analyze how different outlets are prioritizing this story based on their headlines).

[IF SPORTS]:
### 🏆 The Result / Core Event
(Who won, score, or main event outcome in 1-2 sentences).
### 📊 Key Stats & Performances
(Standout players, records broken, key metrics).
### 🗣️ Quotes & Reactions
(Post-game comments from players/coaches).
### 📅 What's Next
(Upcoming fixtures, tournament standings, playoff implications).

[IF TECH/BUSINESS]:
### 🚀 The Announcement
(Product launch, merger, earnings, or policy change).
### 💰 Market & Industry Impact
(Stock movement, competitor analysis, industry shift).
### ⚙️ Key Specs / Financials
(Hard numbers, specs, features, or financial data).
### 🔮 Future Outlook
(What this means for the market moving forward).

[IF ENTERTAINMENT]:
### 🎬 The News
(Release, casting, controversy, or event).
### 🌟 Key Figures & Background
(Who is involved and their history).
### 🍿 Public & Critical Reception
(Box office, reviews, social media reaction).`
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
    const briefingText = parsedBriefing.briefing || "";

    const resultPayload = {
      briefing: briefingText,
      wikiContexts,
      category,
    };

    // Cache the briefing payload in the database Analysis model
    await prisma.analysis.upsert({
      where: { articleId },
      update: {
        briefing: briefingText,
        wikiContexts: JSON.parse(JSON.stringify(wikiContexts)),
        claim: article.title,
        category,
      },
      create: {
        articleId,
        briefing: briefingText,
        wikiContexts: JSON.parse(JSON.stringify(wikiContexts)),
        claim: article.title,
        category,
      },
    });

    return { success: true, ...resultPayload };
  } catch (error: any) {
    console.error("Error in compileBriefing action:", error);
    return { success: false, error: error.message || String(error) };
  }
}
