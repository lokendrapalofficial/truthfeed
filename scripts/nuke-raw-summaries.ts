import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MARKERS = ["Yahoo Finance", "Reuters", "Stock market today", "CNBC"];

async function main() {
  console.log("Starting Database Nuke of raw RSS markers...");

  // 1. Clean Article table (summary, content)
  const articles = await prisma.article.findMany();
  let articleCleanedCount = 0;

  for (const article of articles) {
    let summary = article.summary || "";
    let content = article.content || "";

    const summaryHasMarker = MARKERS.some(marker => summary.includes(marker));
    const contentHasMarker = MARKERS.some(marker => content.includes(marker));

    if (summaryHasMarker || contentHasMarker) {
      articleCleanedCount++;
      const updatedSummary = summaryHasMarker ? null : article.summary;
      const updatedContent = contentHasMarker ? "" : article.content;

      console.log(`[NUKE] Cleaning Article ID: ${article.id}`);
      console.log(`  Title: "${article.title}"`);
      if (summaryHasMarker) console.log(`  -> Summary contained raw marker, nullifying.`);
      if (contentHasMarker) console.log(`  -> Content contained raw marker, clearing.`);

      await prisma.article.update({
        where: { id: article.id },
        data: {
          summary: updatedSummary,
          content: updatedContent,
        }
      });
    }
  }

  // 2. Clean Analysis table (briefing/tl_dr)
  const analyses = await prisma.analysis.findMany({
    include: { article: true }
  });
  let analysisCleanedCount = 0;

  for (const analysis of analyses) {
    const briefing = analysis.briefing || "";
    const briefingHasMarker = MARKERS.some(marker => briefing.includes(marker));

    if (briefingHasMarker) {
      analysisCleanedCount++;
      console.log(`[NUKE] Cleaning Analysis ID: ${analysis.id} for article "${analysis.article?.title}"`);
      console.log(`  -> Briefing (tl_dr) contained raw marker, nullifying.`);

      await prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          briefing: null,
        }
      });
    }
  }

  console.log("Database Nuke complete!");
  console.log(`Cleaned ${articleCleanedCount} articles and ${analysisCleanedCount} analyses.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
