"use server";

import { groq } from "@/lib/groq";

export async function explainSimply(
  articleId: string,
  headline: string,
  briefing?: string | null
): Promise<{ success: boolean; explanation: string }> {
  try {
    const contextText = briefing
      ? `TruthFeed briefing: "${briefing}"\n\nHeadline: "${headline}"`
      : `Headline: "${headline}"`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a friendly teacher at TruthFeed explaining the news to a curious 15-year-old. 
Your job: Explain this news story in EXACTLY 3 short, clear sentences.

Rules:
- No jargon, no technical terms, no acronyms (spell them out).
- Use simple, conversational language a teenager would understand.
- First sentence: What happened?
- Second sentence: Why does it matter?
- Third sentence: What might happen next?
- Output ONLY the 3 sentences. No intro, no labels, no bullet points.`,
        },
        {
          role: "user",
          content: contextText,
        },
      ],
      temperature: 0.4,
      max_tokens: 200,
    });

    const explanation =
      response.choices[0]?.message?.content?.trim() ||
      "TruthFeed Intelligence is processing this story. Check back shortly for a plain-English summary.";

    return { success: true, explanation };
  } catch (error: any) {
    console.error("[explainSimply] Groq call failed:", error);
    return {
      success: false,
      explanation:
        "Could not generate a simplified explanation right now. Please try again.",
    };
  }
}
