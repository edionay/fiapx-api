import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../gerado/prisma/client.js";

export function criarPrismaClient(connectionString: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}
