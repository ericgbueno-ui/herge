import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("DATABASE_URL não está definida - Prisma será desativado");
    return null;
  }
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

let prismaInstance: PrismaClient | null = null;

export function getPrisma() {
  if (!prismaInstance) {
    prismaInstance = createPrismaClient() as PrismaClient;
  }
  return prismaInstance;
}

// Proxy preguiçoso: expõe todos os modelos do client (lead, sale, company, etc.)
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma() as any;
    const value = client?.[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
}) as PrismaClient;
