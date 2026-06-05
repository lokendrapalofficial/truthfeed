import { prisma } from "../lib/db";

async function main() {
  const articleId = "cmpz9ial5000xyam4x66xsquc";
  const analysis = await prisma.analysis.findUnique({
    where: { articleId },
  });

  console.log("Database Analysis Entry:");
  console.log("ID:", analysis?.id);
  console.log("Claim:", analysis?.claim);
  console.log("Briefing (TL;DR):", analysis?.briefing);
  console.log("Category:", analysis?.category);
  console.log("Verification Scorecard Data:", JSON.stringify(analysis?.verification, null, 2));
  console.log("Framing Matrix Data:", JSON.stringify(analysis?.framingMatrix, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
