import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const articles = await prisma.article.findMany({
    select: { sourceName: true }
  });
  const uniqueNames = Array.from(new Set(articles.map(a => a.sourceName)));
  console.log("Unique source names in database:", uniqueNames);
  await prisma.$disconnect();
}
main();
