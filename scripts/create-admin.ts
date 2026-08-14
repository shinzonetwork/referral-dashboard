import { hash } from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Usage: npx tsx scripts/create-admin.ts --email you@shinzo.network --password secret --name "Your Name"

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, "");
    const value = args[i + 1];
    if (key && value) parsed[key] = value;
  }
  return parsed;
}

async function main() {
  const { email, password, name } = parseArgs();
  if (!email || !password || !name) {
    console.error(
      'Usage: npx tsx scripts/create-admin.ts --email you@shinzo.network --password secret --name "Your Name"',
    );
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const admin = await prisma.admin.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash: await hash(password, 10), name },
    create: { email: email.toLowerCase(), name, passwordHash: await hash(password, 10) },
  });

  console.log(`Admin ready: ${admin.email}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
