import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkDb() {
  try {
    const count = await prisma.article.count();
    console.log(`Total articles in DB: ${count}`);

    const articles = await prisma.article.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        sourceName: true,
        publishedAt: true,
      },
    });

    console.log("Top 5 articles:");
    console.log(articles);
  } catch (error) {
    console.error("DB check failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();
