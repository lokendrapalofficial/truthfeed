import { analyzeArticle } from "../app/actions/analyzeArticle";

async function testAnalysis() {
  console.log("Triggering Gemini AI Fact-Check Audit for Article...");
  
  // Use a valid article ID we verified exists in the database
  const articleId = "cmpz9gn6n0005yam44dkgci23";

  try {
    const result = await analyzeArticle(articleId);
    console.log("Gemini Action returned response successfully:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Action execution failed:", error);
  }
}

testAnalysis();
