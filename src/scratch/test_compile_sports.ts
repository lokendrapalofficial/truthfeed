import { compileBriefing } from "../app/actions/compileBriefing";
import { prisma } from "../lib/db";

async function test() {
  const articleId = "cmpz2q6y20000ya8sb8ltumar";
  console.log(`Running compileBriefing for Sports article: ${articleId}`);
  
  // Clear any existing cached Analysis for a clean run
  await prisma.analysis.deleteMany({ where: { articleId } });
  
  const result = await compileBriefing(articleId);
  console.log("Compile Briefing Result for Sports:", JSON.stringify(result, null, 2));
}

test().catch(console.error).finally(() => prisma.$disconnect());
