import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({
    where: {
      OR: [
        { title: { contains: "Suriname", mode: "insensitive" } },
        { content: { contains: "Suriname", mode: "insensitive" } }
      ]
    }
  });

  console.log("Matching articles:", articles.length);
  for (const art of articles) {
    console.log(`ID: ${art.id}`);
    console.log(`Title: ${art.title}`);
    console.log(`SourceName: ${art.sourceName}`);
    console.log(`url: ${art.url}`);
    console.log(`relatedSources:`, art.relatedSources);
    console.log("---");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
