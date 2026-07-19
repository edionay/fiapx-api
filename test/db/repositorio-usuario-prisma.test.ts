import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { RepositorioUsuarioPrisma } from "../../src/adaptadores/repositorio-usuario-prisma.js";
import { criarPrismaClient } from "../../src/adaptadores/prisma/cliente.js";
import type { PrismaClient } from "../../src/gerado/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)("RepositorioUsuarioPrisma", () => {
  let prisma: PrismaClient;
  let repositorio: RepositorioUsuarioPrisma;
  const email = `teste-${randomUUID()}@email.com`;
  const id = randomUUID();

  beforeAll(() => {
    prisma = criarPrismaClient(databaseUrl!);
    repositorio = new RepositorioUsuarioPrisma(prisma);
  });

  afterAll(async () => {
    await prisma.usuario.deleteMany({ where: { id } });
    await prisma.$disconnect();
  });

  it("salva e recupera por e-mail e por id", async () => {
    await repositorio.salvar({
      id,
      email,
      senhaHash: "hash",
      criadoEm: new Date(),
    });

    const porEmail = await repositorio.buscarPorEmail(email);
    const porId = await repositorio.buscarPorId(id);

    expect(porEmail?.id).toBe(id);
    expect(porId?.email).toBe(email);
  });

  it("retorna null quando não encontra", async () => {
    const inexistente = await repositorio.buscarPorEmail("nao@existe.com");
    expect(inexistente).toBeNull();
  });
});
