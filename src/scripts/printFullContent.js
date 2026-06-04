const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const article = await prisma.article.findFirst({
    where: {
      content: {
        contains: "<ol>"
      }
    }
  });
  if (article) {
    console.log("TITLE:", article.title);
    console.log("CONTENT:\n", article.content);
  } else {
    console.log("No article with <ol> found.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
