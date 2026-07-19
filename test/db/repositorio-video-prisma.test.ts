import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { RepositorioVideoPrisma } from "../../src/adaptadores/repositorio-video-prisma.js";
import { RepositorioUsuarioPrisma } from "../../src/adaptadores/repositorio-usuario-prisma.js";
import { criarPrismaClient } from "../../src/adaptadores/prisma/cliente.js";
import type { PrismaClient } from "../../src/gerado/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)("RepositorioVideoPrisma", () => {
  let prisma: PrismaClient;
  let repositorio: RepositorioVideoPrisma;
  const usuarioId = randomUUID();
  const videoId = randomUUID();

  beforeAll(async () => {
    prisma = criarPrismaClient(databaseUrl!);
    repositorio = new RepositorioVideoPrisma(prisma);
    await new RepositorioUsuarioPrisma(prisma).salvar({
      id: usuarioId,
      email: `dono-${usuarioId}@email.com`,
      senhaHash: "hash",
      criadoEm: new Date(),
    });
  });

  afterAll(async () => {
    await prisma.video.deleteMany({ where: { id: videoId } });
    await prisma.usuario.deleteMany({ where: { id: usuarioId } });
    await prisma.$disconnect();
  });

  it("salva e recupera um vídeo PENDENTE", async () => {
    const agora = new Date();
    await repositorio.salvar({
      id: videoId,
      usuarioId,
      nomeOriginal: "filme.mp4",
      caminhoEntrada: `/data/uploads/${videoId}.mp4`,
      status: "PENDENTE",
      caminhoZip: null,
      mensagemErro: null,
      criadoEm: agora,
      atualizadoEm: agora,
    });

    const salvo = await repositorio.buscarPorId(videoId);
    expect(salvo?.usuarioId).toBe(usuarioId);
    expect(salvo?.status).toBe("PENDENTE");
    expect(salvo?.nomeOriginal).toBe("filme.mp4");
  });
});
