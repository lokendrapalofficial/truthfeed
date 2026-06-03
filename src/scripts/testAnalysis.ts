import { analyzeArticle } from "../app/actions/analyzeArticle";

async function testAnalysis() {
  console.log("Triggering Gemini AI Fact-Check Audit for Article...");
  
  // Use the CNBC article ID we verified exists in SQLite
  const articleId = "cmpwo0r8k000hyagckncx4uaa";

  try {
    const result = await analyzeArticle(articleId);
    console.log("Gemini Action returned response successfully:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Action execution failed:", error);
  }
}

testAnalysis();
