import type { PrismaClient } from "../gerado/prisma/client.js";
import type { RepositorioVideo } from "../dominio/repositorio-video.js";
import type { Video } from "../dominio/video.js";

export class RepositorioVideoPrisma implements RepositorioVideo {
  constructor(private readonly prisma: PrismaClient) {}

  async salvar(video: Video): Promise<void> {
    await this.prisma.video.upsert({
      where: { id: video.id },
      update: {
        status: video.status,
        caminhoZip: video.caminhoZip,
        mensagemErro: video.mensagemErro,
      },
      create: {
        id: video.id,
        usuarioId: video.usuarioId,
        nomeOriginal: video.nomeOriginal,
        caminhoEntrada: video.caminhoEntrada,
        status: video.status,
        caminhoZip: video.caminhoZip,
        mensagemErro: video.mensagemErro,
        criadoEm: video.criadoEm,
      },
    });
  }

  async buscarPorId(id: string): Promise<Video | null> {
    return this.prisma.video.findUnique({ where: { id } });
  }

  async listarPorUsuario(usuarioId: string): Promise<Video[]> {
    return this.prisma.video.findMany({
      where: { usuarioId },
      orderBy: { criadoEm: "desc" },
    });
  }
}
