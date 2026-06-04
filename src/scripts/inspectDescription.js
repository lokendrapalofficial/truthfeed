const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({
    take: 5,
    orderBy: { createdAt: "desc" }
  });
  for (const a of articles) {
    console.log("ID:", a.id);
    console.log("Title:", a.title);
    console.log("Summary:", a.summary ? a.summary.substring(0, 150) : "null");
    console.log("Content:", a.content ? a.content.substring(0, 300) : "null");
    console.log("-----------------------------------------");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
