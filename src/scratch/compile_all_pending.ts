import { compileBriefing } from "../app/actions/compileBriefing";
import { prisma } from "../lib/db";

async function main() {
  console.log("Fetching articles with no analysis...");
  const articles = await prisma.article.findMany({
    where: {
      analysis: null,
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  console.log(`Found ${articles.length} articles needing briefing compilation.`);

  for (let i = 0; i < Math.min(articles.length, 10); i++) {
    const article = articles[i];
    console.log(`[${i + 1}/${Math.min(articles.length, 10)}] Compiling briefing for: "${article.title}" (${article.id})...`);
    try {
      const result = await compileBriefing(article.id);
      if (result.success) {
        console.log(`  -> Success! category: ${result.category}`);
        console.log("  -> TL;DR:", result.briefing);
        console.log("  -> Framing Matrix size:", result.framingMatrix?.length || 0);
      } else {
        console.error(`  -> Failed:`, result.error);
      }
    } catch (err) {
      console.error(`  -> Error:`, err);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
