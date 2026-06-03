import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const articles = await prisma.article.findMany({
    take: 5,
    select: { title: true, sourceName: true }
  });
  console.log(articles);
  await prisma.$disconnect();
}
main();
