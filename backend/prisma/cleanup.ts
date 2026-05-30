import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting user credentials cleanup...");

  const adminEmail = "veereshhp2004@gmail.com";
  
  // Find admin user in public.users to get their ID
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  const adminId = adminUser?.id;
  console.log(`Admin User: ${adminEmail} (ID: ${adminId || "not found in public.users"})`);

  // Delete project_devs first (foreign key constraints)
  if (adminId) {
    await prisma.$executeRawUnsafe(
      `DELETE FROM public.project_devs WHERE user_id != $1`,
      adminId
    );
  } else {
    await prisma.$executeRawUnsafe(
      `DELETE FROM public.project_devs`
    );
  }
  console.log("Cleared non-admin project assignments.");

  // Delete from public.users
  const userDeleteCount = await prisma.$executeRawUnsafe(
    `DELETE FROM public.users WHERE email != $1`,
    adminEmail
  );
  console.log(`Cleared ${userDeleteCount} non-admin records from public.users table.`);

  // Delete from auth.users (Supabase Auth table)
  try {
    const authDeleteCount = await prisma.$executeRawUnsafe(
      `DELETE FROM auth.users WHERE email != $1`,
      adminEmail
    );
    console.log(`Cleared ${authDeleteCount} non-admin records from auth.users table.`);
  } catch (err) {
    console.error("Could not delete from auth.users via parameterized query:", err);
    console.log("Attempting deleting by ID matches...");
    try {
      await prisma.$executeRawUnsafe(
        `DELETE FROM auth.users WHERE email != 'veereshhp2004@gmail.com'`
      );
      console.log("Successfully cleared non-admin users from auth.users via literal query.");
    } catch (err2) {
      console.error("Secondary auth deletion failed:", err2);
    }
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
