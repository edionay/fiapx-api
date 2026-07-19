import type { RepositorioVideo } from "../dominio/repositorio-video.js";
import type { Video } from "../dominio/video.js";

export class ListarVideos {
  constructor(private readonly repositorio: RepositorioVideo) {}

  async executar(usuarioId: string): Promise<Video[]> {
    return this.repositorio.listarPorUsuario(usuarioId);
  }
}
