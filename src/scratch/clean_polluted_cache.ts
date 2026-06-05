import { prisma } from "../lib/db";

async function main() {
  console.log("Scanning Analysis table for raw RSS pollution...");
  
  const allAnalysis = await prisma.analysis.findMany({
    include: {
      article: true,
    }
  });

  console.log(`Found ${allAnalysis.length} total cached analysis rows.`);
  let pollutedCount = 0;

  for (const analysis of allAnalysis) {
    const briefing = analysis.briefing || "";
    const isPolluted = 
      briefing.includes("Yahoo Finance") || 
      briefing.includes("Reuters") || 
      briefing.includes("Stock market today") ||
      briefing.includes("CNBC") ||
      briefing.includes("Bloomberg"); // standard raw publisher tags

    if (isPolluted) {
      pollutedCount++;
      console.log(`[POLLUTED] Row for article "${analysis.article?.title}" (${analysis.articleId})`);
      console.log(`  -> Briefing content: "${briefing}"`);
      
      // Delete the analysis row to force fresh compilation on next view/sync
      await prisma.analysis.delete({
        where: { id: analysis.id }
      });
      console.log("  -> Successfully deleted from database.");
    }
  }

  console.log(`Scan complete. Cleaned up ${pollutedCount} polluted analysis records.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
