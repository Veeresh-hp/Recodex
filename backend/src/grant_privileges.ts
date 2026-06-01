import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function grant() {
  console.log("Granting SELECT and read/write privileges to Supabase API roles (anon, authenticated)...");
  await prisma.$executeRawUnsafe("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;");
  await prisma.$executeRawUnsafe("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;");
  console.log("Successfully granted all table permissions!");
}
grant().catch(console.error).finally(() => prisma.$disconnect());
