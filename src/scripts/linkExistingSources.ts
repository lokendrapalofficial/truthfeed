import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting retroactive source linkage for existing articles...");
  
  // Fetch all articles
  const articles = await prisma.article.findMany({
    where: { sourceId: null }
  });

  console.log(`Found ${articles.length} articles currently unlinked.`);

  let linkCount = 0;

  for (const article of articles) {
    const sourceName = article.sourceName;
    const existingSource = await prisma.source.findUnique({
      where: { name: sourceName }
    });

    if (existingSource) {
      await prisma.article.update({
        where: { id: article.id },
        data: { sourceId: existingSource.id }
      });
      linkCount++;
      console.log(`Linked article "${article.title.substring(0, 30)}..." to source "${existingSource.name}"`);
    }
  }

  console.log(`Successfully linked ${linkCount} existing articles!`);
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
