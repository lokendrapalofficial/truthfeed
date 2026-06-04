import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sportsArticle = await prisma.article.upsert({
    where: { url: "https://news.google.com/rss/articles/sports-test-article-url" },
    update: {},
    create: {
      title: "LeBron James scores 45 as Lakers defeat Celtics 112-108 in NBA Finals thriller - ESPN",
      url: "https://news.google.com/rss/articles/sports-test-article-url",
      content: "LeBron James delivered a historic 45-point performance to lead the Los Angeles Lakers to a thrilling 112-108 victory over the Boston Celtics in Game 7 of the NBA Finals.",
      summary: "LeBron James delivered a historic 45-point performance to lead the Los Angeles Lakers to a thrilling 112-108 victory over the Boston Celtics in Game 7 of the NBA Finals.",
      sourceName: "ESPN",
      publishedAt: new Date(),
      relatedSources: [
        {
          title: "Lakers capture NBA Championship behind LeBron's heroics",
          sourceName: "Sports Illustrated",
          url: "https://www.si.com/lakers-championship"
        },
        {
          title: "Celtics fall short in Game 7 thriller despite Tatum's 38",
          sourceName: "Boston Globe",
          url: "https://www.bostonglobe.com/celtics-loss"
        }
      ]
    }
  });

  console.log("Successfully seeded Sports article:", sportsArticle.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
