import type { RepositorioVideo } from "../dominio/repositorio-video.js";
import type { Video } from "../dominio/video.js";

export class RepositorioVideoMemoria implements RepositorioVideo {
  private readonly porId = new Map<string, Video>();

  async salvar(video: Video): Promise<void> {
    this.porId.set(video.id, video);
  }

  async buscarPorId(id: string): Promise<Video | null> {
    return this.porId.get(id) ?? null;
  }

  async listarPorUsuario(usuarioId: string): Promise<Video[]> {
    return [...this.porId.values()]
      .filter((video) => video.usuarioId === usuarioId)
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
  }
}
