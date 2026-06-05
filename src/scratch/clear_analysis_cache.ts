import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Analysis cache clear...");
  
  // Clean up existing conflict alerts first due to cascade relations
  const alertsCount = await prisma.conflictAlert.deleteMany();
  console.log(`Deleted ${alertsCount.count} conflict alerts.`);

  const analysisCount = await prisma.analysis.deleteMany();
  console.log(`Deleted ${analysisCount.count} cached analysis entries.`);
  
  console.log("Analysis cache cleared successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
