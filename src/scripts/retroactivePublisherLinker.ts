import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function extractPublisher(title: string, rssSourceName: string): string {
  if (rssSourceName && rssSourceName !== "Google News") {
    return rssSourceName.trim();
  }

  const parts = title.split(" - ");
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1].trim();
    if (
      lastPart.toLowerCase().includes("breaking") ||
      lastPart.toLowerCase().includes("latest") ||
      lastPart.toLowerCase().includes("videos") ||
      lastPart.toLowerCase().includes("home")
    ) {
      if (parts.length > 2) {
        return parts[parts.length - 2].trim();
      }
    }
    return lastPart;
  }

  return "Google News";
}

async function main() {
  console.log("Starting advanced retroactive publisher extraction and source linkage...");
  
  // Fetch all articles
  const articles = await prisma.article.findMany();
  console.log(`Found ${articles.length} total articles in database.`);

  let updatedCount = 0;
  let linkedCount = 0;

  for (const article of articles) {
    const extractedSource = extractPublisher(article.title, article.sourceName);
    
    // Check if we need to update sourceName in the database
    let sourceName = article.sourceName;
    if (extractedSource !== article.sourceName) {
      sourceName = extractedSource;
      updatedCount++;
    }

    // Attempt to link to a seeded Source rating
    const existingSource = await prisma.source.findUnique({
      where: { name: sourceName }
    });

    await prisma.article.update({
      where: { id: article.id },
      data: {
        sourceName,
        sourceId: existingSource ? existingSource.id : null
      }
    });

    if (existingSource) {
      linkedCount++;
      console.log(`Updated & Linked: "${article.title.substring(0, 45)}..." -> Source "${existingSource.name}"`);
    } else {
      console.log(`Updated (Unlinked): "${article.title.substring(0, 45)}..." -> Source Name "${sourceName}"`);
    }
  }

  console.log(`Completed! Cleaned ${updatedCount} publisher names and successfully linked ${linkedCount} articles to seeded sources.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
