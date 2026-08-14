import { hash } from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@shinzo.network").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  const name = process.env.SEED_ADMIN_NAME ?? "Shinzo Admin";

  const admin = await prisma.admin.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      passwordHash: await hash(password, 10),
    },
  });
  console.log(`Admin ready: ${admin.email}`);

  const existingReferrer = await prisma.referrer.findFirst({
    where: { walletAddress: "0x1111111111111111111111111111111111111111" },
  });

  if (!existingReferrer) {
    const referrer = await prisma.referrer.create({
      data: {
        walletAddress: "0x1111111111111111111111111111111111111111",
        type: "GENERATOR",
        label: "Sample Generator (seed data)",
        createdByAdminId: admin.id,
      },
    });

    await prisma.referralLink.create({
      data: {
        code: "TESTCODE1",
        referrerId: referrer.id,
        createdByAdminId: admin.id,
      },
    });
    console.log("Seeded sample referrer + link (code: TESTCODE1)");
  } else {
    console.log("Sample referrer already exists, skipping");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
