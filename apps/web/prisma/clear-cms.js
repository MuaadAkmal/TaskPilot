const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function clearCmsRecords() {
  try {
    console.log("Connecting to database...");
    
    // Count CMS records before deletion
    const beforeCount = await prisma.taskResolution.count({
      where: {
        project: { in: ["CMS", "CMS_VAL_FS"] },
      },
    });

    console.log(`Found ${beforeCount} CMS records in the database.`);

    if (beforeCount === 0) {
      console.log("No CMS records to clear.");
      return;
    }

    const deleteResult = await prisma.taskResolution.deleteMany({
      where: {
        project: { in: ["CMS", "CMS_VAL_FS"] },
      },
    });

    console.log(`Successfully deleted ${deleteResult.count} CMS records from the database.`);
  } catch (error) {
    console.error("Error clearing CMS records:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearCmsRecords();
