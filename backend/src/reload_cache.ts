import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function reload() {
  console.log("Forcing Supabase PostgREST schema cache reload...");
  await prisma.$executeRawUnsafe("NOTIFY pgrst, 'reload schema';");
  console.log("Successfully reloaded Supabase API schema cache!");
}
reload().catch(console.error).finally(() => prisma.$disconnect());
