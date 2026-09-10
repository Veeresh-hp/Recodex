import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting user credentials cleanup...");

  const adminEmail = "veereshhp2004@gmail.com";
  
  // Find admin user in users to get their ID
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  const adminId = adminUser?.id;
  console.log(`Admin User: ${adminEmail} (ID: ${adminId || "not found in users"})`);

  // Delete project assignments
  if (adminId) {
    await prisma.projectDev.deleteMany({
      where: {
        userId: { not: adminId }
      }
    });
    // Delete non-admin users
    await prisma.user.deleteMany({
      where: {
        email: { not: adminEmail }
      }
    });
    console.log(`Cleared non-admin records from users table.`);
  } else {
    await prisma.projectDev.deleteMany({});
    await prisma.user.deleteMany({});
    console.log("Cleared all users and assignments.");
  }

  console.log("Cleanup completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error cleaning up database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
