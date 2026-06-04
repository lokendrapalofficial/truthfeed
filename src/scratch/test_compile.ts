import { compileBriefing } from "../app/actions/compileBriefing";
import { prisma } from "../lib/db";

async function test() {
  const articleId = "cmpz1tsgk0000ya5wtny6zbtk";
  console.log(`Running compileBriefing for article: ${articleId}`);
  
  // Clear any existing cached Analysis for a clean run
  await prisma.analysis.deleteMany({ where: { articleId } });
  
  const result = await compileBriefing(articleId);
  console.log("Compile Briefing Result:", JSON.stringify(result, null, 2));
}

test().catch(console.error).finally(() => prisma.$disconnect());
