import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const surinameArticle = await prisma.article.upsert({
    where: { url: "https://news.google.com/rss/articles/suriname-test-article-url" },
    update: {},
    create: {
      title: "Government of Suriname announces major economic development and sustainability projects - Reuters",
      url: "https://news.google.com/rss/articles/suriname-test-article-url",
      content: "The government of Suriname announced a new economic partnership today to boost local agriculture and technology sectors. Officials stated this will create thousands of jobs.",
      summary: "The government of Suriname announced a new economic partnership today to boost local agriculture and technology sectors.",
      sourceName: "Reuters",
      publishedAt: new Date(),
      relatedSources: [
        {
          title: "Suriname launches ambitious trade expansion initiatives",
          sourceName: "The New York Times",
          url: "https://www.nytimes.com/example-suriname-article"
        },
        {
          title: "Suriname partners with international tech firms",
          sourceName: "BBC News",
          url: "https://www.bbc.com/news/example-suriname-article"
        }
      ]
    }
  });

  console.log("Successfully seeded Suriname article:", surinameArticle.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
