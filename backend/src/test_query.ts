import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function test() {
  const users = await prisma.user.findMany();
  const projects = await prisma.project.findMany();
  console.log("Database query test:");
  console.log("Users count in public.users:", users.length);
  console.log("Projects count in public.projects:", projects.length);
  console.log("Users:", users);
  console.log("Projects:", projects.map(p => p.title));
}
test().catch(console.error).finally(() => prisma.$disconnect());
