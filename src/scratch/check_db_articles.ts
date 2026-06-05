import { prisma } from "../lib/db";

async function main() {
  const articles = await prisma.article.findMany({
    orderBy: { publishedAt: "desc" },
    include: { analysis: true }
  });

  console.log(`Checking ${articles.length} articles in the database...`);
  
  for (const article of articles) {
    const titleMatch = article.title.includes("Yahoo Finance") || article.title.includes("Stock market today");
    const summaryMatch = article.summary?.includes("Yahoo Finance") || article.summary?.includes("Stock market today");
    const contentMatch = article.content?.includes("Yahoo Finance") || article.content?.includes("Stock market today");
    const briefingMatch = article.analysis?.briefing?.includes("Yahoo Finance") || article.analysis?.briefing?.includes("Stock market today");

    if (titleMatch || summaryMatch || contentMatch || briefingMatch) {
      console.log(`Article ID: ${article.id}`);
      console.log(`  Title: "${article.title}" [Match: ${titleMatch}]`);
      console.log(`  Summary: "${article.summary?.substring(0, 100)}" [Match: ${summaryMatch}]`);
      console.log(`  Content: "${article.content?.substring(0, 100)}" [Match: ${contentMatch}]`);
      console.log(`  Briefing: "${article.analysis?.briefing?.substring(0, 100)}" [Match: ${briefingMatch}]`);
      console.log("-----------------------------------------------------------------");
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
