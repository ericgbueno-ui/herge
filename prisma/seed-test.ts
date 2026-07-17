import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("herge2026", 10);
  
  const user = await prisma.user.upsert({
    where: { email: "admin@herge.com" },
    update: {},
    create: {
      email: "admin@herge.com",
      name: "Admin",
      passwordHash: hashedPassword,
    },
  });

  console.log("✅ Usuário criado:", user.email);
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
