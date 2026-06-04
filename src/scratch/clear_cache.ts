import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing Analysis table...");
  const deleteCount = await prisma.analysis.deleteMany();
  console.log(`Successfully deleted ${deleteCount.count} cached analysis records.`);
}

main()
  .catch((e) => {
    console.error("Error clearing analysis cache:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
